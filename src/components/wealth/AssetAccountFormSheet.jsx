import React, { useState } from 'react'
import BottomSheet from '../ui/BottomSheet.jsx'
import { db } from '../../db/db.js'
import { useFormSheet } from '../../hooks/useFormSheet.js'

const ACCOUNT_TYPES = {
  liquid: [
    { value: 'salary',   label: 'Salary Account',  icon: '💼' },
    { value: 'savings',  label: 'Savings Account',  icon: '🏦' },
    { value: 'checking', label: 'Current Account',  icon: '🏛️' },
    { value: 'cash',     label: 'Cash in Hand',     icon: '💵' },
  ],
  growth: [
    { value: 'mutual_fund', label: 'Mutual Funds / SIP', icon: '📊' },
    { value: 'gold',        label: 'Gold',               icon: '🥇' },
    { value: 'ppf',         label: 'PPF / NPS',          icon: '📋' },
    { value: 'stocks',      label: 'Stocks / Equity',    icon: '📈' },
    { value: 'crypto',      label: 'Cryptocurrency',     icon: '₿' },
    { value: 'other',       label: 'Other Investment',   icon: '💰' },
  ],
  emergency: [
    { value: 'savings',   label: 'Savings Account',  icon: '🏦' },
    { value: 'liquid_fd', label: 'Liquid FD',         icon: '📑' },
  ],
}

const GROUP_COLORS = { liquid: '#4F46E5', growth: '#F59E0B', emergency: '#10B981' }

const DEFAULT_FORM = {
  name: '',
  accountGroup: 'liquid',
  accountType: 'salary',
  balance: '',
  notes: '',
}

function getInitialForm(account) {
  if (!account) return DEFAULT_FORM
  return {
    name: account.name,
    accountGroup: account.accountGroup,
    accountType: account.accountType,
    balance: String(account.balance || 0),
    notes: account.notes || '',
  }
}

export default function AssetAccountFormSheet({ open, onClose, account, onSaved }) {
  const { form, setForm, errors, setErrors, set } = useFormSheet(open, account, getInitialForm)
  const [saving, setSaving] = useState(false)
  const isEdit = !!account

  const typesForGroup = ACCOUNT_TYPES[form.accountGroup] || []
  const selectedType = typesForGroup.find(t => t.value === form.accountType) || typesForGroup[0]

  const handleGroupChange = (g) => {
    const types = ACCOUNT_TYPES[g] || []
    setForm(f => ({ ...f, accountGroup: g, accountType: types[0]?.value || '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Enter an account name'
    if (form.balance === '' || isNaN(Number(form.balance)) || Number(form.balance) < 0) e.balance = 'Enter a valid balance'
    return e
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    const icon = selectedType?.icon || '💰'
    const now = Date.now()
    try {
      if (isEdit) {
        await db.assetAccounts.update(account.id, {
          name: form.name.trim(),
          accountGroup: form.accountGroup,
          accountType: form.accountType,
          balance: Number(form.balance),
          notes: form.notes.trim(),
          icon,
          updatedAt: now,
        })
      } else {
        await db.assetAccounts.add({
          uuid: crypto.randomUUID(),
          name: form.name.trim(),
          accountGroup: form.accountGroup,
          accountType: form.accountType,
          balance: Number(form.balance),
          notes: form.notes.trim(),
          icon,
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        })
      }
      onSaved?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${account.name}"? This cannot be undone.`)) return
    await db.assetAccounts.update(account.id, { isArchived: true })
    onSaved?.()
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={isEdit ? 'Edit Account' : 'Add Account'}>
      <div className="px-5 pb-8 pt-3 space-y-4">

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Account Type</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'liquid',    label: 'Liquid',    icon: '💧' },
              { key: 'growth',    label: 'Growth',    icon: '📈' },
              { key: 'emergency', label: 'Emergency', icon: '🛡️' },
            ].map(g => (
              <button
                key={g.key}
                type="button"
                onClick={() => handleGroupChange(g.key)}
                className="py-2.5 rounded-xl border-2 text-sm font-semibold transition-all flex flex-col items-center gap-1"
                style={form.accountGroup === g.key
                  ? { backgroundColor: GROUP_COLORS[g.key], borderColor: GROUP_COLORS[g.key], color: 'white' }
                  : { borderColor: '#e2e8f0', color: '#64748b', backgroundColor: 'white' }}
              >
                <span className="text-base">{g.icon}</span>
                <span>{g.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Sub-type</label>
          <select
            value={form.accountType}
            onChange={set('accountType')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition"
          >
            {typesForGroup.map(t => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Name</label>
          <input
            type="text"
            placeholder="e.g. HDFC Savings, Zerodha MF"
            value={form.name}
            onChange={set('name')}
            className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
            {isEdit ? 'Current Balance (₹)' : 'Opening Balance (₹)'}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-semibold">₹</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={form.balance}
              onChange={set('balance')}
              className={`w-full pl-9 pr-4 py-3 text-2xl font-bold rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition ${errors.balance ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
            />
          </div>
          {errors.balance && <p className="text-red-500 text-xs mt-1">{errors.balance}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notes (optional)</label>
          <input
            type="text"
            placeholder="Bank name, branch, purpose…"
            value={form.notes}
            onChange={set('notes')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-needs text-white font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Account'}
        </button>

        {isEdit && (
          <button
            onClick={handleDelete}
            className="w-full py-3 rounded-2xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
          >
            Remove Account
          </button>
        )}
      </div>
    </BottomSheet>
  )
}
