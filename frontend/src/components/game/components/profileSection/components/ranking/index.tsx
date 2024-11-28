import "./styles.css";
import { PREFIX_RANKING } from "../../../../../../utils/constants";
import React from "react";

const Ranking = ({ value }: { value: number }) => (
  <div className="game-profile-ranking">
    <div className="game-profile-ranking-value">{`${value}${
      PREFIX_RANKING[value - 1]
    }`}</div>
  </div>
);

export default React.memo(Ranking);
