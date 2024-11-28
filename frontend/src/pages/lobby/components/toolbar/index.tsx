import "./styles.css";
import { API_LOGOUT } from "../../../../utils/constants";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../router/routerConfig";
import Icon from "../../../../components/icon";
import React from "react";
import Share from "../../../../components/share";

const dataShare: ShareData = {
  title: "Ludo React 🎲",
  text: "Let's play Ludo React together. Developed by Jorge Rubiano @ostjh",
  url: window.location.href,
};

const Toolbar = ({ isAuth = false }: { isAuth: boolean }) => (
  <div className="lobby-options-toolbar">
    <Link to={ROUTES.ABOUT} className="button blue" title="About">
      <Icon type="info" />
    </Link>
    <Share data={dataShare}>
      <button className="button blue" title="Share">
        <Icon type="share" />
      </button>
    </Share>
    {isAuth && (
      <a href={API_LOGOUT} className="button blue" title="Logout">
        <Icon type="logout" />
      </a>
    )}
  </div>
);

export default React.memo(Toolbar);
