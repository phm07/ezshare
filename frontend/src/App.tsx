import Editor from "./Editor.tsx";
import View from "./View.tsx";

function App() {
    const path = window.location.pathname;

    if (path === "/") {
        return <Editor />;
    }

    return <View fileKey={path.substring(1)} />;
}

export default App;
