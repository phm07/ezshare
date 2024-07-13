import React, { useState } from "react";
import { isMac } from "./common.ts";
import { FiBox, FiEdit, FiFilePlus, FiFileText, FiSave } from "react-icons/fi";

function ControlButton({
    Icon,
    name,
    shortcutKey,
    onClick,
}: {
    Icon: React.JSX.Element;
    name: string;
    shortcutKey: string;
    onClick?: () => void;
}) {
    const [showTooltip, setShowTooltip] = useState<boolean>(false);

    return (
        <button
            className="p-1 border border-gray-300 dark:border-zinc-700
                dark:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800
                disabled:bg-gray-100 dark:disabled:bg-zinc-800
                focus:ring-2 ring-gray-200 dark:ring-zinc-600
                transition rounded"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            disabled={!onClick}
            onClick={onClick}
        >
            {Icon}

            {showTooltip && (
                <div
                    className="absolute mt-2 -ml-8 bg-white dark:bg-zinc-900 p-2.5 rounded border
                                border-gray-300 dark:border-zinc-700 text-xs dark:text-zinc-100"
                >
                    <p className="font-bold text-left text-nowrap">{name}</p>
                    <div className="text-left mt-2 text-nowrap">
                        <span
                            className="bg-gray-100 dark:bg-zinc-800 p-0.5 rounded border
                                        border-gray-300 dark:border-zinc-700 font-mono"
                        >
                            {isMac ? "Cmd" : "Ctrl"}
                        </span>
                        {" + "}
                        <span
                            className="bg-gray-100 dark:bg-zinc-800 p-0.5 rounded border
                                        border-gray-300 dark:border-zinc-700 font-mono"
                        >
                            {shortcutKey}
                        </span>
                    </div>
                </div>
            )}
        </button>
    );
}

function ButtonBox({
    onSave,
    onNew,
    onEdit,
    onRaw,
}: {
    onSave?: () => void;
    onNew?: () => void;
    onEdit?: () => void;
    onRaw?: () => void;
}) {
    return (
        <div
            className="fixed top-4 right-4 bg-white z-10 p-3 rounded border border-gray-300 dark:bg-zinc-900
                        dark:text-zinc-100 dark:border-zinc-700"
        >
            <h1 className="text-md text-center flex items-center justify-center gap-1">
                <FiBox />
                ezShare
            </h1>
            <hr className="mt-2 mb-3 border-gray-300 dark:border-zinc-700" />

            <div className="flex flex-row gap-1 justify-center">
                <ControlButton
                    Icon={<FiSave />}
                    name="Save"
                    shortcutKey="S"
                    onClick={onSave}
                />
                <ControlButton
                    Icon={<FiFilePlus />}
                    name="New"
                    shortcutKey="M"
                    onClick={onNew}
                />
                <ControlButton
                    Icon={<FiEdit />}
                    name="Duplicate"
                    shortcutKey="D"
                    onClick={onEdit}
                />
                <ControlButton
                    Icon={<FiFileText />}
                    name="Raw View"
                    shortcutKey="J"
                    onClick={onRaw}
                />
            </div>
        </div>
    );
}

export default ButtonBox;
