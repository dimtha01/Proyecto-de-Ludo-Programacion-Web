import { isAValidRoom, validateLastValueRoomName } from "../utils/helpers";
import { TYPES_ONLINE_GAMEPLAY } from "../utils/constants";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { IDataPlayWithFriends, TTotalPlayers } from "../interfaces";

const useGetRoomURL = (
  isAuth = false,
  cb: (data: IDataPlayWithFriends) => void
) => {
  /**
   * Para el estado de los query string en la url...
   */
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Efecto que extrae el valor del query string de la url
   * Además lo elimina para evitar que cuando recargue la página
   * Lo vuelva a tomar...
   */
  useEffect(() => {
    // El valor existe en la url...
    if (searchParams.has("room")) {
      const roomName = searchParams.get("room") || "";

      // Se elimina el valor de la URL
      searchParams.delete("room");

      // Se establece el nuevo valor...
      setSearchParams(searchParams);

      /**
       * Si valor de la sala cumple con los requeriemientos y está auténticado,
       * se procede a estrar los valores de la sala...
       */
      if (isAValidRoom(roomName) && isAuth) {
        /**
         * Se valida que el número de usuarios se encuentre entre el valor del
         * nombre de la sala que llega por la url...
         */
        const { isValid, numPlayers } = validateLastValueRoomName(roomName);

        /**
         * Se valida que sea un valor válido...
         */
        if (isValid) {
          /**
           * Se envía la información para unirse a la sala al componente padre...
           */
          cb({
            type: TYPES_ONLINE_GAMEPLAY.JOIN_ROOM,
            roomName,
            totalPlayers: numPlayers as TTotalPlayers,
          });
        }
      }
    }
  }, [cb, isAuth, searchParams, setSearchParams]);
};

export default useGetRoomURL;
