import { delay } from "../utils/helpers";
import { useEffect } from "react";

/**
 * Hook que hace una interrupción...
 * @param runEffect
 * @param waitTime
 * @param cb
 */
const useWait = (runEffect = false, waitTime: number, cb: () => void) => {
  useEffect(() => {
    const runAsync = async () => {
      /**
       * Se espera el tiempo especificado
       */
      await delay(waitTime);

      /**
       * Se ejecuta el callback...
       */
      cb();
    };

    /**
     * Si se indica que hay una interrupción, se ejecuta la función...
     */
    if (runEffect) {
      runAsync();
    }
  }, [cb, runEffect, waitTime]);
};

export default useWait;
