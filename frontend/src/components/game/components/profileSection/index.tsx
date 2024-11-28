import "./styles.css";
import { EPositionProfile } from "../../../../utils/constants";
import { ProfileSectionProps, renderProfileComponent } from "./helpers";
import React from "react";
import type { TPositionProfile } from "../../../../interfaces";

/**
 * Componente intermedio que establece la posiciones de los perfiles,
 * dependiendo del número de juagdores y de su posociión...
 * @param props
 * @returns
 */
const ProfileSection = (props: ProfileSectionProps) => (
  <div className="game-profile-section">
    {Object.keys(EPositionProfile).map((position) => (
      <div key={position} className="game-profile-section-container">
        {/* Función que determina si el componente Profile se renderiza, en función de los props */}
        {renderProfileComponent(props, position as TPositionProfile)}
      </div>
    ))}
  </div>
);

export default React.memo(ProfileSection);
