import { useCallback, useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import axios from "axios";
import { githubDarkCustom, isMac, Metadata, useDarkMode } from "./common.ts";
import ButtonBox from "./ButtonBox.tsx";
import { FiUpload } from "react-icons/fi";
import { githubLight } from "@uiw/codemirror-theme-github";

function Radio({
    label,
    disabled,
    checked,
    onClick,
}: {
    label: string;
    disabled?: boolean;
    checked: boolean;
    onClick: () => void;
}) {
    return (
        <div className="flex gap-1.5">
            <div className="grid place-items-center">
                <input
                    type="radio"
                    className="col-start-1 row-start-1 peer appearance-none w-4 h-4 border border-black
                              dark:border-zinc-300 rounded-full shrink-0 hover:bg-gray-200 dark:hover:bg-zinc-600
                              disabled:bg-gray-100 dark:disabled:bg-zinc-700 transition enabled:cursor-pointer"
                    disabled={disabled}
                    checked={checked}
                    onClick={onClick}
                />
                <div
                    className="col-start-1 row-start-1 w-2 h-2 rounded-full pointer-events-none
                                peer-checked:bg-black dark:peer-checked:bg-zinc-300"
                />
            </div>
            <label>{label}</label>
        </div>
    );
}

function NumberInput({
    value,
    onChange,
    disabled,
}: {
    value: number;
    onChange: (n: number) => void;
    disabled?: boolean;
}) {
    return (
        <input
            type="number"
            className="border dark:bg-zinc-900 border-gray-500 dark:border-zinc-700 rounded inline-block
                       w-12 p-1 text-center mr-1.5 disabled:bg-gray-100 dark:disabled:bg-zinc-800 transition
                       outline-none focus:ring-2 ring-gray-200 dark:ring-zinc-600"
            value={value}
            disabled={disabled}
            onChange={(e) =>
                onChange(Math.max(Number.parseInt(e.target.value, 10), 0))
            }
        />
    );
}

function SaveDialog({
    error,
    fileToSave,
    isSaving,
    save,
    close,
    setExpiry,
}: {
    error: string;
    fileToSave: File | null;
    isSaving: boolean;
    save: () => void;
    close: () => void;
    setExpiry: (expiry: string) => void;
}) {
    const [expires, setExpires] = useState<boolean>(true);
    const [expireDays, setExpireDays] = useState<number>(30);
    const [expireHours, setExpireHours] = useState<number>(0);
    const [expireMinutes, setExpireMinutes] = useState<number>(0);

    useEffect(() => {
        if (expires) {
            setExpiry(`${expireDays * 24 + expireHours}h${expireMinutes}m`);
        } else {
            setExpiry("never");
        }
    }, [expires, expireDays, expireHours, expireMinutes]);

    return (
        <div>
            <div className="z-20 bg-black bg-opacity-25 w-full h-full fixed"></div>
            <div
                className="bg-white dark:bg-zinc-900 dark:text-zinc-100 z-30 fixed p-10 min-w-96 inset-x-0
                            max-w-max mx-auto mt-10 border border-gray-500 dark:border-zinc-700 rounded"
            >
                <h1 className="font-bold mt-1 mb-2 text-xl">
                    {fileToSave ? "Upload file" : "Save snippet"}
                </h1>

                {error && (
                    <div className="bg-red-100 p-3 border border-red-500 rounded text-red-900 mb-2">
                        {error}
                    </div>
                )}

                <h1 className="font-bold mt-1 mb-2">Expiry</h1>

                <div className="flex flex-col gap-5">
                    <div>
                        <Radio
                            label="Expires after"
                            disabled={isSaving}
                            checked={expires}
                            onClick={() => setExpires(true)}
                        />

                        <div className="flex items-center gap-3 mt-2">
                            <div>
                                <NumberInput
                                    value={expireDays}
                                    onChange={(n) => setExpireDays(n)}
                                    disabled={isSaving || !expires}
                                />
                                Days
                            </div>
                            <div>
                                <NumberInput
                                    value={expireHours}
                                    onChange={(n) => setExpireHours(n)}
                                    disabled={isSaving || !expires}
                                />
                                Hours
                            </div>
                            <div>
                                <NumberInput
                                    value={expireMinutes}
                                    onChange={(n) => setExpireMinutes(n)}
                                    disabled={isSaving || !expires}
                                />
                                Minutes
                            </div>
                        </div>
                    </div>

                    <Radio
                        label="Never expires"
                        disabled={isSaving}
                        checked={!expires}
                        onClick={() => setExpires(false)}
                    />
                </div>

                <div className="flex gap-3 mt-5">
                    <button
                        disabled={isSaving}
                        className="p-2 border border-gray-500 dark:border-zinc-700 rounded px-5 hover:bg-gray-100
                                   dark:hover:bg-zinc-800 disabled:bg-gray-100 dark:disabled:bg-zinc-800 transition"
                        onClick={close}
                    >
                        Cancel
                    </button>
                    <button
                        disabled={isSaving}
                        className="p-2 border border-gray-500 dark:border-zinc-700 rounded px-5 hover:bg-gray-100
                                   dark:hover:bg-zinc-800 disabled:bg-gray-100 dark:disabled:bg-zinc-800 transition"
                        onClick={save}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

function Editor() {
    const [code, setCode] = useState<string>("");
    const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [expiry, setExpiry] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [showDropZone, setShowDropZone] = useState<boolean>(false);
    const [fileToSave, setFileToSave] = useState<File | null>(null);
    const { isDarkMode } = useDarkMode();

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        if (query.has("edit")) {
            const fileKey = query.get("edit");
            query.delete("edit");
            window.history.replaceState({}, document.title, "/");

            axios
                .get(`/api/meta/${fileKey}`)
                .then((e) => {
                    const meta = e.data as Metadata;
                    if (
                        meta.mime_type.startsWith("text/") &&
                        meta.file_size <= 25000000
                    ) {
                        axios.get(`/raw/${fileKey}`).then((e) => {
                            setCode(e.data);
                        });
                    }
                })
                .catch(() => {}); // ignore errors
        }
    }, []);

    const closeDialog = useCallback(() => {
        setShowSaveDialog(false);
        setIsSaving(false);
        setError("");
        setFileToSave(null);
    }, []);

    const save = useCallback(() => {
        setIsSaving(true);

        const formData = new FormData();
        formData.append("expiry", expiry);
        if (fileToSave) {
            formData.append("file", fileToSave);
            formData.append("mime", fileToSave.type);
        } else {
            formData.append("mime", "text/plain");
            formData.append("file", new Blob([code], { type: "text/plain" }));
        }
        axios
            .post("/api/upload", formData)
            .then((e) => {
                window.location.pathname = "/" + e.data;
            })
            .catch((e) => setError(e.response.data))
            .finally(() => {
                setIsSaving(false);
            });
    }, [code, fileToSave, expiry]);

    useEffect(() => {
        if (isSaving) {
            return;
        }

        const keydownListener = (e: KeyboardEvent) => {
            const isModifier = (!isMac && e.ctrlKey) || (isMac && e.metaKey);
            if (isModifier && e.key == "s") {
                e.preventDefault();
                if (code) {
                    setShowSaveDialog(true);
                }
            }
            if (isModifier && e.key == "m") {
                e.preventDefault();
                setCode("");
            }
            if (e.key === "Escape") {
                e.preventDefault();
                closeDialog();
            }
        };

        document.addEventListener("keydown", keydownListener);
        return () => {
            document.removeEventListener("keydown", keydownListener);
        };
    }, [isSaving, code]);

    return (
        <main>
            {showDropZone && (
                <div
                    className="z-50 w-full h-full fixed bg-black bg-opacity-25"
                    onDragOver={(e) => e.preventDefault()}
                    onDragLeave={() => setShowDropZone(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setShowDropZone(false);
                        if (e.dataTransfer.files.length) {
                            const file = e.dataTransfer.files[0];
                            console.log(file);
                            setFileToSave(file);
                            setShowSaveDialog(true);
                        }
                    }}
                >
                    <div className="text-9xl text-gray-200 w-full h-full flex items-center justify-center">
                        <FiUpload />
                    </div>
                </div>
            )}

            {showSaveDialog && (
                <SaveDialog
                    close={closeDialog}
                    isSaving={isSaving}
                    save={save}
                    error={error}
                    fileToSave={fileToSave}
                    setExpiry={setExpiry}
                />
            )}

            <ButtonBox
                onSave={() => code && setShowSaveDialog(true)}
                onNew={() => setCode("")}
            />

            <div onDragOver={() => setShowDropZone(true)}>
                <CodeMirror
                    value={code}
                    onChange={(val) => setCode(val)}
                    theme={isDarkMode ? githubDarkCustom : githubLight}
                />
            </div>
        </main>
    );
}

export default Editor;
