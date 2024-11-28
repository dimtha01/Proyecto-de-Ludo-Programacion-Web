import "./styles.css";
import Icon from "../../../../components/icon";

const Alert = () => (
  <div className="lobby-alert">
    <Icon type="info" fill="#856404" />
    <span>
      Something went wrong connecting to the server, <a href="/">try again</a>
    </span>
  </div>
);

export default Alert;
