import "./styles.css";
import Icon from "../../../icon";
import React from "react";

/**
 * Butón que realiza la acción de mostrar un modal..
 * @param param0
 * @returns
 */
const ButtonOptions = ({ onClick }: { onClick: () => void }) => (
  <button className="button blue game-options-button" onClick={onClick}>
    <Icon type="gear" />
  </button>
);

export default React.memo(ButtonOptions);
