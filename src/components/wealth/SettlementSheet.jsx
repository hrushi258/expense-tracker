import React, { useState, useEffect } from 'react'
import BottomSheet from '../ui/BottomSheet.jsx'
import { db } from '../../db/db.js'
import { formatCurrency, todayDateString } from '../../utils/formatters.js'

export default function SettlementSheet({ open, onClose, card, outstanding, liquidAccounts, onSettled }) {
  const [sourceId, setSourceId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setSourceId(liquidAccounts[0]?.uuid || '')
      setError(null)
    }
  }, [open, liquidAccounts])

  if (!card) return null

  const sourceAccount = liquidAccounts.find(a => a.uuid === sourceId)

  const handleSettle = async () => {
    if (!sourceAccount) { setError('Select a source account'); return }
    if ((sourceAccount.balance || 0) < outstanding) {
      setError(`Insufficient balance in ${sourceAccount.name}`)
      return
    }
    setSaving(true)
    try {
      const now = Date.now()
      const today = todayDateString()
      await db.transaction('rw', db.creditCards, db.assetAccounts, db.assetSnapshots, async () => {
        await db.creditCards.update(card.id, { lastSettledAt: now })
        const newBal = (sourceAccount.balance || 0) - outstanding
        await db.assetAccounts.update(sourceAccount.id, { balance: newBal, updatedAt: now })
        await db.assetSnapshots.add({
          accountId: sourceAccount.uuid,
          snapshotDate: today,
          balance: newBal,
          delta: -outstanding,
          note: `Settlement: ${card.name}`,
          timestamp: now,
        })
      })
      onSettled?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Settle Credit Card Bill">
      <div className="px-5 pb-8 pt-3 space-y-4">

        <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: card.color || '#4F46E5' }}>
          <p className="text-xs opacity-75 mb-1 font-medium uppercase tracking-wide">Paying off</p>
          <p className="text-base font-bold">{card.name}</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(outstanding)}</p>
        </div>

        {outstanding === 0 ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-sm text-emerald-700 text-center font-medium">
            No outstanding balance on this card.
          </div>
        ) : (
          <>
            {liquidAccounts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Add a liquid account (salary/savings) to settle bills.
              </p>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Pay From</label>
                <select
                  value={sourceId}
                  onChange={e => { setSourceId(e.target.value); setError(null) }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition"
                >
                  {liquidAccounts.map(a => (
                    <option key={a.uuid} value={a.uuid}>
                      {a.icon} {a.name} — {formatCurrency(a.balance || 0)}
                    </option>
                  ))}
                </select>
                {sourceAccount && (
                  <p className="text-xs text-slate-400 mt-1.5">
                    After settlement: {formatCurrency((sourceAccount.balance || 0) - outstanding)}
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleSettle}
              disabled={saving || !sourceAccount || outstanding === 0}
              className="w-full py-3.5 rounded-2xl bg-needs text-white font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {saving ? 'Processing…' : `Settle ${formatCurrency(outstanding)}`}
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
