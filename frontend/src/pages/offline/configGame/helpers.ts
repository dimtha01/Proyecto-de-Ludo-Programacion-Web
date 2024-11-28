import { EBoardColors, ESufixColors } from "../../../utils/constants";
import { getColorsByTotalPlayers } from "../../../utils/colorDistribution";
import { guid, isNumber, randomNumber } from "../../../utils/helpers";
import {
  getValueFromCache,
  saveMultiplePropierties,
  savePropierties,
} from "../../../utils/storage";
import botImage from "../../../components/avatar/bot.png";
import cloneDeep from "lodash.clonedeep";
import type {
  DataOfflineGame,
  IUser,
  TBoardColors,
  TColors,
  TSufixColors,
  TTotalPlayers,
} from "../../../interfaces";

export type TProperty = "name" | "isBot";

export interface PlayersOffline {
  id: string;
  index: number;
  name: string;
  color: TColors;
  disabled: boolean;
  isBot: boolean;
}

/**
 * Guarda los datos de los jugadores en Caché...
 * @param players
 */
const savePlayerDataCache = (players: PlayersOffline[]) => {
  const playerDataCache = players.map(({ id, name, isBot }) => ({
    id,
    name,
    isBot,
  }));

  savePropierties("players", playerDataCache);
};

/**
 * Función que obtiene el número inicial de jugadores para la opción offline...
 * @returns
 */
export const getInitialTotalPlayers = (): TTotalPlayers => {
  /**
   * Primero se obtiene la información, si es que existe de LocalStorage...
   */
  const dataFroMcache = getValueFromCache("totalPlayers", 2) as TTotalPlayers;

  /**
   * Se valida que el valor sea un número y además esté en el rango de 2 a 4 jugadores...
   */
  const totalPlayers: TTotalPlayers =
    isNumber(dataFroMcache) && dataFroMcache >= 2 && dataFroMcache <= 4
      ? dataFroMcache
      : 2;

  return totalPlayers;
};

/**
 * Función que retorna la distrubución de colores del board...
 * @returns
 */
export const getInitialColorsBoard = () => {
  /**
   * Extrae la información que esté en caché, si es que existe...
   */
  const dataFromcache = getValueFromCache(
    "boardColor",
    EBoardColors.RGYB
  ) as TBoardColors;

  /**
   * Se establece el valor a retornoar y además se valida que sea una distribución
   * de colores válida.
   */
  const boardColor = Object.keys(EBoardColors).includes(dataFromcache)
    ? dataFromcache
    : EBoardColors.RGYB;

  return boardColor;
};

/**
 * Función que genera la data inicial que tendrá el componente de selección de jugadores.
 * además lee la data de los jugadores que estén guardados en localStorage...
 * @param totalPlayers
 * @returns
 */
export const getInitialDataPlayers = (totalPlayers: TTotalPlayers) => {
  /**
   * Obtiene los valores de los jugadores que están en localStorage...
   */
  const dataFromcache = getValueFromCache("players", []) as PlayersOffline[];

  /**
   * Almacena la data de los jugadores...
   */
  const initialDataPlayers: PlayersOffline[] = [];

  /**
   * Dado la dtsribución por ejemplo RGYB, se separa, obteniendo los sufijos de
   * cada color.
   */
  const boardColors = getInitialColorsBoard().split("");

  /**
   * Se estrae el primero color de la distrubución dek board,
   * boardColors tiene los sufijos por lo que con ESufixColors se toma el nombre
   * del color por ejemplo R = RED
   */
  const firstColor = ESufixColors[boardColors[0] as TSufixColors] as TColors;

  /**
   * Se obtiene el array de colores para los jugadores...
   */
  const { colors } = getColorsByTotalPlayers(firstColor, totalPlayers, 0);

  /**
   * Se iteran los colores, siempre serán 4.
   */
  for (let index = 0; index < boardColors.length; index++) {
    const numPlayer = index + 1;

    /**
     * Se valida si los campos están bloqueados...
     */
    const disabled = !(numPlayer <= totalPlayers);

    /**
     * Se obtiene el color que se mostrará del token,
     * en este caso depende si el color existe, si no se pone un
     * por defecto que proviene de boardColors, en este caso puede pasar que
     * sólo son dos jugadores, por lo que se tiene una distrubución de dos colores,
     * los otros colores se pasan al componente pero al estar bloqueados con disabled
     * en la UI no se mostrará color alguno...
     */
    const color =
      colors?.[index] ||
      (ESufixColors[boardColors[index] as TSufixColors] as TColors);

    /**
     * Se extrae de la información de la caché los campos de id, name y isBot,
     * si estos dados no existen, se establecen valores por defecto, esto
     * puedo pasar al primero momento de ingresar a la página, ya que no hay
     * datos en localStorage...
     */
    const id = dataFromcache?.[index]?.id || guid();
    const name = dataFromcache?.[index]?.name || `Player 0${numPlayer}`;
    const isBot = dataFromcache?.[index]?.isBot ?? false;

    initialDataPlayers.push({
      color,
      disabled,
      id,
      index,
      isBot,
      name,
    });
  }

  return initialDataPlayers;
};

interface ChangeTotalPlayers {
  totalPlayers: TTotalPlayers;
  players: PlayersOffline[];
  setTotalPlayers: React.Dispatch<React.SetStateAction<TTotalPlayers>>;
  setPlayers: React.Dispatch<React.SetStateAction<PlayersOffline[]>>;
  setboardColor: React.Dispatch<React.SetStateAction<TBoardColors>>;
}

/**
 * Función que establece el número de jugadores habilitados para jugar (2 - 4)...
 * @param param0
 */
export const changeTotalPlayers = ({
  totalPlayers,
  players,
  setTotalPlayers,
  setPlayers,
  setboardColor,
}: ChangeTotalPlayers) => {
  const copyPlayers = cloneDeep(players);

  /**
   * Se obtiene el color del primero jugador, para crear la distrubución
   * de colores de los tokens para los demás jugadoeres...
   */
  const firstColor = copyPlayers[0].color;

  /**
   * Se obtiene el listado de colores para cada player, dependiendo del
   * número de jugadores que está habilitados, además se obtiene la
   * distribución de colores del board...
   */
  const { colors, boardColor } = getColorsByTotalPlayers(
    firstColor,
    totalPlayers,
    0
  );

  for (let i = 0; i < copyPlayers.length; i++) {
    /**
     * Se establece si los campos del jugador estarán habilitados...
     */
    copyPlayers[i].disabled = !(i + 1 <= totalPlayers);

    /**
     * Se establecen el color del token del jugador, el cual puede cambiar
     * dependiendo del número de jugadores...
     */
    if (i < totalPlayers) {
      copyPlayers[i].color = colors[i];
    }
  }

  setTotalPlayers(totalPlayers);
  setPlayers(copyPlayers);
  setboardColor(boardColor);

  /**
   * Guardar en localStorage...
   */
  saveMultiplePropierties({ totalPlayers, boardColor });
  savePlayerDataCache(players);
};

interface ChangeDataPlayers {
  index: number;
  players: PlayersOffline[];
  property: TProperty;
  value: never;
  setPlayers: React.Dispatch<React.SetStateAction<PlayersOffline[]>>;
}

/**
 * Actualizar la información del nombre y isBot para cada usuaurio...
 * @param param0
 */
export const changeDataPlayers = ({
  index,
  players,
  property,
  value,
  setPlayers,
}: ChangeDataPlayers) => {
  const copyPlayers = cloneDeep(players);

  copyPlayers[index][property] = value;

  setPlayers(copyPlayers);
  savePlayerDataCache(copyPlayers);
};

interface ChangeColorPlayers {
  color: TColors;
  index: number;
  players: PlayersOffline[];
  totalPlayers: TTotalPlayers;
  setPlayers: React.Dispatch<React.SetStateAction<PlayersOffline[]>>;
  setboardColor: React.Dispatch<React.SetStateAction<TBoardColors>>;
}

/**
 * Función que valida el cambio de color del token,
 * además de la distrubución de los colores para los demás players, validando
 * que dos players no tengan el mismo color...
 */
export const changeColorPlayers = ({
  color,
  index,
  players,
  totalPlayers,
  setPlayers,
  setboardColor,
}: ChangeColorPlayers) => {
  const copyPlayers = cloneDeep(players);

  /**
   * Se obtiene el listado de colores por player y además la distribución de
   * colores del board...
   */
  const { colors, boardColor } = getColorsByTotalPlayers(
    color,
    totalPlayers,
    index
  );

  for (let i = 0; i < colors.length; i++) {
    copyPlayers[i].color = colors[i];
  }

  setPlayers(copyPlayers);
  setboardColor(boardColor);

  /**
   * Se guarda en localStorage la distrubución de los colores del Board.
   * Nota: No se guarda los players, por que el color de los tokens no se almacena,
   * éste es calculado de nuevo en función del valor de boardColor
   */
  savePropierties("boardColor", boardColor);
};

/**
 * Función que genera la data que es pasada al componete Game...
 * @param totalPlayers
 * @param players
 * @param boardColor
 * @returns
 */
export const getGameData = (
  totalPlayers: TTotalPlayers,
  players: PlayersOffline[],
  boardColor: TBoardColors
): DataOfflineGame => {
  /**
   * Se obtiene de forma aleatoria el turno inicial, dependiendo del número
   * de jugadores seleccionados...
   */
  const initialTurn = randomNumber(0, totalPlayers - 1);

  /**
   * Se generan los usuarios que se pasarán al componente Game, en este caso,
   * solo es necesario algunos campos, si es un Bot, se pasa una imagen que
   * representa el bot, si no se deja la imagen por defecto...
   */
  const users: IUser[] = players
    .filter(({ disabled }) => !disabled)
    .map(({ id, name, isBot }) => ({
      id,
      name,
      isBot,
      photo: isBot ? botImage : undefined,
    }));

  return {
    initialTurn,
    users,
    totalPlayers,
    boardColor,
  };
};
