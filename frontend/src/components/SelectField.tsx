import { useState, useRef, useEffect, type KeyboardEvent } from 'react'

interface SelectFieldProps {
  label: string
  id: string
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export default function SelectField({ label, id, options, placeholder, error, value, onChange, required }: SelectFieldProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = options.find(o => o.value === value)
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(val: string) {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
      setSearch('')
    }
  }

  return (
    <div className="flex flex-col gap-unit" ref={ref}>
      <label
        className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => {
            setOpen(!open)
            setTimeout(() => inputRef.current?.focus(), 0)
          }}
          onKeyDown={handleKeyDown}
          className={`w-full text-left bg-transparent border-0 border-b px-0 py-2 pr-8 focus:ring-0 focus:outline-none transition-colors duration-300 cursor-pointer flex items-center justify-between ${
            error ? 'border-error' : open ? 'border-primary' : 'border-outline-variant'
          }`}
        >
          <span className={selected ? 'text-on-surface' : 'text-outline'}>
            {selected ? selected.label : placeholder || 'Select...'}
          </span>
          <span className={`material-symbols-outlined text-on-surface-variant text-[20px] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {open && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-outline-variant">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent border-0 px-0 py-1 text-body-md text-on-surface focus:ring-0 focus:outline-none placeholder:text-outline font-poppins"
              />
            </div>
            <ul ref={listRef} className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-on-surface-variant font-poppins text-body-md">
                  No results
                </li>
              ) : (
                filtered.map(opt => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left px-4 py-3 text-body-md font-poppins transition-colors duration-150 cursor-pointer hover:bg-surface-container ${
                        opt.value === value
                          ? 'text-primary font-medium bg-surface-container'
                          : 'text-on-surface'
                      }`}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      {error && (
        <p className="font-poppins text-label-sm text-error">{error}</p>
      )}
    </div>
  )
}
