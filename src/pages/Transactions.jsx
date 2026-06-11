import React, { useState, useEffect, useMemo } from 'react'
import { useAppContext } from '../context/AppContext.jsx'
import { db, PILLAR_META, PILLARS } from '../db/db.js'
import TransactionItem from '../components/transactions/TransactionItem.jsx'
import { formatCurrency, monthToLabel } from '../utils/formatters.js'

const ALL = 'all'

export default function Transactions() {
  const { selectedMonth, setSelectedMonth, categories, refreshTrigger } = useAppContext()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPillar, setFilterPillar] = useState(ALL)
  const [filterType, setFilterType] = useState(ALL)

  useEffect(() => {
    setLoading(true)
    db.transactions
      .where('month')
      .equals(selectedMonth)
      .toArray()
      .then(txns => setTransactions(txns.sort((a, b) => b.timestamp - a.timestamp)))
      .finally(() => setLoading(false))
  }, [selectedMonth, refreshTrigger])

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== ALL && t.type !== filterType) return false
      if (filterPillar !== ALL && t.mainCategory !== filterPillar) return false
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [transactions, filterPillar, filterType, search])

  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="pb-4">
      <div className="px-4 pt-4 space-y-3">
        {/* Month selector */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Showing:</span>
          <span className="text-slate-700 font-semibold">{monthToLabel(selectedMonth)}</span>
          <span className="text-slate-300">·</span>
          <span>{transactions.length} entries</span>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search transactions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition"
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {[
            { key: ALL, label: 'All' },
            { key: 'expense', label: 'Expense' },
            { key: 'income', label: 'Income' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filterType === f.key
                  ? 'bg-needs text-white border-needs'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="w-px bg-slate-200 flex-shrink-0" />
          {PILLARS.map(p => (
            <button
              key={p}
              onClick={() => setFilterPillar(fp => fp === p ? ALL : p)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all`}
              style={filterPillar === p
                ? { backgroundColor: PILLAR_META[p].color, color: 'white', borderColor: PILLAR_META[p].color }
                : { backgroundColor: 'white', color: '#64748b', borderColor: '#e2e8f0' }}
            >
              {PILLAR_META[p].label}
            </button>
          ))}
        </div>

        {/* Summary strip */}
        {(totalExpense > 0 || totalIncome > 0) && (
          <div className="flex gap-3">
            {totalExpense > 0 && (
              <div className="flex-1 bg-red-50 rounded-xl px-3 py-2">
                <p className="text-xs text-red-400 font-medium">Expenses</p>
                <p className="text-sm font-bold text-red-600">{formatCurrency(totalExpense)}</p>
              </div>
            )}
            {totalIncome > 0 && (
              <div className="flex-1 bg-emerald-50 rounded-xl px-3 py-2">
                <p className="text-xs text-emerald-500 font-medium">Income</p>
                <p className="text-sm font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction list */}
      <div className="px-4 mt-3 space-y-2">
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 rounded-full border-2 border-needs border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-slate-400 text-sm">No transactions match your filters</p>
          </div>
        ) : (
          filtered.map(txn => (
            <TransactionItem key={txn.id} txn={txn} categories={categories} />
          ))
        )}
      </div>
    </div>
  )
}
