import "./styles.css";
import { useId } from "react";

interface InputRadioProps {
  value: string;
  label: string;
  checked?: boolean;
  onChange: (value: string) => void;
}

/**
 * Componente para renderizar un radioButton para el UI OFFline/Online...
 * @param param0
 * @returns
 */
const InputRadio = ({
  value,
  label,
  checked = false,
  onChange,
}: InputRadioProps) => {
  const id = useId();

  return (
    <label htmlFor={id} className="form-control">
      <input
        type="radio"
        value={value}
        checked={checked}
        id={id}
        onChange={() => onChange(value)}
      />
      {label}
    </label>
  );
};

export default InputRadio;
