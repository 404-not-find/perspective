/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {CommandRegistry} from "@phosphor/commands";

export const createCommands = workspace => {
    const commands = new CommandRegistry();

    commands.addCommand("perspective:export", {
        execute: args => args.widget.viewer.download(),
        iconClass: "p-MenuItem-export",
        label: "Export CSV",
        mnemonic: 0
    });

    commands.addCommand("perspective:copy", {
        execute: args => args.widget.viewer.copy(),
        iconClass: "p-MenuItem-copy",
        label: "Copy To Clipboard",
        mnemonic: 0
    });

    commands.addCommand("perspective:reset", {
        execute: args => args.widget.viewer.reset(),
        iconClass: "p-MenuItem-reset",
        label: "Reset",
        mnemonic: 0
    });

    commands.addCommand("perspective:duplicate", {
        execute: ({widget}) => workspace.duplicate(widget),
        iconClass: "p-MenuItem-duplicate",
        label: "Duplicate",
        mnemonic: 0
    });

    commands.addCommand("workspace:master", {
        execute: args => workspace.toggleMasterDetail(args.widget),
        iconClass: args => (args.widget.parent === workspace.dockpanel ? "p-MenuItem-master" : "p-MenuItem-detail"),
        label: args => (args.widget.parent === workspace.dockpanel ? "Master" : "Detail"),
        mnemonic: 0
    });

    commands.addCommand("workspace:toggle-single-document", {
        execute: args => workspace.toggleSingleDocument(args.widget),
        isVisible: args => args.widget.parent === workspace.dockpanel,
        iconClass: () => {
            if (workspace.dockpanel.mode !== "single-document") {
                return "p-MenuItem-maximize";
            } else {
                return "p-MenuItem-minimize";
            }
        },
        label: () => (workspace.dockpanel.mode === "single-document" ? "Minimize" : "Maximize"),
        mnemonic: 0
    });
    return commands;
};
