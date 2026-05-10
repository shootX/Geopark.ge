'use client';

import { useRef, useCallback, KeyboardEvent } from 'react';

interface PlateNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Premium plate number input with masked formatting: AB-123-CD
 * Auto-capitalizes letters, inserts hyphens automatically.
 */
export function PlateNumberInput({ value, onChange, error, disabled }: PlateNumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatPlate = useCallback((raw: string): string => {
    // Remove non-alphanumeric characters, uppercase
    const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    // Build the plate: AA-111-AA
    let formatted = '';
    for (let i = 0; i < cleaned.length && i < 8; i++) {
      if (i === 2 || i === 5) {
        formatted += '-';
      }
      formatted += cleaned[i];
    }
    return formatted;
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPlate(e.target.value);
      onChange(formatted);
    },
    [onChange, formatPlate]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // Auto-advance cursor when typing the 3rd or 6th character (after separator)
      if (e.key === 'Backspace' || e.key === 'Delete') return;
      const cursorPos = e.currentTarget.selectionStart ?? 0;
      const val = e.currentTarget.value;
      if ((cursorPos === 2 || cursorPos === 5) && val[cursorPos] === '-') {
        // Prevent typing over the hyphen
        e.preventDefault();
        const newPos = cursorPos + 1;
        setTimeout(() => {
          e.currentTarget.setSelectionRange(newPos, newPos);
        }, 0);
      }
    },
    []
  );

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
        Plate Number
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          maxLength={8}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="AB-123-CD"
          disabled={disabled}
          className={`premium-input font-mono text-lg tracking-[0.15em] text-center uppercase ${
            error ? 'border-red-300 focus:ring-red-500' : ''
          }`}
        />
        {value.length < 8 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-tertiary)]">
            {8 - value.replace(/-/g, '').length} left
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
        Format: AB-123-CD
      </p>
    </div>
  );
}
