import type {
  IDataRoom,
  IDataRoomSocket,
  IDataSocketUser,
  IUser,
  IUserSocket,
  TDataRoomUserOrder,
  TTotalPlayers,
} from "../interfaces";
import { getColorsByTotalPlayers } from "./colorDistribution";
import { ETypeGame } from "./constants";

/**
 * Dado el objeto qie contiene el orden de los usaurios,
 * devuleve el array de usuarios que se usarán en el componente de Game...
 * @param orderPlayers
 * @param totalPlayers
 * @returns
 */
const getUsersPlay = (
  orderPlayers: TDataRoomUserOrder,
  totalPlayers: TTotalPlayers
) => {
  const users: IUser[] = [];

  for (let i = 1; i <= totalPlayers; i++) {
    const { id, name, photo, socketID } = orderPlayers[i];
    users.push({ id, name, photo, socketID, isOnline: true });
  }

  return users;
};

/**
 * Devuelve el usuario actual que se está conectado...
 * @param currentUser
 * @param users
 * @returns
 */
export const getCurrentUser = (
  currentUser: IDataSocketUser,
  users: IUserSocket[]
) => users.find((user) => user.id === currentUser.id);

export const updateDataRoomSocket = (
  dataRoom: IDataRoom,
  user: IDataSocketUser
): IDataRoomSocket => {
  const { isFull, totalPlayers, users } = dataRoom;

  /**
   * Se obtiene el usuario actual de la sesión...
   */
  const currentUser = getCurrentUser(user, users);

  /**
   * Guarda el orden de los usuarios que será mostrando en la panralla de match..
   */
  const orderPlayers: TDataRoomUserOrder = {};

  /**
   * De aceurdo al color del usuario se obtien el color del board,
   * y los colores correspondientes a los demás jugadores...
   */
  const { boardColor, colors } = getColorsByTotalPlayers(
    currentUser!.color,
    totalPlayers,
    0
  );

  /**
   * Se itrean los colores...
   */
  for (let i = 0; i < colors.length; i++) {
    /**
     * Dado el color se busca el mismo en el listado de usuarios que se han
     * conectado...
     */
    const userColor = users.find((user) => user.color === colors[i]);

    /**
     * Si existe se crea un objeto, cuya propiedad es el orden del usuario
     * en la pantalla y su valor es el color...
     */
    if (userColor) {
      orderPlayers[i + 1] = userColor;
    }
  }

  return {
    isFull,
    boardColor,
    totalPlayers,
    orderPlayers,
  };
};

export const getDataOnlineGame = (
  dataRoomSocket: IDataRoomSocket,
  dataRoom: IDataRoom
) => {
  const { totalPlayers, orderPlayers, boardColor } = dataRoomSocket;
  const { initialTurnUserID, roomName } = dataRoom;

  const users = getUsersPlay(orderPlayers, totalPlayers);
  const initialTurn = users.findIndex((v) => v.id === initialTurnUserID);

  return {
    totalPlayers,
    initialTurn,
    users,
    boardColor,
    roomName,
    typeGame: ETypeGame.ONLINE,
  };
};
