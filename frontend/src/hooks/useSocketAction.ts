import { Socket } from "socket.io-client";
import type {
  ISocketActions,
  ISocketListenActions,
  ISocketListenData,
  TActionsBoardGame,
} from "../interfaces";
import { useEffect, useState } from "react";
import {
  EActionsBoardGame,
  INITIAL_SOCKET_LISTEN_ACTIONS,
} from "../utils/constants";

const useSocketAction = (
  socket: Socket | null = null,
  cb: (type: TActionsBoardGame, socketData?: ISocketListenData) => void
) => {
  /**
   * Estado que guarda el valor que llega del socket...
   */
  const [dataSocketListenActions, setDataSocketListenActions] =
    useState<ISocketListenActions>(INITIAL_SOCKET_LISTEN_ACTIONS);
  /**
   * Efecto resposable en informar que un usuario está listo para iniciar a jugar, además, escucha
   * un evento que indica que todos los jugadores ya están listos para emopezar,
   * puede suceder que un usuario este en una conexión lenta, y por lo tanto la carga del componente game
   * se demore un poco más que la demás, con esto se valida que todos ya tengan el board cargado y de esta
   * manera todos inicien al mismo tiempo el juego...
   * Este efecto se ejecutará solo una vez después de que el componente se monte en el DOM,
   * ya que no depende de ningún valor específico que pueda cambiar durante la vida útil del componente.
   * Al dejar el array de dependencias vacío [], indicamos a React que el efecto solo debe ejecutarse una vez.
   */
  useEffect(() => {
    if (!socket) return;

    /**
     * Emite una acción al socket, indicando que el juagdor está listo para empezar...
     */
    socket.emit("PLAYER_READY");

    /**
     * Se indica al componente padre que todos los jugadores están listos
     * para empezar a jugar...
     */
    const allPlayersReady = () => cb(EActionsBoardGame.START_GAME);

    /**
     * Se recibe un evento que indica que todos los juagdores están listos
     * para empezar a jugar....
     */
    socket.on("ALL_PLAYERS_READY", allPlayersReady);

    return () => {
      /**
       * Se limpia el listener después de que se ejecute...
       */
      socket.off("ALL_PLAYERS_READY", allPlayersReady);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Efecto que escucha los eventos que llegan del socket...
   */
  useEffect(() => {
    if (!socket) return;

    /**
     * Se iteran las acciones del socket...
     */
    Object.keys(EActionsBoardGame).forEach((event) => {
      /**
       * Se obtiene el tipo de acción del socket, se omite el tipo START_GAME, ya que éste sólo es
       * utlizado para iniciar el juego...
       */
      const socketType = event as Exclude<TActionsBoardGame, "START_GAME">;

      /**
       * Se crean los diferentes eventos que escucha el socket...
       */
      socket.on(EActionsBoardGame[socketType], (data: ISocketActions) => {
        /**
         * Se establece la nueva data.
         */
        const newData: ISocketListenData = {
          ...INITIAL_SOCKET_LISTEN_ACTIONS.data,
          [socketType]: data[socketType],
        };

        /**
         * Se guarda la data para ser escuchada que ha cambiado...
         */
        setDataSocketListenActions({
          type: socketType,
          change: true,
          data: newData,
        });
      });
    });
  }, [socket]);

  /**
   * Eefecto que escucha lso eventos del socket,
   * estrategía para mantener escuchando los estados actuales y así
   * evitar el clousure creado en el socket...
   */
  useEffect(() => {
    /**
     *  Sólo ingresa si se ha detectado que ha un cambio, lo cual se
     * establece en la variable change, sólo cuando está es true,
     * se emite el valor.
     */
    if (dataSocketListenActions.change) {
      /**
       * Se pasa la data al componente padre...
       */
      cb(dataSocketListenActions.type, dataSocketListenActions.data);

      /**
       * Se reinicia los valores de escucha del socket...
       */
      setDataSocketListenActions(INITIAL_SOCKET_LISTEN_ACTIONS);
    }
  }, [dataSocketListenActions, cb]);
};

export default useSocketAction;
