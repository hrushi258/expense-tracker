import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppContext } from './context/AppContext.jsx'
import AppShell from './components/layout/AppShell.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Transactions from './pages/Transactions.jsx'
import History from './pages/History.jsx'
import Categories from './pages/Categories.jsx'
import Settings from './pages/Settings.jsx'
import Recurring from './pages/Recurring.jsx'

export default function App() {
  const { isReady } = useAppContext()

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-needs flex items-center justify-center text-white text-2xl font-bold shadow-md">
            ₹
          </div>
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/history" element={<History />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </HashRouter>
  )
}
