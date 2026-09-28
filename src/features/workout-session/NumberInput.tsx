import { useEffect, useState, type InputHTMLAttributes } from 'react';
import { toast } from 'sonner';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number;
  onValueChange: (value: number) => void;
}

export default function NumberInput({ value, onValueChange, onBlur, min = 0, step = 1, ...props }: NumberInputProps) {
  const [draft, setDraft] = useState(String(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(String(value));
    setInvalid(false);
  }, [value]);

  return (
    <input
      {...props}
      className={`input session-number ${props.className ?? ''}`}
      type="number"
      inputMode={step === 1 ? 'numeric' : 'decimal'}
      min={min}
      step={step}
      value={draft}
      aria-invalid={invalid || undefined}
      onChange={event => {
        const text = event.currentTarget.value;
        const next = event.currentTarget.valueAsNumber;
        const valid = text !== '' && Number.isFinite(next) && event.currentTarget.validity.valid;
        setDraft(text);
        setInvalid(!valid);
        if (valid) onValueChange(next);
      }}
      onBlur={event => {
        if (invalid) {
          setDraft(String(value));
          setInvalid(false);
          toast.info('Valor inválido. Mantivemos o último valor salvo.');
        }
        onBlur?.(event);
      }}
    />
  );
}
