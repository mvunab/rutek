import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../../components/ui/Input';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  showAriaLabel: string;
  hideAriaLabel: string;
};

type PasswordFieldVariantProps = PasswordFieldProps & {
  onToggleVisibility: () => void;
};

function MaskedPasswordField({
  label,
  value,
  onChange,
  autoComplete,
  showAriaLabel,
  onToggleVisibility,
}: PasswordFieldVariantProps) {
  return (
    <div className="relative">
      <Input
        label={label}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        aria-label={showAriaLabel}
        className="absolute right-3 top-8 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
      >
        <Eye size={16} aria-hidden />
      </button>
    </div>
  );
}

function VisiblePasswordField({
  label,
  value,
  onChange,
  autoComplete,
  hideAriaLabel,
  onToggleVisibility,
}: PasswordFieldVariantProps) {
  return (
    <div className="relative">
      <Input
        label={label}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        aria-label={hideAriaLabel}
        className="absolute right-3 top-8 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
      >
        <EyeOff size={16} aria-hidden />
      </button>
    </div>
  );
}

const PASSWORD_FIELD_VARIANTS = {
  masked: MaskedPasswordField,
  visible: VisiblePasswordField,
} as const;

export function PasswordFieldWithToggle(props: PasswordFieldProps) {
  const [variant, setVariant] = useState<keyof typeof PASSWORD_FIELD_VARIANTS>('masked');
  const VariantComponent = PASSWORD_FIELD_VARIANTS[variant];

  return (
    <VariantComponent
      {...props}
      onToggleVisibility={() =>
        setVariant((current) => (current === 'masked' ? 'visible' : 'masked'))
      }
    />
  );
}
