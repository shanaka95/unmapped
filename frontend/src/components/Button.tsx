import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: string
}

export default function Button({ children, ...props }: ButtonProps) {
  return (
    <button
      className="w-full bg-primary text-on-primary py-4 rounded-default font-poppins text-label-sm uppercase tracking-wider transition-opacity hover:opacity-80 cursor-pointer"
      {...props}
    >
      {children}
    </button>
  )
}
