import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Handle SPA redirect from 404.html on GitHub Pages
const params = new URLSearchParams(window.location.search);
const redirect = params.get("redirect");
if (redirect) {
  window.history.replaceState(null, "", redirect);
}

createRoot(document.getElementById("root")!).render(<App />);
