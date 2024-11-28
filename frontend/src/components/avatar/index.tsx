import defaulImage from "./default.png";
import React from "react";

interface AvatarProps {
  photo?: string;
  name?: string;
  className?: string;
}

const Avatar = ({ photo = "", name = "", className }: AvatarProps) => (
  <img
    alt="Avatar"
    className={className}
    src={photo || defaulImage}
    title={name}
    onError={({ currentTarget }) => {
      currentTarget.onerror = null;
      currentTarget.src = defaulImage;
    }}
  />
);

export default React.memo(Avatar);
