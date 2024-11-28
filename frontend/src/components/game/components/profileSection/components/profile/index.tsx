import "./styles.css";
import { ChatBubble, Image, NameAndDice, Ranking, RenderDice } from "..";
import React from "react";
import type {
  IActionsTurn,
  IPlayer,
  TPositionProfile,
  TPositionProfiles,
  ThandleDoneDice,
  ThandleMuteChat,
  ThandleSelectDice,
  ThandleTimer,
} from "../../../../../../interfaces";

interface ProfileProps {
  basePosition: TPositionProfiles;
  hasTurn: boolean;
  player: IPlayer;
  position: TPositionProfile;
  actionsTurn: IActionsTurn;
  handleTimer: ThandleTimer;
  handleDoneDice: ThandleDoneDice;
  handleSelectDice: ThandleSelectDice;
  handleMuteChat: ThandleMuteChat;
}

/**
 * Componente que renderiza el perfil de un jugador en el juego...
 * @param param0
 * @returns
 */
const Profile = ({
  basePosition,
  hasTurn,
  player,
  position,
  actionsTurn,
  handleTimer,
  handleDoneDice,
  handleSelectDice,
  handleMuteChat,
}: ProfileProps) => {
  const className = `game-profile ${basePosition.toLowerCase()} ${position.toLowerCase()}`;

  return (
    <div className={className}>
      <div className="game-profile-dice-name">
        <Image
          player={player}
          startTimer={actionsTurn.timerActivated}
          position={position}
          handleMuteChat={handleMuteChat}
          handleInterval={(ends) => handleTimer(ends, player.index)}
        />
        {/* Pasa la información de los dados a mostrar */}
        <NameAndDice
          name={player.name}
          diceAvailable={actionsTurn.diceList}
          hasTurn={hasTurn}
        />
        {/* Para mostrar los mensajes del chat */}
        {/* con el key se indica que el componente se desmonte */}
        {player.isOnline && (
          <ChatBubble
            key={player.counterMessage}
            basePosition={basePosition}
            chatMessage={player.chatMessage}
            counterMessage={player.counterMessage}
            position={position}
            typeMessage={player.typeMessage}
          />
        )}
      </div>
      {hasTurn && (
        <RenderDice
          disabledDice={actionsTurn.disabledDice}
          showDice={actionsTurn.showDice}
          diceRollNumber={actionsTurn.diceRollNumber}
          value={actionsTurn.diceValue}
          handleDoneDice={handleDoneDice}
          handleSelectDice={() => handleSelectDice()}
        />
      )}
      {player.finished && <Ranking value={player.ranking} />}
    </div>
  );
};

export default React.memo(Profile);
