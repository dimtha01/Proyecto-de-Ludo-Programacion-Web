import { delay, randomNumber } from "../../utils/helpers";
import { getDiceIndexSelected } from "./components/token/helpers";
// import { TOKENS_JAIN_AND_OUTSITE } from "./components/debug/states";
import {
  BASE_TOKENS_SYNC,
  DELAY_DONE_TOKEN_MOVEMENT_SOCKET,
  DICE_VALUE_GET_OUT_JAIL,
  EActionsBoardGame,
  ENextStepGame,
  EPositionGame,
  ESounds,
  ESufixColors,
  EtypeTile,
  MAXIMUM_DICE_PER_TURN,
  MAXIMUM_VISIBLE_TOKENS_PER_CELL,
  PREDEFINED_CHAT_MESSAGES,
} from "../../utils/constants";
import {
  POSITION_ELEMENTS_BOARD,
  POSITION_TILES,
  SAFE_AREAS,
  TOTAL_EXIT_TILES,
  TOTAL_TILES,
} from "../../utils/positions-board";
import cloneDeep from "lodash.clonedeep";
import type {
  IActionsMoveToken,
  IActionsTurn,
  IDiceList,
  IENextStepGame,
  IESounds,
  IGameOver,
  IListTokens,
  IPlayer,
  ISocketActions,
  ISocketListenChatMessage,
  IToken,
  IUser,
  TBoardColors,
  TColors,
  TDicevalues,
  TPositionGame,
  TShowTotalTokens,
  TSufixColors,
  TTokenByPositionType,
  TTokensSocket,
  TTotalPlayers,
  TtypeTile,
} from "../../interfaces";
import { Socket } from "socket.io-client";

/**
 * Dependiendo del total de jugadores se duvuelen los colores que corresponde a las
 * posiciones donde quedará cada jugador...
 * @param boardColor
 * @param totalPlayers
 * @returns
 */
const getPlayersColors = (
  boardColor: TBoardColors,
  totalPlayers: TTotalPlayers
) => {
  /**
   * Se divide el nombre de cada una de las letras correspondientes a los colores...
   */
  const splitColor = boardColor.split("");
  /**
   * Se obtiene el nombre de los colores en relación al sufijo...
   */
  const colors = splitColor.map((v) => ESufixColors[v as TSufixColors]);

  /**
   * Dependiendo del total de jugadores se duvuelen los colores que corresponde a las
   * posiciones donde quedará cada jugador...
   */
  if (totalPlayers === 2) {
    return [colors[0], colors[2]];
  }

  if (totalPlayers === 3) {
    return [colors[0], colors[1], colors[2]];
  }

  return colors;
};

/**
 * Dependiendo del número de jugadores, devuelve los valores de posiciones
 * para cada token...
 * @param totalPlayers
 */
const getTokensPositionsOnBoard = (totalPlayers: TTotalPlayers) => {
  /**
   * Dependiendo la cantidad de jugadores, se devuelve el valor de posiciones...
   */
  if (totalPlayers === 2) {
    return [EPositionGame.BOTTOM_LEFT, EPositionGame.TOP_RIGHT];
  }

  if (totalPlayers === 3) {
    return [
      EPositionGame.BOTTOM_LEFT,
      EPositionGame.TOP_LEFT,
      EPositionGame.TOP_RIGHT,
    ];
  }

  return [
    EPositionGame.BOTTOM_LEFT,
    EPositionGame.TOP_LEFT,
    EPositionGame.TOP_RIGHT,
    EPositionGame.BOTTOM_RIGHT,
  ];
};

/**
 * Devuelve el listado de coordendas, dependiendo del tipo de celda
 * además de la posición en el board
 * @param tileType
 * @param positionGame
 * @param index
 * @returns
 */
const getCoordinatesByTileType = (
  tileType: TtypeTile,
  positionGame: TPositionGame,
  index: number
) => {
  if (tileType === EtypeTile.JAIL) {
    return POSITION_ELEMENTS_BOARD[positionGame].startPositions[index]
      .coordinate;
  }

  if (tileType === EtypeTile.NORMAL) {
    return POSITION_TILES[index].coordinate;
  }

  if (tileType === EtypeTile.EXIT) {
    return POSITION_ELEMENTS_BOARD[positionGame].exitTiles[index].coordinate;
  }

  // END
  return POSITION_ELEMENTS_BOARD[positionGame].finalPositions[index].coordinate;
};

/**
 * Función que genera la data para ubicar los tokens en la cárcel...
 * @param positionGame
 * @param color
 * @param canSelectToken
 */
const getTokensInJail = (
  positionGame: TPositionGame,
  color: TColors,
  canSelectToken: boolean
) => {
  const tokens: IToken[] = [];

  for (let i = 0; i < 4; i++) {
    /**
     * Se obtiene la coordenada de posición para los tokens,
     * en este caso se requuiere las relacionadas a la cárcel...
     */
    const coordinate = getCoordinatesByTileType(
      EtypeTile.JAIL,
      positionGame,
      i
    );

    tokens.push({
      color,
      coordinate,
      typeTile: EtypeTile.JAIL,
      positionTile: i,
      index: i,
      diceAvailable: [],
      totalTokens: 1,
      position: 1,
      enableTooltip: false,
      isMoving: false,
      animated: false,
      canSelectToken,
    });
  }

  return tokens;
};

/**
 * Valida si el botón del dado estaría bloqueado...
 * @param indexTurn
 * @param players
 * @returns
 */
const validateDisabledDice = (indexTurn: number, players: IPlayer[]) => {
  /**
   * Se obtiene la información del jugador que tiene el turno...
   */
  const { isOnline, isBot } = players[indexTurn];

  let disabledDice = !!(isBot || isOnline);

  /**
   * Si es un jugador online y es el jugador uno (0) eso quiere decir
   * que se puede habilitar el botón...
   */
  if (isOnline && indexTurn === 0) {
    disabledDice = false;
  }

  return disabledDice;
};

/**
 * Función que valida si existen tres dados con el mismo valor,
 * cuando sucede esto, el usuario pierde el turno...
 * @param diceList
 * @returns
 */
const validateThreeConsecutiveRolls = (diceList: IDiceList[]) => {
  let isConsecutiveDice = false;

  /**
   * Se valida que la totalidad de dados sea igual al máximo permitido..
   */
  if (diceList.length === MAXIMUM_DICE_PER_TURN) {
    /**
     * Se obtiene el primer dado...
     */
    const firstDice = diceList[0].value;
    /**
     * Se valida si todos los dados son iguales...
     */
    isConsecutiveDice = diceList.every((v) => v.value === firstDice);
  }

  return isConsecutiveDice;
};

interface ValidateNextTurn {
  currentTurn: number;
  players: IPlayer[];
  addLastDice?: boolean;
  addDelayNextTurn?: boolean;
  setActionsTurn: React.Dispatch<React.SetStateAction<IActionsTurn>>;
  setCurrentTurn: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Función que valida la acción para pasar al siguiente turno...
 * No debe llegar a está función si ya se ha terminado el juego...
 * @param param0
 */
const validateNextTurn = async ({
  currentTurn,
  players,
  addLastDice = false,
  addDelayNextTurn = false,
  setActionsTurn,
  setCurrentTurn,
}: ValidateNextTurn) => {
  /**
   * Agrega el último valor del dado cuando es necesario,
   * está validación tiene el fin de mostra por ejemplo cuando se han ontenido
   * los  3 dados con el valor de seis..
   */
  if (addLastDice) {
    /**
     * Establece el valor de último dado obtenido para ser mostrado en la UI
     */
    setActionsTurn((data) => {
      /**
       * Se hace una copia del estado...
       */
      const newData = cloneDeep(data);

      /**
       * Se extrae el valor del dado que se ha obtenido...
       */
      const value = newData.diceValue as TDicevalues;

      /**
       * Se establece el dado en el litado de dados
       */
      newData.diceList.push({ key: Math.random(), value });

      /**
       * Se establece que el dado esté bloqueado y que además no se active el cronometro...
       */
      newData.disabledDice = true;
      newData.timerActivated = false;

      return newData;
    });
  }

  /**
   * Se establece una interrupción, con el fin de poder reflejado el valor en el UI...
   */
  if (addDelayNextTurn) {
    await delay(250);
  }

  /**
   * Pasada la interrupción se realiza el proceso de obtener el siguiente turno...
   */
  let nextTurn = currentTurn;

  /**
   * Se utiliza un ciclo infinito, para así validar los casos de los
   * jugadores que hayan terminado o que estén offline
   */
  do {
    /**
     * Se mantiene el valor de nextTurn...
     */
    nextTurn = nextTurn + 1 < players.length ? nextTurn + 1 : 0;

    /**
     * Para evitar que se quede en un ciclo infinito, se valida si el valor
     * del siguiente turno es igual al turno actual...
     */
    if (nextTurn === currentTurn) {
      console.log(
        "Romper el ciclo infinito, el siguiente turno no debería ser igual al turno actual"
      );
      break;
    }

    /**
     * Se extrae la información para saber si el juagdor ha terminado
     * y además si el usuario ha estado offline (se aplica en al jugabilidad online)
     */
    const { finished, isOffline } = players[nextTurn];

    /**
     * Si no ha terminado y además no está offline, se establece el nuevo valor del turno...
     */
    if (!finished && !isOffline) {
      /**
       * Establece los valores base para las acciones del turno...
       */
      setActionsTurn(getInitialActionsTurnValue(nextTurn, players));
      /**
       * Establece el valor del nuevo turno...
       */
      setCurrentTurn(nextTurn);
      /**
       * Rompe el ciclo infinito ya que se ha enocntrado un turno válido...
       */
      break;
    }
  } while (1);
};

/**
 * Dado el listado de tokens y el tipo los filtra con ese valor
 * @param listTokens
 * @param type
 * @returns
 */
const getTokenByCellType = (listTokens: IListTokens, type: TtypeTile) =>
  listTokens.tokens.filter((token) => token.typeTile === type);

/**
 * Dado los tokens del turno actual, se obtiene el tipo de ubicación de cada
 * uno de los tokens (JAIL, NORMAL, EXIT, END)
 * @param listTokens
 * @returns
 */
const getTokensValueByCellType = (listTokens: IListTokens) =>
  Object.keys(EtypeTile)
    .map((type) => {
      const typeTile = type as TtypeTile;

      return { [typeTile]: getTokenByCellType(listTokens, typeTile) };
    })
    .reduce((a, s) => ({ ...a, ...s }), {}) as TTokenByPositionType;

/**
 * Dado los tokens, se devuleve un objeto de la forma:
 * 1: Token, 1 representa la posición, en este caso se busca que en cada
 * popsición de una celda dada sólo se devuelva un token, esto con el fin
 * de evaluar un sólo token si en la celda hay varios tokesn del mismo tipo.
 * @param tokens
 * @returns
 */
const getUniquePositionTokenCell = (tokens: IToken[]) => {
  /**
   * Guarda la relación de la posición de los tokens en las celdas normales,
   * esto para sólo guardar tokens cuyas celdas sean diferentes...
   */
  const positionAndToken: Record<number, number> = {};

  /**
   * Se iteran los tokens que están en las celdas normales o exit...
   */
  for (let i = 0; i < tokens.length; i++) {
    /**
     * Se obtiene sólo un token, es decir, si hay dos o más tokens del mismo
     * tipo en la celda se escoge sólo uno
     */
    const { positionTile } = tokens[i];

    /**
     * Valida si ya se ha evaluado la posición,
     * en este caso se usa ?? por si el valor guardado es 0,
     * además se valida que el indice sea mayor e igual que cero..
     */
    const existValue = (positionAndToken[positionTile] ?? -1) >= 0;

    /**
     * Se valida si ya exitía la posición del token guardada en positionAndToken,
     * en este caso por ejemplo si los 4 tokens están en la misma celda,
     * sólo se elige uno, ya que es innecesario validar los demás ya que sería lo
     * mismo.
     */
    if (!existValue) {
      /**
       * Se devuelve el index dle token
       */
      positionAndToken[positionTile] = tokens[i].index;
    }
  }

  return positionAndToken;
};

/**
 * Función que valida el incremento de celdas,
 * previene que se salga del rango de celdas de movimiento,
 * en este caso el valor máximo es TOTAL_TILES (52), si llega a este valor
 * el nuevo valor de la celda sería cero..
 * @param positionTile
 */
const validateIncrementTokenMovement = (positionTile: number) => {
  let newPosition = positionTile + 1;

  /**
   * Si el valor de la nueva celda excede el total disponible,
   * se inicia desde cero (51 -> 0)
   */
  if (newPosition >= TOTAL_TILES) {
    newPosition = 0;
  }

  return newPosition;
};

/**
 * Retorna la cantidad y los tokens que se encuentran en una celda,
 * el valor de tokens debería llegar filtrado a esta función, es decir,
 * sólo llegar aquellos tokens que sea de tipo NORMAL o de tipo EXIT
 * @param positionTile
 * @param tokens
 * @returns
 */
const getTotalTokensInCell = (positionTile: number, tokens: IToken[]) => {
  /**
   * Extrae los tokens que estén en la posición dada,
   * en este caso sólo se guarda el índice...
   */
  const tokensByPosition = tokens
    .filter((v) => v.positionTile === positionTile)
    .map((v) => v.index);

  /**
   * Se guarda el total de tokens encontrados
   */
  const total = tokensByPosition.length;

  return { total, tokensByPosition };
};

/**
 * Dada la posición de una celda y el listado de tokens,
 * devuleve el total de tokens que existe en esa celda, además de la
 * distribución de tokens por player que existe en ese total...
 * FUNCIÓN APLICABLE SÓLO PARA LA CELDAS NORMALES, NO DE SALIDA...
 * @param positionTile
 * @param listTokens
 */
const getTotalTokensInNormalCell = (
  positionTile: number,
  listTokens: IListTokens[]
) => {
  let total = 0;
  const distribution: Record<number, number[]> = {};

  /**
   * Se iterás los tokens disponibles...
   */
  for (let i = 0; i < listTokens.length; i++) {
    /**
     * Se obtienen sólo los tokens que estén en las celdas normales...
     */
    const tokensInNormalCell = listTokens[i].tokens.filter(
      (v) => v.typeTile === EtypeTile.NORMAL
    );

    const { total: newTotal, tokensByPosition } = getTotalTokensInCell(
      positionTile,
      tokensInNormalCell
    );

    if (newTotal !== 0) {
      /**
       * Se guarda la sumatoria de tokens.
       */
      total += newTotal;

      /**
       * se guarda el valor del player (i) con el listado los indices de los tokens,
       * que pertenecen a ese player...
       */
      distribution[i] = tokensByPosition;
    }
  }

  return { total, distribution };
};

/**
 * Válida si el número de celda es un ára segura...
 * @param positionTile
 * @returns
 */
const validateSafeArea = (positionTile: number) =>
  SAFE_AREAS.includes(positionTile);

interface ValidateMovementTokenWithValueDice {
  currentTurn: number;
  diceValue: TDicevalues;
  listTokens: IListTokens[];
  positionGame: TPositionGame;
  positionTile: number;
}

/**
 * Función que valida si el valor de un dado para un token se puede usar,
 * en este caso podría no servir un token si:
 * 1. La celda de destino está ocupada por dos o más tokens de un color diferente
 * al que se está evaluando, esto se considera una barrera
 * 2. El valor del dado excede o no es suficiente para las celdas de salida...
 * @param param0
 * @returns
 */
const validateMovementTokenWithValueDice = ({
  currentTurn,
  diceValue,
  listTokens,
  positionGame,
  positionTile,
}: ValidateMovementTokenWithValueDice) => {
  /**
   * Se extrae el índice de la celda de salida, del player...
   */
  const { exitTileIndex } = POSITION_ELEMENTS_BOARD[positionGame];

  /**
   * Variable que indica si es válida o no la celda de destino...
   */
  let isValid = true;

  /**
   * Varianle que tendrá el contador de la nueva celda.
   */
  let newPositionTile = positionTile;

  /**
   * Se utiliza un ciclo, por que en este caso, es necesario evaluar el contador
   * de la nueva celda, en este caso, para saber si ha llegado o está pasando,
   * por la celda de salida, de otro modo no se tedría en cuenta a la celda de
   * salida y seguiría a la siguiente, por ejemplo el token estaba en la celda 22,
   * cuya celda de salida es la 24, si el valor del dado es 5, se podría decir
   * que la celda de destino es 27, pero debido a que la celda de salida es 24,
   * debería llegar sólo hasta ese valor e ingresar a las celdas de salida, en esta
   * parte sí se evalúa si con el valor de dado que le queda puede o no salir...
   */
  for (let i = 0; i < diceValue; i++) {
    /**
     * No se encuentra en la celda de salida del board...
     */
    if (newPositionTile !== exitTileIndex) {
      /**
       * Se valida la nueva posición de incremnto del token,
       * teniendo en cuenta cuando se debe reniciar el contador,
       * sólo aplicable para las celdas normales...
       */
      newPositionTile = validateIncrementTokenMovement(newPositionTile);

      /**
       * Es la celda de destino, la celda final,
       * se debe validar si se puede mover
       */
      if (i === diceValue - 1) {
        /**
         * Se valida el total de tokens que existen en la celda de destino...
         */
        const totalTokensInCell = getTotalTokensInNormalCell(
          newPositionTile,
          listTokens
        );

        /**
         * Quiere decir que existen tokens en la celda de destino...
         * además que esa celda de destino no es segura, cuando es una celda segura
         * (safe), pueden exitir el número de tokens que se deseen, por ello,
         * sólo se hará una validación especial si la celda no es segura...
         * ------------------------------------------------------------------
         * Validación: Es mayor e igual que dos, ya que si existe un token, en ese caso,
         * puede ser que se envíe un token a la cárcel o puede ser un token del mismo
         * tipo, pero si son dos tokens se debe valir si esos token no forman
         * una barrera...
         */
        if (
          totalTokensInCell.total >= 2 &&
          !validateSafeArea(newPositionTile)
        ) {
          /**
           * totalTokensInCell devuleve el total de tokes,
           * totalTokensInCell.distribution la ditruncuón por cada player,
           * con currentTurn se accedería al player que se está evauando..
           * ------------------------------------------------------------------
           * Validación: Se extrae el listado de índices de los tokens que tienen el turno actual.
           * Sí no existe el valor sera un array vacío.
           * La lógica es la siguiente:
           * Si ingresa a esta parte, es que existen dos o más tokens en la misma celda,
           * además no es una zona segura, en este caso, si existen tokens del mismo color
           * del token que se está validando, eso quiere decir que se podría mover, en caso
           * contrario quiere decir que son tokens del mismo color de otro player,
           * ya que no podran existir tokens de diferente colores en la misma celda,
           * a no ser que sea una celda segura, lo cual no es el caso en está validación.
           */
          const tokensSameTurn =
            totalTokensInCell.distribution[currentTurn] ?? [];

          /**
           * Si no se encunetra tokens del mismo color que se está evaluando, quiere decir
           * que son de otro color, por lo tanto no es una casilla válida para moverse
           */
          if (tokensSameTurn.length === 0) {
            isValid = false;
          }
        }
      }
    } else {
      /**
       * Se obtienen las celdas que le quedan para movers en las celdas de salida.
       */
      const remainingCells = diceValue - i;
      /**
       * Sería un dado no válido para este caso si:
       * No tiene celdas disponibles o si el excde la cantidad de celdas disponibles
       * ------------------------------------------------------
       */

      /**
       * Validación que es poco problable que se ejeucté, para se deja con el
       * fin de así evitar que el valor dado se desbordé cuando el token esté
       * por salir...
       */
      if (remainingCells <= 0 || remainingCells > TOTAL_EXIT_TILES) {
        isValid = false;
      }

      /**
       * No es necesario evaluar los demás valores restantes del dado...
       */
      break;
    }
  }

  return isValid;
};

interface ValidateDiceForTokenMovement {
  currentTurn: number;
  listTokens: IListTokens[];
  diceList: IDiceList[];
}

/**
 * Función que determina si con los valores de los dados, se podrá mover los
 * tokens que se tienen disponibles, en este caso se prepara la data la cual
 * será devuleta para así ser almacenada en el estado...
 * @param param0
 * @returns
 */
const validateDiceForTokenMovement = ({
  currentTurn,
  listTokens,
  diceList,
}: ValidateDiceForTokenMovement) => {
  /**
   * Se hace una copia del listado de tokens que se podrían modificar,
   */
  const copyListTokens = cloneDeep(listTokens);

  /**
   * Se establece la posición de donde se deben ontener los valores del token...
   */
  const { positionGame } = copyListTokens[currentTurn];
  /**
   * Se obtiene los diferentes tokens que se podrían mover, dependiendo en que
   * tipo de celda se encuentran, en este caso sólo se necesita los tokens que
   * estén en la cárcel (JAIL), los que estén en las celdas normales (NORMAL) y
   * los que se encuentren en las celdas de salida
   * Los tokens en el punto final (END) no es necesario en este caso...
   */
  const { JAIL, NORMAL, EXIT } = getTokensValueByCellType(
    copyListTokens[currentTurn]
  );

  /**
   * Busca dentro del array de dados disponibles, si existe un número seis, esté
   * no siempre estaría de primeras por ello se busca el índice, además sólo
   * se busca uno, con éste índice se pasa el valor a los tokens que estén en la
   * cárcel, si es que hay.
   */
  const indexSixAvailable = diceList.findIndex(
    (v) => v.value === DICE_VALUE_GET_OUT_JAIL
  );

  /**
   * Validar si se tiene fichas en la cárcel y saber si entre los valores
   * de los dados hay un seis para poder utilizar, si es así, todos los dados,
   * estarían habilitados...
   */
  if (JAIL.length !== 0 && indexSixAvailable >= 0) {
    /**
     * Se establece que los tokens tienen un dado disponible,
     * se itera los valores que estén en la cárcel y se le pasa el dado seis
     */
    for (let i = 0; i < JAIL.length; i++) {
      /**
       * Se extra el índex del token, éste puede que no sea igual que el
       * valor de i
       */
      const indexToken = JAIL[i].index;

      /**
       * Se establece el valor en los dados disponibles, ya que se espera un
       * array se establece de esta forma, a pesar de ser un sólo ítem
       */
      copyListTokens[currentTurn].tokens[indexToken].diceAvailable = [
        diceList[indexSixAvailable],
      ];
    }
  }

  /**
   * Se utiliza un forEach para de esta forma reusar lógica, en este caso,
   * lo único que cambiaría en la validación, es validar si el dado es válido entre NORMAL y EXIT.
   * Primero se hace la acción para NORMAL y luego para EXIT
   */
  [NORMAL, EXIT].forEach((tokensEvaluate, evaluatedIndex) => {
    /**
     * Se valida si existen tokens a evaluar.
     * 0: Para NORMAL.
     * 1: Para Exit.
     */
    if (tokensEvaluate.length !== 0) {
      /**
       * Se ontiene un token único por celda, que son los que se evaluarán,
       * con los valores de lo(s) dado(s) entregados...
       */
      const positionAndToken = getUniquePositionTokenCell(tokensEvaluate);

      /**
       * Se iteran las posiciones de los tokens que se tienen disponibles
       * debido a que es un objeto se hará uso de un for/in
       */
      for (let positionTile in positionAndToken) {
        /**
         * Guada el valor de los dados que ya han sido evaluados,
         * útil pra evitar evaluar un dado del mismo valor, por ejemplo
         * si los dados son 6, 6, 5, se evalúa el 6, se guarda en diceEvaluated,
         * además se guarda si es válido, luego se pasa a evaluar el segunfdo 6,
         * como ya se encuentra en diceEvaluated, ya no se vuelva a evaluar y se toma
         * el resultado que esté en isValid, por último se válida el 5
         */
        const diceEvaluated: { diceValue: TDicevalues; isValid: boolean }[] =
          [];

        /**
         * Guarda los dados que estarán dosponibles para el token que se está evaluando...
         */
        const diceAvailable: IDiceList[] = [];

        /**
         * Se iteran los dados en relación a los tokens que están disponibles...
         */
        // diceList = 6, 6, 5
        for (let i = 0; i < diceList.length; i++) {
          /**
           * Se extrae el valor del dado a evaluar...
           * diceValue = 6
           */
          const { value: diceValue } = diceList[i];

          /**
           * Se valida si el dado ya se había evaluado, en este caso,
           * comparando el dado actual con el valor almacenado en diceEvaluated,
           * si existe evaluated se ontiene el valor de isValid, el cual indicará si el dado
           * es válido o no para el token evaluado...
           */
          const evaluated = diceEvaluated.find(
            (v) => v.diceValue === diceValue
          );

          /**
           * Sí ya se había evaluado el dado se toma el valor que se haya almacenado
           * anteriomente, si no existe por defecto sería false.
           */
          let isValid = evaluated?.isValid ?? false;

          /**
           * Sí el dado no ha sido evaluado (difente a que sea o no válido), se invocan
           * las funciones, dependiendo del tipo de tokens a evaluar (NORMAL ó EXIT)
           * que harán la validación de si es válido o no el dado para el token
           * que se está evaluando...
           */
          if (!evaluated) {
            /**
             * Se evaluan los tokens de tipo NORMAL
             */
            if (evaluatedIndex === 0) {
              /**
               * Se invoca la función que validará si el dado es válido para el token...
               */
              isValid = validateMovementTokenWithValueDice({
                currentTurn,
                diceValue,
                listTokens,
                positionGame,
                positionTile: +positionTile,
              });
            } else {
              /**
               * Se evalúa los tokens de tipo EXIT.
               * Se resta el total de celdas de salida, con el valor de la posción de
               * la celda, en este caso positionTile es un string, entonces se convierte a número.
               * Además se resta uno de la posición actual...
               */
              const remainingCells = TOTAL_EXIT_TILES - +positionTile - 1;

              /**
               * Se evalua si el valor del dado es menor e igual que el valor
               * que queda para salir...
               */
              isValid = diceValue <= remainingCells;
            }

            /**
             * Se guarda el dado evaluado y la respuesta de isValid relacionada al dado.
             */
            diceEvaluated.push({ diceValue, isValid });
          }

          /**
           * Si el dado es válido se guara en los dados disponibles para el token...
           */
          if (isValid) {
            diceAvailable.push(diceList[i]);
          }
        }

        /**
         * Validar si existen dados disponibles.
         */
        if (diceAvailable.length !== 0) {
          /**
           * Se guarda el valor de dados disponibles en otra variable,
           * para de esta forma poder validar si son el mismo valor...
           */
          let finalDiceAvailable = diceAvailable;

          /**
           * Si existe más de dos dados disponibles, se valida si son iguales...
           * La lógica es la siguiente, si el usuario tiene más de dados del mismo
           * valor, al final es lo mismo, es decir, para no mostrar un tooltip
           * con los valores por ejemplo 6, 6, se indica que para ese token, sólo
           * se moverá un valor de seis, ya que no importa el que se elija, dará
           * el mimos resultado, pero es diferente si el usuario obtuvo por ejemplo
           * 6, 6, 5 (que es el valor máximo que se obtiene), en este caso si se muestra
           * el tooltip con esos valores (debido que no todos son iguales), esto
           * por que el usuario puede elegir como distrubir los valores de los dados.
           */
          if (finalDiceAvailable.length >= 2) {
            /**
             * Se extrae el primer dado disponible...
             */
            const firstDice = finalDiceAvailable[0];

            /**
             * Se valida si todos los dados disponibles son del mismo valor...
             */
            const isSameDice = finalDiceAvailable.every(
              (v) => v.value === firstDice.value
            );

            /**
             * Si son iguales, sólo se devuleve el primero...
             */
            if (isSameDice) {
              finalDiceAvailable = [firstDice];
            }
          }

          /**
           * Se extrae el índice del token que está guardado en el objeto de
           * positionAndToken
           */
          const indexToken = positionAndToken[positionTile];

          /**
           * Se almacnea los dados disponibles para el token
           */
          copyListTokens[currentTurn].tokens[indexToken].diceAvailable =
            finalDiceAvailable;
        }
      }
    }
  });

  /**
   * Se extraen los tokens que se pueden mover, dependiendo
   * de la validación que se ha hecho anteriormente...
   */
  const totalTokensCanMove = copyListTokens[currentTurn].tokens.filter(
    (v) => v.diceAvailable.length !== 0
  );

  /**
   * Indica si el token se podrá mover sólo sin necesidad que se seleccione...
   */
  let moveAutomatically = false;
  /**
   * Valores que guardará el token y el valor del dado cuando se moverá
   * de forma automáticamente...
   */
  let tokenIndex = 0;

  /**
   * Por defecto el índice del token a mover sería el primero, ésto si es
   * el único token disponible...
   */
  let diceIndex = 0;

  /**
   * Variable que indicará si existen tokens a moverse,
   * en este caso se sabe en función al total de tokens que
   * hay disponibles, de esta forma se indicará que se puede
   * mutar el estado de tokens...
   */
  const canMoveTokens = totalTokensCanMove.length !== 0;

  /**
   * Validación que se hará para saber si se puede mover el token
   * automáticamente o si se debe mostrar el tooltip automáticamente...
   */
  if (totalTokensCanMove.length === 1) {
    /**
     * Se extrae el valor del token, en este caso se sabe que sólo es uno...
     */
    const token = totalTokensCanMove[0];
    /**
     * Se extrae los dados disponibles que tiene el token...
     */
    const diceAvailable = token.diceAvailable;

    tokenIndex = token.index;

    /**
     * Sólo se tiene un dado disponible,
     * por lo tanto como se tiene sólo un token y un sólo
     * dado se indicará que se debe mover automáticamente...
     */
    if (diceAvailable.length === 1) {
      moveAutomatically = true;

      /**
       * Se obtiene el índice real del dado, con relación a los dados globales...
       */
      diceIndex = getDiceIndexSelected(diceList, diceAvailable[0].key);
    }

    /**
     * Se tiene un sólo token, pero más de dos dados,
     * por lo que se mostrará el tooltip, sin necesidad que el
     * usuario elija el token...
     */
    if (diceAvailable.length >= 2) {
      copyListTokens[currentTurn].tokens[tokenIndex].enableTooltip = true;
    }
  }

  return {
    canMoveTokens,
    moveAutomatically,
    tokenIndex,
    diceIndex,
    copyListTokens,
  };
};

interface ValidateTokenDistributionCell {
  token: IToken;
  listTokens: IListTokens[];
  currentTurn: number;
  totalTokens: TShowTotalTokens;
  removeTokenFromCell: boolean;
  setTotalTokens: React.Dispatch<React.SetStateAction<TShowTotalTokens>>;
}

/**
 * Función que valida la distribución de los tokens, tanto para las celdas normales,
 * como para las celdas de salida, cuando se quita el token y se agrega el token (removeTokenFromCell)...
 * @param param0
 * @returns
 */
const validateTokenDistributionCell = ({
  token,
  listTokens,
  currentTurn,
  totalTokens,
  removeTokenFromCell = true,
  setTotalTokens,
}: ValidateTokenDistributionCell) => {
  /**
   * Se hace una copia del listado de tokens...
   */
  const copyListTokens = cloneDeep(listTokens);
  /**
   * Se obtiene la posición donde está el token...
   */
  const positionTile = token.positionTile || 0;

  /**
   * Si es una acción de quitar un token, se establece que se debe
   * restar del total de tokens que existene la celda...
   */
  const totalTokensRemove = removeTokenFromCell ? 1 : 0;

  if (token.typeTile === EtypeTile.NORMAL) {
    /**
     * Se traen los demás tokens que se encuentren en la misma
     * celda normal..
     */
    const totalTokensInCell = getTotalTokensInNormalCell(
      positionTile,
      copyListTokens
    );

    /**
     * Hay más de dos tokens en la misma celda,
     * por lo tanto se debe disminuir el número de tokens que existían
     */
    if (totalTokensInCell.total >= 2) {
      /**
       * Se resta el total de tokens que ahora tiene la celda...
       */
      const totalTokensRemain = totalTokensInCell.total - totalTokensRemove;
      /**
       * Variable que tendrá el valor de la posición que ahora tendrán
       * los tokens denrtro de la celda...
       */
      let position = 1;

      /**
       * playerIndex es un objeto de la forma indexPlay: [indexToekns],
       * en este caso en una celda puede que existan tokens de diferentes colores
       * por lo que playerIndex es el indice de cada player
       * luego se iteran el listado de indices de los tokens de cada player
       * que se encuentren en esa celda.
       */
      for (let playerIndex in totalTokensInCell.distribution) {
        /**
         * Se iteran los índices que puedan existir en esa celda por jugador...
         */
        for (let index of totalTokensInCell.distribution[playerIndex]) {
          /**
           * Se determina si se debe evaluar el indice del token,
           * la validación es la siguiente, se valida si el valor del playerIndex
           * que se está iterando es igual al turno actual, si es así, se valida
           * si el indice del token es igual al token selccionado, si es así
           * no se evalúa ese índice ya que es que se va a mover, esto con el fin de
           * evitar lo siguiente, digamos que en la misma celda existen 4 tokens
           * y cada uno de ellos es el índice cero (es cero por que es diferente
           * por que se reinicia por cada player index), si no se hace está validación
           * y el indice que se está moviendo es el cero, en ese caso nunca entraría,
           * por ello se valida que sólo se haga esa coindición cuando el índice
           * del player es igual al índice del turno actual
           */
          const evaluateIndex = removeTokenFromCell
            ? +playerIndex === currentTurn
              ? index !== token.index
              : true
            : true;

          if (evaluateIndex) {
            /**
             * Se extrablece el valor de total de tokens por celda
             */
            copyListTokens[playerIndex].tokens[index].totalTokens =
              totalTokensRemain;
            /**
             * Se establece la posición que tiene el token dentro de la celda...
             */
            copyListTokens[playerIndex].tokens[index].position = position;
            /**
             * Se incrementa la posición para el siguiente token...
             */
            position++;
          }
        }
      }

      /**
       * Se valida si se tiene que mostrar el indicador de número de tokens
       * el máximo de tokens que se muestran son 4, si hay más que ese valor
       * se muestra un indicador, en caso contrario si el valor que ahora tiene
       * de tokens es inferior se debe eliminar.
       * Inicialmente se valida si la totalidad de tokens que estaba en la celda
       * aplicaba para mostrar el indicador.
       */
      if (totalTokensInCell.total > MAXIMUM_VISIBLE_TOKENS_PER_CELL) {
        const copyTotalTokens = cloneDeep(totalTokens);

        /**
         * Se valida que el número de tokens que exista siga siendo
         * mayor que el valor permitido, si es así se actualiza el valor del
         * indicador.
         */
        if (totalTokensRemain > MAXIMUM_VISIBLE_TOKENS_PER_CELL) {
          copyTotalTokens[positionTile] = totalTokensRemain;
        } else if (copyTotalTokens[positionTile]) {
          /**
           * En caso contrario, si el valor es inferior a 4 y el indicador existe,
           * se elimina para que no se muestre en el UI.
           */
          delete copyTotalTokens[positionTile];
        }

        /**
         * Se actualiza la información de los idnicadores...
         */
        setTotalTokens(copyTotalTokens);
      }
    }
  }

  /**
   * Ahora se valida en el caso que se haya seleccioando un token
   * que estaba en las celdas de salida...
   */
  if (token.typeTile === EtypeTile.EXIT) {
    /**
     * Se obtienen la totalidad de tokens que se encuentran
     * en la celdas de salida...
     */
    const { EXIT } = getTokensValueByCellType(copyListTokens[currentTurn]);
    /**
     * Se ontienen los tokens que se encuentren en la misma celda de salida...
     */
    const totalTokensInCell = getTotalTokensInCell(positionTile, EXIT);

    /**
     * Si es mayor que dos quiere decir que se debe hacer
     * dustribución de posición de los tokens que quedan..
     * Si es dos corresponde al token que se está moviendo y a otro,
     * en la parte de arriba ya se especifico que el token que se mueve
     * su posición será siempre de uno, por lo que esta validación
     * sólo actualiza las posiciones de los tokens que restan...
     */
    if (totalTokensInCell.total >= 2) {
      /**
       * Se resta el total de tokens que ahora tiene la celda...
       */
      const totalTokensRemain = totalTokensInCell.total - totalTokensRemove;
      /**
       * Variable que tendrá el valor de la posición que ahora tendrán
       * los tokens denrtro de la celda...
       */
      let position = 1;

      for (let index of totalTokensInCell.tokensByPosition) {
        if (index !== token.index || !removeTokenFromCell) {
          /**
           * Se extrablece el valor de total de tokens por celda
           */
          copyListTokens[currentTurn].tokens[index].totalTokens =
            totalTokensRemain;
          /**
           * Se establece la posición que tiene el token dentro de la celda...
           */
          copyListTokens[currentTurn].tokens[index].position = position;
          /**
           * Se incrementa la posición para el siguiente token...
           */
          position++;
        }
      }
    }
  }

  return copyListTokens;
};

interface ValidatePlayerRankingGameOver {
  players: IPlayer[];
  ranking: number;
  playSound: (type: IESounds) => void;
  setIsGameOver: React.Dispatch<React.SetStateAction<IGameOver>>;
}

/**
 * Valida la posición del ranking de los jugadores que quedan...
 * @param param0
 */
const validatePlayerRankingGameOver = ({
  players,
  ranking,
  playSound,
  setIsGameOver,
}: ValidatePlayerRankingGameOver) => {
  /**
   * Se hace una copia del listado de los jugadores...
   */
  const copyPlayers = cloneDeep(players);

  /**
   * Se establece el estado que el juego ha terminado...
   */
  setIsGameOver({ showModal: false, gameOver: true });

  /**
   * Sonido para el game over...
   */
  playSound(ESounds.GAMER_OVER);

  /**
   * Se obtienen los que no han terminado pero que están online
   */
  const onlinePlayersNotFinished = copyPlayers.filter(
    (v) => !v.isOffline && !v.finished
  );

  /**
   * Primero se obtienen los jugadores que están offline y que no haya
   * terminado, puede ser que e jugador terminó y ya tiene una posción,
   * por lo que se debe obviar por que ya tiene un ranking
   */
  const offlinePlayers = copyPlayers.filter((v) => v.isOffline && !v.finished);

  /**
   * Se unen los dos tipos de jugadores que quedan, dando la prioridad
   * que el ranking será para los jugadores que estaban online, pero
   * que no habían termnado, quedando al final los que estaban offline...
   */
  const playersLeftRanking = [...onlinePlayersNotFinished, ...offlinePlayers];

  /**
   * Puede suceder el siguiente caso en la versión online...
   * Inician a jugar 4 jugadores.
   * Un jugador  se desconectan, por ello el valor de
   * totalPlayersEnd es 3, por lo que se valida sólo esos tres jugadores.
   * Terminan dos jugadores, por lo que sería game over, entonces
   * se obtiene los que estaba offline que quedará al final, y el que estaba
   * online pero no ha terminado sería el tercero en ejemplo planteado...
   */
  for (let player of playersLeftRanking) {
    /**
     * Se incremente la posición del ranlking para el siguiente jugador...
     */
    ranking++;

    /**
     * Se indica que ha terminado...
     */
    copyPlayers[player.index].finished = true;

    /**
     * Se establece el rankig calculado...
     */
    copyPlayers[player.index].ranking = ranking;
  }

  return copyPlayers;
};

interface NextStepGame {
  type: IENextStepGame;
  actionsTurn: IActionsTurn;
  currentTurn: number;
  players: IPlayer[];
  setActionsTurn: React.Dispatch<React.SetStateAction<IActionsTurn>>;
  setCurrentTurn: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Función que valida el siguiente paso a seguir en el juego...
 */
export const nextStepGame = ({
  type,
  actionsTurn,
  currentTurn,
  players,
  setActionsTurn,
  setCurrentTurn,
}: NextStepGame) => {
  /**
   * Se convierte a boolenos los tipos...
   */
  const rollDiceAgain = type === ENextStepGame.ROLL_DICE_AGAIN;
  const moveTokensAgain = type === ENextStepGame.MOVE_TOKENS_AGAIN;
  const goNextTurn = type === ENextStepGame.NEXT_TURN;

  /**
   * Se valida si se tiene que dar la opción de lanzar el dado de nuevo
   * o si el usuario puede seguir moviendo tokens por que tiene dados disponiobles...
   */
  if (rollDiceAgain || moveTokensAgain) {
    const copyActionsTurn = cloneDeep(actionsTurn);

    /**
     * Se activa el dado siempre y cuando se indique que se tiene que lanzar de
     * nuevo, si es así se valida si el dado se puede o no habilitar,
     * de lo contario quiere decir que es que se debe mover otro token,
     * entonces el dado se bloqueará...
     */
    copyActionsTurn.disabledDice = rollDiceAgain
      ? validateDisabledDice(currentTurn, players)
      : true;

    /**
     * Se vuelve a mostrar el dado para que pueda lanzar de nuevo...
     */
    copyActionsTurn.showDice = rollDiceAgain;

    /**
     * Se reinicia el cronometro...
     */
    copyActionsTurn.timerActivated = true;
    /**
     * Se indica que se puede habilitar la UI (en este caso es para el token)
     */
    copyActionsTurn.isDisabledUI = false;

    /**
     * Se indica el tipo de acción dependiendo si se tiene que lanzar el
     * dado de nuevo o si se puede seleccionar un token,
     * útil para cuando el cronometro llega al final y así saber que tipo de
     * acción automática debe hacer...
     */
    copyActionsTurn.actionsBoardGame =
      EActionsBoardGame[rollDiceAgain ? "ROLL_DICE" : "SELECT_TOKEN"];

    setActionsTurn(copyActionsTurn);
  } else {
    /**
     * Se ha indicado que debe puede pasar al siguiente turno,
     * siempre y cuando no se haya establecido que el juego ha terminado...
     */
    if (goNextTurn) {
      validateNextTurn({
        currentTurn,
        players,
        setActionsTurn,
        setCurrentTurn,
      });
    }
  }
};

/**
 * Función que generá la data inicial de los jugadores del juego
 * @param users
 * @param boardColor
 * @param totalPlayers
 * @returns
 */
export const getInitialDataPlayers = (
  users: IUser[],
  boardColor: TBoardColors,
  totalPlayers: TTotalPlayers
) => {
  const players: IPlayer[] = [];

  /**
   * Se obtiene la distrubiución de colores, dependiendo del total de jugadores
   * y de la distrubución del colores que está el board...
   */
  const playersColors = getPlayersColors(boardColor, totalPlayers);

  /**
   * Se genera la data de los players...
   */
  for (let i = 0; i < totalPlayers; i++) {
    /**
     * Se le adiciona el índice y además el color a la información de user que le llega al componente...
     */
    players.push({
      index: i,
      color: playersColors[i],
      finished: false,
      isOffline: false,
      isMuted: false,
      chatMessage: "",
      counterMessage: 0,
      ranking: 0,
      ...users[i],
    });
  }

  return players;
};

/**
 * Función que establece la información inicial para la acciones de cada turno...
 * @param indexTurn
 * @param players
 * @returns
 */
export const getInitialActionsTurnValue = (
  indexTurn: number,
  players: IPlayer[]
): IActionsTurn => ({
  timerActivated: true,
  disabledDice: validateDisabledDice(indexTurn, players),
  showDice: true,
  diceValue: 0,
  diceList: [],
  diceRollNumber: 0,
  isDisabledUI: false,
  actionsBoardGame: EActionsBoardGame.ROLL_DICE,
});

/**
 * Función que devuelve el valor aleatorio de un dado...
 * @returns
 */
export const randomValueDice = () => randomNumber(1, 6) as TDicevalues;

/**
 * Obtiene un valor aleatorio del dado,
 * además detiene el cronometro y bloquea el botón del dado...
 * @param actionsTurn
 * @param diceValue
 * @returns
 */
export const getRandomValueDice = (
  actionsTurn: IActionsTurn,
  diceValue?: TDicevalues
) => {
  const copyActionsTurn = cloneDeep(actionsTurn);
  /**
   * Se obtiene el valor del dado de forma aleatorio...
   * si el valor del dado llega se toma ese valor, si no se obtiene aleatorio,
   * se hace esto pata el caso de la jugabilidad online, en la cual el valor del dado,
   * es determinado por un cliente remoto.
   */
  copyActionsTurn.diceValue = diceValue || randomValueDice();

  /**
   * Se indica que le cronometro se debe detener...
   */
  copyActionsTurn.timerActivated = false;

  /**
   * Se bloquea el botón del dado para prevenir nuevos lanzamientos...
   */
  copyActionsTurn.disabledDice = true;

  /**
   * Se incrementa el valor del lanzamiento por si el valor del dado no cambia
   */
  const diceRollNumber = copyActionsTurn.diceRollNumber;

  /**
   * Se valida que sólo incremente hasta 10 para así evitar estar almancenado
   * un número grande que no se refelja en el UI
   */
  const newDiceRollNumber = diceRollNumber + 1 >= 10 ? 1 : diceRollNumber + 1;
  copyActionsTurn.diceRollNumber = newDiceRollNumber;

  return copyActionsTurn;
};

/**
 * Función que genera la dada inicial de los tokens,
 * inicialmente inicia en la cárcel...
 * @param boardColor
 * @param totalPlayers
 * @param players
 * @returns
 */
export const getInitialPositionTokens = (
  boardColor: TBoardColors,
  totalPlayers: TTotalPlayers,
  players: IPlayer[]
) => {
  // Se obtiene los colores según el color del board...
  const playersColors = getPlayersColors(boardColor, totalPlayers);
  // Se obtiene las posciones para cada token, según la cantidad de jugadores...
  const tokensPositions = getTokensPositionsOnBoard(totalPlayers);
  // Para guardar los tokens...
  const listTokens: IListTokens[] = [];

  for (let i = 0; i < totalPlayers; i++) {
    /**
     * El usuario actual cuando se está jugando online, siempre estará en la
     * posición 0, es el jugador número uno en el tablero...
     */
    const isCurrentOnlineUser = i === 0;
    /**
     * Se extrae el valor para saber si es un bot o si es un jugador online...
     */
    const { isBot = false, isOnline = false } = players[i];
    /**
     * Se indica que puede seleccionar el token, si no es bot y además
     * el jugador online es el actual...
     */
    const canSelectToken = isOnline ? isCurrentOnlineUser : !isBot;

    /**
     * Se extrae el color que tendrá el token...
     */
    const color = playersColors[i];

    /**
     * Se extra la posición en el board...
     */
    const positionGame = tokensPositions[i];

    /**
     * Se obtiene el listado de tokens en la cárcel...
     */
    const tokens: IToken[] = getTokensInJail(
      positionGame,
      color,
      canSelectToken
    );

    listTokens.push({ index: i, positionGame, tokens });
  }

  return listTokens;

  // return TOKENS_JAIN_AND_OUTSITE;
};

interface ValidateDicesForTokens {
  actionsTurn: IActionsTurn;
  currentTurn: number;
  listTokens: IListTokens[];
  players: IPlayer[];
  totalTokens: TShowTotalTokens;
  playSound: (type: IESounds) => void;
  setActionsMoveToken: React.Dispatch<React.SetStateAction<IActionsMoveToken>>;
  setActionsTurn: React.Dispatch<React.SetStateAction<IActionsTurn>>;
  setCurrentTurn: React.Dispatch<React.SetStateAction<number>>;
  setListTokens: React.Dispatch<React.SetStateAction<IListTokens[]>>;
  setShowSync: React.Dispatch<React.SetStateAction<boolean>>;
  setTotalTokens: React.Dispatch<React.SetStateAction<TShowTotalTokens>>;
}

/**
 * Validar el valor de los dados para los tokens del jugador que tenga el turno
 * @param param0
 * @returns
 */
export const validateDicesForTokens = ({
  actionsTurn,
  currentTurn,
  listTokens,
  players,
  totalTokens,
  playSound,
  setActionsMoveToken,
  setActionsTurn,
  setCurrentTurn,
  setListTokens,
  setShowSync,
  setTotalTokens,
}: ValidateDicesForTokens) => {
  /**
   * Se clona el objeto que mantiene las acciones del turno...
   */
  const copyActionsTurn = cloneDeep(actionsTurn);
  /**
   * Se obtiene el valor del dado que se ha lanzado...
   */
  const diceValue = copyActionsTurn.diceValue as TDicevalues;
  /**
   * Se guarda el dado en el listado de dados que se han lanzado...
   * el indice del dado es un valor aleatorio, esto será útil
   * para renderizar los dados en tooltip o en perfil,
   * este valor es único por lo que después se filtra para así saber cual
   * es la posición del dado...
   */
  copyActionsTurn.diceList.push({
    key: Math.random(),
    value: diceValue,
  });

  /**
   * El nuevo tamaño del total de dados, útil para prevenir que se lancen más
   * dados de los permitido...
   */
  const newTotalDicesAvailable = copyActionsTurn.diceList.length;

  /**
   * Determinar si todos los valores que existen son del mismo valor
   * además que sean tres, en ese caso ha perdido el turno...
   */
  const isThreeRolls = validateThreeConsecutiveRolls(copyActionsTurn.diceList);

  /**
   * Reproduce un sonido cuandos se ha obtenido el número seis, el
   * cual permitirá salir de la cárcel...
   */
  if (diceValue === DICE_VALUE_GET_OUT_JAIL) {
    playSound(ESounds.GET_SIX);
  }

  /**
   * Se debe indicar que ha perdido el turno y por tanto se le debe pasar
   * el turno al siguiente jugador...
   */
  if (isThreeRolls) {
    return validateNextTurn({
      currentTurn,
      players,
      addLastDice: true,
      addDelayNextTurn: true,
      setActionsTurn,
      setCurrentTurn,
    });
  }

  /**
   * Se obtienen los tokens que estén en las celdas normales o en la cárcel,
   * esto con el fin de saber si el usuario saca un seis, puede usarlo...
   */
  const { JAIL, NORMAL } = getTokensValueByCellType(listTokens[currentTurn]);

  /**
   * Se obtiene la sumatoria de tokens en celdas normales y en la cárcel..
   */
  const totalTokensNormalJailCells = JAIL.length + NORMAL.length;

  /**
   * Sí ha obtenido un seis, puede lanzar de nuevo, siempre y cuando la totalidad
   * de dados no se mayor que el valor permitido (son tres máximo),
   * además que se tengan tokens en las celdas normales o en las celdas de salida
   * en este caso para evitar que si el usuario saca un 6 y los tokens están en las
   * celdas de salida, no darle otro lanzamiento, además ese 6 no lo podrá usar
   * y se le estaría dando una ventaja al jugador al tener otro lanzamiento y asi
   * poder sacar el token.
   * es poco probable que se presente, pero para evitar que se tengan más de tres
   * dados se establece está condición...
   */
  if (
    diceValue === DICE_VALUE_GET_OUT_JAIL &&
    totalTokensNormalJailCells > 0 &&
    newTotalDicesAvailable < MAXIMUM_DICE_PER_TURN
  ) {
    copyActionsTurn.timerActivated = true;
    copyActionsTurn.disabledDice = validateDisabledDice(currentTurn, players);
    copyActionsTurn.actionsBoardGame = EActionsBoardGame.ROLL_DICE;
    return setActionsTurn(copyActionsTurn);
  }

  const {
    canMoveTokens,
    copyListTokens,
    moveAutomatically,
    tokenIndex,
    diceIndex,
  } = validateDiceForTokenMovement({
    currentTurn,
    listTokens,
    diceList: copyActionsTurn.diceList,
  });

  /**
   * Indica que sólo se tiene un token y un sólo dado, por
   * lo que se moverá de forma automática...
   * ---------
   * Se valida la cantidad de tokens que tienen dados disponibles.
   * por ejemplo si es un sólo dado con un sólo token, se debería mover éste
   * sin necesidad que el usuario lo haga.
   * Si en este caso es un sólo token y se tiene más de dados disponibles,
   * se debería mostrar e tooltip automáticamente...
   * Para la acción de mover el token automáticamente, tendría que llamar a la
   * funciín validateSelectToken, es importante recibir los paramtros que requiere
   * esa función (done)...
   */
  if (moveAutomatically) {
    /**
     * Se invca la función de selección de token,
     * con los valores que devuelve la función validateDiceForTokenMovement,
     * se envía los valores de actionsTurn y listTokens, en este caso sus valores
     * mutados, por ejemplo copyActionsTurn tendrá el valor del dado y
     * copyListTokens tendrá los valores mutados en al función validateDiceForTokenMovement
     */
    return validateSelectToken({
      actionsTurn: copyActionsTurn,
      currentTurn,
      diceIndex,
      listTokens: copyListTokens,
      tokenIndex,
      totalTokens,
      setActionsMoveToken,
      setActionsTurn,
      setTotalTokens,
      setShowSync,
      setListTokens,
    });
  }

  /**
   * Debido a que se indica que se puede mover, se mutará el estado de los tokens
   * además de indicar que el dado se debe bloquear e inicializar el cronometro...
   */
  if (canMoveTokens) {
    /**
     * Se guarda el estado para el turno, en este caso se dtermina que el dado
     * estará bloqueado, se habilita el timer, y se estblace que la acción es de
     * seleccionar un token...
     */
    copyActionsTurn.timerActivated = true;
    copyActionsTurn.disabledDice = true;
    /**
     * Se valida que no se muestre el dado...
     */
    copyActionsTurn.showDice = false;
    copyActionsTurn.actionsBoardGame = EActionsBoardGame.SELECT_TOKEN;
    setActionsTurn(copyActionsTurn);

    /**
     * Se muta el estado de los tokens...
     */
    return setListTokens(copyListTokens);
  }

  validateNextTurn({
    currentTurn,
    players,
    addDelayNextTurn: true,
    setActionsTurn,
    setCurrentTurn,
  });
};

interface ValidateSelectToken {
  actionsTurn: IActionsTurn;
  currentTurn: number;
  diceIndex: number;
  listTokens: IListTokens[];
  tokenIndex: number;
  totalTokens: TShowTotalTokens;
  setActionsMoveToken: React.Dispatch<React.SetStateAction<IActionsMoveToken>>;
  setActionsTurn: React.Dispatch<React.SetStateAction<IActionsTurn>>;
  setTotalTokens: React.Dispatch<React.SetStateAction<TShowTotalTokens>>;
  setShowSync: React.Dispatch<React.SetStateAction<boolean>>;
  setListTokens: React.Dispatch<React.SetStateAction<IListTokens[]>>;
}

/**
 * Función que valida la selección de un token...
 * Establece la nueva distrubución de los tokens que
 * estén en la misma celda.
 * Actualiza el indicador del número de tokens si es necesario
 * Elimina del listado de dados el dado seleccioando.
 * @param param0
 */
export const validateSelectToken = ({
  actionsTurn,
  currentTurn,
  diceIndex,
  listTokens,
  tokenIndex,
  totalTokens,
  setActionsMoveToken,
  setActionsTurn,
  setTotalTokens,
  setShowSync,
  setListTokens,
}: ValidateSelectToken) => {
  /**
   * Quitar del estado del turno, el dado seleccionado...
   */
  const copyActionsTurn = cloneDeep(actionsTurn);

  /**
   * Se obtiene el total de celdas a mover...
   */
  let totalCellsMove = copyActionsTurn?.diceList?.[diceIndex]?.value;

  if (!totalCellsMove) {
    return setShowSync(true);
  }

  /**
   * Con el indice seleccionado se elimina el dado...
   */
  copyActionsTurn.diceList.splice(diceIndex, 1);
  /**
   * Se establece que el dado y el tiempo no estén habilitados...
   */
  copyActionsTurn.disabledDice = true;
  /**
   * Se oculta el dado...
   */
  copyActionsTurn.showDice = false;
  copyActionsTurn.timerActivated = false;

  /**
   * Se actualiza el estado de las acciones del turno...
   */
  setActionsTurn(copyActionsTurn);

  /**
   * Se cambia el estado para los tokens...
   */
  let copyListTokens = cloneDeep(listTokens);

  /**
   * Se obtiene el token seleccionado...
   */
  const tokenSelected = copyListTokens[currentTurn].tokens[tokenIndex];

  /**
   * Se itrean los tokens del turno actual
   */
  for (let i = 0; i < copyListTokens[currentTurn].tokens.length; i++) {
    /**
     * Se valida que tokens tienen dados disponibles...
     */
    if (copyListTokens[currentTurn].tokens[i].diceAvailable.length !== 0) {
      /**
       * Se remueven los dados y además
       * se establece que el tooltip, no esté visible...
       */
      copyListTokens[currentTurn].tokens[i].diceAvailable = [];
      copyListTokens[currentTurn].tokens[i].enableTooltip = false;
      copyListTokens[currentTurn].tokens[i].animated = false;
      copyListTokens[currentTurn].tokens[i].isMoving = false;
    }
  }

  /**
   * Se establece el estado de movimiento al token seleccionado...
   */
  copyListTokens[currentTurn].tokens[tokenIndex].isMoving = true;
  /**
   * Se establece que el token que se va a mover, no hace parte de una
   * celda donde existan más tokens,
   */
  copyListTokens[currentTurn].tokens[tokenIndex].totalTokens = 1;
  copyListTokens[currentTurn].tokens[tokenIndex].position = 1;

  /**
   * Se valida si el token estaba en la cárcel..
   */
  if (tokenSelected.typeTile === EtypeTile.JAIL) {
    /**
     * Si el token estaba en la cárcel, se indica que sólo
     * se debe mover una celda...
     */
    totalCellsMove = 1;
  }

  /**
   * Se valida si el token está en las celdas normales
   * o en la celdas de salida...
   */
  if (
    [EtypeTile.NORMAL, EtypeTile.EXIT].includes(
      tokenSelected.typeTile as EtypeTile
    )
  ) {
    /**
     * Se hace la distribución de tokens en la celdas...
     */
    copyListTokens = validateTokenDistributionCell({
      token: tokenSelected,
      listTokens: copyListTokens,
      currentTurn,
      totalTokens,
      removeTokenFromCell: true,
      setTotalTokens,
    });
  }

  /**
   * Se actualiza el estado de los tokens...
   */
  setListTokens(copyListTokens);

  /**
   * Se establece el estado para indicar el movimiento del
   * token que se ha seleccionado...
   */
  setActionsMoveToken({
    isRunning: true,
    tokenIndex,
    totalCellsMove,
    cellsCounter: 0,
  });
};

interface ValidateMovementToken {
  actionsMoveToken: IActionsMoveToken;
  actionsTurn: IActionsTurn;
  currentTurn: number;
  listTokens: IListTokens[];
  players: IPlayer[];
  totalTokens: TShowTotalTokens;
  socket?: Socket;
  roomName?: string;
  playSound: (type: IESounds) => void;
  setActionsMoveToken: React.Dispatch<React.SetStateAction<IActionsMoveToken>>;
  setActionsTurn: React.Dispatch<React.SetStateAction<IActionsTurn>>;
  setCurrentTurn: React.Dispatch<React.SetStateAction<number>>;
  setIsGameOver: React.Dispatch<React.SetStateAction<IGameOver>>;
  setListTokens: React.Dispatch<React.SetStateAction<IListTokens[]>>;
  setPlayers: React.Dispatch<React.SetStateAction<IPlayer[]>>;
  setShowSync: React.Dispatch<React.SetStateAction<boolean>>;
  setTotalTokens: React.Dispatch<React.SetStateAction<TShowTotalTokens>>;
}

/**
 * Función que realiza el proceso de mover el token,
 * @param param0
 * @returns
 */
export const validateMovementToken = async ({
  actionsMoveToken,
  actionsTurn,
  currentTurn,
  listTokens,
  players,
  totalTokens,
  socket,
  roomName,
  playSound,
  setActionsMoveToken,
  setActionsTurn,
  setCurrentTurn,
  setIsGameOver,
  setListTokens,
  setPlayers,
  setShowSync,
  setTotalTokens,
}: ValidateMovementToken) => {
  /**
   * Reproduce el sonido de movimiento del token...
   */
  playSound(ESounds.TOKEN_MOVE);

  /**
   * Se clona el estado de moviento
   */
  const copyActionsMoveToken = cloneDeep(actionsMoveToken);
  /**
   * Se clona la información del listado de tokes.
   * es let por que otra función mutará su estado también...
   */
  let copyListTokens = cloneDeep(listTokens);
  /**
   * Se extre el valor correspondiente a la posición en que se encuentra
   * el board u por tanto de esta forma saber los valores de posición.
   */
  const { positionGame } = copyListTokens[currentTurn];

  /**
   * Se extrae el indice de la celda de salida de la cárcel (startTileIndex)
   * Y se obtiene el valor de la celda que indica que ingresa a las celdas de
   * salida (exitTileIndex)
   */
  const { startTileIndex, exitTileIndex } =
    POSITION_ELEMENTS_BOARD[positionGame];

  /**
   * Se obtiene el índice token que se está moviendo...
   */
  const { tokenIndex } = copyActionsMoveToken;

  /**
   * Se obtiene el token que se está moviendo...
   */
  const tokenMove = copyListTokens[currentTurn].tokens[tokenIndex];
  /**
   * Variable que tendrá la posición de la celda donde se pondrá el token
   * cuando se está moviendo...
   */
  let positionTile = 0;

  /**
   * Establece si se debe pasar el turno al soguiente jugador...
   */
  let goNextTurn = false;

  /**
   * El token que se está moviendo se encuentra en una celda de salida...
   */
  if (tokenMove.typeTile === EtypeTile.EXIT) {
    positionTile = tokenMove.positionTile + 1;

    /**
     * Esto quiere decir que la celda ha salido...
     * en este caso es cuando el valor de positionTile es 5,
     * la cantidad máxima de celdas de salida es de 5,
     * pero el total es 6, por que se tiene encuenta la primera
     * celda a salir, en este caso esa celda es normal
     */
    if (positionTile === TOTAL_EXIT_TILES - 1) {
      /**
       * Se establece que la posición será igual al valor del indice
       * del token, es decir token 0 irá a la posición 0 de la salida...
       */
      positionTile = tokenMove.index;
      /**
       * Se indica que ahora el tipo de celda donde se encuentra el token
       * es la celda de tipo END, es decir que ha terminado...
       */
      copyListTokens[currentTurn].tokens[tokenIndex].typeTile = EtypeTile.END;
    }
  }

  /**
   * El token que se está moviendo está en una celda normal..
   */
  if (tokenMove.typeTile === EtypeTile.NORMAL) {
    /**
     * Se valida que no se encuentre en la celda que indica que
     * podría entrar en las celdas de salida...
     */
    if (tokenMove.positionTile !== exitTileIndex) {
      /**
       * Se incrementa el valor de la celdas normales...
       */
      positionTile = validateIncrementTokenMovement(tokenMove.positionTile);
    } else {
      /**
       * En este caso se encuentra en la primera celda de salida...
       * Se indica que la posción ahora es 0, por que es la priemra celda
       * de salida
       */
      positionTile = 0;

      /**
       * Se establece el nuevo tipo de celda donde se encuentra el token...
       */
      copyListTokens[currentTurn].tokens[tokenIndex].typeTile = EtypeTile.EXIT;
    }
  }

  /**
   * La celda que se está moviendo se encuentraba en la cárcel...
   */
  if (tokenMove.typeTile === EtypeTile.JAIL) {
    /**
     * Se indica que la posción de la celda es la posición de salida de la cárcel...
     */
    positionTile = startTileIndex;
    /**
     * Se indica que es animada, es decir que se añade una clase
     * para agregar un transition...
     */
    copyListTokens[currentTurn].tokens[tokenIndex].animated = true;
    /**
     * Ahora se indica que el tipo de celda que se encuentra es en el normal..
     */
    copyListTokens[currentTurn].tokens[tokenIndex].typeTile = EtypeTile.NORMAL;
  }

  /**
   * Se establece la posición de la celda al token que se está moviendo...
   */
  copyListTokens[currentTurn].tokens[tokenIndex].positionTile = positionTile;
  /**
   * Se establece la coordenda del token, la
   * función getCoordinatesByTileType devuleve la coordenada
   * depoendiendo del tipo de celda y además del índice de la misma
   */
  copyListTokens[currentTurn].tokens[tokenIndex].coordinate =
    getCoordinatesByTileType(
      copyListTokens[currentTurn].tokens[tokenIndex].typeTile,
      positionGame,
      positionTile
    );

  /**
   * Incrementa el contador de movimiento de celdas...
   */
  copyActionsMoveToken.cellsCounter++;

  /**
   * Para indicar el tipo de evento que debe hacerse depués de terminar de mover
   * el token...
   */
  let typeNextStep: ENextStepGame | null = null;

  /**
   * Para saber si el juego ha terminado y así prevenir que se haga la
   * validación de siguiente turno...
   */
  let isGameOver = false;

  /**
   * Validación cuando se han movido todos los valores disponibles del dado
   * seleccionado...
   */
  if (
    copyActionsMoveToken.cellsCounter === copyActionsMoveToken.totalCellsMove
  ) {
    /**
     * indica si se puede lanzar el dado de nuevo,
     * esto sucede cuando se ha enviado un token a la cárcel
     * o cuando se ha sacado una ficha del juego (siempre que no se hayan sacado
     * todos los tokens)...
     */
    let rollDiceAgain = false;

    /**
     * Variable que indica que aún tiene token disponibles para mover,
     * útil para reiniciar el cronometro del tiempo...
     */
    let moveTokensAgain = false;

    /**
     * Se indica que se debe detener el intervalo de movimiento...
     */
    copyActionsMoveToken.isRunning = false;

    /**
     * Indica que el token ya no se está moviendo...
     */
    copyListTokens[currentTurn].tokens[tokenIndex].isMoving = false;

    /**
     * Se traen todos los tokens del turno actual que estén en las celdas
     * finales
     */
    const { END } = getTokensValueByCellType(copyListTokens[currentTurn]);

    /**
     * Ahora se valida que el token se encuentra en la celda donde se
     * ha sacado un token del board...
     */
    if (tokenMove.typeTile === EtypeTile.END) {
      /**
       * Proceso que valida que las posiciones de los tokens en el punto final (end)
       * sean válidas, se notó que a veces quedaban una sobre otra,
       * con este proceso se espera que siempre estén ubicadas en la posición
       * correcta, la cual es el índice del token corresponde a la posición
       * final...
       */
      for (let tokenEnd of END) {
        /**
         * Se obtiene el token del index, el cual también sería
         * la posición final en END
         */
        const tokenIndexEndPosition = tokenEnd.index;

        /**
         * Se establece la posición de la celda al token que se está moviendo...
         */
        copyListTokens[currentTurn].tokens[tokenIndexEndPosition].positionTile =
          tokenIndexEndPosition;

        /**
         * Se establecen las coordenadas del token en la posición final END
         */
        copyListTokens[currentTurn].tokens[tokenIndexEndPosition].coordinate =
          getCoordinatesByTileType(
            EtypeTile.END,
            positionGame,
            tokenIndexEndPosition
          );
      }

      /**
       *  Saber el total de ítems que están afuera,
       * si la totalidad es 4 quiere decir que todos los
       * tokens ya están afuera...
       */
      const finished = END.length === 4;

      /**
       *  Si no ha sacado todos los tokens se le permite al
       * jugador hacer otro lazamiento...
       */
      rollDiceAgain = !finished;

      if (finished) {
        /**
         * Se clona los jugadores para así poder mutar su data...
         */
        let copyPlayers = cloneDeep(players);

        /**
         * Se obtiene la toalidad de juagdores disponibles,
         * se valida con la opción es isOffline ó con el valor de finished
         * para así saber cual es la totalidad de jugadores que hay
         * Por ejemplo si en una partida online, donde habían 4 jugadores.
         * Un jugador se desconectó.
         * Un jugador se desconectó pero ya había terminado.
         * Dos jugadores están online
         * Para este caso el valor de totalPlayers es de 3, debido a que:
         * Dos están online y uno estaba offline, pero había terminado.
         */
        const totalPlayers = copyPlayers.filter(
          (v) => !v.isOffline || v.finished
        ).length;

        /**
         * Se obtiene la totalidad de jugadores que han finalizado el juego,
         * en este caso a través de la propiedad finished...
         * Siguiendo con el ejemlo anterior, el usuario se había desconectado,
         * pero ya había terminado, en este caso sólo un usuario había acabado.
         */
        const totalPlayersEnd = copyPlayers.filter((v) => v.finished).length;

        /**
         * Se obtiene el ranking donde quedaría el jugador,
         * en este caso se toma la totalidad de jugadores que ha terminado
         * y se incrementa uno, por ejemplo si el valor que ha terminado es
         * cero, la posición del jugador sería 1 y así sucesivamente...
         */
        let ranking = totalPlayersEnd + 1;

        /**
         * Validar si el juego ha terminado...
         * en este caso se sabe si ha termiando,
         * si el valor del ranking es igual a la totalidad de jugadores
         * menos uno, por ejemplo si son dos juadores y el valor del ranking
         * es 1, quiere decir que ha acabado, igualmente con 3 y 4...
         * Ejemplos offline
         * Dos jugadores:
         *  isGameOver = ranking (1) === totalPlayers (2) - 1 => 1 === 1
         * Tres Jugadores
         *  isGameOver = ranking (2) === totalPlayers (3) - 1 => 2 === 2
         * Cuatro jugadores
         *  isGameOver = ranking (3) === totalPlayers (4) - 1 => 3 === 3
         * Ejemplo online:
         * No hay dos, por que si se sale un jugador no ingresa acá y se marca gameOver.
         * Cuatro jugadores:
         *  isGameOver = ranking (1) === totalPlayers (2) - 1 => 1 === 1
         */
        isGameOver = ranking === totalPlayers - 1;

        /**
         * Se establece que el jugador ha terminado...
         */
        copyPlayers[currentTurn].finished = true;

        /**
         * Además se indica la posición del jugador...
         */
        copyPlayers[currentTurn].ranking = ranking;

        if (isGameOver) {
          copyPlayers = validatePlayerRankingGameOver({
            players: copyPlayers,
            playSound,
            ranking,
            setIsGameOver,
          });
        }

        /**
         * Se muta la data de players...
         */
        setPlayers(copyPlayers);
      }
    }

    if (
      [EtypeTile.NORMAL, EtypeTile.EXIT].includes(
        tokenMove.typeTile as EtypeTile
      )
    ) {
      /**
       * Por defecto si el token está en una celda de salida, se indica que
       * haga la validación de distribución de tokens en la celda...
       */
      let distributeTokensCell = tokenMove.typeTile === EtypeTile.EXIT;

      /**
       * Se evalua el token cuando está en las casillas normales...
       */
      if (tokenMove.typeTile === EtypeTile.NORMAL) {
        /**
         * Validar si es un área segura...
         */
        const isSafeArea = validateSafeArea(positionTile);

        /**
         * Reproduce un sonido cuando ha llegado a una zona segura...
         */
        if (isSafeArea) {
          playSound(ESounds.SAFE_ZONE);
        }

        /**
         * Se obtienen los tokens que hay en la misma celda de destino...
         * en este caso para normal...
         */
        const totalTokensInCell = getTotalTokensInNormalCell(
          positionTile,
          copyListTokens
        );

        if (totalTokensInCell.total >= 2) {
          /**
           * Si en la distrubución se encuentra que los tokens que hay
           * son del mismo color, en este caso se sabe por que la totalidad
           * de token de la celda es la misma
           * la única vez que puede pasar que tokens de difeeentes colores
           * estén en una misma celda es cuando se encuentra en una zona segura
           * ya se ha validado que un token no puede llegar a una celda donde existan
           * dos o más tokens del mismo color, esto se hizo en la función validateMovementTokenWithValueDice
           */
          const isSameTokens =
            (totalTokensInCell.distribution[currentTurn] ?? []).length ===
            totalTokensInCell.total;

          /**
           * Se debe hacer la distrubición de posiciones de los
           * tokens en las celda, ya que o es el mismo color de tokens
           * ó se está en una área segura...
           */
          distributeTokensCell = isSameTokens || isSafeArea;

          /**
           * Si no se debe hacer distribución, quiere decir que enviará el token a la cárcel...
           */
          if (!distributeTokensCell) {
            /**
             * Quiere decir que se enviará un token a la cárcel
             */
            /**
             * Se ontiene el indice del player que se enviará a la carcel..
             * en este caso ingresa acá por que son dos tokens en una misma celda
             * y son de diferente color, y no es una zona sgura
             * se extrae el player index scando el turno actual,
             * se conveirte a número ya que el Object.keys daría un string
             * en este caso distribution es un objeto como {0: [2]}, siendo
             * 0 en este ejemploe el indice del palyer.
             * Como se espera que sean sólo dos y esto nos da un array sólo se extrae
             * el primero..
             */
            const playerIndexToJail = Object.keys(
              totalTokensInCell.distribution
            )
              .map((v) => +v)
              .filter((v) => v !== currentTurn)[0];

            /**
             * se extrae el indice del token que irá a la cárcel
             * se espera que sólo exista un token, por ello se obtiene
             * la posición 0 del array...
             */
            const tokenIndexToJail =
              totalTokensInCell.distribution[playerIndexToJail][0];

            /**
             * Se obtiene la posición del player que irá a la cárcel...
             */
            const { positionGame: positionGameToJail } =
              copyListTokens[playerIndexToJail];

            /**
             * Se indica que es animada, es decir que se añade una clase
             * para agregar un transition...
             */
            copyListTokens[playerIndexToJail].tokens[
              tokenIndexToJail
            ].animated = true;

            /**
             * Ahora se indica que el tipo de celda es de tipo JAIL...
             */
            copyListTokens[playerIndexToJail].tokens[
              tokenIndexToJail
            ].typeTile = EtypeTile.JAIL;

            /**
             * Se establece su nueva posición la cual en este caso
             * es igual al índice dle totken...
             */
            copyListTokens[playerIndexToJail].tokens[
              tokenIndexToJail
            ].positionTile = tokenIndexToJail;

            /**
             * Se obtiene la coordenada donde se ubicará el token en la cárcel...
             */
            copyListTokens[playerIndexToJail].tokens[
              tokenIndexToJail
            ].coordinate = getCoordinatesByTileType(
              EtypeTile.JAIL,
              positionGameToJail,
              tokenIndexToJail
            );

            /**
             * Se indica que puede lanzar el dado de nuevo...
             */
            rollDiceAgain = true;

            /**
             * Reproduce el sonido que envía un token a al cárcel...
             */
            playSound(ESounds.TOKEN_JAIL);
          }
        }
      }

      if (distributeTokensCell) {
        copyListTokens = validateTokenDistributionCell({
          token: tokenMove,
          listTokens: copyListTokens,
          currentTurn,
          totalTokens,
          removeTokenFromCell: false,
          setTotalTokens,
        });
      }
    }

    /**
     * Se establece que se va al siguiente turno, si
     * no se tienen dados disponibles...
     */
    goNextTurn = actionsTurn.diceList.length === 0;

    if (actionsTurn.diceList.length !== 0 && !rollDiceAgain) {
      /**
       * Se valida si los dados disponibles es posible usarlos...
       */
      const {
        canMoveTokens,
        copyListTokens: newListTokens,
        moveAutomatically,
        tokenIndex: newTokenIndex,
        diceIndex: newDiceIndex,
      } = validateDiceForTokenMovement({
        currentTurn,
        listTokens: copyListTokens,
        diceList: actionsTurn.diceList,
      });

      /**
       * Sólo tiene un dado, por lo que se moverá de forma automática...
       */
      if (moveAutomatically) {
        /**
         * Se devuleve por qiue no es necesario mutar actionsMoveToken,
         * debido a que la función validateSelectToken cabiará ese valor,
         * igualmente el valor de los tokens no es necesario...
         */
        return validateSelectToken({
          actionsTurn,
          currentTurn,
          diceIndex: newDiceIndex,
          listTokens: copyListTokens,
          tokenIndex: newTokenIndex,
          totalTokens,
          setActionsMoveToken,
          setActionsTurn,
          setTotalTokens,
          setShowSync,
          setListTokens,
        });
      } else {
        /**
         * Si no se pueden mover tokens el valor de nextTurn será true...
         */
        goNextTurn = !canMoveTokens;

        /**
         * Indica que si se puede mover...
         */
        if (canMoveTokens) {
          copyListTokens = newListTokens;

          /**
           * Quiere decir que se debe seleccionar de nuevo un token...
           */
          moveTokensAgain = true;
        }
      }
    }

    /**
     * Si no ha terminado el juego, se determina el siguiente paso a seguir en el juego, el cual puede ser:
     * 1. Lanzar de nuevo el dado.
     * 2. Mover de nuevo un token.
     * 3. Pasar el turno al siguiente jugador...
     * 4. O puede ser que no tenga que hacer nada...
     */
    typeNextStep = rollDiceAgain
      ? ENextStepGame.ROLL_DICE_AGAIN
      : moveTokensAgain
      ? ENextStepGame.MOVE_TOKENS_AGAIN
      : goNextTurn
      ? ENextStepGame.NEXT_TURN
      : null;

    /**
     * Si el juego no ha terminado y se sabe el tipo del siguiente paso
     */
    if (!socket && !isGameOver && typeNextStep) {
      /**
       * Si no es online, sigue al siguiente paso normal...
       */
      nextStepGame({
        type: typeNextStep,
        actionsTurn,
        currentTurn,
        players,
        setActionsTurn,
        setCurrentTurn,
      });
    }
  }

  /**
   * Se muta los valores de los tokens...
   */
  setListTokens(copyListTokens);

  /**
   * Se muta las acciones de movimiento dle intervalo...
   */
  setActionsMoveToken(copyActionsMoveToken);

  /**
   *  Si no ha finalizado el juego, es online por que tiene un socket,
   * además se ha determinado el siguiente paso y es el usuario actual,
   * se emite a los demás usuarios el siguiente paso...
   */
  if (socket && typeNextStep && currentTurn === 0) {
    /**
     * Se genera la data de los tokens que han quedado para ser enviadas al socket
     * esta es usada para sincronización, en el caso que un cliente no lo este...
     */
    const syncTokens = players
      .map((player) => {
        /**
         * Se obtiene la posición inicial donde sale el token de la cárcel...
         */
        const { positionGame: positionGameSync } = copyListTokens[player.index];

        /**
         * Se obtiene le valor...
         */
        const { startTileIndex } = POSITION_ELEMENTS_BOARD[positionGameSync];

        console.log({ positionGameSync, startTileIndex });

        return {
          [player.color]: copyListTokens[player.index].tokens.map((token) => {
            let positionTileSync = token.positionTile;

            /**
             * Si es una celda normal, se calcula cuantas veces se ha movido el token
             * en relación a su punto de salida...
             */
            if (token.typeTile === EtypeTile.NORMAL) {
              /**
               * Se el valor es menor que el punto de salida, se ajusta su valor
               * con respecto al total de celdas...
               */
              if (positionTileSync < startTileIndex) {
                positionTileSync =
                  positionTileSync + (TOTAL_TILES - startTileIndex);
              } else {
                positionTileSync = positionTileSync - startTileIndex;
              }
            }

            return {
              position: positionTileSync,
              type: token.typeTile,
            };
          }),
        };
      })
      .reduce((a, s) => ({ ...a, ...s }), {}) as TTokensSocket;

    /**
     *  Se indica que se debe bloquear la UI, útil para bloquear los tokens,
     * si el usuario puede volver a lanzar los tokens, en este caso, sólo
     * lo podrá hacer una vez que se haya emitido el socket...
     */
    setActionsTurn((current) => ({ ...current, isDisabledUI: true }));

    /**
     * Se establece un dealy, este con el fin de dar tiempo al cliente de hacer
     * el cambio que se necesite en el UI, pasado ese tiempo se emite el socket
     * que valida la siguiente acción, si es para el siguiente turno será el
     * valor total del delay de lo contrario sería la mitad (lanzar dado, seleccionar un token)
     */
    await delay(
      typeNextStep === ENextStepGame.NEXT_TURN
        ? DELAY_DONE_TOKEN_MOVEMENT_SOCKET
        : DELAY_DONE_TOKEN_MOVEMENT_SOCKET / 2
    );

    socket.emit("ACTIONS", {
      roomName,
      type: EActionsBoardGame.DONE_TOKEN_MOVEMENT,
      DONE_TOKEN_MOVEMENT: {
        action: typeNextStep,
        tokens: syncTokens,
      },
    } as ISocketActions);
  }
};

/**
 * Función que devuleve de forma aleatoria un token de los que tengan dados
 * disponibles, así como un dado de esos dados disponibles,
 * útil para el bot y cuando el tiempo del usuario se le ha acabado para la
 * selección del token...
 * @param currentTurn
 * @param listTokens
 * @param diceList
 * @returns
 */
export const validateSelectTokenRandomly = (
  currentTurn: number,
  listTokens: IListTokens[],
  diceList: IDiceList[]
) => {
  /**
   * Se extrae los tokens que se pueden mover, lo
   * cual depende si tiene o no dados disponibles...
   */
  const tokensCanMoved = listTokens[currentTurn].tokens.filter(
    (v) => v.diceAvailable.length !== 0
  );

  /**
   * Se extrae de forma aleatoria un índce de los tokens que se pueden mover
   */
  const randomIndexToken = randomNumber(0, tokensCanMoved.length - 1);

  /**
   * Con el índice obtenido se onbtiene el token...
   */
  const token = tokensCanMoved[randomIndexToken];

  /**
   * Se extrae el valor del token, es importante que el valor de randomIndexToken puede
   * ser diferente al valor de tokenIndex, por ejemplo si tokensCanMoved devolvío
   * dos tokens y el valor de randomIndexToken es 0, el token en la posición 0 de tokensCanMoved
   * puede tener un indice diferente, por ello se extrae este índice del token...
   */
  const tokenIndex = token.index;

  /**
   * Se extrae los dados que tiene disponible el token seleccionado...
   */
  const diceAvailable = token.diceAvailable;

  /**
   * Se selecciona de forma aleatoria el índice de los dados disponibles del token
   */
  const diceIndexInTokenSelected = randomNumber(0, diceAvailable.length - 1);

  /**
   * Ahora se obtiene el indice del dado del listado de dados globales de diceList,
   * para tener el índice real...
   */
  const diceIndex = getDiceIndexSelected(
    diceList,
    diceAvailable[diceIndexInTokenSelected].key
  );

  return { diceIndex, tokenIndex };
};

/**
 * Función que bloquea los tokens del turno actual, útil cuando se hace
 * un lanzamiento en la juganbilidad online y se envía la data al socket,
 * en este caso se bloquea en el cliente...
 * @param listTokens
 * @param currentTurn
 * @returns
 */
export const disableCurrentTurnTokens = (
  listTokens: IListTokens[],
  currentTurn: number
) => {
  const copyListTokens = cloneDeep(listTokens);

  for (let i = 0; i < copyListTokens[currentTurn].tokens.length; i++) {
    copyListTokens[currentTurn].tokens[i].diceAvailable = [];
  }

  return copyListTokens;
};

interface ValidateTokenSync {
  currentTurn: number;
  listTokens: IListTokens[];
  players: IPlayer[];
  syncTokens: TTokensSocket;
  totalTokens: TShowTotalTokens;
  playSound: (type: IESounds) => void;
  setIsGameOver: React.Dispatch<React.SetStateAction<IGameOver>>;
  setListTokens: React.Dispatch<React.SetStateAction<IListTokens[]>>;
  setPlayers: React.Dispatch<React.SetStateAction<IPlayer[]>>;
  setShowSync: React.Dispatch<React.SetStateAction<boolean>>;
  setTotalTokens: React.Dispatch<React.SetStateAction<TShowTotalTokens>>;
}

export const validateTokenSync = ({
  currentTurn,
  listTokens,
  players,
  syncTokens,
  totalTokens,
  playSound,
  setIsGameOver,
  setListTokens,
  setPlayers,
  setShowSync,
  setTotalTokens,
}: ValidateTokenSync) => {
  /**
   * Variable que contiene las posiciones relaes de los tokens,
   * dependiendo del board...
   */
  const synchronizedTokenPosition: TTokensSocket = BASE_TOKENS_SYNC;

  /**
   * Establece si están está sincronizado el juego...
   */
  let tokensInSync = true;

  /**
   * Se iteran los players...
   */
  for (let player of players) {
    /**
     * Se obtiene el color y el indice del player...
     */
    const { color, index } = player;
    /**
     * Se obtiene la posición base donde sale los tokens...
     */
    const { positionGame } = listTokens[index];
    /**
     * Se obtiene la posición base donde sale los tokens...
     */
    const { startTileIndex } = POSITION_ELEMENTS_BOARD[positionGame];

    /**
     * Se hace el cálculo real de la posición donde está el token,
     * sólo aplicable para las celdas normales...
     */
    synchronizedTokenPosition[color] = syncTokens[color]?.map(
      ({ position, type }) => {
        /**
         * Posición que llega del socket...
         */
        let synchronizedPosition = position;

        /**
         * Si es una celda normal se establece la posición real...
         */
        if (type === EtypeTile.NORMAL) {
          /**
           * Se toma el valor de la celda de la salida, más el nímero de veces
           * que se ha movido el token...
           */
          synchronizedPosition = startTileIndex + synchronizedPosition;

          /**
           * Si es mayor que el número de tokens del board, se hace el calculo real...
           */
          if (synchronizedPosition >= TOTAL_TILES) {
            synchronizedPosition = synchronizedPosition - TOTAL_TILES;
          }
        }

        return {
          position: synchronizedPosition,
          type,
        };
      }
    );
  }

  /**
   * Se compara los tokens que hay en cliente con los tokens que han llegado del socket...
   */
  for (let player of players) {
    const { color, index } = player;

    /**
     * Se obtiene el listado de tokens que hay en el cliente...
     */
    const clientTokens = listTokens[index].tokens;

    /**
     * El listado de tokens remoto...
     */
    const remoteTokens = synchronizedTokenPosition[color];

    /**
     * Se inicia el proceso de comparación de posiciones...
     */
    for (let i = 0; i < clientTokens.length; i++) {
      /**
       * Se valida que el token del cliente y el remoto estén en las mismas posiciones
       * y tipo de celdas...
       */
      const isSynchronized =
        clientTokens[i].typeTile === remoteTokens?.[i].type &&
        clientTokens[i].positionTile === remoteTokens?.[i].position;

      /**
       * Si no está sincronizado se indica el caso y se rompe el ciclo...
       */
      if (!isSynchronized) {
        tokensInSync = false;
        break;
      }
    }

    if (!tokensInSync) {
      break;
    }
  }

  /**
   * Si los tokens no están sincronizados, se debe establecer el estado...
   */
  if (!tokensInSync) {
    /**
     * Se Copia los tokens para hacer el cambio...
     */
    let copyListTokens = cloneDeep(listTokens);

    /**
     * Se debe establecer el estado para que quede sincronizado...
     */
    for (let player of players) {
      /**
       * Obtener index del player y color...
       */
      const { color, index } = player;

      /**
       * Posición base del board...
       */
      const { positionGame } = copyListTokens[index];

      /**
       * Se obtiene el listado de tokens que hay en el cliente...
       */
      for (let i = 0; i < copyListTokens[index].tokens.length; i++) {
        /**
         * Se valida que se debe reditribuir el token si se quita...
         */
        copyListTokens = validateTokenDistributionCell({
          token: copyListTokens[index].tokens[i],
          listTokens: copyListTokens,
          currentTurn,
          totalTokens,
          removeTokenFromCell: true,
          setTotalTokens,
        });

        /**
         * Se establece el tipo correcto...
         */
        copyListTokens[index].tokens[i].typeTile =
          synchronizedTokenPosition[color][i].type;

        /**
         * Se establece el valor de la posición del token
         */
        copyListTokens[index].tokens[i].positionTile =
          synchronizedTokenPosition[color][i].position;

        copyListTokens[index].tokens[i].coordinate = getCoordinatesByTileType(
          copyListTokens[index].tokens[i].typeTile,
          positionGame,
          copyListTokens[index].tokens[i].positionTile
        );

        /**
         * Ahora se establece si el token llega a una celda, donde se deba redistribuir, en
         * este caso no es remover sino agregar...
         */
        copyListTokens = validateTokenDistributionCell({
          token: copyListTokens[index].tokens[i],
          listTokens: copyListTokens,
          currentTurn,
          totalTokens,
          removeTokenFromCell: false,
          setTotalTokens,
        });
      }
    }

    /**
     * Saber si hay game over...
     */
    let isGameOver = false;

    /**
     * Para calcular el ranking...
     */
    let ranking = 0;

    /**
     * Se hace copia de los players...
     */
    let copyPlayers = cloneDeep(players);

    /**
     * Se itera cada jugador y se valida si ha terminado de jugar...
     */
    for (let { index, finished } of copyPlayers) {
      /**
       * Sólo se valida a quellos que no hayan finalizado...
       */
      if (!finished) {
        /**
         * Se obtiene cuantos tokens están en las celdas finales...
         */
        const { END } = getTokensValueByCellType(copyListTokens[index]);

        /**
         * Si es 4 quiere decir que ya las ha sacado todas...
         */
        if (END.length === 4) {
          /**
           * Se obtiene el número real de jugadores que hay...
           */
          const totalPlayers = copyPlayers.filter(
            (v) => !v.isOffline || v.finished
          ).length;

          /**
           * Número de jugadores que ya ha finalizado...
           */
          const totalPlayersEnd = copyPlayers.filter((v) => v.finished).length;

          /**
           * Se calcula el ranking...
           */
          ranking = totalPlayersEnd + 1;

          /**
           * Si el valor del ranking es igual al numéro de jugadores reales, menos uno
           * es game over...
           */
          isGameOver = ranking === totalPlayers - 1;

          /**
           * Se establece que el jugador ha terminado...
           */
          copyPlayers[index].finished = true;
          /**
           * * Además se indica la posición del jugador...
           */
          copyPlayers[index].ranking = ranking;
        }
      }
    }

    /**
     * Si es game over, se hace la restribución de ranking para los jugadores que quedan...
     */
    if (isGameOver) {
      copyPlayers = validatePlayerRankingGameOver({
        players: copyPlayers,
        playSound,
        setIsGameOver,
        ranking,
      });
    }

    setPlayers(copyPlayers);
    setListTokens(copyListTokens);
    setShowSync(false);
  }
};

interface ValidateOpponentLeave {
  currentTurn: number;
  idLeave: string;
  listTokens: IListTokens[];
  players: IPlayer[];
  totalTokens: TShowTotalTokens;
  playSound: (type: IESounds) => void;
  setActionsMoveToken: React.Dispatch<React.SetStateAction<IActionsMoveToken>>;
  setActionsTurn: React.Dispatch<React.SetStateAction<IActionsTurn>>;
  setCurrentTurn: React.Dispatch<React.SetStateAction<number>>;
  setIsGameOver: React.Dispatch<React.SetStateAction<IGameOver>>;
  setListTokens: React.Dispatch<React.SetStateAction<IListTokens[]>>;
  setPlayers: React.Dispatch<React.SetStateAction<IPlayer[]>>;
  setTotalTokens: React.Dispatch<React.SetStateAction<TShowTotalTokens>>;
}

/**
 *  Función que valida cuando un usuario se ha desconectado
 * Cambia el usuario a desconectado.
 * Establece el número de jugadores que quedan.
 * Indica el siguiente turno, si el jugador que se desconecta lo tenía.
 * Establece si el juego ha acabado por que no hay más jugadores.
 * @param param0
 */
export const validateOpponentLeave = ({
  currentTurn = 0,
  idLeave = "",
  listTokens = [],
  players = [],
  totalTokens,
  playSound,
  setActionsMoveToken,
  setActionsTurn,
  setCurrentTurn,
  setIsGameOver,
  setListTokens,
  setPlayers,
  setTotalTokens,
}: ValidateOpponentLeave) => {
  /**
   * Se busca el jugador que se ha desconectado
   */
  const playerLeave = players.find((player) => player.id === idLeave);

  if (playerLeave) {
    /**
     * Índice del jugador que se ha desconectado...
     */
    const indexPlayerLeave = playerLeave.index;
    /**
     * Se hace la copia de los jugadores...
     */
    const copyPlayers = cloneDeep(players);

    /**
     * Se establece que el jugador ahora está desconectado...
     */
    copyPlayers[indexPlayerLeave].isOffline = true;

    /**
     * Ahora saber si el jugador ya había acabado, si no es así
     * se deben poner los tokens en la posición incial
     */
    if (!playerLeave.finished) {
      /**
       * Como no ha finalizado, se deben enviar los tokens a la cárcel...
       */
      let copyListTokens = cloneDeep(listTokens);
      /**
       * Se obtiene la posición del board del jugador que se ha descoectado...
       */
      const { positionGame } = copyListTokens[indexPlayerLeave];

      /**
       * Se iteran todos los tokens del juagador que se ha ido, para así validar si en
       * la posición que estaba se debe hacer una reditrubución de tokens en la celda...
       */
      for (let token of copyListTokens[indexPlayerLeave].tokens) {
        copyListTokens = validateTokenDistributionCell({
          token,
          listTokens: copyListTokens,
          currentTurn,
          totalTokens,
          removeTokenFromCell: true,
          setTotalTokens,
        });
      }

      /**
       * Se reubican los tokens en la cárcel...
       */
      copyListTokens[indexPlayerLeave].tokens = getTokensInJail(
        positionGame,
        playerLeave.color,
        false
      );

      /**
       * Se actualiza el estado de los tokens que se han movido a la cárcel...
       */
      setListTokens(copyListTokens);
    }

    /**
     * Ahora validar cuantos usuarios quedan online,
     * para ello se deja sólo aquellos usuarios que no estén offline o que
     * no hayan acabado, por ejemplo.
     * Cuatro jugadores.
     * 1. Uno se desconectó.
     * 2. Uno terminó.
     * 3. Otro se desconectó.
     * Con ese ejemplo el valor de totalOnlinePlayers es 1, por que sólo uno
     * está online y no ha terminado...
     */
    const totalOnlinePlayers = copyPlayers.filter(
      (player) => !player.isOffline && !player.finished
    );

    /**
     * Si sólo queda un jugador online, se indica que el juego ha acabado...
     */
    if (totalOnlinePlayers.length === 1) {
      /**
       * Se obtiene el total de jugadores que ya ha terminado...
       */
      const totalPlayersEnd = copyPlayers.filter((v) => v.finished).length;

      /**
       * Se obtiene la posición (ranking) del jugador que ha quedado, si son dos
       * juagdores, éste quedaría de primeras...
       */
      let ranking = totalPlayersEnd + 1;

      /**
       * * Se extrae el índice del jugador que ha quedado...
       */
      const { index: indexLastPlayer } = totalOnlinePlayers[0];

      /**
       * Se indica que ha finalziado y además su posición...
       */
      copyPlayers[indexLastPlayer].finished = true;
      copyPlayers[indexLastPlayer].ranking = ranking;

      /**
       * Ahora se obtienen los jugadores que están offline y que no haya
       * terminado, puede ser que el jugador terminó y ya tiene una posción,
       * por lo que se debe obviar por que ya tiene un ranking
       */
      const offlinePlayers = copyPlayers.filter(
        (v) => v.isOffline && !v.finished
      );

      /**
       * Se iteran los jugadores onffline y que no habían terminado,
       * para de esta forma obtener su posición...
       */
      for (let player of offlinePlayers) {
        /**
         * Se incremente la posición del ranlking para el siguiente jugador...
         */
        ranking++;

        /**
         * Se indica que ha terminado...
         */
        copyPlayers[player.index].finished = true;

        /**
         * Se establece el rankig calculado...
         */
        copyPlayers[player.index].ranking = ranking;
      }

      /**
       * Se establece el estado que el juego ha terminado...
       */
      setIsGameOver({ showModal: false, gameOver: true });

      /**
       * Sonido para el game over...
       */
      playSound(ESounds.GAMER_OVER);

      /**
       * Se valida que no exista ningún cronometro que se esté ejecutando...
       */
      setActionsTurn((current) => ({
        ...current,
        timerActivated: false,
        disabledDice: true,
        showDice: false,
      }));

      /**
       * Validar que ningún token se esté moviendo...
       */
      setActionsMoveToken((current) => ({ ...current, isRunning: false }));
    } else {
      /**
       * Si el usuario que se desconecta es el usuario actual, es decir, tenía
       * el turno, se debe indicar
       * que se le debe pasar el turno al siguiente jugador...
       */
      if (playerLeave.index === currentTurn) {
        validateNextTurn({
          currentTurn,
          players,
          addLastDice: true,
          addDelayNextTurn: true,
          setActionsTurn,
          setCurrentTurn,
        });
      }

      /**
       * Sonido cuando se desconecta un usuario...
       */
      playSound(ESounds.USER_OFFLINE);
    }

    /**
     * Se muta el estado de los jugadores...
     */
    setPlayers(copyPlayers);
  }
};

interface ToogleMuteChat {
  playerIndex: number;
  players: IPlayer[];
  setPlayers: React.Dispatch<React.SetStateAction<IPlayer[]>>;
}

/**
 * Para establecer el mute de un usuario en el chat, en la jugabilidad online
 * @param param0
 */
export const toogleMuteChat = ({
  playerIndex,
  players,
  setPlayers,
}: ToogleMuteChat) => {
  const copyPlayers = cloneDeep(players);
  copyPlayers[playerIndex].isMuted = !copyPlayers[playerIndex].isMuted;
  setPlayers(copyPlayers);
};

interface ShowChatMessage {
  data: ISocketListenChatMessage;
  players: IPlayer[];
  playSound: (type: IESounds) => void;
  setPlayers: React.Dispatch<React.SetStateAction<IPlayer[]>>;
}

/**
 * Función que muta el estado para mostrar los mensajes del chat...
 * @param param0
 */
export const showChatMessage = ({
  data,
  players,
  playSound,
  setPlayers,
}: ShowChatMessage) => {
  /**
   * Se valida que exista y además que no este muteado...
   */
  const playerChat = players.find((player) => player.id === data.userID);

  /**
   * Se valida que exista y además que no este muteado...
   */
  if (playerChat && !playerChat.isMuted) {
    const copyPlayers = cloneDeep(players);

    /**
     * Se extrae el índice del usuario a cambiar...
     */
    const { index } = playerChat;

    /**
     * Se genera el mensaje que se mostrará...
     */
    const chatMessage =
      PREDEFINED_CHAT_MESSAGES[data.type][data.messageIndex].value;

    /**
     * Se muta el estado...
     */
    copyPlayers[index].chatMessage = chatMessage;
    copyPlayers[index].typeMessage = data.type;

    /**
     * Valor para indicar que el estado ha cambiado,
     * además es usado para el key del buuble del chat, para así
     * indicarle a react que se debe recrear ese elemento...
     */
    const counterMessage = copyPlayers[index].counterMessage;
    const newCounterMessage = counterMessage + 1 >= 10 ? 1 : counterMessage + 1;
    copyPlayers[index].counterMessage = newCounterMessage;

    /**
     * Se guarda el valor...
     */
    setPlayers(copyPlayers);

    /**
     * Sonido de la burbuja del chat...
     */
    playSound(ESounds.CHAT);
  }
};
