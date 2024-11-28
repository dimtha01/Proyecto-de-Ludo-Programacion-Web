import "./styles.css";
import { ROLL_TIME_VALUE } from "../../../../../../utils/constants";
import Icon from "../../../../../icon";
import React, { useEffect, useRef } from "react";
import ReactDice, { ReactDiceRef } from "react-dice-complete";
import type { TDicevalues } from "../../../../../../interfaces";

interface RenderDiceProps {
  disabledDice: boolean;
  showDice: boolean;
  value: 0 | TDicevalues;
  diceRollNumber: number;
  handleDoneDice: () => void;
  handleSelectDice: () => void;
}

const RenderDice = ({
  disabledDice = false,
  showDice = false,
  value = 0,
  diceRollNumber = 0,
  handleDoneDice,
  handleSelectDice,
}: RenderDiceProps) => {
  /**
   * Referencia del dado en el dom, para así tener acceso a la función rollAll
   */
  const refDice = useRef<ReactDiceRef>(null);
  /**
   * Tiempo que durará girando el dado, si el valor que llega es 0 se establece que no tendrá tiempo y por tanto no girará
   */
  const rollTime = value !== 0 ? ROLL_TIME_VALUE : 0;

  /**
   * Se pasa el número de lanzamientos, en el caso que el valor del dado sea el mismo.
   * con el fin que se escuche el cambio en el efecto.
   */
  useEffect(() => {
    if (value !== 0 && diceRollNumber !== 0) {
      refDice.current?.rollAll([value]);
    }
  }, [value, diceRollNumber]);

  return (
    <div className={`game-profile-dice ${!showDice ? "hide" : ""}`}>
      {/* Muestra un arrow indicando que puede girar el dado, ya que está habilitado */}
      {!disabledDice && <Icon type="arrow" />}
      <button
        className="game-profile-dice-button"
        disabled={disabledDice}
        onClick={handleSelectDice}
      >
        <ReactDice
          ref={refDice}
          disableIndividual
          defaultRoll={1}
          dieSize={45}
          dotColor="black"
          faceColor="white"
          numDice={1}
          outline
          rollTime={rollTime}
          rollDone={() => value !== 0 && handleDoneDice()}
          outlineColor="white"
        />
      </button>
    </div>
  );
};

export default React.memo(RenderDice);
