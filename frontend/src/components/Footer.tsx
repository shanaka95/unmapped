import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-transparent text-[11px] tracking-wider uppercase w-full border-t border-outline-variant flex justify-center items-center gap-8 py-6 mt-auto text-neutral-400 dark:text-neutral-600">
      <span>{t('footer.copyright')}</span>
      <a
        className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors duration-300 cursor-pointer"
        href="#"
      >
        {t('footer.terms')}
      </a>
      <a
        className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors duration-300 cursor-pointer"
        href="#"
      >
        {t('footer.privacy')}
      </a>
      <a
        className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors duration-300 cursor-pointer"
        href="#"
      >
        {t('footer.help')}
      </a>
    </footer>
  )
}
