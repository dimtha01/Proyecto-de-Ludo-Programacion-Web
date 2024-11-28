import type { ICoordinate } from "../../../../../../interfaces";
import {
  DIE_SIZE_TOOLTIP,
  SIZE_BOARD,
  SIZE_TILE,
} from "../../../../../../utils/constants";

/**
 * Valida si una coordenada se encuentra dentro de las dimensiones del board...
 * @param coordinate
 * @returns
 */
const coordinateInRange = (coordinate: ICoordinate) =>
  coordinate.x >= 0 &&
  coordinate.x <= SIZE_BOARD &&
  coordinate.y >= 0 &&
  coordinate.y <= SIZE_BOARD;

/**
 * Se calcula la posición del tooltip...
 * @param totalDiceAvailable
 * @param coordinate
 * @returns
 */
export const getPositionTooltip = (
  totalDiceAvailable: number,
  coordinate: ICoordinate
) => {
  const finalPosition: { position: string; coordinate: ICoordinate } = {
    position: "",
    coordinate: { x: 0, y: 0 },
  };

  /**
   * Se obtiene el tamaño que tiene el tooltip, dependiendo del número de dados...
   */
  const tooltipSize = {
    width: Math.round(totalDiceAvailable * DIE_SIZE_TOOLTIP),
    height: DIE_SIZE_TOOLTIP,
  };

  /**
   * Establece las posibles posciones donde puede quedar el tooltip...
   */
  const posiblePositions = {
    center: {
      x: (tooltipSize.width / 2) * -1,
      y: (tooltipSize.height + SIZE_TILE) * -1,
    },
    left: {
      x: 0,
      y: (tooltipSize.height + SIZE_TILE) * -1,
    },
    top: {
      x: (tooltipSize.width / 2) * -1,
      y: tooltipSize.height + 5,
    },
    right: {
      x: (tooltipSize.width - 8) * -1,
      y: (tooltipSize.height + SIZE_TILE) * -1,
    },
  };

  /**
   * Se extraen los valores...
   */
  const positions = Object.entries(posiblePositions);

  /**
   * Se iteran las posibles posiciones...
   */
  for (let i = 0; i < positions.length; i++) {
    /**
     * Se obtiene la coordenada de inicio (arriba izquerda)
     */
    const start = {
      x: coordinate.x + positions[i][1].x,
      y: coordinate.y + positions[i][1].y,
    };

    /**
     * Se obtiene la coordenada final (abajo derecha)
     * se agregan los valores de padding
     */
    const end = {
      x: start.x + tooltipSize.width + 16,
      y: start.y + tooltipSize.height + 8,
    };

    /**
     * Se valida que las coordenadas estén dentro del board...
     */
    if (coordinateInRange(start) && coordinateInRange(end)) {
      finalPosition.position = positions[i][0];
      finalPosition.coordinate = start;
      break;
    }
  }

  return finalPosition;
};
