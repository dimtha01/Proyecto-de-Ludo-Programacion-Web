import "./styles.css";
import { TYPES_CHAT_MESSAGES } from "../../../../../../utils/constants";
import React, { useCallback, useEffect, useState } from "react";
import type {
  ITypeChatMessage,
  TPositionProfile,
  TPositionProfiles,
} from "../../../../../../interfaces";
import { useWait } from "../../../../../../hooks";

interface ChatBubbleProps {
  basePosition: TPositionProfiles;
  chatMessage?: string;
  counterMessage?: number;
  position: TPositionProfile;
  typeMessage?: ITypeChatMessage;
}

const ChatBubble = ({
  basePosition,
  chatMessage = "",
  counterMessage = 0,
  position,
  typeMessage = TYPES_CHAT_MESSAGES.TEXT,
}: ChatBubbleProps) => {
  const [showBubble, setshowBubble] = useState<"show" | "hide" | "remove">(
    "remove"
  );

  const className = `game-chat-bubble ${basePosition.toLowerCase()} ${position.toLowerCase()}`;
  const classNameBubble = `game-chat-bubble-container ${typeMessage.toLowerCase()} ${showBubble}`;

  /**
   * Efecto que escucha si hay nuevos mensajes, se toma un contador, por que un usuario
   * podría enviar el mismo mensaje varias veces y en ese caso no habría cambio.
   * Si hay cambio muestra la burbuja...
   */
  useEffect(() => {
    if (counterMessage !== 0) {
      setshowBubble("show");
    }
  }, [counterMessage]);

  /**
   * Si la burbuja está visible, se oculta...
   */
  useWait(
    showBubble === "show",
    2000,
    useCallback(() => setshowBubble("hide"), [])
  );

  return (
    <div className={className}>
      {showBubble !== "remove" && (
        <div className={classNameBubble}>{chatMessage}</div>
      )}
    </div>
  );
};

export default React.memo(ChatBubble);
