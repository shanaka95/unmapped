import { useMemo } from 'react'

interface PaginationProps {
  total: number
  page: number
  perPage: number
  onPageChange: (page: number) => void
}

export default function Pagination({ total, page, perPage, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  const pages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const result: (number | '...')[] = [1]
    if (page > 3) result.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      result.push(i)
    }
    if (page < totalPages - 2) result.push('...')
    result.push(totalPages)
    return result
  }, [totalPages, page])

  if (total === 0) return null

  return (
    <div className="flex items-center justify-between py-3">
      <span className="font-poppins text-label-sm text-on-surface-variant uppercase tracking-wider">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-default text-on-surface-variant hover:bg-surface-container transition-colors duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} className="w-8 h-8 flex items-center justify-center font-poppins text-label-sm text-on-surface-variant">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-default font-poppins text-label-sm transition-colors duration-300 cursor-pointer ${
                p === page
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-default text-on-surface-variant hover:bg-surface-container transition-colors duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  )
}
