import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES, type LanguageCode } from '../i18n'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleChange(code: LanguageCode) {
    i18n.changeLanguage(code)
    localStorage.setItem('language', code)
    setOpen(false)
  }

  const current = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="font-poppins text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-300 uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
      >
        <span className="material-symbols-outlined text-[18px]">language</span>
        <span className="hidden sm:inline">{current.name}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 min-w-[160px] py-1">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={`w-full text-left px-4 py-2.5 font-poppins text-body-md transition-colors duration-150 cursor-pointer hover:bg-surface-container ${
                lang.code === i18n.language
                  ? 'text-primary font-medium bg-surface-container'
                  : 'text-on-surface'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
