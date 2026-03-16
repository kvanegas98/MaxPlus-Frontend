/**
 * PhoneField — input de teléfono con bandera, código de país y validación libphonenumber
 *
 * Uso con react-hook-form + Controller:
 *
 *   <Controller
 *     name="customerPhone"
 *     control={control}
 *     render={({ field }) => (
 *       <PhoneField
 *         label="Teléfono"
 *         value={field.value}
 *         onChange={field.onChange}
 *         error={errors.customerPhone?.message}
 *       />
 *     )}
 *   />
 *
 * Validación Zod compatible:
 *   import { isValidPhoneNumber } from 'react-phone-number-input';
 *   z.string().refine(v => !v || isValidPhoneNumber(v), 'Número inválido')
 */

import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './PhoneField.css';

export default function PhoneField({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder = '8888-0000',
  disabled = false,
  dark = false,
}) {
  const labelCls = dark
    ? 'text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4'
    : 'text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1';

  const wrapperCls = dark
    ? `phone-field-wrapper phone-field-dark ${error ? 'phone-field-error' : ''}`
    : `phone-field-wrapper ${error ? 'phone-field-error' : ''}`;

  const errorCls = dark
    ? 'text-[10px] text-red-400 font-black ml-4 uppercase'
    : 'text-xs text-red-500 mt-0.5';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className={labelCls}>
          {label}
          {required && !dark && <span className="text-red-500">*</span>}
        </label>
      )}

      <PhoneInput
        international
        countryCallingCodeEditable={false}
        defaultCountry="NI"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={wrapperCls}
      />

      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}
