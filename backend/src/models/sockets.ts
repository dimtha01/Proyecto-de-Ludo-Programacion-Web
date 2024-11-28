import { genDataNewRoom } from "../utils/rooms";
import { genUserSocket, getUserTokenColor } from "../utils/user";
import { guid } from "../utils/helpers";
import { RequestHandler, Request } from "express";
import { Server } from "http";
import { Server as SocketServer } from "socket.io";
import {
  EActionsBoardGame,
  SocketErrors,
  TYPES_ONLINE_GAMEPLAY,
} from "../utils/constants";
import {
  createRoom,
  deleteUserFromRoom,
  getAvailableRoom,
  getRoom,
  updateUserInRoom,
} from "../utils/redis";
import {
  synchronizeGameStart,
  validateSocketData,
  wrapSocketRequest,
} from "../utils/sockets";
import passport from "passport";
import type {
  CustomSocket,
  IDataRoom,
  IDataSocket,
  ISocketActions,
  TSocketErrors,
} from "../interfaces";

const startSocketServer = (
  server: Server,
  sessionMiddleware: RequestHandler
) => {
  const io = new SocketServer(server, {
    cors: {
      credentials: true,
    },
  });

  /**
   * Se agrega la inicialización de Passport
   * Se agrega la sesión de Passport:
   * lo que permite que Passport persista los datos de autenticación
   * de un usuario durante toda la sesión de WebSocket.
   */
  io.use(wrapSocketRequest(sessionMiddleware));
  io.use(wrapSocketRequest(passport.initialize()));
  io.use(wrapSocketRequest(passport.session()));

  io.on("connection", (socket: CustomSocket) => {
    socket.on(
      "NEW_USER",
      async (data: IDataSocket, cb?: (error: TSocketErrors) => void) => {
        const request = socket.request as Request;
        const isAuthenticated = request.isAuthenticated();
        const authUser = request?.user || {};
        const socketID = socket.id;

        /**
         * Valida que la data que ha llegado al socket es válida...
         */
        const isInvalidDataSocket = validateSocketData({
          data,
          authUser,
          isAuthenticated,
        });

        /**
         * Si no es válida se indica el tipo de error al front...
         */
        if (isInvalidDataSocket) {
          return cb?.(isInvalidDataSocket);
        }

        /**
         * Se extrae la información que llega al socket...
         */
        const {
          type,
          totalPlayers,
          roomName: customRoom,
          playAsGuest,
          user,
        } = data;

        /**
         * Se expecifican los diferentes tipos de salas disponibles...
         */
        const isJoinRoom = type === TYPES_ONLINE_GAMEPLAY.JOIN_ROOM;
        const isCreateRoom = type === TYPES_ONLINE_GAMEPLAY.CREATE_ROOM;
        const isJoinExistingRoom =
          type === TYPES_ONLINE_GAMEPLAY.JOIN_EXISTING_ROOM;

        /**
         * Nombre de la sala a la cual se unirá los usuarios,
         * si se está creando la sala o se une a la sala,
         * se toma el valor que llega del cliente
         * si no se deja vacio, por que se tomará el valor después...
         */
        let roomName = isCreateRoom || isJoinRoom ? customRoom : "";

        /**
         * Guarda la data de la nueva sala...
         */
        let dataRoom: IDataRoom | undefined;

        /**
         * Se establece el valor para indicar si se crea una nueva sala,
         * se toma como base el valor de isCreateRoom, si es true el valor de
         * createNewRoom será verdadero, en este caso ya se tendría el valor
         * del nombre de la sala, si este valor es false, puede que se tenga el valor
         * de la sala, pero no se crearía una nueva sala.
         */
        let createNewRoom = isCreateRoom;

        /**
         * Si es el caso que se está uniendo a una sala que no es privada,
         * se busca las salas que estén disponibles y en ese caso se indica
         * si se debe o no crear una nueva sala, si se tiene que crear
         * se indica el nuevo nombre de la sala...
         */
        if (isJoinExistingRoom) {
          /**
           * Se obtiene el listado de salas disponibles...
           */
          const availableRoom = await getAvailableRoom(totalPlayers, user);

          /**
           * Se valida si existe alguna sala...
           */
          if (availableRoom) {
            roomName = availableRoom.roomName;
            createNewRoom = false;
          } else {
            /**
             * Si no existe se crea un nuevo nombre de la sala
             */
            roomName = guid();
            createNewRoom = true;
          }
        }

        /**
         * Se crea una nueva sala...
         */
        if (createNewRoom) {
          /**
           * Se genera la data de la sala...
           */
          dataRoom = genDataNewRoom({
            data,
            authUser,
            socketID,
            roomName,
          });

          /**
           * Se guarda la nueva sala en redis...
           */
          await createRoom(roomName, dataRoom, totalPlayers);

          // console.log("dataRoom: ", dataRoom);
        } else {
          /**
           * En este caso se esta uniendo a una sala ya existente...
           */
          const roomToJoin = await getRoom(roomName);

          /**
           * Si no existe la sala...
           */
          if (!roomToJoin) {
            return cb?.(SocketErrors.INVALID_ROOM);
          }

          /**
           * En este caso si exitiría la sala...
           */
          const newUser = genUserSocket({
            playAsGuest,
            authUser,
            userGuest: data.user,
            socketID,
            color: getUserTokenColor(roomToJoin),
          });

          dataRoom = await updateUserInRoom(roomName, totalPlayers, newUser);
        }

        if (!dataRoom) {
          return cb?.(SocketErrors.INVALID_ROOM);
        }

        // console.log("dataRoom: ", dataRoom);

        // Se une el usuario a la sala...
        socket.join(roomName);

        // Se emite la información al usuario...
        io.sockets.in(roomName).emit("UPDATE_OPPONENT", dataRoom);

        /**
         * Se agregan valores extra al socket, para así poderlo identificar más fácil,
         * cuando existe una desconexión...
         */
        socket.extraData = { roomName, totalPlayers };

        /**
         * Existe la sala y además ya está completa con los jugadores, se realiza
         * un proceso para establecer si los clientes están listos para
         * jugar...
         */
        if (dataRoom.isFull) {
          await synchronizeGameStart({ roomName, io });
        }
      }
    );

    socket.on("ACTIONS", (data: ISocketActions) => {
      const { type, roomName } = data;

      /**
       * Se extrae los nombres de los tipos de acciones,
       * de esta manera se válida que sólo se escuchen los tipos válidos
       */
      const keyActions = Object.keys(EActionsBoardGame);

      // console.log(JSON.stringify(data, null, 2));

      if (keyActions.includes(type)) {
        /**
         * Se emite la data a todos los jugadores, es decir, si son 4 jugadores
         * el usuario que emite también escucha, esto con el fin de sincronizar
         * las acciones del juego.
         * Si usará socket.broadcast.to(roomName).emit(type, data);
         * el usuario que emite no escucharía y podría existir un momento en
         * que los datos no están sincronizados.
         */
        io.sockets.in(roomName).emit(type, data);
      }
    });

    socket.on("disconnect", async () => {
      if (socket?.extraData && socket.id) {
        /**
         * Se extra la data extra que se le agregó al socket, para
         * así poder identificar la sala más fácil...
         */
        const { roomName, totalPlayers } = socket.extraData;

        /**
         * Se ejecuta la función que elimina el usuario de la sala...
         */
        const dataRoom = await deleteUserFromRoom(
          roomName,
          totalPlayers,
          socket.id
        );

        /**
         * Si la eliminación fue éxitosa, se emite a los demás usuarios
         */
        if (dataRoom) {
          /**
           * Determinar si la sala ya estaba llena, es decir
           * que ya se estaba jugando...
           */
          const isFull = dataRoom.room.isFull;

          /**
           * Los tipos de eventos que se envíaran cuando se desconecta un usuario
           * del socket...
           */
          const dataTypeSocket = [
            {
              type: "OPPONENT_LEAVE",
              data: { OPPONENT_LEAVE: dataRoom.idUserDelete },
            },
            {
              type: "UPDATE_OPPONENT",
              data: dataRoom.room,
            },
          ];

          /**
           * Dependiendo si la sala está lleba o no se determina el tipo de
           * evento de socket que se emite...
           */
          const dataSocketDisconnect = dataTypeSocket[isFull ? 0 : 1];

          /**
           * Se emite el socket dependiendo de la validación anterior...
           */
          io.sockets
            .in(roomName)
            .emit(dataSocketDisconnect.type, dataSocketDisconnect.data);
        }
      }
    });
  });
};

export default startSocketServer;
