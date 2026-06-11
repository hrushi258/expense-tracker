import React from 'react'
import { useLocation } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'
import { useAppContext } from '../../context/AppContext.jsx'
import { monthToLabel, navigateMonth } from '../../utils/formatters.js'

const PAGE_TITLES = {
  '/': null, // dashboard shows its own header
  '/transactions': 'Transactions',
  '/history': 'History',
  '/categories': 'Categories',
  '/settings': 'Settings',
}

export default function AppShell({ children }) {
  const { selectedMonth, setSelectedMonth } = useAppContext()
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-lg mx-auto">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        {location.pathname === '/' ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-needs flex items-center justify-center text-white text-sm font-bold">
                ₹
              </div>
              <span className="font-semibold text-slate-800 text-base">Expense Tracker</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedMonth(m => navigateMonth(m, -1))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Previous month"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-slate-700 min-w-[120px] text-center">
                {monthToLabel(selectedMonth)}
              </span>
              <button
                onClick={() => setSelectedMonth(m => navigateMonth(m, 1))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Next month"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <h1 className="text-base font-semibold text-slate-800">{title}</h1>
        )}
      </header>

      <main className="flex-1 pb-24 overflow-y-auto">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
