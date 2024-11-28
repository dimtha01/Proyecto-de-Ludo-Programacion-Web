import { SHARE_AVAILABLE, shareLink, successMessage } from "./helpers";
import React, { useState } from "react";
import Modal from "./modal";

interface ShareProps {
  children: JSX.Element;
  data: ShareData;
  useNativeOption?: boolean;
}

/**
 * Componente wrapper para la compartir, si el navegador soporta la versión nativa
 * se utiliza, además si useNativeOption es true, si es false se mostraría la versión
 * cutom, la cual también se muestra si el navegador no soporta la share nativo...
 * El share requiere un botón como children, al cual se le agregará un evneto onCLick,
 * @param param0
 * @returns
 */
const Share = ({ children, data, useNativeOption = true }: ShareProps) => {
  const [isVisible, setIsVisible] = useState(false);

  /**
   * Para saber si utiliza la opción nativa del navegador...
   */
  const useNativeVersionBrowser = SHARE_AVAILABLE && useNativeOption;

  /**
   * Evento que se le agrega al children, que normalmente es un botón...
   */
  const onClick = () => {
    /**
     * Si se soporta share y ademas se indica que se utilicé se invoca la función que realiza
     * la acción de compartir nativo...
     */
    if (useNativeVersionBrowser) {
      shareLink(data);
    } else {
      /**
       * De lo contrario se establece que se muestre un modal con las opciones de compertir custom...
       */
      setIsVisible(true);
    }
  };

  /**
   * Evento que cierra el modal, además si se presionó en una opción de compartir, se muestra
   * el mensaje de éxito...
   * @param isShare
   */
  const onCloseModal = (isShare = false) => {
    if (isShare) {
      successMessage();
    }

    setIsVisible(false);
  };

  /**
   * Inicialmemte se clona el children que puede ser un botón y se le añade el evento onClick
   * Si no se soporta la opción nativa, se muestra un modal...
   */
  return (
    <React.Fragment>
      {React.cloneElement(children, { onClick })}
      {!useNativeVersionBrowser && (
        <Modal isVisible={isVisible} data={data} onCloseModal={onCloseModal} />
      )}
    </React.Fragment>
  );
};

export default React.memo(Share);
