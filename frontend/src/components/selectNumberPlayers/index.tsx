import "./styles.css";
import InputRadio from "../radio";
import type { TTotalPlayers } from "../../interfaces";

interface SelectNumberPlayersProps {
  value: TTotalPlayers;
  numberPlayers?: number[];
  handleSelectTotal: (value: TTotalPlayers) => void;
}

/**
 * Componente que renderiza el UI para seleccionar el número de jugadores...
 * @param param0
 * @returns
 */
const SelectNumberPlayers = ({
  value,
  numberPlayers = [2, 3, 4],
  handleSelectTotal,
}: SelectNumberPlayersProps) => (
  <div className="game-select-number-players">
    {numberPlayers.map((total) => (
      <InputRadio
        key={total}
        checked={value === total}
        value={total.toString()}
        label={`${total}P`}
        onChange={(value) => handleSelectTotal(+value as TTotalPlayers)}
      />
    ))}
  </div>
);

export default SelectNumberPlayers;
