import "./styles.css";
import { IEOptionsGame } from "../../../../interfaces";
import { useOptionsContext } from "../../../../context/optionContext";
import FocusTrap from "focus-trap-react";
import Icon, { TypeIcon } from "../../../icon";
import React from "react";
import Switch from "react-switch";

interface RenderOptionProps {
  label: string;
  icon: TypeIcon;
  checked: boolean;
  handleChecked: (nextChecked: boolean) => void;
}

const RenderOption = ({
  label = "",
  icon,
  checked,
  handleChecked,
}: RenderOptionProps) => (
  <div className="options-game-option">
    <Icon type={icon} fill="white" />
    <div className="options-game-option-label">{label}</div>
    <Switch
      borderRadius={15}
      checked={checked}
      onChange={handleChecked}
      onColor="#ffe901"
      onHandleColor="#f6ba00"
      handleDiameter={30}
      uncheckedIcon={false}
      checkedIcon={false}
      boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
      activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
      height={30}
      width={60}
    />
  </div>
);

interface OptionsProps {
  handleClose: () => void;
}

/**
 * Renderiza el componente
 * @param param0
 * @returns
 */
const ModalOptions = ({ handleClose }: OptionsProps) => {
  const { optionsGame, toogleOptions } = useOptionsContext();

  return (
    <FocusTrap focusTrapOptions={{ escapeDeactivates: false }}>
      <div className="options-game">
        <div className="options-game-container">
          <div className="options-game-header">
            Options
            <button
              title="Close"
              className="button options-game-close"
              onClick={handleClose}
            >
              <Icon type="close" fill="white" />
            </button>
          </div>
          <div className="options-game-options">
            {Object.keys(optionsGame).map((option) => (
              <RenderOption
                key={option}
                label={option}
                icon={option.toLowerCase() as TypeIcon}
                checked={optionsGame[option as IEOptionsGame]}
                handleChecked={() => toogleOptions(option as IEOptionsGame)}
              />
            ))}
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};

export default React.memo(ModalOptions);
