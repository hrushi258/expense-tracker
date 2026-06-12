import React, { useState } from 'react'
import BottomSheet from '../ui/BottomSheet.jsx'
import { db } from '../../db/db.js'
import { useFormSheet } from '../../hooks/useFormSheet.js'

const CARD_COLORS = ['#4F46E5', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#64748B']

const DEFAULT_FORM = {
  name: '',
  limit: '',
  statementDay: '15',
  dueDay: '5',
  color: CARD_COLORS[0],
}

function getInitialForm(card) {
  if (!card) return DEFAULT_FORM
  return {
    name: card.name,
    limit: String(card.limit),
    statementDay: String(card.statementDay),
    dueDay: String(card.dueDay),
    color: card.color || CARD_COLORS[0],
  }
}

export default function CreditCardFormSheet({ open, onClose, card, onSaved }) {
  const { form, setForm, errors, setErrors, set } = useFormSheet(open, card, getInitialForm)
  const [saving, setSaving] = useState(false)
  const isEdit = !!card

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Enter a card name'
    if (!form.limit || isNaN(Number(form.limit)) || Number(form.limit) <= 0) e.limit = 'Enter a valid credit limit'
    const stDay = Number(form.statementDay)
    if (!stDay || stDay < 1 || stDay > 28) e.statementDay = 'Enter a day between 1–28'
    const dDay = Number(form.dueDay)
    if (!dDay || dDay < 1 || dDay > 28) e.dueDay = 'Enter a day between 1–28'
    return e
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        limit: Number(form.limit),
        statementDay: Number(form.statementDay),
        dueDay: Number(form.dueDay),
        color: form.color,
        isArchived: false,
      }
      if (isEdit) {
        await db.creditCards.update(card.id, payload)
      } else {
        await db.creditCards.add({ uuid: crypto.randomUUID(), lastSettledAt: null, ...payload })
      }
      onSaved?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Remove "${card.name}"?`)) return
    await db.creditCards.update(card.id, { isArchived: true })
    onSaved?.()
    onClose()
  }

  const inputClass = (key) => `w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition ${errors[key] ? 'border-red-300 bg-red-50' : 'border-slate-200'}`

  return (
    <BottomSheet open={open} onClose={onClose} title={isEdit ? 'Edit Card' : 'Add Credit Card'}>
      <div className="px-5 pb-8 pt-3 space-y-4">

        {/* Card preview */}
        <div className="rounded-2xl p-4 text-white flex items-end justify-between h-24 relative overflow-hidden"
          style={{ backgroundColor: form.color }}>
          <div className="absolute top-3 right-4 opacity-30 text-4xl font-bold select-none">▣</div>
          <div>
            <p className="text-base font-bold">{form.name || 'Card Name'}</p>
            <p className="text-xs opacity-75 mt-0.5">
              Statement: {form.statementDay || '—'} · Due: {form.dueDay || '—'} of month
            </p>
          </div>
          <p className="text-sm font-semibold opacity-90">
            ₹{Number(form.limit) > 0 ? (Number(form.limit) >= 100000 ? `${(Number(form.limit) / 100000).toFixed(1)}L` : Number(form.limit).toLocaleString('en-IN')) : '—'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Card Name</label>
          <input type="text" placeholder="e.g. HDFC Regalia, Axis ACE" value={form.name} onChange={set('name')} className={inputClass('name')} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Credit Limit (₹)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
            <input type="number" inputMode="decimal" placeholder="0" value={form.limit} onChange={set('limit')}
              className={`w-full pl-9 pr-4 py-3 text-xl font-bold rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition ${errors.limit ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
          </div>
          {errors.limit && <p className="text-red-500 text-xs mt-1">{errors.limit}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Statement Day</label>
            <input type="number" min={1} max={28} placeholder="15" value={form.statementDay} onChange={set('statementDay')} className={inputClass('statementDay')} />
            {errors.statementDay && <p className="text-red-500 text-xs mt-1">{errors.statementDay}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Due Day</label>
            <input type="number" min={1} max={28} placeholder="5" value={form.dueDay} onChange={set('dueDay')} className={inputClass('dueDay')} />
            {errors.dueDay && <p className="text-red-500 text-xs mt-1">{errors.dueDay}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Card Color</label>
          <div className="flex gap-2 flex-wrap">
            {CARD_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-needs text-white font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Card'}
        </button>

        {isEdit && (
          <button onClick={handleDelete}
            className="w-full py-3 rounded-2xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors">
            Remove Card
          </button>
        )}
      </div>
    </BottomSheet>
  )
}
