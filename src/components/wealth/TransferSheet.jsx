import React, { useState } from 'react'
import BottomSheet from '../ui/BottomSheet.jsx'
import { db } from '../../db/db.js'
import { applyAccountDelta } from '../../services/ledger.js'
import { todayDateString } from '../../utils/formatters.js'
import { useFormSheet } from '../../hooks/useFormSheet.js'

const DEFAULT_FORM = {
  fromId: '',
  toId: '',
  amount: '',
  note: 'ATM Withdrawal',
  date: '',
}

function getInitialForm() {
  return { ...DEFAULT_FORM, date: todayDateString() }
}

export default function TransferSheet({ open, onClose, accounts, onSaved }) {
  // accounts: all non-archived liquid + emergency asset accounts
  const { form, setForm, errors, setErrors, set } = useFormSheet(open, null, getInitialForm)
  const [saving, setSaving] = useState(false)

  const fromAccount = accounts.find(a => a.uuid === form.fromId)
  const availableBalance = fromAccount?.balance || 0

  const validate = () => {
    const e = {}
    if (!form.fromId) e.fromId = 'Select source account'
    if (!form.toId) e.toId = 'Select destination account'
    if (form.fromId && form.toId && form.fromId === form.toId) e.toId = 'Source and destination must differ'
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Enter a valid amount'
    if (fromAccount && Number(form.amount) > availableBalance) e.amount = `Exceeds available balance (₹${availableBalance.toLocaleString('en-IN')})`
    return e
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    const amount = Number(form.amount)
    const toAccount = accounts.find(a => a.uuid === form.toId)
    const note = form.note.trim() || 'Transfer'
    try {
      await db.transfers.add({
        uuid: crypto.randomUUID(),
        fromAccountId: form.fromId,
        toAccountId: form.toId,
        amount,
        note,
        timestamp: new Date(form.date).getTime(),
        createdAt: Date.now(),
      })
      await applyAccountDelta({
        accountUuid: form.fromId,
        delta: -amount,
        date: form.date,
        note: `Transfer to ${toAccount?.name}: ${note}`,
      })
      await applyAccountDelta({
        accountUuid: form.toId,
        delta: +amount,
        date: form.date,
        note: `Transfer from ${fromAccount?.name}: ${note}`,
      })
      onSaved?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const inputClass = (key) =>
    `w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition ${errors[key] ? 'border-red-300 bg-red-50' : 'border-slate-200'}`

  return (
    <BottomSheet open={open} onClose={onClose} title="Transfer Funds">
      <div className="px-5 pb-8 pt-3 space-y-4">

        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3">
          <p className="text-xs text-indigo-700 font-medium leading-relaxed">
            Transfers move money between your accounts (e.g. ATM withdrawal: bank → cash). They do not appear as budget expenses.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">From</label>
          <select value={form.fromId} onChange={set('fromId')} className={inputClass('fromId')}>
            <option value="">— Select source account —</option>
            {accounts.map(a => (
              <option key={a.uuid} value={a.uuid}>
                {a.icon} {a.name}  (₹{(a.balance || 0).toLocaleString('en-IN')})
              </option>
            ))}
          </select>
          {errors.fromId && <p className="text-red-500 text-xs mt-1">{errors.fromId}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">To</label>
          <select value={form.toId} onChange={set('toId')} className={inputClass('toId')}>
            <option value="">— Select destination account —</option>
            {accounts.filter(a => a.uuid !== form.fromId).map(a => (
              <option key={a.uuid} value={a.uuid}>{a.icon} {a.name}</option>
            ))}
          </select>
          {errors.toId && <p className="text-red-500 text-xs mt-1">{errors.toId}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
            <input
              type="number" inputMode="decimal" placeholder="0"
              value={form.amount} onChange={set('amount')}
              className={`w-full pl-9 pr-4 py-3 text-xl font-bold rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition ${errors.amount ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
            />
          </div>
          {fromAccount && !errors.amount && (
            <p className="text-xs text-slate-400 mt-1">Available: ₹{availableBalance.toLocaleString('en-IN')}</p>
          )}
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Note</label>
          <input
            type="text" placeholder="ATM Withdrawal, Rent Paid, Transfer…"
            value={form.note} onChange={set('note')}
            className={inputClass('note')}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Date</label>
          <input type="date" value={form.date} onChange={set('date')} className={inputClass('date')} />
        </div>

        <button
          onClick={handleSave} disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-needs text-white font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {saving ? 'Transferring…' : 'Transfer Funds'}
        </button>
      </div>
    </BottomSheet>
  )
}
