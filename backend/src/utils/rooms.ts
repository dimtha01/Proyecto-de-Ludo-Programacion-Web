import { genUserSocket } from "./user";
import { randomNumber } from "./helpers";
import {
  EBoardColors,
  EColors,
  ESufixColors,
  TYPES_ONLINE_GAMEPLAY,
} from "./constants";
import type {
  IDataRoom,
  IDataSocket,
  TBoardColors,
  TColors,
  TSufixColors,
  TTotalPlayers,
} from "../interfaces";

/**
 * Se obtiene de forma aleatoria el color base para el board...
 * @returns
 */
const getInitialColorToken = (): TColors => {
  /**
   * Se crea como un array...
   */
  const colors = Object.keys(EColors);
  const totalColors = colors.length;

  /**
   * Se obtiene aleatoriamente el color...
   */
  return colors[randomNumber(0, totalColors - 1)] as TColors;
};

/**
 * Función que obtiene el color de la distrubución del board..
 * @param index
 * @param colorSuffix
 * @returns
 */
const getBoardColorType = (index: number, colorSuffix: string) =>
  Object.keys(EBoardColors).find((v) => {
    /**
     * Se itreab cada uno de los diferentes tipos de distrubuciones del board,
     * por ejemplo si se índica que el color es RED, colorSuffix sería R y la posición
     * del que ha cambiado es 2 (index = 2), se busca la distrubución que cumpla esa
     * condición en este caso YBRG sería el que cumple, ya que en la posición 2 se
     * encuentra el sufijo R, por lo tanto la distrubución del board es YBRG
     */
    const splitColor = v.split("");
    return splitColor[index] === colorSuffix;
  }) as TBoardColors;

/**
 * Función que devuleve la distrubución de colores, seleccionado un color
 * y la posición del mismo, además depende del número de jugadores...
 * @param color
 * @param totalPlayers
 * @param index
 * @returns
 */
const getColorsByTotalPlayers = (
  color: TColors,
  totalPlayers: TTotalPlayers,
  index: number
) => {
  const colorDistribution: TColors[] = [];
  /**
   * Se Obtiene el sufijo del color que se va a cambiar, por ejemplo, si el
   * color es RED, su sufijo sería R.
   */
  const colorSuffix = color.substring(0, 1);

  /**
   * Se validan si son dos jugadores, en este caso se deben devolver los colores
   * opoestos al color seleccionado, por ejemplo si se selecciona el color RED para el
   * jugador 1, el color opuesto sería YELLOW.
   */
  if (totalPlayers === 2) {
    /**
     * Se obtiene el índice por el cual se hará la búsqueda en la distribución de los boards,
     * por ejemplo si el índice del juagdor es 0, el valor a buscar sería 0, si tenemos
     * la distrbución RGYB, el valor que se tomaría sería R y para el usuario contrario el
     * índice sería el 2, con el mismo ejemplo su color sería Y (posición 2 en RGYB)
     */
    const indexSearch = index === 0 ? 0 : 2;
    /**
     * Función que devuleve la distrubución de colores del board...
     */
    const boardColor = getBoardColorType(indexSearch, colorSuffix);
    /**
     * Teniendo por ejemplo RGYB se divide cada uno de sus sufijos, en este
     * caso se guardaría un array de string con los valores de RGYB de forma
     * indepediente...
     */
    const splitColor = boardColor?.split("") || [];

    /**
     * Se obtiene el color del sufijo para el primer color, por ejemplo
     * si el indice del jugador a cambiar es 0 se extraeria R de RGYB,
     * en caso contrario si no es 0 su valor sería Y
     */
    const sufixFirstColor = (
      index === 0 ? splitColor[0] : splitColor[2]
    ) as TSufixColors;

    /**
     * Se hace la acción opuesta de la aanterior para obtener el segundo sufijo de color...
     */
    const sifixSecondColor = (
      index === 0 ? splitColor[2] : splitColor[0]
    ) as TSufixColors;

    /**
     * Teniendo los sufijos de los colres se obtiene el nombre de los colores,
     * por ejemplo R = RED, Y = YELLOW
     */
    const firstColor = ESufixColors[sufixFirstColor] as TColors;
    const secondColor = ESufixColors[sifixSecondColor] as TColors;

    /**
     * Se obtiene el indice opuesto del jugador que está haciendo el cambio...
     */
    const oppositeIndex = index === 0 ? 1 : 0;

    /**
     * Como son dos jugadores se deben devolver dos colores,
     * para el jugador que hizo el cambio se establece el color en el array de
     * colorDistribution, pero este color debe ser igual al color que usuario seleccinó,
     * por ello se valida si el color seleccionado es igual a uno de los colores obtenidos..
     */
    colorDistribution[index] = color === firstColor ? color : secondColor;

    /**
     * Se realiza la misma acción para el usuario opuesto...
     */
    colorDistribution[oppositeIndex] =
      color === firstColor ? secondColor : color;

    /**
     * Se devuelve la información de distrubución de colores del board
     * y el del orden de colores para cada jugador...
     */
    return colorDistribution;
  }

  /**
   * En el caso cuando son 3 ó 4 jugadores el proceso es el mismo, ya que no
   * se debe obtener un usuario contrario y el orden es que da la dstribución de colores
   */

  /**
   * Se obtiene la distrubción de colores del board, dependiendo del sufijo y del
   * indice del color, por ejemplo si el index 1 y colorSuffix es B, la
   * distrubución de color del board podría ser YBRG
   */
  const boardColor = getBoardColorType(index, colorSuffix);

  /**
   * Se dividen los sufijos...
   */
  const splitColor = boardColor?.split("") || [];

  /**
   * Se iteran los sufijos de colores...
   */
  for (let i = 0; i < splitColor.length; i++) {
    const value = splitColor[i] as TSufixColors;

    /**
     * Sólo se devuelven colores dependiendo de la cantidad de juagdores,
     * si son 3, colorDistribution sólo tendría tres colores y asi sucesivamente...
     */
    if (i < totalPlayers) {
      const finalColor = ESufixColors[value] as TColors;
      colorDistribution.push(finalColor);
    }
  }

  return colorDistribution;
};

interface GenDataNewRoom {
  data: IDataSocket;
  authUser: any;
  socketID: string;
  roomName: string;
}

/**
 * Genera la información necesaria para una nueva sala, que será guardada en redis...
 * @param param0
 * @returns
 */
export const genDataNewRoom = ({
  data,
  authUser,
  socketID,
  roomName,
}: GenDataNewRoom) => {
  /**
   * Se obtiene el color inicial del token, si viene del cliente se toma ese
   * valor, de lo contrario se genra de forma aleatoria...
   */
  const initialColor = data.initialColor || getInitialColorToken();

  /**
   * Se genera la data del nuevo usuario...
   */
  const newUser = genUserSocket({
    playAsGuest: data.playAsGuest,
    authUser,
    userGuest: data.user,
    socketID,
    color: initialColor,
  });

  const colorDistribution = getColorsByTotalPlayers(
    initialColor,
    data.totalPlayers,
    0
  );

  /**
   * Valida si es una sala privada, se establece cuando se indica que el tipo
   * que ha llegado del cliente es de tipo de creación de sala, de lo
   * contrario sería false...
   */
  const isPrivate = data.type === TYPES_ONLINE_GAMEPLAY.CREATE_ROOM;

  /**
   * La data que se guardará en redis...
   */
  const dataRoom: IDataRoom = {
    initialTurnUserID: "",
    initialColor,
    isPrivate,
    isFull: false,
    roomName,
    users: [newUser],
    colorDistribution,
    totalPlayers: data.totalPlayers,
    gameStarted: false,
  };

  return dataRoom;
};
