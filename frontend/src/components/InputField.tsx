import { type InputHTMLAttributes } from 'react'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export default function InputField({ label, id, error, ...props }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-unit">
      <label
        className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        className={`w-full bg-transparent border-0 border-b px-0 py-2 text-on-surface focus:ring-0 focus:outline-none transition-colors duration-300 placeholder:text-outline ${
          error ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'
        }`}
        id={id}
        {...props}
      />
      {error && (
        <p className="font-poppins text-label-sm text-error">{error}</p>
      )}
    </div>
  )
}
