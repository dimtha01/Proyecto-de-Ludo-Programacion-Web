import "./styles.css";
import { useUserContext } from "../../context/userContext";
import Avatar from "../avatar";

const ProfilePicture = () => {
  const { isAuth = false, user, serviceError } = useUserContext();

  if (!isAuth || serviceError) {
    return null;
  }

  return (
    <Avatar
      photo={user?.photo || ""}
      name={user?.name || ""}
      className="profile-picture"
    />
  );
};

export default ProfilePicture;
