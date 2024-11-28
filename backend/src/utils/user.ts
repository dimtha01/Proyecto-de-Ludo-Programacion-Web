import type {
  IDataRoom,
  IDataSocketUser,
  IUserSocket,
  TColors,
} from "../interfaces";

interface GenUserSocket {
  playAsGuest: boolean;
  authUser: any;
  userGuest: IDataSocketUser;
  socketID: string;
  color: TColors;
}

export const genUserSocket = ({
  playAsGuest,
  authUser,
  userGuest,
  socketID,
  color,
}: GenUserSocket): IUserSocket => {
  /**
   * Se extrae la información del usuario que este autenticado,
   * si se está jugando como invitado no se obtiene...
   */
  const dataAuthUser = (!playAsGuest && authUser) || {};

  /**
   * Se extrae sólo el id del usuario si es que está autéticado,
   * esto con el fin de extraer sólo el ID como string no como
   * objecto (new ObjectId()) que es como lo devolvería moongose.
   */
  const authUserID = authUser._id?.toString() || "";

  /**
   * Se genera la data del usuario, si no existe data de un usaurio
   * autenticado se toma la data del usuario que sea invitado...
   */
  return {
    id: authUserID || userGuest.id,
    name: dataAuthUser?.name || userGuest.name,
    photo: dataAuthUser?.photo || "",
    socketID,
    color,
    isReady: false,
  };
};

/**
 * Función que devuleve el color que le corresponde al nuevo usuario,
 * este color se obtiene de la distrubución de colores que etsá guardado en la
 * sala.
 * @param dataRoom
 * @returns
 */
export const getUserTokenColor = (dataRoom: IDataRoom) => {
  const { users, colorDistribution } = dataRoom;
  const indexNewUser = users.length;

  return colorDistribution[indexNewUser];
};
