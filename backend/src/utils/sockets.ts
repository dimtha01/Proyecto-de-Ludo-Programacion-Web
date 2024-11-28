import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { isAValidRoom, isSocket, isValidColor } from "./helpers";
import { NextFunction, Request, Response } from "express";
import { Server, Socket } from "socket.io";
import {
  SocketErrors,
  TIMEOUT_DELAY_SYNC,
  TYPES_ONLINE_GAMEPLAY,
} from "./constants";
import type { IDataSocket } from "../interfaces";

/**
 * Es un "adaptador" que permite que el middleware diseñado para Express se use con Socket.io.
 * Permite que el middleware de Express procese la solicitud de Socket.io.
 * https://github.com/socketio/socket.io/discussions/4470
 * @param middleware
 * @returns
 */
export const wrapSocketRequest = (
  middleware: (req: Request, res: Response, next: NextFunction) => void
) => {
  return (socket: Socket, next: (err?: any) => void) => {
    return middleware(socket.request as Request, {} as Response, next);
  };
};

interface ValidateSocketData {
  data: IDataSocket;
  authUser: any;
  isAuthenticated: boolean;
}

/**
 * Función que valida la información que le llega al socket cuando se conexta un nuevo usuario...
 * @param param0
 * @returns
 */
export const validateSocketData = ({
  data,
  authUser,
  isAuthenticated,
}: ValidateSocketData) => {
  const {
    type,
    totalPlayers,
    roomName: customRoom,
    initialColor,
    playAsGuest,
    user,
  } = data;

  /**
   * Para saber que el valor de total de jugadores sea válido, en este caso
   * sólo pueden ser 2 ó 4 jugadores...
   */
  const totalValidPlayers = [2, 4].includes(totalPlayers);
  const isJoinRoom = type === TYPES_ONLINE_GAMEPLAY.JOIN_ROOM;
  const isCreateRoom = type === TYPES_ONLINE_GAMEPLAY.CREATE_ROOM;

  /**
   * Se está uniendo a una sala personalizada, por lo tanto se debe validar que la sala enviada sea
   * valida, además que el valor que el total de jugadores sea válido...
   */
  if (
    (isCreateRoom || isJoinRoom) &&
    (!isAValidRoom(customRoom) || !totalValidPlayers)
  ) {
    return SocketErrors.INVALID_ROOM;
  }

  /**
   * Si está creando una sala, se debe validar que el color dado para el
   * token sea un color válido...
   */
  if (isCreateRoom && !isValidColor(initialColor)) {
    return SocketErrors.INVALID_COLOR;
  }

  /**
   * No está jugando como invitado...
   */
  if (!playAsGuest) {
    if (isAuthenticated) {
      /**
       * Se extra el id del usuario que está auténticado...
       */
      const authUserID = authUser._id?.toString() || "";

      /**
       * Validar que el id del usuario que ha llegado, sea el que está autéticado...
       */
      if (authUserID !== user.id) {
        return SocketErrors.INVALID_USER;
      }
    } else {
      /**
       * Debería estar autéticado...
       */
      return SocketErrors.UNAUTHENTICATED;
    }
  } else if (isAuthenticated) {
    /**
     * Está jugando como invitado, pero ya está auténticado...
     */
    return SocketErrors.AUTHENTICATED;
  }
};

interface SynchronizeGameStart {
  roomName: string;
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
}

/**
 * Función que crea listeners por usuarios, para así validar que estén listos
 * para iniciar la partida del juego, es decir, que todos los clientes han
 * cargado...
 * @param param0
 */
export const synchronizeGameStart = async ({
  roomName,
  io,
}: SynchronizeGameStart) => {
  try {
    // Obtenemos los sockets en la sala
    const clientsInRoom = await io.in(roomName).fetchSockets();

    // Array para almacenar las promesas de confirmación
    const confirmationSync: Promise<void>[] = [];

    for (const clientSocket of clientsInRoom) {
      // Verificamos que el socket sea de tipo Socket
      if (isSocket(clientSocket)) {
        let eventListeningTime: NodeJS.Timeout;

        const confirmationPromise = new Promise<void>((resolve, reject) => {
          // Establecemos un temporizador para cancelar la promesa si excede cierto tiempo
          eventListeningTime = setTimeout(() => {
            reject(
              new Error(
                "Tiempo de espera excedido para recibir la confirmación"
              )
            );

            clientSocket.off("PLAYER_READY", confirmationHandler);
            clientSocket.off("disconnect", disconnectHandler);
          }, TIMEOUT_DELAY_SYNC);

          const disconnectHandler = () => {
            clearTimeout(eventListeningTime);
            resolve();
          };

          // Escuchamos el evento 'confirmacionRecibida' del cliente
          const confirmationHandler = () => {
            clearTimeout(eventListeningTime);
            clientSocket.off("disconnect", disconnectHandler);
            resolve();
          };

          // Se escucha el evento de respuesta una vez
          clientSocket.once("PLAYER_READY", confirmationHandler);

          // Se valida la desconexión del cliente
          clientSocket.once("disconnect", disconnectHandler);
        });

        confirmationPromise.finally(() => {
          if (eventListeningTime) {
            clearTimeout(eventListeningTime);
          }
        });

        confirmationSync.push(confirmationPromise);
      }
    }

    // Se espera a que todas las promesas de confirmación se resuelvan
    await Promise.all(confirmationSync);

    /**
     * Se emite a los clientes que se puede iniciar el juego...
     */
    io.sockets.in(roomName).emit("ALL_PLAYERS_READY");
  } catch (error) {
    console.log("Error validating completed socket action:", error);
    throw error;
  }
};
