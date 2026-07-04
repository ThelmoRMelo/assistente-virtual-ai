import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerAniaServiceWorker } from "./lib/pwaRegistration";

registerAniaServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
