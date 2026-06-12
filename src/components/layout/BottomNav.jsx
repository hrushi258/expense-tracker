import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import AddTransactionSheet from '../transactions/AddTransactionSheet.jsx'

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/transactions',
    label: 'Transactions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={2}>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4" />
      </svg>
    ),
  },
  null, // center FAB
  {
    to: '/wealth',
    label: 'Wealth',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={2}>
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="14 7 21 7 21 14" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const [addOpen, setAddOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 safe-bottom z-40">
        <div className="flex items-end justify-around max-w-lg mx-auto px-2">
          {navItems.map((item, i) => {
            if (!item) {
              return (
                <div key="fab" className="flex-1 flex justify-center">
                  <button
                    onClick={() => setAddOpen(true)}
                    className="relative -top-5 w-14 h-14 rounded-full bg-needs shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform"
                    aria-label="Add transaction"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              )
            }

            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-needs' : 'text-slate-400'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      <AddTransactionSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  )
}
