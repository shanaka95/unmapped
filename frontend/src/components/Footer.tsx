import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-transparent text-[11px] tracking-wider uppercase w-full border-t border-outline-variant flex justify-center items-center py-6 mt-auto text-neutral-400 dark:text-neutral-600">
      <span>{t('footer.copyright')}</span>
    </footer>
  )
}
