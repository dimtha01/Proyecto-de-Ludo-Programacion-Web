import { PageWrapper } from "../wrapper";
import { Socket } from "socket.io-client";
import { useInterval, useSocketAction, useWait } from "../../hooks";
import { useOptionsContext } from "../../context/optionContext";
import {
  Board,
  BoardWrapper,
  Chat,
  Debug,
  GameOver,
  ProfileSection,
  ShowTotalTokens,
  SyncGame,
  Tokens,
} from "./components";
import {
  DEFAULT_VALUE_ACTION_TURN,
  EActionsBoardGame,
  EBoardColors,
  EPositionProfiles,
  ESounds,
  ETypeGame,
  INITIAL_ACTIONS_MOVE_TOKEN,
  INITIAL_SOCKET_LISTEN_ACTIONS,
  TOKEN_MOVEMENT_INTERVAL_VALUE,
  WAIT_SHOW_MODAL_GAME_OVER,
} from "../../utils/constants";
import {
  disableCurrentTurnTokens,
  getInitialActionsTurnValue,
  getInitialDataPlayers,
  getInitialPositionTokens,
  getRandomValueDice,
  nextStepGame,
  randomValueDice,
  showChatMessage,
  toogleMuteChat,
  validateDicesForTokens,
  validateMovementToken,
  validateOpponentLeave,
  validateSelectToken,
  validateSelectTokenRandomly,
  validateTokenSync,
} from "./helpers";
import BackButton from "../backButton";
import React, { useCallback, useState } from "react";
import type {
  IActionsMoveToken,
  IActionsTurn,
  IDoneTokenMovement,
  IGameOver,
  IListTokens,
  IPlayer,
  ISelectTokenValues,
  ISocketActions,
  ISocketListenChatMessage,
  IUser,
  TBoardColors,
  TDicevalues,
  TShowTotalTokens,
  TTotalPlayers,
  TTypeGame,
} from "../../interfaces";

interface GameProps {
  totalPlayers: TTotalPlayers;
  initialTurn: number;
  users: IUser[];
  typeGame?: TTypeGame;
  boardColor?: TBoardColors;
  debug?: boolean;
  roomName?: string;
  socket?: Socket;
}

const Game = ({
  totalPlayers = 2,
  initialTurn = 0,
  users = [],
  typeGame = ETypeGame.OFFLINE,
  boardColor = EBoardColors.RGYB,
  debug = false,
  roomName = "",
  socket,
}: GameProps) => {
  /**
   * Contexto para los opciones del juego...
   */
  const { playSound, optionsGame } = useOptionsContext();

  /**
   * Estado que guarda la información de los jugadores...
   */
  const [players, setPlayers] = useState<IPlayer[]>(() =>
    getInitialDataPlayers(users, boardColor, totalPlayers)
  );

  /**
   * Estado que guarda la información de los tokens del juego...
   */
  const [listTokens, setListTokens] = useState<IListTokens[]>(() =>
    getInitialPositionTokens(boardColor, totalPlayers, players)
  );

  /**
   * Establece la información relaciona a las acciones de cada turno
   */
  const [actionsTurn, setActionsTurn] = useState<IActionsTurn>(() => {
    /**
     * Si es un juego offline se establece el valor de inicio dle juego, de lo contrario,
     * no se establece nada, hasta que se haya validado que todos los jugadores ya están
     * listos para empezar el juego...
     */
    return typeGame === ETypeGame.OFFLINE
      ? getInitialActionsTurnValue(initialTurn, players)
      : DEFAULT_VALUE_ACTION_TURN;
  });

  /**
   * Guadra el valor del usuario que tiene el turno...
   * Si es offline, se establece el turno del usaurio que inicia la partida, si es online,
   * se establece -1, hasta que se haya validado que todos los usuarios ya se encuentran
   * listo para empezar el juego...
   */
  const [currentTurn, setCurrentTurn] = useState(
    typeGame === ETypeGame.OFFLINE ? initialTurn : -1
  );

  /**
   * Estado que giarda las acciones de movimiento del token...
   */
  const [actionsMoveToken, setActionsMoveToken] = useState<IActionsMoveToken>(
    INITIAL_ACTIONS_MOVE_TOKEN
  );

  /**
   * Estado usado para mostrar el indicador de número de tokens
   * por celda...
   */
  const [totalTokens, setTotalTokens] = useState<TShowTotalTokens>({});

  const [isGameOver, setIsGameOver] = useState<IGameOver>({
    showModal: false,
    gameOver: false,
  });

  /**
   * Para indicar que se muestre la capa de sincronización del juego,
   * útil para la jugabilidad online, será true al inicio, sólo si el tipo de
   * juego es online, por el contrario será falso, así no se mostrará en la
   * jugabilidad offline...
   */
  const [showSync, setShowSync] = useState(typeGame === ETypeGame.ONLINE);

  /**
   * El id correspondiente al primer usuario del juego, útil para la jugabilidad
   * online, en este caso para ser pasado al chat...
   */
  const userID = players[0].id;

  /**
   * Evento que escucha cuando se ha seleccionado un dado...
   * @param selectTokenValues
   */
  const handleSelectedToken = useCallback(
    ({ diceIndex, tokenIndex }: ISelectTokenValues, isActionSocket = false) => {
      /**
       * Si es un usuario actual de la sesión en jugabilidad online, siempre el usaurio que hace lanzamiento
       * es el uno (0) por eso se toma con el usuario que lanzó y por lo tanto debe emitir a los demás usuarios...
       */
      if (!isActionSocket && currentTurn === 0 && socket) {
        setActionsTurn((current) => ({
          ...current,
          timerActivated: false,
          disabledDice: true,
          showDice: false,
        }));

        setListTokens((current) =>
          disableCurrentTurnTokens(current, currentTurn)
        );

        /**
         * Se emite la data a los demás usuarios...
         */
        socket.emit("ACTIONS", {
          roomName,
          type: EActionsBoardGame.SELECT_TOKEN,
          SELECT_TOKEN: { tokenIndex, diceIndex },
        } as ISocketActions);
      } else {
        validateSelectToken({
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
        });
      }
    },
    [actionsTurn, currentTurn, listTokens, roomName, socket, totalTokens]
  );

  /**
   * Función que recibe el estado del timer,
   * útil para hacer acciones para el bot...
   * @param ends
   */
  const handleTimer = (ends = false) => {
    /**
     * Valida si el usuarios actual que tiene el turno es el actual de esta sesión,
     * por defecto el usuario de la sesión acual está en la posición cero...
     */
    const isCurrentOnlineUser = currentTurn === 0;
    /**
     * Extraer el tipo de jugador...
     */
    const { isBot, isOnline } = players[currentTurn];

    /**
     * Determina si realiza una acción automática para un usuario que este en la jugabilidad online...
     */
    const isAutomaticActionCurrentOnlineUser = isOnline && isCurrentOnlineUser;

    // Determina que es un juego online...
    const isOnlineGame = typeGame === ETypeGame.ONLINE;

    /**
     * Variable que termina si se hace un movimiento automático, cuando
     * el tiempo se ha acabado, se hacen las siguientes validaciones:
     * 1: Si es un juego offline:
     *  * Si el contador finaliza ó si es un bot, si es un bot no se espera a que el timpo finalice.
     * 2: Si es online, se valida si el tiempo ha terminado y además que el usuario actual de la sesión
     * puede hacer lanzamiento...
     */
    const makeAutomaticMovement = !isOnlineGame
      ? ends || isBot
      : ends && isAutomaticActionCurrentOnlineUser;
    // const makeAutomaticMovement = false;

    // console.log("actionsBoardGame: ", actionsTurn.actionsBoardGame);

    if (makeAutomaticMovement) {
      /**
       * Si es de tipo girar dado, invoca la función que generá un dado aleatorio...
       */
      if (actionsTurn.actionsBoardGame === EActionsBoardGame.ROLL_DICE) {
        handleSelectDice();
      }

      /**
       * Si es un tipo de seleccionar un token invoca una función que obtiene los valores...
       */
      if (actionsTurn.actionsBoardGame === EActionsBoardGame.SELECT_TOKEN) {
        /**
         * Obtiene los valores del token y del dado que se utuilizarán para hacer un
         * movimiento, cuando el tiempo ha acabado o cuando es un bot
         */
        const { diceIndex, tokenIndex } = validateSelectTokenRandomly(
          currentTurn,
          listTokens,
          actionsTurn.diceList
        );

        /**
         * Invoca la misma función de selección de token...
         */
        handleSelectedToken({ diceIndex, tokenIndex });
      }
    }
  };

  /**
   * Función que establece cuando se ha hecho click en el dado...
   * @param diceValue
   * @param isActionSocket
   */
  const handleSelectDice = useCallback(
    (diceValue?: TDicevalues, isActionSocket = false) => {
      /**
       * Si no es una acción del socket y además es el usuario que puede lanzar
       * y se tiene un socket, se emite al server el valor del dado...
       */
      if (!isActionSocket && currentTurn === 0 && socket) {
        /**
         * Se detiene el cronocmetro y se bloquea el dado...
         */
        setActionsTurn((current) => ({
          ...current,
          timerActivated: false,
          disabledDice: true,
        }));

        /**
         * Si es el usaurio actual, es decir el que puede lanzar y además existe un socket
         * lo cual quiere decir que es online, emite este valor a los demás usuarios...
         * Si llegase el valor del dado se envía, útil para la opción de debug, para así
         * simular valor del dado que no sean aleatorios...
         */
        socket.emit("ACTIONS", {
          roomName,
          type: EActionsBoardGame.ROLL_DICE,
          ROLL_DICE: diceValue || randomValueDice(),
        } as ISocketActions);
      } else {
        /**
         * Crear el estado para el dado...
         */
        setActionsTurn((current) => getRandomValueDice(current, diceValue));
        /**
         * Se reproduce el sonido de lanzamiento del dado...
         */
        playSound(ESounds.ROLL_DICE);
      }
    },
    [currentTurn, playSound, roomName, socket]
  );

  /**
   * Función que determina que el dado ha terminado de girar...
   * @param isActionSocket
   */
  const handleDoneDice = useCallback(
    (isActionSocket = false) => {
      /**
       * Variable que indica si se debe invocar la función de validación de valores del token con los dados,
       * handleDoneDice se ejecuta cuando el dado termina de girar, esto pasa en cada cliente, lo
       * que se está validando es que sólo el usuario que tiene el turno emita que terminó de jugar el dado
       * y los demás clientes lo escuchen.
       */
      let canCallValidateDicesForTokens = true;

      /**
       * Si existe un socket y además no es valor que venga ya de la respuesta del socket...
       */
      if (socket && !isActionSocket) {
        /**
         * Es el usaurio actual de la sesión, siempre el usuario 0 es el que hace lanzamientos en cada cliente...
         */
        if (currentTurn === 0) {
          socket.emit("ACTIONS", {
            roomName,
            type: EActionsBoardGame.DONE_DICE,
            DONE_DICE: true,
          } as ISocketActions);
        }

        /**
         * Se determina que no llame a la función que hace la validación del valor del dado...
         */
        canCallValidateDicesForTokens = false;
      }

      /**
       * Si llega acá es por que no es un juego online, o por que la acción que ha llegado es del socket...
       */
      if (canCallValidateDicesForTokens) {
        /**
         * Función que valida el dado con respecto al token
         */
        validateDicesForTokens({
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
        });
      }
    },
    [
      actionsTurn,
      currentTurn,
      listTokens,
      playSound,
      players,
      roomName,
      socket,
      totalTokens,
    ]
  );

  /**
   * Función que determina el siguiente paso del juego, en la
   * jugabilidad online y además valida sincronización de tokens...
   */
  const handleNextStepGame = useCallback(
    ({ tokens: syncTokens, action }: IDoneTokenMovement) => {
      /**
       * Primero se valida si los tokens están sicronizados...
       */
      validateTokenSync({
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
      });

      /**
       * Se hace el proceso de ir al siguiente paso...
       */
      nextStepGame({
        type: action,
        actionsTurn,
        currentTurn,
        players,
        setActionsTurn,
        setCurrentTurn,
      });
    },
    [actionsTurn, currentTurn, listTokens, playSound, players, totalTokens]
  );

  /**
   * Para manejar la acción cuando un jugador se ha desconectado...
   */
  const handleOpponentLeave = useCallback(
    (idLeave: string) => {
      if (!isGameOver.gameOver) {
        validateOpponentLeave({
          currentTurn,
          idLeave,
          listTokens,
          players,
          totalTokens,
          playSound,
          setActionsMoveToken,
          setActionsTurn,
          setCurrentTurn,
          setIsGameOver,
          setListTokens,
          setPlayers,
          setTotalTokens,
        });
      }
    },
    [
      currentTurn,
      isGameOver.gameOver,
      listTokens,
      playSound,
      players,
      totalTokens,
    ]
  );

  /**
   * Para establecer el mute del chat de un usuario,
   * el usaurio actual (posición 0) no se puede mutear...
   * @param playerIndex
   */
  const handleMuteChat = (playerIndex: number) =>
    toogleMuteChat({
      playerIndex,
      players,
      setPlayers,
    });

  /**
   * Función que se ejecuta cuando se inicia el juego en la versión online
   */
  const handleStartGameOnline = useCallback(() => {
    /**
     * Se estable las acciones del turno...
     */
    setActionsTurn(getInitialActionsTurnValue(initialTurn, players));

    /**
     * Se indica quien tiene el turno actual...
     */
    setCurrentTurn(initialTurn);

    /**
     * Se oculta la capa de sincronización, permitiendo iniciar la partida...
     */
    setShowSync(false);
  }, [initialTurn, players]);

  /**
   * Función que recibe los mensajes del chat
   * @param data
   * @param isActionSocket
   */
  const handleMessageChat = useCallback(
    (data: ISocketListenChatMessage, isActionSocket = false) => {
      /**
       * Si es el usuario que emite la acción, para saberlo, se busca el índice donde se encutra el usaurio,
       * ya que el valor que llega es el id, si el usuario se encuentra en la posición 0 quiere decir
       * que es el usuario que emite, de lo contrario quiere decir que son usaurios que escuchan...
       */
      const isCurrentOnlineUser =
        players.findIndex((player) => player.id === data.userID) === 0;

      /**
       * *Si es un juego online, el usuario que hizo la acción es el usuario
       * de la misma sesión y además existe el socket, lo emite...
       */
      if (!isActionSocket && isCurrentOnlineUser && socket) {
        socket.emit("ACTIONS", {
          roomName,
          type: EActionsBoardGame.CHAT_MESSAGE,
          CHAT_MESSAGE: data,
        } as ISocketActions);
      } else {
        /**
         * Función que toma la selección del chat y muta la información del player,
         * para ser mostrada, tanto para el usuario actual (posición 0) como para los demás
         * usuarios.
         * Sólo lo emite si la opción de chat la tiene habilitada en las opciones...
         */
        if (optionsGame.CHAT) {
          showChatMessage({
            data,
            players,
            playSound,
            setPlayers,
          });
        }
      }
    },
    [optionsGame.CHAT, playSound, players, roomName, socket]
  );

  /**
   * Hook que escucha los eventos que llegan del socket...
   */
  useSocketAction(
    socket,
    useCallback(
      (type, data = INITIAL_SOCKET_LISTEN_ACTIONS.data) => {
        const handlersFunctions = {
          [EActionsBoardGame.START_GAME]: handleStartGameOnline,
          // Evento para girar el dado...
          [EActionsBoardGame.ROLL_DICE]: () =>
            handleSelectDice(data.ROLL_DICE, true),
          // Evento para mover un token
          [EActionsBoardGame.SELECT_TOKEN]: () =>
            handleSelectedToken(data.SELECT_TOKEN, true),
          // Evento que indica que se ha terminado de girar los dados.
          [EActionsBoardGame.DONE_DICE]: () => handleDoneDice(data.DONE_DICE),
          // Evento que indica que se ha terminado de mover un token y se dtermina el siguiente paso
          [EActionsBoardGame.DONE_TOKEN_MOVEMENT]: () =>
            handleNextStepGame(data.DONE_TOKEN_MOVEMENT),
          // Evento para indicar que se ha desconectado un usaurio
          [EActionsBoardGame.OPPONENT_LEAVE]: () =>
            handleOpponentLeave(data.OPPONENT_LEAVE),
          // Para emitir el mensaje que se envía a través del chat
          [EActionsBoardGame.CHAT_MESSAGE]: () =>
            handleMessageChat(data.CHAT_MESSAGE, true),
        };

        /**
         * Se valida que el tipo exista en el objeto de  handlers
         */
        if (type in handlersFunctions) {
          handlersFunctions[type]();
        }
      },
      [
        handleDoneDice,
        handleMessageChat,
        handleNextStepGame,
        handleOpponentLeave,
        handleSelectDice,
        handleSelectedToken,
        handleStartGameOnline,
      ]
    )
  );

  /**
   * Hook que se ejecuta para realizar el movimiento del token...
   */
  useInterval(
    () => {
      validateMovementToken({
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
      });
    },
    actionsMoveToken.isRunning ? TOKEN_MOVEMENT_INTERVAL_VALUE : null
  );

  /**
   * Espera un tiempo antes de mostrar el modal del gameOver
   */
  useWait(
    isGameOver.gameOver,
    WAIT_SHOW_MODAL_GAME_OVER,
    // Se usa el useCallback para evitar que la función se genere cada vez que renderiza el componente...
    useCallback(() => setIsGameOver({ showModal: true, gameOver: true }), [])
  );

  const profileHandlers = {
    handleTimer,
    handleSelectDice,
    handleDoneDice,
    handleMuteChat,
  };

  const profileProps = { players, totalPlayers, currentTurn, actionsTurn };

  return (
    <PageWrapper leftOption={<BackButton withConfirmation />}>
      {showSync && <SyncGame />}
      {isGameOver.showModal && <GameOver players={players} />}
      <BoardWrapper>
        <ProfileSection
          basePosition={EPositionProfiles.TOP}
          profileHandlers={profileHandlers}
          {...profileProps}
        />
        <Board boardColor={boardColor}>
          {debug && <Debug.Tiles />}
          <Tokens
            debug={debug}
            isDisabledUI={actionsTurn.isDisabledUI}
            listTokens={listTokens}
            diceList={actionsTurn.diceList}
            handleSelectedToken={handleSelectedToken}
          />
          <ShowTotalTokens totalTokens={totalTokens} />
        </Board>
        <ProfileSection
          basePosition={EPositionProfiles.BOTTOM}
          profileHandlers={profileHandlers}
          {...profileProps}
        />
      </BoardWrapper>
      {debug && (
        <Debug.Tokens
          typeGame={typeGame}
          players={players}
          listTokens={listTokens}
          actionsTurn={actionsTurn}
          setListTokens={setListTokens}
          handleSelectDice={handleSelectDice}
        />
      )}
      {/* Sólo se renderiza la opción de chat, si se está jugando online */}
      {/* y además que en las opciones del juego el chat esté habilitado */}
      {typeGame === ETypeGame.ONLINE && optionsGame.CHAT && (
        <Chat userID={userID} handleMessageChat={handleMessageChat} />
      )}
    </PageWrapper>
  );
};

export default React.memo(Game);
