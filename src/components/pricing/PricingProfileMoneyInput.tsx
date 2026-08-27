import { Input } from '../ui/Input';

export function PricingProfileMoneyInput({
  label,
  value,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <Input
      label={label}
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
      hint={hint}
    />
  );
}
