import { ModalOptions } from "./components";
import { usePortal } from "../../hooks";
import React, { useState } from "react";

/**
 * Componente que renderiza el botón para mostrar las opciones
 * además del modal, en este caso dentro de un portal...
 * @returns
 */
const Options = () => {
  const [showOptions, setShowOptions] = useState(false);

  /**
   * Crear un portal personalizado para renderizar el menú de opciones...
   */
  const renderOptions = usePortal({
    container: ".screen",
    id: "overlay-options",
  });

  return (
    <React.Fragment>
     
      {renderOptions(
        showOptions && (
          <ModalOptions handleClose={() => setShowOptions(false)} />
        )
      )}
    </React.Fragment>
  );
};

export default React.memo(Options);
