import { type InputHTMLAttributes } from 'react'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function InputField({ label, id, ...props }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-unit">
      <label
        className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        className="w-full bg-transparent border-0 border-b border-outline-variant px-0 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline"
        id={id}
        {...props}
      />
    </div>
  )
}
