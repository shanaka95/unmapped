export default function Footer() {
  return (
    <footer className="bg-transparent text-[11px] tracking-wider uppercase fixed bottom-0 w-full border-none flex justify-center items-center gap-8 pb-12 text-neutral-400 dark:text-neutral-600">
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
