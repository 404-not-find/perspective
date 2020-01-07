/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import style from "../less/workspace.less";
import template from "../html/workspace.html";
import {bindTemplate} from "@finos/perspective-viewer/dist/esm/utils";
import {PerspectiveWorkspace} from "./phosphor";
import {MessageLoop} from "@phosphor/messaging";
import {Widget} from "@phosphor/widgets";

import viewerStyle from "../less/viewer.less";
import menuStyle from "../less/menu.less";

@bindTemplate(template, style) // eslint-disable-next-line no-unused-vars
class PerspectiveWorkspaceElement extends HTMLElement {
    set side(value) {
        this.setAttribute("side", value);
    }

    get side() {
        return this.getAttribute("side");
    }

    save() {
        return this.workspace.save();
    }

    restore(layout) {
        return this.workspace.restore(layout);
    }

    addTable(name, table) {
        this.workspace.addTable(name, table);
    }

    getTable(name) {
        return this.workspace.getTable(name);
    }

    connectedCallback() {
        // make theme configurable
        this.classList.add("p-Theme-Default");

        this.side = this.side || "left";

        const container = this.shadowRoot.querySelector("#container");
        this.workspace = new PerspectiveWorkspace(this, {side: this.side});

        injectStyles("workspace-injected-stylesheet", this, viewerStyle);
        // check we only insert one of these
        injectStyles("workspace-menu-injected-stylesheet", document.body, menuStyle);

        MessageLoop.sendMessage(this.workspace, Widget.Msg.BeforeAttach);
        container.insertBefore(this.workspace.node, null);
        MessageLoop.sendMessage(this.workspace, Widget.Msg.AfterAttach);

        window.onresize = () => {
            this.workspace.update();
        };
    }
}

const injectStyles = (name, element, style) => {
    const node = document.createElement("style");
    node.id = name;
    node.innerHTML = style;
    element.appendChild(node);
};
