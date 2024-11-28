import "./styles.css";
import { IAuthOptions } from "../../../../interfaces";
import { PageWrapper } from "../../../../components/wrapper";
import Icon, { TypeIcon } from "../../../../components/icon";
import Logo from "../../../../components/logo";

interface AuthenticateProps {
  authOptions: IAuthOptions[];
  handlePlayGuest: () => void;
}

const Authenticate = ({ authOptions, handlePlayGuest }: AuthenticateProps) => (
  <PageWrapper>
    <Logo />
    {authOptions.length !== 0 && (
      <div className="page-auth-section">
        <h2 className="page-auth-title">LOGIN WITH</h2>
        {authOptions.map(({ socialName, routerURL }) => (
          <a
            className={`page-auth-social button blue ${socialName}`}
            key={socialName}
            href={routerURL}
          >
            <Icon type={socialName as TypeIcon} />
            <span>{socialName}</span>
          </a>
        ))}
      </div>
    )}
    <div className="page-auth-section">
      {authOptions.length !== 0 && <h2 className="page-auth-title">OR</h2>}
      <button
        className="button yellow page-auth-social"
        onClick={handlePlayGuest}
      >
        <Icon type="play" fill="#8b5f00" />
        <span>Play as guest</span>
      </button>
    </div>
  </PageWrapper>
);

export default Authenticate;
