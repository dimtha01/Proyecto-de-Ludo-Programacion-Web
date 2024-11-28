import "./styles.css";
import { getLabelRanking, getOrganizedRanking } from "./helpers";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../../pages/router/routerConfig";
import Avatar from "../../../avatar";
import Crown from "./crown";
import FocusTrap from "focus-trap-react";
import Icon from "../../../icon";
import React, { useState } from "react";
import Ribbon from "./ribbon";
import type { IPlayer } from "../../../../interfaces";
import Share from "../../../share";

/**
 * Componente que muestra al usuario que ha quedado de primeras...
 * @param param0
 * @returns
 */
const FirstPosition = ({ first }: { first: IPlayer }) => {
  const classNameFirstPosition = `game-over-container-winner-name game-over-color ${first.color.toLowerCase()}`;

  return (
    <div className="game-over-container-winner">
      <div className="game-over-container-winner-photo">
        <Crown />
        <Avatar photo={first.photo || ""} />
        <span>{getLabelRanking(first.ranking)}</span>
      </div>
      <div className={classNameFirstPosition}>{first.name}</div>
    </div>
  );
};

/**
 * La data para el componente de compartir, se usa tanto para la versión nativa, si los soporta
 * el nabegador, como para la versión custom...
 */
const DATA_SHARE: ShareData = {
  title: "Ludo React",
  text: "Come and play ludo react 🎲, Developed by Jorge Rubiano @ostjh",
  url: window.location.href,
};

/**
 * Renderiza los demás jugadores...
 * @param param0
 * @returns
 */
const OtherPlayer = ({ player }: { player: IPlayer }) => (
  <div className="game-over-container-player">
    <span>{getLabelRanking(player.ranking)}</span>
    <Avatar photo={player.photo || ""} />
    <div className={`game-over-color ${player.color.toLowerCase()}`}>
      {player.name}
    </div>
  </div>
);

const GameOver = ({ players = [] }: { players: IPlayer[] }) => {
  /**
   * Se ordenada el array de menor a mayor, se extrae el primer jugador
   * y luego se extrae los demás jugadores en un array...
   * se usa un useState para guardar la información ordenda, en este caso
   * no es necesario establecerle un set, ya que la data no se modifica.
   * no se usó toSorted debido a un error en Typscript.
   * Property 'toSorted' does not exist on type 'IPlayer[]'
   */
  const [{ first, others }] = useState(() => getOrganizedRanking(players));

  return (
    <FocusTrap focusTrapOptions={{ escapeDeactivates: false }}>
      <div className="game-over-wrapper">
        <div className="game-over-options">
          <div className="game-over-container">
            <Ribbon title="Well Played" />
            <FirstPosition first={first} />
            <div className="game-over-container-others">
              {others.map((player) => (
                <OtherPlayer key={player.index} player={player} />
              ))}
            </div>
          </div>
          <div className="game-over-buttons">
            <Share data={DATA_SHARE}>
              <button className="button blue">
                <Icon type="share" />
              </button>
            </Share>
            <Link className="button yellow" to={ROUTES.LOBBY}>
              <Icon type="home" />
            </Link>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};

export default React.memo(GameOver);
