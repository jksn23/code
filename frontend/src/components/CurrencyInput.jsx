import React from 'react';

/**
 * CurrencyInput - Reusable input for Rupiah amounts
 * Props:
 *   value: number | string (raw numeric value)
 *   onChange: (numericValue: number) => void
 *   placeholder: string
 *   className: string
 *   style: object
 */
export default function CurrencyInput({ value, onChange, placeholder = 'Rp 0', className, style, disabled }) {
  // Format for display: 1500000 => "1.500.000"
  const format = (num) => {
    const n = String(num).replace(/\D/g, '');
    if (!n) return '';
    return Number(n).toLocaleString('id-ID');
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, ''); // remove non-digits
    const numeric = raw ? Number(raw) : 0;
    onChange(numeric); // send clean number up
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', ...style }}>
      <span style={{
        position: 'absolute',
        left: 12,
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-muted)',
        pointerEvents: 'none',
        userSelect: 'none'
      }}>Rp</span>
      <input
        type="text"
        inputMode="numeric"
        className={className || 'form-control'}
        value={format(value)}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{ paddingLeft: 36, ...style }}
      />
    </div>
  );
}
