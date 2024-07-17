import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import ButtonBox from "./ButtonBox.tsx";
import { filesize } from "filesize";
import { resolveMime } from "friendly-mimes";
import { FiDownload } from "react-icons/fi";
import {
    baseUrl,
    githubDarkCustom,
    languageExtensionFromString,
    Metadata,
} from "./common.ts";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import flourite from "flourite";
import { Extension } from "@uiw/react-codemirror";
import { useDarkMode } from "./common.ts";
import { githubLight } from "@uiw/codemirror-theme-github";

function DownloadButton({ url }: { url: string }) {
    return (
        <a href={url} download={true}>
            <button
                className="flex items-center gap-2 text-xl p-5 border border-gray-300 dark:border-zinc-700
                               rounded mx-auto mt-7 hover:bg-gray-100 dark:hover:bg-zinc-800 transition
                               focus:ring-2 ring-gray-200 dark:ring-zinc-600"
            >
                <FiDownload />
                Download
            </button>
        </a>
    );
}

function InfoWindow({
    title,
    children,
}: {
    title?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className="max-w-96 border border-gray-300 dark:border-zinc-700 dark:text-zinc-100
                        rounded p-10 mx-auto mt-20"
        >
            {title && <h1 className="text-center text-xl">{title}</h1>}

            {children}
        </div>
    );
}

function FileInfoTable({ meta }: { meta: Metadata }) {
    return (
        <table className="mt-5 text-gray-600 dark:text-zinc-400">
            <tbody>
                <tr>
                    <td className="pr-2">File size:</td>
                    <td>{filesize(meta.file_size)}</td>
                </tr>
                <tr>
                    <td className="pr-2">Uploaded on:</td>
                    <td>
                        {new Date(meta.uploaded_on).toLocaleString("en-us")}
                    </td>
                </tr>
                <tr>
                    <td className="pr-2">File type:</td>
                    <td>
                        {(() => {
                            try {
                                return resolveMime(meta.mime_type).name;
                            } catch (_) {
                                return meta.mime_type;
                            }
                        })()}
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

function View({ fileKey }: { fileKey: string }) {
    const [meta, setMeta] = useState<Metadata | null>(null);
    const [code, setCode] = useState<string>("");
    const [language, setLanguage] = useState<Extension | undefined>();
    const { isDarkMode } = useDarkMode();

    const fileUrl = baseUrl + "/raw/" + fileKey;

    const showRaw = useCallback(() => {
        window.location.href = fileUrl;
    }, [fileUrl]);

    const edit = useCallback(() => {
        window.location.href = "/?edit=" + fileKey;
    }, [fileKey]);

    const createNew = useCallback(() => {
        window.location.pathname = "/";
    }, []);

    useEffect(() => {
        if (!meta) {
            axios
                .get(`/api/meta/${fileKey}`)
                .then((res) => {
                    setMeta(res.data);
                })
                .catch(() => {
                    window.location.href = "/";
                });
        }
    }, [meta, fileKey]);

    useEffect(() => {
        if (meta && meta.mime_type.startsWith("text/")) {
            axios
                .get(fileUrl, {
                    responseType: "text",
                })
                .then((res) => {
                    const code = res.data;
                    setCode(code);
                    const detectedLanguage = flourite(code);
                    languageExtensionFromString(detectedLanguage.language).then(
                        (lang) => {
                            if (lang) {
                                setLanguage(lang);
                            }
                        },
                    );
                })
                .catch(() => {
                    // 404
                });
        }
    }, [meta, fileUrl]);

    if (!meta) {
        // loading
        return <></>;
    }

    if (meta.file_size > 25000000) {
        return (
            <main>
                <ButtonBox onNew={createNew} onRaw={showRaw} />
                <InfoWindow title="File is too large to display">
                    <FileInfoTable meta={meta} />
                    <DownloadButton url={fileUrl} />
                </InfoWindow>
            </main>
        );
    }

    if (
        ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(
            meta.mime_type,
        )
    ) {
        return (
            <main>
                <ButtonBox onNew={createNew} onRaw={showRaw} />
                <InfoWindow>
                    <img
                        src={fileUrl}
                        alt={"Uploaded file"}
                        className="mx-auto max-w-72 max-h-72 mb-5"
                    />
                    <FileInfoTable meta={meta} />
                    <DownloadButton url={fileUrl} />
                </InfoWindow>
            </main>
        );
    }

    if (["video/mp4", "video/webm", "video/ogg"].includes(meta.mime_type)) {
        return (
            <main>
                <ButtonBox onNew={createNew} onRaw={showRaw} />
                <InfoWindow>
                    <video
                        src={fileUrl}
                        controls={true}
                        className="mx-auto max-w-72 max-h-72 mb-5"
                    />
                    <FileInfoTable meta={meta} />
                    <DownloadButton url={fileUrl} />
                </InfoWindow>
            </main>
        );
    }

    if (["audio/mpeg", "audio/ogg", "audio/wav"].includes(meta.mime_type)) {
        return (
            <main>
                <ButtonBox onNew={createNew} onRaw={showRaw} />
                <InfoWindow>
                    <audio
                        src={fileUrl}
                        controls={true}
                        className="mx-auto max-w-72 max-h-72 mb-5"
                    />
                    <FileInfoTable meta={meta} />
                    <DownloadButton url={fileUrl} />
                </InfoWindow>
            </main>
        );
    }

    if (meta.mime_type.startsWith("text/")) {
        const extensions = [
            EditorView.contentAttributes.of({ tabindex: "0" }), // fixes select all
        ];
        if (language) {
            extensions.push(language);
        }
        return (
            <main>
                <ButtonBox onNew={createNew} onEdit={edit} onRaw={showRaw} />
                <CodeMirror
                    value={code}
                    editable={false}
                    extensions={extensions}
                    theme={isDarkMode ? githubDarkCustom : githubLight}
                />
            </main>
        );
    }

    return (
        <main>
            <ButtonBox onNew={createNew} onRaw={showRaw} />
            <InfoWindow title={"File cannot be previewed"}>
                <FileInfoTable meta={meta} />
                <DownloadButton url={fileUrl} />
            </InfoWindow>
        </main>
    );
}

export default View;
