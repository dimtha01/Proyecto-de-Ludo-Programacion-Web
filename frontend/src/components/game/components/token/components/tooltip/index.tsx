import "./styles.css";
import { DIE_SIZE_TOOLTIP, EColors } from "../../../../../../utils/constants";
import { getPositionTooltip } from "./helpers";
import Dice from "../../../dice";
import React, { ForwardedRef, forwardRef } from "react";
import type {
  ICoordinate,
  IDiceList,
  TColors,
} from "../../../../../../interfaces";

interface TooltipProps {
  color: TColors;
  coordinate: ICoordinate;
  diceAvailable?: IDiceList[];
  handleTooltipDice: (dice: IDiceList) => void;
}

/**
 * Componente que muestra los dados disponibles para lanzar
 * se establece el forwardRef para así poder utiliza el hook useOnClickOutside,
 * y poder capturar el ref del elemento...
 */
const Tooltip = forwardRef(
  (
    {
      color = EColors.RED,
      coordinate = { x: 0, y: 0 },
      diceAvailable = [],
      handleTooltipDice,
    }: TooltipProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    /**
     * Se obtiene la clase y la coordenada para ubicar al tooltip...
     */
    const { position, coordinate: coordinateTooltip } = getPositionTooltip(
      diceAvailable.length,
      coordinate
    );

    const className = `game-tooltip ${position} ${color.toLowerCase()}`;
    const style = { left: coordinateTooltip.x, top: coordinateTooltip.y };

    return (
      <div style={style} className={className} ref={ref}>
        {diceAvailable.map((dice) => (
          <button
            key={dice.key}
            title={`Dice ${dice.value}`}
            onClick={() => handleTooltipDice(dice)}
          >
            <Dice value={dice.value} size={DIE_SIZE_TOOLTIP} />
          </button>
        ))}
      </div>
    );
  }
);

export default React.memo(Tooltip);
