import "./styles.css";
import { TIME_INTERVAL_CHRONOMETER } from "../../../../../../utils/constants";
import { useInterval } from "../../../../../../hooks";
import { useOptionsContext } from "../../../../../../context/optionContext";
import Avatar from "../../../../../avatar";
import Icon from "../../../../../icon";
import React, { useEffect, useState } from "react";
import type {
  IPlayer,
  TPositionProfile,
  ThandleMuteChat,
} from "../../../../../../interfaces";

interface ImageProps {
  player: IPlayer;
  startTimer: boolean;
  position: TPositionProfile;
  handleMuteChat: ThandleMuteChat;
  handleInterval: (ends: boolean) => void;
}

const Image = ({
  player,
  startTimer,
  position,
  handleMuteChat,
  handleInterval,
}: ImageProps) => {
  /**
   * Se extrae las opciones del juego del contexto, en este caso para saber
   * si la opción del chat está habilidata...
   */
  const { optionsGame } = useOptionsContext();

  /**
   * Se extrae la data del player que se requiere...
   */
  const {
    index = 0,
    photo = "",
    isOnline = false,
    isMuted = false,
    isOffline,
  } = player;
  const [progress, setProgress] = useState(1);
  const [isRunning, setIsRunning] = useState(false);

  /**
   * Efecto que escucha si se indica que se ejecute el timer desde un elemento padre...
   */
  useEffect(() => {
    setIsRunning(startTimer);
    setProgress(1);
  }, [startTimer]);

  /**
   * Ejecuta el cambio para el cronometro...
   */
  useInterval(
    () => {
      const newProgress = progress + 1;
      setProgress(newProgress);

      /**
       * Evento para cuando se ejeucta el bot,
       * para que se ejecute automaticamente, en el padre se valida que sea un bot
       * y de esa forma se ejecutaría...
       * En este caso sería para el lanzamiento del dado y
       * además para la selección del token...
       */
      if (newProgress === 15) {
        handleInterval(false);
      }

      /**
       * Si el progreso es de 100, quiere decir que ha terminado el couter...
       */
      if (newProgress === 100) {
        /**
         * Se detiene el counter...
         */
        setIsRunning(false);
        /**
         * Se devuleve un evento indicando que el counter ha terminado.
         * El componente de arriba adiciona información adicional, como el índice del usuario...
         */
        handleInterval(true);
      }
    },
    isRunning ? TIME_INTERVAL_CHRONOMETER : null
  );

  const style = {
    "--progress": `${Math.round(360 * (progress / 100))}deg`,
  } as React.CSSProperties;

  /**
   * Título que se muestra dependiendo del estado del chat...
   */
  const titleMuteChat = isMuted ? "Enable chat messages" : "Mute chat messages";

  /**
   * Para saber si se muestra la opción de silenciar el chat...
   */
  const styleChatIcon = `game-profile-mute-chat ${position.toLowerCase()} ${
    isMuted ? "mute" : ""
  }`;

  /**
   * Para saber si se muestra la opción de silenciar el chat...
   */
  const showMuteChat =
    isOnline && index !== 0 && !isOffline && optionsGame.CHAT;

  return (
    <div className="game-profile-image">
      {isOffline && <div className="game-profile-image-ofline">Left</div>}
      <Avatar photo={photo} className="game-profile-image-avatar" />
      {showMuteChat && (
        <button
          title={titleMuteChat}
          className={styleChatIcon}
          onClick={() => handleMuteChat(index)}
        >
          <Icon type="chat" />
        </button>
      )}
      {startTimer && isRunning && (
        <div className="game-profile-image-progress" style={style} />
      )}
    </div>
  );
};

export default React.memo(Image);
