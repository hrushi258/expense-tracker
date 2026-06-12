import React, { useState } from 'react'
import { PILLAR_META } from '../../db/db.js'
import { formatCurrency, formatShortDate } from '../../utils/formatters.js'
import { db } from '../../db/db.js'
import { useAppContext } from '../../context/AppContext.jsx'
import AddTransactionSheet from './AddTransactionSheet.jsx'
import { reverseTxnDelta } from '../../services/ledger.js'

export default function TransactionItem({ txn, categories }) {
  const { triggerRefresh } = useAppContext()
  const [editOpen, setEditOpen] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const category = categories.find(c => c.id === txn.subCategoryId)
  const meta = txn.type === 'income' ? null : PILLAR_META[txn.mainCategory]

  const handleDelete = async () => {
    if (window.confirm('Delete this transaction?')) {
      await reverseTxnDelta(txn)
      await db.transactions.delete(txn.id)
      triggerRefresh()
    }
  }

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-card active:bg-slate-50 transition-colors cursor-pointer"
        onClick={() => setShowActions(s => !s)}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={meta ? { backgroundColor: meta.light } : { backgroundColor: '#ECFDF5' }}
        >
          {category?.icon || (txn.type === 'income' ? '💵' : '💸')}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{txn.description}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400">{formatShortDate(txn.timestamp)}</span>
            {category && <span className="text-xs text-slate-400">· {category.name}</span>}
            {txn.type === 'expense' && (
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                txn.costType === 'fixed'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-orange-50 text-orange-600'
              }`}>
                {txn.costType}
              </span>
            )}
            {txn.recurringId && (
              <span className="text-xs px-1.5 py-0.5 rounded-md font-medium bg-violet-50 text-violet-500">
                🔁 recurring
              </span>
            )}
            {txn.paidVia?.startsWith('account:') && (
              <span className="text-xs px-1.5 py-0.5 rounded-md font-medium bg-indigo-50 text-indigo-500">🏦</span>
            )}
            {txn.paidVia?.startsWith('card:') && (
              <span className="text-xs px-1.5 py-0.5 rounded-md font-medium bg-slate-50 text-slate-500">💳</span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-bold ${txn.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
            {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
          </p>
          {meta && (
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-md"
              style={{ color: meta.color, backgroundColor: meta.light }}
            >
              {meta.label}
            </span>
          )}
        </div>
      </div>

      {/* Action row */}
      {showActions && (
        <div className="flex gap-2 mx-1 -mt-1 px-4 pb-2 pt-3 bg-white rounded-b-2xl border-t border-slate-50 shadow-card">
          <button
            onClick={() => { setShowActions(false); setEditOpen(true) }}
            className="flex-1 py-2 text-xs font-semibold text-needs bg-needs-light rounded-lg active:opacity-70 transition-opacity"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-2 text-xs font-semibold text-red-500 bg-red-50 rounded-lg active:opacity-70 transition-opacity"
          >
            Delete
          </button>
        </div>
      )}

      <AddTransactionSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        prefillTransaction={txn}
      />
    </>
  )
}
