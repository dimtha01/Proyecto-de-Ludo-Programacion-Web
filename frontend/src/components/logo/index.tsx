import "./styles.css";
import { EColors } from "../../utils/constants";
import { Piece } from "../game/components/token/components";
import Dice from "../game/components/dice";
import type { TColors } from "../../interfaces";

const DATA_LOGO: { letter: string; color: TColors }[] = [
  {
    letter: "L",
    color: EColors.YELLOW,
  },
  {
    letter: "U",
    color: EColors.RED,
  },
  {
    letter: "D",
    color: EColors.GREEN,
  },
  {
    letter: "O",
    color: EColors.BLUE,
  },
];

const Logo = () => (
  <div className="game-logo">
    <div className="game-logo-name">
      <div className="game-logo-dice">
        {new Array(2).fill(null).map((_, key) => (
          <Dice key={key} value={6} size={40} />
        ))}
      </div>
      {DATA_LOGO.map(({ letter, color }) => (
        <div key={letter} className="game-logo-letters">
          <div className="game-logo-letter">{letter}</div>
        </div>
      ))}
    </div>
    <div className="game-logo-footer">Venezolano</div> {/* Cambiado de "Party" a "Fiesta" */}
  </div>
);

export default Logo;