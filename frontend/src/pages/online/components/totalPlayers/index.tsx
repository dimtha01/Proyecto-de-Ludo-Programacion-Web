import "./styles.css";
import { PageWrapper } from "../../../../components/wrapper";
import Icon from "../../../../components/icon";
import Logo from "../../../../components/logo";
import type { TTotalPlayers } from "../../../../interfaces";

interface TotalPlayersProps {
  playAsGuest: boolean;
  handlePlayWithFriends: () => void;
  handleTotalPlayers: (total: TTotalPlayers) => void;
}

const DISTRIBUTION_PLAYERS: {
  total: TTotalPlayers;
  label: string;
}[] = [
  {
    total: 2,
    label: "Two Players",
  },
  {
    total: 4,
    label: "Four Players",
  },
];

const TotalPlayers = ({
  playAsGuest = false,
  handlePlayWithFriends,
  handleTotalPlayers,
}: TotalPlayersProps) => {
  return (
    <PageWrapper>
      <Logo />
      <div className="page-total-players-section">
        <h2>Number of players</h2>
        {DISTRIBUTION_PLAYERS.map(({ total, label }) => {
          return (
            <button
              key={total}
              className="button blue page-total-players-button"
              onClick={() => handleTotalPlayers(total)}
            >
              <span>{total}</span>
              {label}
            </button>
          );
        })}
      </div>
      {!playAsGuest && (
        <div className="page-total-players-section">
          <h2>OR</h2>
          <button
            className="button yellow page-total-players-friends"
            onClick={handlePlayWithFriends}
          >
            <Icon type="play" fill="#8b5f00" />
            <span>Play with Friends</span>
          </button>
        </div>
      )}
    </PageWrapper>
  );
};

export default TotalPlayers;
