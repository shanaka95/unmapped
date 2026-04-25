import { type SelectHTMLAttributes } from 'react'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export default function SelectField({ label, id, error, options, placeholder, ...props }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-unit">
      <label
        className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <select
          className={`w-full appearance-none bg-transparent border-0 border-b px-0 py-2 pr-8 text-on-surface focus:ring-0 focus:outline-none transition-colors duration-300 cursor-pointer ${
            error ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'
          }`}
          id={id}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-0 top-2 pointer-events-none material-symbols-outlined text-on-surface-variant text-[20px]">
          expand_more
        </span>
      </div>
      {error && (
        <p className="font-poppins text-label-sm text-error">{error}</p>
      )}
    </div>
  )
}
