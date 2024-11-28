import "./styles.css";
import { EBoardColors } from "../../../../utils/constants";
import React, { ReactNode } from "react";
import type { TBoardColors } from "../../../../interfaces";

interface BoardProps {
  boardColor?: TBoardColors;
  children: JSX.Element | JSX.Element[] | ReactNode;
}

const Board = ({ boardColor = EBoardColors.RGYB, children }: BoardProps) => {
  return <div className={`game-board ${boardColor}`}>{children}</div>;
};

export default React.memo(Board);
