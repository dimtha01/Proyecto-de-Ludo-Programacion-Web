import "./styles.css";
import { EColors } from "../../../utils/constants";
import React, { ForwardedRef, forwardRef } from "react";
import type { TColors } from "../../../interfaces";

interface TooltipColorProps {
  color: TColors;
  handleColor: (color: TColors) => void;
}

/**
 * Componente Tooltip para la selección del color del Token en la página Offline...
 */
const TooltipColor = forwardRef(
  (
    { color, handleColor }: TooltipColorProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => (
    <div className="game-offline-token-tooltip glass-effect" ref={ref}>
      {Object.keys(EColors).map((buttonColor) => {
        return (
          <button
            key={buttonColor}
            className={buttonColor === color ? "selected" : ""}
            onClick={() => handleColor(buttonColor as TColors)}
            style={
              {
                "--select-color": `var(--game-${buttonColor.toLowerCase()})`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  )
);

export default React.memo(TooltipColor);
