/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {Panel} from "@phosphor/widgets";
import {PerspectiveDockPanel} from "./dockpanel";
import {Menu} from "@phosphor/widgets";
import {createCommands} from "./commands";

import {PerspectiveViewerWidget} from "./widget";
import {toArray} from "@phosphor/algorithm";
import uniqBy from "lodash/uniqBy";
import {DiscreteSplitPanel} from "./discrete";

const DEFAULT_WORKSPACE_SIZE = [1, 3];

export class PerspectiveWorkspace extends DiscreteSplitPanel {
    constructor(element, options = {}) {
        super({orientation: "horizontal"});

        this.addClass("p-PerspectiveWorkspace");
        this.dockpanel = new PerspectiveDockPanel("main", {enableContextMenu: false});
        this.boxPanel = new Panel();
        this.boxPanel.layout.fitPolicy = "set-no-constraint";
        this.boxPanel.addClass("p-PerspectiveScrollPanel");
        this.boxPanel.addWidget(this.dockpanel);
        this.masterpanel = new DiscreteSplitPanel({orientation: "vertical"});
        this.masterpanel.addClass("p-MasterPanel");

        this.addWidget(this.boxPanel);

        this.listeners = new WeakMap();
        this.tables = new Map();
        this.commands = createCommands(this);

        this.element = element;
        this.side = options.side || "left";
    }

    addTable(name, datasource) {
        this.tables.set(name, datasource);
    }

    getTable(name) {
        return this.tables.get(name);
    }

    getAllWidgets() {
        return [...this.masterpanel.widgets, ...toArray(this.dockpanel.widgets())];
    }

    clearLayout() {
        this.widgets.forEach(widget => widget.close());
        this.boxPanel.close();

        if (this.masterpanel.isAttached) {
            this.masterpanel.close();
        }
    }

    createWidget({title, table, config}) {
        const widget = new PerspectiveViewerWidget({title, table});
        widget.title.closable = true;
        this.element.appendChild(widget.viewer);
        this.addWidgetEventListeners(widget);
        widget.restore(config);
        return widget;
    }

    setupMasterPanel(sizes) {
        if (this.side === "left") {
            this.addWidget(this.masterpanel);
            this.addWidget(this.boxPanel);
            this.setRelativeSizes(sizes);
        } else {
            this.addWidget(this.boxPanel);
            this.addWidget(this.masterpanel);
            this.setRelativeSizes(sizes.slice().reverse());
        }
    }

    addWidgetEventListeners(widget) {
        if (this.listeners.has(widget)) {
            this.listeners.get(widget)();
        }
        const settings = event => {
            widget.title.className = event.detail && "settings_open";
        };
        const contextMenu = event => this.showContextMenu(widget, event);
        widget.viewer.addEventListener("contextmenu", contextMenu);
        widget.viewer.addEventListener("perspective-toggle-settings", settings);

        this.listeners.set(widget, () => {
            widget.viewer.removeEventListener("contextmenu", contextMenu);
            widget.viewer.removeEventListener("perspective-toggle-settings", settings);
        });
    }

    /*********************************************************************
     * Workspace-level contextmenu actions
     */
    async duplicate(widget) {
        if (this.dockpanel.mode === "single-document") {
            this.toggleSingleDocument(widget);
        }
        const duplicate = this.createWidget({title: "duplicate", table: widget.table, config: widget.save()});
        if (widget.master) {
            const index = this.masterpanel.widgets.indexOf(widget) + 1;
            this.masterpanel.insertWidget(index, duplicate);
        } else {
            this.dockpanel.addWidget(duplicate, {mode: "split-right", ref: widget});
        }
    }

    toggleMasterDetail(widget) {
        if (widget.parent === this.dockpanel) {
            if (this.dockpanel.mode === "single-document") {
                this.toggleSingleDocument(widget);
            }
            this.makeMaster(widget);
        } else {
            this.makeDetail(widget);
        }
    }

    toggleSingleDocument(widget) {
        if (this.dockpanel.mode !== "single-document") {
            this.single_document_prev_layout = this.dockpanel.saveLayout();
            this.dockpanel.mode = "single-document";
            this.dockpanel.activateWidget(widget);
            widget.notifyResize();
        } else {
            this.dockpanel.mode = "multiple-document";
            this.dockpanel.restoreLayout(this.single_document_prev_layout);
        }
    }

    /*********************************************************************
     * Master -> Detail filters
     */
    filterWidget(candidates, filters) {
        toArray(this.dockpanel.widgets()).forEach(async widget => {
            const config = widget.save();
            const availableColumns = Object.keys(await widget.table.schema());
            const currentFilters = config.filters || [];
            const columnAvailable = filter => filter[0] && availableColumns.includes(filter[0]);
            const validFilters = filters.filter(columnAvailable);

            validFilters.push(...currentFilters.filter(x => !candidates.has(x[0])));
            const newFilters = uniqBy(validFilters, item => item[0]);
            widget.restore({filters: newFilters});
        }, this.dockpanel.saveLayout());
    }

    onPerspectiveClick = event => {
        const config = event.target.save();
        const candidates = new Set([...(config["row-pivots"] || []), ...(config["column-pivots"] || []), ...(config.filters || []).map(x => x[0])]);
        const filters = [...event.detail.config.filters];
        this.filterWidget(candidates, filters);
    };

    /*********************************************************************
     * Master/Detail methods
     */

    makeMaster(widget) {
        widget.master = true;

        if (this.masterpanel.widgets.length === 0) {
            this.boxPanel.close();
            this.setupMasterPanel(DEFAULT_WORKSPACE_SIZE);
        }

        this.masterpanel.addWidget(widget);
        widget.isHidden && widget.show();

        widget.selectable = true;
        widget.viewer.restyleElement();
        widget.viewer.addEventListener("perspective-click", this.onPerspectiveClick);
    }

    makeDetail(widget) {
        widget.master = false;

        this.dockpanel.addWidget(widget, {mode: "split-right"});

        if (this.masterpanel.widgets.length === 0) {
            this.boxPanel.close();
            this.masterpanel.close();
            this.addWidget(this.boxPanel);
        }
        widget.selectable = false;
        widget.viewer.restyleElement();
        widget.viewer.removeEventListener("perspective-click", this.onPerspectiveClick);
    }

    /*********************************************************************
     * Context menu methods.
     */

    createContextMenu(widget) {
        const contextMenu = new Menu({commands: this.commands});

        contextMenu.addItem({command: "workspace:toggle-single-document", args: {widget}});
        contextMenu.addItem({command: "perspective:duplicate", args: {widget}});
        contextMenu.addItem({command: "workspace:master", args: {widget}});

        contextMenu.addItem({type: "separator"});

        contextMenu.addItem({command: "perspective:export", args: {widget}});
        contextMenu.addItem({command: "perspective:copy", args: {widget}});
        contextMenu.addItem({command: "perspective:reset", args: {widget}});
        return contextMenu;
    }

    showContextMenu(widget, event) {
        const menu = this.createContextMenu(widget);
        menu.open(event.clientX, event.clientY);
        event.preventDefault();
        event.stopPropagation();
    }

    /*********************************************************************
     * Serialisation methods .
     */

    save() {
        const master = {
            widgets: this.masterpanel.widgets.map(widget => widget.save()),
            sizes: [...this.masterpanel.relativeSizes()]
        };

        return {
            sizes: [...this.relativeSizes()],
            detail: this.dockpanel.save(),
            master
        };
    }

    restore(layout) {
        this.clearLayout();
        if (layout.master && layout.master.widgets.length > 0) {
            this.setupMasterPanel(layout.sizes || DEFAULT_WORKSPACE_SIZE);
        } else {
            this.addWidget(this.boxPanel);
        }

        if (layout.master) {
            layout.master.widgets.forEach(widgetConfig => {
                const widget = this.createWidget({
                    title: widgetConfig.name,
                    table: this.getTable(widgetConfig.table),
                    config: {master: true, ...widgetConfig}
                });
                widget.viewer.addEventListener("perspective-click", this.onPerspectiveClick);
                this.masterpanel.addWidget(widget);
            });
            layout.master.sizes && this.masterpanel.setRelativeSizes(layout.master.sizes);
        }

        const detailLayout = PerspectiveDockPanel.mapWidgets(widgetConfig => {
            const widget = this.createWidget({
                title: widgetConfig.name,
                table: this.getTable(widgetConfig.table),
                config: widgetConfig
            });
            return widget;
        }, layout.detail);
        this.dockpanel.restoreLayout(detailLayout);
    }
}
