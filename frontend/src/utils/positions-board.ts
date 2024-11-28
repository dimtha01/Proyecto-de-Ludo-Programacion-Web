import { SIZE_TILE } from "./constants";
import type {
  IPoint,
  IPositionsItems,
  TExitTilesValues,
  TFinalPositionsValues,
  TLocationBoardElements,
} from "../interfaces";

/**
 * Guarda las valores de las posiciones para la ubicación de las fichas,
 * cuando se ha llevado la misma al punto final (ha terminado)....
 */
const FINAL_POSITIONS_VALUES: TFinalPositionsValues = {
  BOTTOM_LEFT: [
    {
      index: 0,
      coordinate: {
        x: Math.round(SIZE_TILE * 7 - SIZE_TILE / 1.8),
        y: Math.round(SIZE_TILE * 8 + SIZE_TILE / 8),
      },
    },
    {
      index: 1,
      coordinate: {
        x: Math.round(SIZE_TILE * 7),
        y: Math.round(SIZE_TILE * 8 + SIZE_TILE / 8),
      },
    },
    {
      index: 2,
      coordinate: {
        x: Math.round(SIZE_TILE * 7 + SIZE_TILE / 1.8),
        y: Math.round(SIZE_TILE * 8 + SIZE_TILE / 8),
      },
    },
    {
      index: 3,
      coordinate: {
        x: Math.round(SIZE_TILE * 7),
        y: Math.round(SIZE_TILE * 8 - SIZE_TILE / 2.3),
      },
    },
  ],
  TOP_LEFT: [
    {
      index: 0,
      coordinate: {
        x: Math.round(SIZE_TILE * 6 - SIZE_TILE / 8),
        y: Math.round(SIZE_TILE * 7 - SIZE_TILE / 1.8),
      },
    },
    {
      index: 1,
      coordinate: {
        x: Math.round(SIZE_TILE * 6 - SIZE_TILE / 8),
        y: Math.round(SIZE_TILE * 7),
      },
    },
    {
      index: 2,
      coordinate: {
        x: Math.round(SIZE_TILE * 6 - SIZE_TILE / 8),
        y: Math.round(SIZE_TILE * 7 + SIZE_TILE / 1.8),
      },
    },
    {
      index: 3,
      coordinate: {
        x: Math.round(SIZE_TILE * 6 + SIZE_TILE / 2.3),
        y: Math.round(SIZE_TILE * 7),
      },
    },
  ],
  TOP_RIGHT: [
    {
      index: 0,
      coordinate: {
        x: Math.round(SIZE_TILE * 7 + SIZE_TILE / 1.8),
        y: Math.round(SIZE_TILE * 6 - SIZE_TILE / 8),
      },
    },
    {
      index: 1,
      coordinate: {
        x: Math.round(SIZE_TILE * 7),
        y: Math.round(SIZE_TILE * 6 - SIZE_TILE / 8),
      },
    },
    {
      index: 2,
      coordinate: {
        x: Math.round(SIZE_TILE * 7 - SIZE_TILE / 1.8),
        y: Math.round(SIZE_TILE * 6 - SIZE_TILE / 8),
      },
    },
    {
      index: 3,
      coordinate: {
        x: Math.round(SIZE_TILE * 7),
        y: Math.round(SIZE_TILE * 6 + SIZE_TILE / 2.3),
      },
    },
  ],
  BOTTOM_RIGHT: [
    {
      index: 0,
      coordinate: {
        x: Math.round(SIZE_TILE * 8 + SIZE_TILE / 8),
        y: Math.round(SIZE_TILE * 7 + SIZE_TILE / 1.8),
      },
    },
    {
      index: 1,
      coordinate: {
        x: Math.round(SIZE_TILE * 8 + SIZE_TILE / 8),
        y: Math.round(SIZE_TILE * 7),
      },
    },
    {
      index: 2,
      coordinate: {
        x: Math.round(SIZE_TILE * 8 + SIZE_TILE / 8),
        y: Math.round(SIZE_TILE * 7 - SIZE_TILE / 1.8),
      },
    },
    {
      index: 3,
      coordinate: {
        x: Math.round(SIZE_TILE * 8 - SIZE_TILE / 2.3),
        y: Math.round(SIZE_TILE * 7),
      },
    },
  ],
};

/**
 * Guarda los valores para calcular la posición de las celdas de salida...
 */
const EXIT_TILES_VALUES: TExitTilesValues = {
  BOTTOM_LEFT: {
    x: 7,
    y: 13,
    increaseX: 0,
    increaseY: -1,
    total: 5,
    indexBase: 0,
  },
  TOP_LEFT: {
    x: 1,
    y: 7,
    increaseX: 1,
    increaseY: 0,
    total: 5,
    indexBase: 0,
  },
  TOP_RIGHT: {
    x: 7,
    y: 1,
    increaseX: 0,
    increaseY: 1,
    total: 5,
    indexBase: 0,
  },
  BOTTOM_RIGHT: {
    x: 13,
    y: 7,
    increaseX: -1,
    increaseY: 0,
    total: 5,
    indexBase: 0,
  },
};

/**
 * Información para generar la data de los tiles en el board...
 */
const POINTS: IPoint[] = [
  {
    x: 6,
    y: 13,
    increaseX: 0,
    increaseY: -1,
    total: 5,
    indexBase: 0,
  },
  {
    x: 5,
    y: 8,
    increaseX: -1,
    increaseY: 0,
    total: 6,
    indexBase: 5,
  },
  {
    x: 0,
    y: 7,
    increaseX: 0,
    increaseY: -1,
    total: 2,
    indexBase: 11,
  },
  {
    x: 1,
    y: 6,
    increaseX: 1,
    increaseY: 0,
    total: 5,
    indexBase: 13,
  },
  {
    x: 6,
    y: 5,
    increaseX: 0,
    increaseY: -1,
    total: 6,
    indexBase: 18,
  },
  {
    x: 7,
    y: 0,
    increaseX: 1,
    increaseY: 0,
    total: 2,
    indexBase: 24,
  },
  {
    x: 8,
    y: 1,
    increaseX: 0,
    increaseY: 1,
    total: 5,
    indexBase: 26,
  },
  {
    x: 9,
    y: 6,
    increaseX: 1,
    increaseY: 0,
    total: 6,
    indexBase: 31,
  },
  {
    x: 14,
    y: 7,
    increaseX: 0,
    increaseY: 1,
    total: 2,
    indexBase: 37,
  },
  {
    x: 13,
    y: 8,
    increaseX: -1,
    increaseY: 0,
    total: 5,
    indexBase: 39,
  },
  {
    x: 8,
    y: 9,
    increaseX: 0,
    increaseY: 1,
    total: 6,
    indexBase: 44,
  },
  {
    x: 7,
    y: 14,
    increaseX: -1,
    increaseY: 0,
    total: 2,
    indexBase: 50,
  },
];

/**
 * Dado un punto determina la información de coordenadas para el tile en el board.
 * @param point
 * @returns
 */
const calculatePosition = (point: IPoint) => {
  const position: IPositionsItems[] = [];

  const { x, y, increaseX, increaseY, total, indexBase } = point;

  for (let i = 0; i < total; i++) {
    const index = indexBase + i;
    const baseX = x + increaseX * i;
    const baseY = y + increaseY * i;

    const coordinate = {
      x: SIZE_TILE * baseX,
      y: SIZE_TILE * baseY,
    };

    position.push({ index, coordinate });
  }

  return position;
};

/**
 * Calcula la posición del punto de inicio (fichas en la carcel)
 * @param baseX
 * @param baseY
 * @returns
 */
const getStartPositions = (baseX: number, baseY: number) => {
  const position: IPositionsItems[] = [];
  const center = SIZE_TILE / 2;

  for (let i = 0; i < 4; i++) {
    const increaseX = i >= 2 ? 2 : 0;
    const increaseY = i % 2 !== 0 ? 2 : 0;

    const x = SIZE_TILE * (baseX + increaseX) - center;
    const y = SIZE_TILE * (baseY + increaseY) - center;

    position.push({
      index: i,
      coordinate: { x, y },
    });
  }

  return position;
};

/**
 * Indices de las celdas que se consideran seguras...
 */
export const SAFE_AREAS = [0, 8, 13, 21, 26, 34, 39, 47];

/**
 * Variable que contiene la información de posición de los board en el tablero
 * se aplica flat para que quede un array unidimensional...
 */
export const POSITION_TILES = POINTS.map((point) =>
  calculatePosition(point)
).flat();

/**
 * Devuleve el total de tiles que existen en el board,
 * estos son los tiles normales, no lo de salida, en total son 52
 */
export const TOTAL_TILES = POSITION_TILES.length;

/**
 * La totalidad de las celdas de salida, en este caso se muestran cinco,
 * pero se adiciona la celda extra para salir del board...
 */
export const TOTAL_EXIT_TILES = 6;

/**
 * Objeto que contiene las posiciones del board, dependiendo de la ubicación de cada jugador...
 */
export const POSITION_ELEMENTS_BOARD: TLocationBoardElements = {
  BOTTOM_LEFT: {
    exitTileIndex: 50,
    exitTiles: calculatePosition(EXIT_TILES_VALUES.BOTTOM_LEFT),
    finalPositions: FINAL_POSITIONS_VALUES.BOTTOM_LEFT,
    startPositions: getStartPositions(2, 11),
    startTileIndex: 0,
  },
  TOP_LEFT: {
    exitTileIndex: 11,
    exitTiles: calculatePosition(EXIT_TILES_VALUES.TOP_LEFT),
    finalPositions: FINAL_POSITIONS_VALUES.TOP_LEFT,
    startPositions: getStartPositions(2, 2),
    startTileIndex: 13,
  },
  TOP_RIGHT: {
    exitTileIndex: 24,
    exitTiles: calculatePosition(EXIT_TILES_VALUES.TOP_RIGHT),
    finalPositions: FINAL_POSITIONS_VALUES.TOP_RIGHT,
    startPositions: getStartPositions(11, 2),
    startTileIndex: 26,
  },
  BOTTOM_RIGHT: {
    exitTileIndex: 37,
    exitTiles: calculatePosition(EXIT_TILES_VALUES.BOTTOM_RIGHT),
    finalPositions: FINAL_POSITIONS_VALUES.BOTTOM_RIGHT,
    startPositions: getStartPositions(11, 11),
    startTileIndex: 39,
  },
};
