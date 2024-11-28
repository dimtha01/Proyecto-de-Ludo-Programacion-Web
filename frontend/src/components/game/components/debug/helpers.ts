import { EtypeTile } from "../../../../utils/constants";
import {
  IListTokens,
  IPlayer,
  TPositionGame,
  TtypeTile,
} from "../../../../interfaces";
import {
  POSITION_ELEMENTS_BOARD,
  POSITION_TILES,
  SAFE_AREAS,
} from "../../../../utils/positions-board";
import cloneDeep from "lodash.clonedeep";

export type TOptions = "player" | "token" | "type" | "position";
export type TSelects = Record<TOptions, number>;

/**
 * Genera un array con el nombre de los tipos de celdas que existen.
 */
export const LIST_TYPE_TILE = Object.keys(EtypeTile);

/**
 * Función que retorna las opciones para el select de positions
 * dependiendo del tipo de celda seleccionada...
 * @param type
 * @param position
 * @returns
 */
const getDebugPositionsTiles = (type: number, position: TPositionGame) => {
  const tileType = LIST_TYPE_TILE[type] as TtypeTile;

  if (tileType === EtypeTile.JAIL) {
    return POSITION_ELEMENTS_BOARD[position].startPositions.map((v) => ({
      id: v.index,
      label: v.index,
    }));
  }

  if (tileType === EtypeTile.NORMAL) {
    return POSITION_TILES.map((v) => {
      /**
       * Se valida si es una celda segura para añadir el texto al label...
       */
      const label = `${v.index}${
        SAFE_AREAS.includes(v.index) ? " - SAFE" : ""
      }`;

      return { id: v.index, label };
    });
  }

  if (tileType === EtypeTile.EXIT) {
    return POSITION_ELEMENTS_BOARD[position].exitTiles.map((v) => ({
      id: v.index,
      label: v.index,
    }));
  }

  /**
   * Por defecto devolverá las celdas de tipo END
   */

  return POSITION_ELEMENTS_BOARD[position].finalPositions.map((v) => ({
    id: v.index,
    label: v.index,
  }));
};

/**
 * Función que genera los options para cada uno de los selects del componente...
 * @param selects
 * @param players
 * @param listTokens
 * @returns
 */
export const getOptionsSelects = (
  selects: TSelects,
  players: IPlayer[],
  listTokens: IListTokens[]
) => {
  const playerOptions = players.map((v) => ({ id: v.index, label: v.color }));

  const tokenOptions =
    selects.player >= 0
      ? listTokens[selects.player].tokens.map((v) => ({
          id: v.index,
          label: `Token ${v.index}`,
        }))
      : [];

  const typesOptions =
    selects.token >= 0
      ? LIST_TYPE_TILE.map((v, index) => ({
          id: index,
          label: v,
        }))
      : [];

  const positionOptions =
    selects.type >= 0
      ? getDebugPositionsTiles(
          selects.type,
          listTokens[selects.player].positionGame
        )
      : [];

  return {
    player: playerOptions,
    token: tokenOptions,
    type: typesOptions,
    position: positionOptions,
  };
};

/**
 * Devuleve el listado de coordenadas dependiendo del tipo de celda...
 * @param tileType
 * @param positionGame
 * @returns
 */
const getDebugCoordiantes = (
  tileType: TtypeTile,
  positionGame: TPositionGame
) => {
  if (tileType === EtypeTile.JAIL) {
    return POSITION_ELEMENTS_BOARD[positionGame].startPositions;
  }

  if (tileType === EtypeTile.NORMAL) {
    return POSITION_TILES;
  }

  if (tileType === EtypeTile.EXIT) {
    return POSITION_ELEMENTS_BOARD[positionGame].exitTiles;
  }

  // END
  return POSITION_ELEMENTS_BOARD[positionGame].finalPositions;
};

interface ValidateChangeToken {
  selects: TSelects;
  listTokens: IListTokens[];
  setListTokens: React.Dispatch<React.SetStateAction<IListTokens[]>>;
}

/**
 * Función que realiza el cambio de posición del token, dependiendo de los valores
 * seleccionados en los selects...
 * @param param0
 */
export const validateChangeToken = ({
  selects,
  listTokens,
  setListTokens,
}: ValidateChangeToken) => {
  /**
   * Se obtiene el tipo de celda seleccionada, ya que en el select sólo se guarda el indice
   * entonces se extrae el tipo del array LIST_TYPE_TILE y se le aplica su tipo...
   */
  const tileType = LIST_TYPE_TILE[selects.type] as TtypeTile;

  const copyListTokens = cloneDeep(listTokens);

  /**
   * Se obtiene la posición del player ("BOTTOM_LEFT" | "TOP_LEFT" |
   * "TOP_RIGHT" | "BOTTOM_RIGHT")
   * con este se podrá sacar las coordenadas.
   */
  const { positionGame } = copyListTokens[selects.player];

  /**
   * Se extrae las coordenadas donde se ubicará el token...
   */
  const coordinates = getDebugCoordiantes(tileType, positionGame);
  const { coordinate } = coordinates[selects.position];

  /**
   * Se establece los nuevos valores del token seleccionado...
   */
  copyListTokens[selects.player].tokens[selects.token].coordinate = coordinate;
  /**
   * * El tipo es importante por que con éste se sabe el tipo de celda donde está
   * el token...
   */
  copyListTokens[selects.player].tokens[selects.token].typeTile = tileType;

  /**
   * El positionTile es el index del array de coordenadas, dependiendo del tipo de
   * celda...
   */
  copyListTokens[selects.player].tokens[selects.token].positionTile =
    selects.position;

  setListTokens(copyListTokens);
};
