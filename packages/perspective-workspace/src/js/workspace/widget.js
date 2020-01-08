/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "@finos/perspective-viewer";
import {Widget} from "@phosphor/widgets";

let ID_COUNTER = 0;

export class PerspectiveViewerWidget extends Widget {
    constructor({title, table}) {
        const {viewer, node} = createNode();
        super({node});
        this.viewer = viewer;
        this.table = table;

        this.title.label = title;
        this._loaded = false;
    }

    set master(value) {
        if (value) {
            this.viewer.classList.add("p-Master");
            this.viewer.classList.remove("p-Detail");
            this.viewer.selectable = true;
        } else {
            this.viewer.classList.add("p-Detail");
            this.viewer.classList.remove("p-Master");
            this.viewer.selectable = null;
        }
        this._master = value;
    }

    get master() {
        return this._master;
    }

    set table(value) {
        if (this.isAttached) {
            this.viewer.load(value);
        } else {
            this._table = value;
        }
    }

    get table() {
        return this.viewer.table;
    }

    toggleConfig() {
        this.viewer.toggleConfig();
    }

    restore(config) {
        const {master, ...viewerConfig} = config;
        this.master = master;
        this.viewer.restore({...viewerConfig});
    }

    save() {
        return {
            ...this.viewer.save(),
            master: this.master
        };
    }

    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        if (this._table) {
            this.viewer.load(this._table);
            delete this._table;
        }
    }

    async onCloseRequest(msg) {
        super.onCloseRequest(msg);
        await this.viewer.delete();
        this.viewer.parentElement.removeChild(this.viewer);
    }

    onAfterShow(msg) {
        this.notifyResize();
        super.onAfterShow(msg);
    }

    onResize(msg) {
        this.notifyResize();
        super.onResize(msg);
    }

    async notifyResize() {
        if (this.isVisible) {
            await this.viewer.notifyResize();
        }
    }
}

const createNode = () => {
    const slot = document.createElement("slot");
    const name = `AUTO_ID_${ID_COUNTER++}`;
    slot.setAttribute("name", name);

    const node = document.createElement("div");
    node.classList.add("p-Widget");
    node.appendChild(slot);

    const viewer = document.createElement("perspective-viewer");
    viewer.setAttribute("slot", name);

    return {node: node, viewer: viewer};
};
