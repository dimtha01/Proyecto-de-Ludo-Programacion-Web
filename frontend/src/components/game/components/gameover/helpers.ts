import cloneDeep from "lodash.clonedeep";
import type { IPlayer } from "../../../../interfaces";
import { PREFIX_RANKING } from "../../../../utils/constants";

/**
 * Devuelve el label del ranking a mostrar en el modal de game over...
 * @param ranking
 * @returns
 */
export const getLabelRanking = (ranking = 0) =>
  `${ranking}${PREFIX_RANKING[ranking - 1]}`;

/**
 * Función que ordena el listado de jugadores, en función a su ranking
 * @param players
 * @returns
 */
export const getOrganizedRanking = (players: IPlayer[]) => {
  /**
   * Se clona el valor original de players, ya que sort mutaría el array,
   * luego se extrae el primer player, y se deja los demás jugadores...
   */
  const [first, ...others] = cloneDeep(players).sort(
    (a, b) => a.ranking - b.ranking
  );

  return { first, others };
};
