import "./styles.css";
import { useUpdateServiceWorker, useWindowResize } from "../../../hooks";
import AlertUpdateApp from "../../alertUpdateApp";
import React from "react";

/**
 * Componente que maneja el escalamiento del juego...
 * @param param0
 * @returns
 */
const Container = ({ children }: { children: React.ReactNode }) => {
  const serviceWorkerInformation = useUpdateServiceWorker();
  useWindowResize();

  return (
    <div className="container">
      <div className="screen">
        {serviceWorkerInformation?.serviceWorkerUpdated && (
          <AlertUpdateApp
            serviceWorkerRegistration={
              serviceWorkerInformation.serviceWorkerRegistration
            }
          />
        )}
        {children}
      </div>
    </div>
  );
};

export default React.memo(Container);
