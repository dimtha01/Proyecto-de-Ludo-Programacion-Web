import "./styles.css";
import Dice from "../../../dice";
import React from "react";
import type { IDiceList } from "../../../../../../interfaces";

interface NameAndDiceProps {
  name: string;
  diceAvailable: IDiceList[];
  hasTurn: boolean;
}

/**
 * Componente que muestra el nombre del jugador,
 * ó si existen dados mostrará los dados que se han obtenido...
 * @param param0
 * @returns
 */
const NameAndDice = ({
  name,
  diceAvailable = [],
  hasTurn = false,
}: NameAndDiceProps) => (
  <div className="game-profile-name-dice">
    {diceAvailable.length !== 0 ? (
      <div className="game-profile-dices">
        {diceAvailable.map(({ key, value }) => (
          <Dice key={key} value={value} size={16} animate />
        ))}
      </div>
    ) : (
      <div className={`game-profile-name ${hasTurn ? "has-turn" : ""}`}>
        {name}
      </div>
    )}
  </div>
);

export default React.memo(NameAndDice);
