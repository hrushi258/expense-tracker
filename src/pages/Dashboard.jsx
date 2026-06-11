import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext.jsx'
import { db } from '../db/db.js'
import SummaryCards from '../components/dashboard/SummaryCards.jsx'
import PillarBars from '../components/dashboard/PillarBars.jsx'
import SpendingDonut from '../components/dashboard/SpendingDonut.jsx'
import FixedVsVariable from '../components/dashboard/FixedVsVariable.jsx'
import TransactionItem from '../components/transactions/TransactionItem.jsx'
import { formatCurrency } from '../utils/formatters.js'

export default function Dashboard() {
  const { selectedMonth, monthConfig, categories, refreshTrigger } = useAppContext()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    db.transactions
      .where('month')
      .equals(selectedMonth)
      .toArray()
      .then(txns => setTransactions(txns.sort((a, b) => b.timestamp - a.timestamp)))
      .finally(() => setLoading(false))
  }, [selectedMonth, refreshTrigger])

  const income = monthConfig.income || 0
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const effectiveIncome = income > 0 ? income : totalIncome
  const balance = effectiveIncome - totalExpense

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="w-6 h-6 rounded-full border-2 border-needs border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* No income banner */}
      {income === 0 && totalIncome === 0 && (
        <div className="mx-4 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700 flex items-center gap-2">
          <span>💡</span>
          <span>Set your monthly income in <strong>Settings</strong> to see budget targets.</span>
        </div>
      )}

      <SummaryCards income={effectiveIncome} totalExpense={totalExpense} balance={balance} />
      <PillarBars transactions={transactions} monthConfig={monthConfig} />
      <SpendingDonut transactions={transactions} />
      <FixedVsVariable transactions={transactions} />

      {/* Recent transactions */}
      <div className="px-4 mt-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent</h2>
        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-slate-600 font-medium mb-1">No transactions yet</p>
            <p className="text-slate-400 text-sm">Tap <strong>+</strong> to add your first entry</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 5).map(txn => (
              <TransactionItem key={txn.id} txn={txn} categories={categories} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
