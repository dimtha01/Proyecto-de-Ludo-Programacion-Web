import {
  BASE_ZINDEX_TOKEN,
  EtypeTile,
  MAXIMUM_VISIBLE_TOKENS_PER_CELL,
  SIZE_TILE,
  ZINDEX_TOKEN_SELECT,
} from "../../../../utils/constants";
import type { IDiceList, TtypeTile } from "../../../../interfaces";
import React from "react";

/**
 * Dado el listado de dados que están totalmente disponibles,
 * devolver el indice real del dado seleccioando de acuerdo al key del mismo,
 * este key es un valor único (random)...
 * @param diceList
 * @param diceKey
 * @returns
 */
export const getDiceIndexSelected = (diceList: IDiceList[], diceKey: number) =>
  diceList.findIndex((v) => v.key === diceKey);

export interface ICalculateTokenStyles {
  totalTokens: number;
  position: number;
  totalDiceAvailable: number;
  isMoving: boolean;
  canSelectToken: boolean;
}

export const getZindexTokenWrapper = ({
  totalTokens,
  position,
  totalDiceAvailable,
  isMoving,
  canSelectToken,
}: ICalculateTokenStyles) => {
  /**
   * Se establece el zindex por defecto que tendrá el contenedor del token...
   */
  let zIndex = BASE_ZINDEX_TOKEN;

  /**
   * Sí tiene dados disponibles, se establece el zIndez de selección,
   * de esta forma el token quedará encima de los demás que estén en la misma celda
   * (si es que hay más...)
   * También se pondrá si la ficha se está moviendo, en este caso
   * tomará el zindex mayor para que quede arriba...
   * Se establece el valor canSelectToken con totalDiceAvailable,
   * ya que sólo debería tener en cuenta el valor de totalDiceAvailable,
   * si el usuario puede seleccionar el token, también entra cuando
   * se está moviendo el token...
   */
  if ((canSelectToken && totalDiceAvailable !== 0) || isMoving) {
    zIndex = ZINDEX_TOKEN_SELECT;
  } else {
    /**
     * Por el contrario si existen más tokens en la misma celda,
     * se establece su zindex dependiendo de la posición, de está forma
     * quedará uno sobre otr0.
     * Sólo se tienen en cuenta los primeros 4, si hay más no se les establece el zindex
     * y quedará con el valor por defecto...
     */
    if (totalTokens > 1 && position <= MAXIMUM_VISIBLE_TOKENS_PER_CELL) {
      zIndex = position;
    }
  }

  return zIndex;
};

export interface IGetTokenSyle extends ICalculateTokenStyles {
  typeTile: TtypeTile;
}

export const getTokenSyle = ({
  totalTokens,
  position,
  totalDiceAvailable,
  typeTile = EtypeTile.JAIL,
  isMoving,
  canSelectToken,
}: IGetTokenSyle): React.CSSProperties => {
  /**
   * Los diferentes scales dependiendo de la cantidad de fichas que existan en una misma celda
   */
  const scales = ["0.85", "0.7", "0.6", "0.5"];

  /**
   * La posición del token en la celda dependiendo de la cantidad de tokens que existan
   */
  const positions = [[0], [-4, 4], [-8, 0, 8], [-12, -5, 5, 12]];

  /**
   * Si el total de tokens (inicia en 1) es menor e igual que la totalidad de posiciones
   * se crea el indice, pero si el valor de totalTokens es mayor se indica por defecto que
   * el valor de la posición a tomar es la última, ya que se mostrarán como si fuera 4 tokens
   * Si existen más de 4, esos tokens no se mostraranm, pero para para los demás aplica la posición para 4
   */
  let indexPosition = totalTokens <= positions.length ? totalTokens - 1 : 3;

  /**
   * Si la posición del token es menor e igual que cuatro se establece el scale,
   * si no el scale será 0, oculatanto al token.
   * Por ejemplo si se tienen 6 tokens en la misma celda, sólo se mostraran 4 tokens,
   * el quinto y el sexto tendrán un scale de 0
   */
  let scale =
    position <= MAXIMUM_VISIBLE_TOKENS_PER_CELL ? scales[indexPosition] : 0;

  /**
   * Determina la posición de la misma en la celda...
   */
  let translateX =
    position <= MAXIMUM_VISIBLE_TOKENS_PER_CELL
      ? positions[indexPosition][position - 1]
      : 0;

  if ((canSelectToken && totalDiceAvailable !== 0) || isMoving) {
    scale = scales[0];
    translateX = positions[0][0];
  }

  /**
   * Si la ficha ya está en el punto final, se establece una scale menor...
   */
  if (typeTile === EtypeTile.END) {
    scale = "0.45";
  }

  return {
    width: SIZE_TILE,
    height: SIZE_TILE,
    transform: `scale(${scale}) translate(${translateX}px, -1px)`,
  };
};
