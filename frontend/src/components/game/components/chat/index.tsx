import "./styles.css";
import { useOnClickOutside } from "../../../../hooks";
import {
  PREDEFINED_CHAT_MESSAGES,
  TYPES_CHAT_MESSAGES,
} from "../../../../utils/constants";
import Icon from "../../../icon";
import React, { useRef, useState } from "react";
import type { ISocketListenChatMessage } from "../../../../interfaces";

/**
 * Se extraen los mensajes predefinidos del chat...
 */
const { EMOJI, TEXT } = PREDEFINED_CHAT_MESSAGES;

type IHandleMessageChat = (data: ISocketListenChatMessage) => void;

interface ChatProps {
  userID: string;
  handleMessageChat: IHandleMessageChat;
}

const ChatModal = ({ userID = "", handleMessageChat }: ChatProps) => (
  <div className="game-chat-modal">
    <div className="game-chat-modal-emojis">
      {EMOJI.map(({ value, index }) => (
        <button
          key={index}
          onClick={() =>
            handleMessageChat({
              userID,
              type: TYPES_CHAT_MESSAGES.EMOJI,
              messageIndex: index,
            })
          }
        >
          {value}
        </button>
      ))}
    </div>
    <ul className="game-chat-modal-text">
      {TEXT.map(({ value, index }) => (
        <li key={index}>
          <button
            onClick={() =>
              handleMessageChat({
                userID,
                type: TYPES_CHAT_MESSAGES.TEXT,
                messageIndex: index,
              })
            }
          >
            {value}
          </button>
        </li>
      ))}
    </ul>
  </div>
);

const Chat = ({ userID, handleMessageChat }: ChatProps) => {
  const [showOptions, setShowOptions] = useState(false);

  /**
   * Referncia al elemento del chat...
   */
  const chatRef = useRef<HTMLDivElement>(null);

  /**
   * Para hacer la acción de cerrar el modal del chat cuando se hace
   * click por fuera del mismo...
   */
  useOnClickOutside(chatRef, () => setShowOptions(false));

  return (
    <div className="game-chat" ref={chatRef}>
      {showOptions && (
        <ChatModal
          userID={userID}
          handleMessageChat={(data) => {
            setShowOptions(false);
            handleMessageChat(data);
          }}
        />
      )}
      <button
        className="button yellow game-chat-button"
        onClick={() => setShowOptions(!showOptions)}
        title="Chat"
      >
        <Icon type="emoji" fill="#8b5f00" />
      </button>
    </div>
  );
};

export default React.memo(Chat);
