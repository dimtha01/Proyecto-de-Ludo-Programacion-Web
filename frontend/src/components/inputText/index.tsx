import "./styles.css";

interface InputTextProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

const InputText = ({ value, disabled, onChange }: InputTextProps) => (
  <input
    className="game-offline-name"
    disabled={disabled}
    maxLength={20}
    required
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);

export default InputText;
