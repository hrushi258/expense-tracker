import React, { useState, useEffect } from 'react'
import BottomSheet from '../ui/BottomSheet.jsx'
import { db } from '../../db/db.js'
import { formatCurrency, todayDateString } from '../../utils/formatters.js'

export default function SnapshotUpdateSheet({ open, onClose, account, onUpdated }) {
  const [newBalance, setNewBalance] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open && account) {
      setNewBalance(String(account.balance || 0))
      setNote('')
      setError(null)
    }
  }, [open, account])

  if (!account) return null

  const parsed = Number(newBalance)
  const delta = isNaN(parsed) ? 0 : parsed - (account.balance || 0)
  const hasChange = !isNaN(parsed) && parsed !== (account.balance || 0)

  const handleSave = async () => {
    if (isNaN(parsed) || parsed < 0) { setError('Enter a valid balance'); return }
    setSaving(true)
    try {
      const today = todayDateString()
      await db.transaction('rw', db.assetAccounts, db.assetSnapshots, async () => {
        await db.assetAccounts.update(account.id, { balance: parsed, updatedAt: Date.now() })
        await db.assetSnapshots.add({
          accountId: account.uuid,
          snapshotDate: today,
          balance: parsed,
          delta,
          note: note.trim(),
          timestamp: Date.now(),
        })
      })
      onUpdated?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Update Balance">
      <div className="px-5 pb-8 pt-3 space-y-4">
        <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Account</p>
            <p className="text-base font-semibold text-slate-800 mt-0.5">{account.icon} {account.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Current</p>
            <p className="text-base font-semibold text-slate-700 mt-0.5">{formatCurrency(account.balance || 0)}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">New Balance (₹)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-semibold">₹</span>
            <input
              type="number"
              inputMode="decimal"
              value={newBalance}
              onChange={e => { setNewBalance(e.target.value); setError(null) }}
              className={`w-full pl-9 pr-4 py-3 text-2xl font-bold rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
            />
          </div>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        {hasChange && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${delta > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            <span>{delta > 0 ? '↑' : '↓'}</span>
            <span>Balance {delta > 0 ? 'increased' : 'decreased'} by {formatCurrency(Math.abs(delta))}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Note (optional)</label>
          <input
            type="text"
            placeholder="e.g. Payday deposit, MF NAV update"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || isNaN(parsed) || parsed < 0}
          className="w-full py-3.5 rounded-2xl bg-needs text-white font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {saving ? 'Saving…' : 'Update Balance'}
        </button>
      </div>
    </BottomSheet>
  )
}
