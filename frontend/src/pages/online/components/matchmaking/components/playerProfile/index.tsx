import "./styles.css";
import Avatar from "../../../../../../components/avatar";
import Loading from "../../../../../../components/loading";

interface PlayerProfileProps {
  photo?: string;
  name: string;
}

const PlayerProfile = ({ photo = "", name = "" }: PlayerProfileProps) => {
  const searching = !name;

  return (
    <div className="page-matchmaking-avatar">
      <div className="page-matchmaking-image-wrapper">
        {searching && (
          <div className="page-matchmaking-image-loading">
            <Loading />
          </div>
        )}
        <Avatar photo={photo} name={name} className="page-matchmaking-image" />
      </div>
      <span className="page-matchmaking-avatar-name">
        {!searching ? name : "Searching..."}
      </span>
    </div>
  );
};

export default PlayerProfile;
