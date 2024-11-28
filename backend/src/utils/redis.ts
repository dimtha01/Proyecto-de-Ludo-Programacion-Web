import { redisClient } from "../db/redis";
import {
  IAvailableRoom,
  IAvailableRoomData,
  IDataRoom,
  IDataSocketUser,
  IUserSocket,
  TTotalPlayers,
} from "../interfaces";
import {
  INITIAL_AVAILABLE_ROOMS,
  KEY_AVAILABLE_ROOMS,
  ROOM_TTL,
} from "./constants";
import { isValidJson, randomNumber } from "./helpers";

/**
 * Guarda información en redis...
 * @param data
 * @param redisKey
 * @param EX
 */
const setDataRedis = async <T>(data: T, redisKey: string, EX = 0) => {
  await redisClient.set(redisKey, JSON.stringify(data), EX !== 0 ? { EX } : {});
};

/**
 * Se serializa la información de un string que estaba en redis, a un objeto,
 * si la data no es válida, se devuelve el valor por defecto...
 * @param data
 * @param defaultValue
 * @returns
 */
const getRedisDataFromStringToJSON = <T>(
  data: string = "",
  defaultValue: T
): T => (data && isValidJson(data) ? JSON.parse(data) : defaultValue);

/**
 * Dado el key, se devuelve del valor que está en redis ese Key,
 * si no existe, se establece el valor por dfecto...
 * @param key
 * @param defaultValue
 * @returns
 */
const getDataRedisByKey = async <T>(
  key: string,
  defaultValue: T
): Promise<T> => {
  /**
   * Se obtiene la data que están en redis, por el key
   */
  const data = await redisClient.get(key);

  /**
   * Se ontiene la información ya serializada...
   */
  return getRedisDataFromStringToJSON(data || "", defaultValue);
};

/**
 * Devuleve el valor que exista en redis con esa llave...
 * @returns
 */
const getAvailableRoomsInRedis = async () => {
  /**
   * Se extrae de redis la infomación de salas disponibles, este objeto,
   * su propiedad es el total de jugadores y estés tiene un array con el nombre de la
   * sala y además si ésta es o no privada...
   */
  const availableRooms = await getDataRedisByKey<IAvailableRoom>(
    KEY_AVAILABLE_ROOMS,
    INITIAL_AVAILABLE_ROOMS
  );

  return availableRooms;
};

/**
 * Actualiza la data de las salas disponibles en redis...
 * @param roomsAvailable
 */
const updateAvailableRooms = async (roomsAvailable: IAvailableRoom) => {
  await setDataRedis(roomsAvailable, KEY_AVAILABLE_ROOMS);
};

/**
 * Se actualiza la data de una sala en redis...
 * @param roomName
 * @param dataRoom
 */
const updateRoom = async (roomName: string, dataRoom: IDataRoom) => {
  await setDataRedis(dataRoom, roomName, ROOM_TTL);
};

/**
 * Se agrega una nueva sala disponible a redis, en este caso relacionado
 * al total de jugadores...
 * @param totalPlayers
 * @param availableRoomData
 */
const addRoomToAvailableRooms = async (
  totalPlayers: TTotalPlayers,
  availableRoomData: IAvailableRoomData
) => {
  /**
   * Se trae el listado de salas disponibles...
   */
  const roomsAvailable = await getAvailableRoomsInRedis();

  /**
   * Se agrega el valor de la sala disponibles a la propiedad relacionada
   * al número de juagadores...
   */
  roomsAvailable[totalPlayers].push(availableRoomData);

  /**
   * Se actualiza la data en redis para esa llave...
   */
  await updateAvailableRooms(roomsAvailable);
};

/**
 * Se elimina el valor de una sala en el listado de salas disponibles de redis...
 * @param totalPlayers
 * @param roomName
 */
const removeRoomFromAvailableRooms = async (
  totalPlayers: TTotalPlayers,
  roomName: string
) => {
  /**
   * Se trae el listado de salas disponibles...
   */
  const roomsAvailable = await getAvailableRoomsInRedis();

  if (roomsAvailable[totalPlayers].length !== 0) {
    /**
     * Se Busca la sala en el listado de salas disponibles...
     */
    const roomIndex = roomsAvailable[totalPlayers].findIndex(
      (room) => room.roomName === roomName
    );

    /**
     * Si existe la sala...
     */
    if (roomIndex >= 0) {
      /**
       * Se elimina el valor de la sala...
       */
      roomsAvailable[totalPlayers].splice(roomIndex, 1);

      /**
       * Se guarda la data en redis, en la llave de salas disponibles...
       */
      await updateAvailableRooms(roomsAvailable);
    }
  }
};

/**
 * Nos crea una sala en redis...
 * @param roomName
 * @param dataRoom
 * @param totalPlayers
 */
export const createRoom = async (
  roomName: string,
  dataRoom: IDataRoom,
  totalPlayers: TTotalPlayers
) => {
  /**
   * Se guarda el valor en la llave de salas disponibles...
   */
  await addRoomToAvailableRooms(totalPlayers, {
    roomName,
    isPrivate: dataRoom.isPrivate,
  });

  /**
   * Ahora se guarda la data en redis de sólo esa sala...
   */
  await updateRoom(roomName, dataRoom);
};

/**
 * Dado el número de jugadores y el usaurio que se quiere unir,
 * se busca una sala que esté disponible...
 * @param totalPlayers
 * @param user
 * @returns
 */
export const getAvailableRoom = async (
  totalPlayers: TTotalPlayers,
  user: IDataSocketUser
) => {
  /**
   * Se extrae el valor de las salas que están disponibles, por ejemplo si el total es 2,
   * se buscaría en availableRooms[2], esté a su vez devuleve un array y con este se busca
   * la sala que esté disponible...
   */
  const availableRooms = await getAvailableRoomsInRedis();

  /**
   * Se extrar el listado de sals dependiendo del total de jugadores que puede tener la sala...
   */
  const roomsAvailableTotalPlayers = availableRooms[totalPlayers];

  if (roomsAvailableTotalPlayers.length !== 0) {
    for (const room of roomsAvailableTotalPlayers) {
      const { roomName, isPrivate } = room;

      /**
       * Si no es una sala privada, se puede usar...
       */
      if (!isPrivate) {
        const room = await getDataRedisByKey<IDataRoom | null>(roomName, null);

        /**
         * Si se ha encontrado la sala, en redis...
         */
        if (room) {
          const { isFull, users } = room;

          /**
           * Valida si el usuario que está buscando la sala, ya existe en la sala que
           * se está evaluando...
           */
          const userAlreadyInRoom =
            users.findIndex((v) => v.id === user.id) >= 0;

          if (!isFull && !userAlreadyInRoom) {
            return room;
          }
        } else {
          /**
           * Si no existe la sala en el listado de salas de redis a nivel general,
           * se elimina del listado de salas disponibles de la llave KEY_AVAILABLE_ROOMS
           */
          await removeRoomFromAvailableRooms(totalPlayers, roomName);
        }
      }
    }
  }
};

/**
 * Función que elimina una sala de redis...
 * @param roomName
 * @param totalPlayers
 */
export const deleteRoom = async (
  roomName: string,
  totalPlayers: TTotalPlayers
) => {
  /**
   * Primero se elimina la sala del listado de salas disponibles...
   */
  await removeRoomFromAvailableRooms(totalPlayers, roomName);

  /**
   * Ahora se elimina la llave completamente de redis de la sala..
   */
  await redisClient.del(roomName);
};

/**
 * Devuleve el valor de una sala...
 * @param roomName
 * @returns
 */
export const getRoom = async (roomName: string) => {
  const room = await getDataRedisByKey<IDataRoom | null>(roomName, null);

  return room;
};

/**
 * Actualiza la información de los usuarios en una sala...
 * @param roomName
 * @param totalPlayers
 * @param newUser
 * @returns
 */
export const updateUserInRoom = async (
  roomName: string,
  totalPlayers: TTotalPlayers,
  newUser: IUserSocket
) => {
  /**
   * Se obtiene la sala de redis..
   */
  const room = await getRoom(roomName);

  /**
   * Se valida que exista la sala, además que no esté llena...
   */
  if (room && !room.isFull) {
    const { users } = room;

    /**
     * Valida si el usuario que está buscando la sala, ya existe en la sala que
     * se está evaluando...
     */
    const userAlreadyInRoom = users.findIndex((v) => v.id === newUser.id) >= 0;

    /**
     * Ya existe el usuario en la sala, por lo tanto no se puede agregar de nuevo...
     */
    if (userAlreadyInRoom) return;

    /**
     * Se agrega el número usuario a la sala...
     */
    room.users.push(newUser);

    /**
     * Se obtiene la nueva cantidad de usuarios...
     */
    const newTotalPlayers = room.users.length;

    /**
     * Se determina si la sala ya está llena...
     */
    if (newTotalPlayers === totalPlayers) {
      room.isFull = true;

      /**
       * Se obtiene los usarios, en este caso sólo los id's...
       */
      const usersID = room.users.map((v) => v.id);

      /**
       * Se obtiene el id del usuario que tendrá el turno...
       */
      room.initialTurnUserID = usersID[randomNumber(0, totalPlayers - 1)];

      /**
       * Como la sala ya está llena, se debe sacar del listado de salas disponnibles...
       */
      await removeRoomFromAvailableRooms(totalPlayers, roomName);
    }

    /**
     * Se actualiza la data en redis para la sala...
     */
    await updateRoom(roomName, room);

    /**
     * Se indica que el proceso fue éxitoso...
     */
    return room;
  }
};

/**
 * Función que elimina a un usuario de una sala...
 * @param roomName
 * @param totalPlayers
 * @param socketID
 * @returns
 */
export const deleteUserFromRoom = async (
  roomName: string,
  totalPlayers: TTotalPlayers,
  socketID: string
) => {
  /**
   * Se extrae las salas actuales...
   */
  const room = await getRoom(roomName);

  if (room) {
    /**
     * Se busca el indice donde se encuentra el usuario...
     */
    const indexUserDelete = room.users.findIndex(
      (v) => v.socketID === socketID
    );

    if (indexUserDelete >= 0) {
      /**
       * Se obtiene el id del usaurio que se ha elimiando de la sala...
       */
      const idUserDelete = room.users[indexUserDelete].id;

      /**
       * Se elimina el usuario del listado de usuarios de la sala...
       */
      room.users.splice(indexUserDelete, 1);

      /**
       * Si ya no hay usuarios en la sala, se elimina la sala de redis...
       */
      if (room.users.length === 0) {
        await deleteRoom(roomName, totalPlayers);
      } else {
        /**
         * Sí la sala no está llena, es decir que no se ha iniciado el juego,
         * se debe redistribuir los colores del board, entre los usuarios que
         * quedan...
         */
        if (!room.isFull) {
          for (let i = 0; i < room.users.length; i++) {
            room.users[i].color = room.colorDistribution[i];
          }
        }

        /**
         * Se actualiza la data en redis...
         */
        await updateRoom(roomName, room);

        /**
         * Si no se retorna la sala...
         */
        return { room, idUserDelete };
      }
    }
  }
};
