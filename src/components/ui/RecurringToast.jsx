import React, { useEffect } from 'react'

export default function RecurringToast({ count, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500)
    return () => clearTimeout(t)
  }, [onDismiss])

  if (!count) return null

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slideUp"
      style={{ animation: 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1) both' }}
    >
      <button
        onClick={onDismiss}
        className="flex items-center gap-2.5 bg-slate-800 text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-xl active:scale-95 transition-transform whitespace-nowrap"
      >
        <span className="text-base">🔁</span>
        <span>
          <span className="font-bold">{count}</span>
          {' '}recurring transaction{count > 1 ? 's' : ''} added
        </span>
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-slate-400 ml-1" stroke="currentColor" strokeWidth={2}>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
