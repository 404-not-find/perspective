/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {DockPanel} from "@phosphor/widgets";
import {DiscreteDockPanel} from "./discrete";
import {PerspectiveTabBar} from "./tabbar";
import {PerspectiveTabBarRenderer} from "./tabbarrenderer";

class PerspectiveDockPanelRenderer extends DockPanel.Renderer {
    createTabBar() {
        const tabbar = new PerspectiveTabBar({renderer: new PerspectiveTabBarRenderer()});
        tabbar.addClass("p-DockPanel-tabBar");
        return tabbar;
    }
}

export class PerspectiveDockPanel extends DiscreteDockPanel {
    constructor() {
        super({renderer: new PerspectiveDockPanelRenderer()});
        this._renderer.dock = this;
    }

    static mapWidgets(widgetFunc, layout) {
        if (layout.main) {
            layout.main = PerspectiveDockPanel.mapWidgets(widgetFunc, layout.main);
        } else if (layout.children) {
            layout.children = layout.children.map(widget => PerspectiveDockPanel.mapWidgets(widgetFunc, widget));
        } else if (layout.widgets) {
            layout.widgets = layout.widgets.map(widget => widgetFunc(widget));
        }
        return layout;
    }

    onAfterAttach() {
        this.spacing = parseInt(window.getComputedStyle(this.node).padding) || 0;
    }
}