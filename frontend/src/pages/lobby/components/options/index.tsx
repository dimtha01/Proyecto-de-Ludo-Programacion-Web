import "./styles.css";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../router/routerConfig";
import Icon from "../../../../components/icon";

interface OptionsProps {
  serviceError: boolean;
}

const Options = ({ serviceError = false }: OptionsProps) => (
  <div className="lobby-options">
    {!serviceError && (
      <Link to={ROUTES.ONLINE} className="button blue">
        <Icon type="online" />
        Play online
      </Link>
    )}
    <Link to={ROUTES.OFFLINE} className="button yellow">
      <Icon type="offline" fill="#8b5f00" />
      Play offline
    </Link>
  </div>
);

export default Options;
