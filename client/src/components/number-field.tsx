import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

/**
 * Numeric input that keeps what the user typed while they are typing.
 *
 * A plain controlled input that re-renders from Number(text) eats the decimal
 * point: "8." parses to 8, the field snaps back to "8", and the next keystroke
 * produces 85. This keeps the raw text while focused and only shows the
 * canonical number once focus leaves, so 8.5 and 1234.56 can be typed.
 */

/** Read the leading number out of typed text. Tolerates currency symbols and separators. */
export function parseAmount(value: string): number {
  const match = value.replace(/[^0-9.\-]/g, '').match(/^-?\d*(\.\d*)?/);
  const parsed = Number(match?.[0] ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
}

export function NumberField({
  value,
  onChange,
  blankWhenZero = false,
  className,
  ...props
}: {
  value: number;
  onChange: (value: number) => void;
  blankWhenZero?: boolean;
  className?: string;
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'>) {
  const display = blankWhenZero && value === 0 ? '' : String(value);
  const [raw, setRaw] = useState(display);
  const [editing, setEditing] = useState(false);

  // Track external changes (loading another record, resetting a draft) while idle.
  useEffect(() => {
    if (!editing) setRaw(display);
  }, [display, editing]);

  return (
    <Input
      {...props}
      inputMode="decimal"
      value={editing ? raw : display}
      onFocus={(e) => { setEditing(true); setRaw(display); props.onFocus?.(e); }}
      onBlur={(e) => { setEditing(false); props.onBlur?.(e); }}
      onChange={(e) => {
        setRaw(e.target.value);
        onChange(parseAmount(e.target.value));
      }}
      className={cn(className)}
    />
  );
}
