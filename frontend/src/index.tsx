import "./index.css";
import * as serviceWorker from "./serviceWorkerRegistration";
import App from "./App";
import React from "react";
import ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


/**
 * Se establecen eventos para el service worker, para determinar si se debe actualizar
 */
serviceWorker.register({
  onSuccess: () => {
    const event = new CustomEvent("changeServiceWorker", {
      detail: { type: "SW_INIT" },
    });

    document.dispatchEvent(event);
  },
  onUpdate: (registration) => {
    // Cuando existe una nueva versión de la aplicación se ejcuta el evento
    const event = new CustomEvent("changeServiceWorker", {
      detail: {
        type: "SW_UPDATE",
        payload: registration,
      },
    });

    document.dispatchEvent(event);
  },
});
