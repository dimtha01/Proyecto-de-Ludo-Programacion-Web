import "./styles.css";
import React, { ReactNode } from "react";

/**
 * Componente que contiene los perfiles de usuario y el board.
 * @param param0
 * @returns
 */
const BoardWrapper = ({
  children,
}: {
  children: JSX.Element | JSX.Element[] | ReactNode;
}) => <div className="game-board-wrapper">{children}</div>;

export default React.memo(BoardWrapper);
