export default function Footer() {
  return (
    <footer className="bg-transparent text-[11px] tracking-wider uppercase w-full border-t border-outline-variant flex justify-center items-center gap-8 py-6 mt-auto text-neutral-400 dark:text-neutral-600">
      <span>&copy; 2026 UNMAPPED</span>
      <a
        className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors duration-300 cursor-pointer"
        href="#"
      >
        Terms
      </a>
      <a
        className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors duration-300 cursor-pointer"
        href="#"
      >
        Privacy
      </a>
      <a
        className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors duration-300 cursor-pointer"
        href="#"
      >
        Help
      </a>
    </footer>
  )
}
