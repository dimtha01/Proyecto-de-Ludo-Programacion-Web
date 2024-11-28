import "./styles.css";
import React from "react";
import { TShowTotalTokens } from "../../../../interfaces";
import { POSITION_TILES } from "../../../../utils/positions-board";

interface ShowTotalTokensProps {
  indexPosition: number;
  value: number;
}

const TotalTokens = ({
  indexPosition = 0,
  value = 0,
}: ShowTotalTokensProps) => {
  /**
   * Se ontiene la posición del elemento dado su indice...
   */
  const { x: left, y: top } = POSITION_TILES[indexPosition].coordinate;

  /**
   * Se establece la poosición del elemento base...
   */
  const style: React.CSSProperties = { left, top };

  return (
    <div className="game-total-tokens" style={style}>
      <div className="game-total-tokens-value">{value}</div>
    </div>
  );
};

const ShowTotalTokens = ({
  totalTokens = {},
}: {
  totalTokens: TShowTotalTokens;
}) => {
  /**
   * Debido a que es un objeto se convierte en array,
   * además se asegura que los valores sean númericos...
   */
  const totalTokensData = Object.keys(totalTokens).map((v) => +v);

  return (
    <React.Fragment>
      {totalTokensData.length !== 0 &&
        totalTokensData.map((indexPosition) => (
          <TotalTokens
            key={indexPosition}
            indexPosition={indexPosition}
            value={totalTokens[indexPosition]}
          />
        ))}
    </React.Fragment>
  );
};

export default React.memo(ShowTotalTokens);
