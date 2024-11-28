import { createPortal } from "react-dom";
import { ReactNode, ReactPortal, useEffect, useState } from "react";

interface UsePortalProps {
  id: string;
  container?: string;
}

/**
 * Hook que crea un portal, el cual permite que se renderice JSX en un container
 * diferente al root, de la apliación.
 * Requiere el container donde se renderizará, si no se pasa, se renderizará en
 * el body
 * @param param0
 * @returns
 */
const usePortal = ({ container = "body", id = "" }: UsePortalProps) => {
  /**
   * Guarda la referencia del elemento en el DOM...
   */
  const [element, setElement] = useState<Element | null>(null);

  /**
   * Efecto que crea el elemento en el DOM, si es que no existe...
   */
  useEffect(() => {
    /**
     * Se valida si el elemento que se renderiza el contenido ya está en el estado
     */
    if (!element) {
      const domElement = document.querySelector(`#${id}`);

      /**
       * Valida si ya está en e DOM..
       */
      if (!domElement) {
        /**
         * No está en el DOM, por tanto se crea un div...
         */
        const newElement = document.createElement("div");

        /**
         * El identificador del elemento en el DOM...
         */
        newElement.id = id;

        /**
         * Se agrega el elemento al container...
         */
        document.querySelector(container)?.appendChild(newElement);

        /**
         * Se Guarda en el estado la referencia del elemeto creado...
         */
        setElement(newElement);
      }
    }

    return () => {
      if (element && document.querySelector(`#${id}`)) {
        document.querySelector(container)?.removeChild(element);
        setElement(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element]);

  return (children: ReactNode): ReactPortal | null =>
    element ? createPortal(children, element) : null;
};

export default usePortal;
