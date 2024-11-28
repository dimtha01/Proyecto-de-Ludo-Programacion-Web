import { getDataOnlineGame, updateDataRoomSocket } from "../utils/sockets";
import { isDev } from "../utils/helpers";
import { Socket, io } from "socket.io-client";
import { useEffect, useState } from "react";
import { useShowMessageRedirect } from ".";
import {
  SOCKET_ERROR_MESSAGES,
  SOCKET_PORT_DEV,
  SocketErrors,
} from "../utils/constants";
import swal from "sweetalert";
import type {
  IDataOnline,
  IDataRoom,
  IDataRoomSocket,
  IDataSocket,
  TSocketErrors,
} from "../interfaces";

/**
 * Variable para el socket que se usaurá para conectar a los usuarios,
 * está se pasará al componente game...
 */
let socket: Socket;

const useSocket = (connectionData: IDataSocket) => {
  const setRedirect = useShowMessageRedirect();

  //setDataRoomSocket
  /**
   * Estado que guarda la información que se mostrará en la UI para los usuarios
   * que se están conectado...
   */
  const [dataRoomSocket, setDataRoomSocket] = useState<IDataRoomSocket | null>(
    null
  );

  /**
   * Estado que guarda la información para iniciar el juego...
   */
  const [dataOnlineGame, setDataOnlineGame] = useState<IDataOnline | null>(
    null
  );

  useEffect(() => {
    const { user: currentUser } = connectionData;

    // Se establece la URL de conexión...
    const socketURL = isDev() ? `http://localhost:${SOCKET_PORT_DEV}/` : "/";

    // Se hace la conexión con el socket
    socket = io(socketURL, { withCredentials: true });

    socket.on("connect_error", (_) => {
      setRedirect({
        message: {
          title: "Error connecting to socket",
          icon: "error",
          timer: 5000,
        },
      });
    });

    socket.on("connect", () => {
      /**
       * Emite la data al server para el nuevo usuario,
       * valida si hay errores...
       */
      socket.emit("NEW_USER", connectionData, (error: TSocketErrors) => {
        const isAuthError =
          error === SocketErrors.AUTHENTICATED ||
          error === SocketErrors.UNAUTHENTICATED;

        /**
         * Valida si es un error de auteticación...
         */
        if (isAuthError) {
          /**
           * Si es un error de autenticación, muestra un mensaje y recarga la
           * página...
           */
          return swal({
            title: "Authentication Error",
            text: SOCKET_ERROR_MESSAGES[error],
            icon: "info",
            closeOnClickOutside: false,
            closeOnEsc: false,
            timer: 5000,
          }).then(() => window.location.reload());
        }

        setRedirect({
          message: {
            title: SOCKET_ERROR_MESSAGES[error],
            icon: "error",
            timer: 5000,
          },
        });
      });

      /**
       * Socket que escucha cuando los oponentes cambian,
       * bien por que se agrega uno nuevo o por que se ha salido un
       * oponente muentras se está haciendo el proceso match...
       */
      socket.on("UPDATE_OPPONENT", (dataRoom: IDataRoom) => {
        /**
         * Se genera la data que se mostrará en el UI cuando se están conectado
         * los usaurios...
         */
        const newDataRoomSocket = updateDataRoomSocket(dataRoom, currentUser);
        setDataRoomSocket(newDataRoomSocket);

        /**
         * Si la sala ya está llena se generá la data para el juego...
         */
        if (newDataRoomSocket.isFull) {
          const newDataOnlineGame = getDataOnlineGame(
            newDataRoomSocket,
            dataRoom
          );

          /**
           * Se genera la data online, además se le añade el socket...
           */
          setDataOnlineGame({ ...newDataOnlineGame, socket });
        }
      });
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { dataRoomSocket, dataOnlineGame };
};

export default useSocket;
