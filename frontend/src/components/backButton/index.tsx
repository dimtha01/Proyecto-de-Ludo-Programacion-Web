import "./styles.css";
import { handleBack } from "./helpers";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../pages/router/routerConfig";
import Icon from "../icon";

interface BackButtonProps {
  to?: string;
  withConfirmation?: boolean;
}

const RenderAnchor = ({ to }: { to: string }) => (
  <Link to={to} className="button blue game-back-button">
    <Icon type="back" />
  </Link>
);

const BackButton = ({
  to = ROUTES.LOBBY,
  withConfirmation = false,
}: BackButtonProps) => {
  const navigate = useNavigate();

  if (!withConfirmation) {
    return <RenderAnchor to={to} />;
  }

  return (
    <button
      className="button blue game-back-button"
      onClick={() => handleBack((action) => action && navigate("/"))}
    >
      <Icon type="back" />
    </button>
  );
};

export default BackButton;
