import { Extension } from "@uiw/react-codemirror";
import { githubDarkInit } from "@uiw/codemirror-theme-github";
import { useEffect, useState } from "react";

export const isMac = navigator.userAgent.indexOf("Mac") !== -1;

export const baseUrl = import.meta.env.DEV ? "http://localhost:8080" : "";

export type Metadata = {
    expires_on: string;
    file_size: number;
    mime_type: string;
    uploaded_on: string;
};

export async function languageExtensionFromString(
    lang: string,
): Promise<Extension | null> {
    switch (lang) {
        case "YAML": {
            const { yaml } = await import("@codemirror/lang-yaml");
            return yaml();
        }
        case "Javascript": {
            const { javascript } = await import("@codemirror/lang-javascript");
            return javascript({ jsx: true });
        }
        case "JSON": {
            const { json } = await import("@codemirror/lang-json");
            return json();
        }
        case "HTML": {
            const { html } = await import("@codemirror/lang-html");
            return html();
        }
        case "Markdown": {
            const { markdown } = await import("@codemirror/lang-markdown");
            return markdown();
        }
        case "CSS": {
            const { css } = await import("@codemirror/lang-css");
            return css();
        }
        case "Go": {
            const { go } = await import("@codemirror/lang-go");
            return go();
        }
        case "C":
        case "C++": {
            const { cpp } = await import("@codemirror/lang-cpp");
            return cpp();
        }
        case "Java": {
            const { java } = await import("@codemirror/lang-java");
            return java();
        }
        case "Rust": {
            const { rust } = await import("@codemirror/lang-rust");
            return rust();
        }
        case "Python": {
            const { python } = await import("@codemirror/lang-python");
            return python();
        }
        case "PHP": {
            const { php } = await import("@codemirror/lang-php");
            return php();
        }
    }
    return null;
}

export const githubDarkCustom = githubDarkInit({
    settings: {
        background: "#18181b",
        lineHighlight: "#27272a",
        gutterBackground: "#27272a",
    },
});

export function useDarkMode() {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(
        window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches,
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const listener = () => {
            setIsDarkMode(mediaQuery.matches);
        };
        mediaQuery.addEventListener("change", listener);
        return () => {
            mediaQuery.removeEventListener("change", listener);
        };
    }, []);

    return { isDarkMode };
}
