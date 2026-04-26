import { useRef, useEffect } from 'react'

interface SearchBarProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({ id, value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative">
      <span className="material-symbols-outlined text-on-surface-variant text-[20px] absolute left-0 top-1/2 -translate-y-1/2">
        search
      </span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-0 border-b border-outline-variant pl-7 pr-7 py-2 text-on-surface focus:ring-0 focus:border-primary focus:outline-none transition-colors duration-300 placeholder:text-outline font-poppins text-body-md"
      />
      {value && (
        <button
          onClick={() => { onChange(''); inputRef.current?.focus() }}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors duration-300 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  )
}
