import React, { useState } from 'react'
import BottomSheet from '../ui/BottomSheet.jsx'
import { db } from '../../db/db.js'
import { todayDateString } from '../../utils/formatters.js'
import { useFormSheet } from '../../hooks/useFormSheet.js'

const FREQ_OPTIONS = [
  { value: 'monthly',   label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually',  label: 'Annually' },
]

const DEFAULT_FORM = {
  name: '',
  principal: '',
  openDate: '',
  maturityDate: '',
  interestRate: '',
  compoundingFrequency: 'quarterly',
  notes: '',
}

function getInitialForm(fd) {
  if (!fd) return { ...DEFAULT_FORM, openDate: todayDateString() }
  return {
    name: fd.name,
    principal: String(fd.principal),
    openDate: fd.openDate,
    maturityDate: fd.maturityDate,
    interestRate: String(fd.interestRate),
    compoundingFrequency: fd.compoundingFrequency,
    notes: fd.notes || '',
  }
}

export default function FDFormSheet({ open, onClose, fd, onSaved }) {
  const { form, setForm, errors, setErrors, set } = useFormSheet(open, fd, getInitialForm)
  const [saving, setSaving] = useState(false)
  const isEdit = !!fd

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Enter a name'
    if (!form.principal || isNaN(Number(form.principal)) || Number(form.principal) <= 0) e.principal = 'Enter a valid principal'
    if (!form.openDate) e.openDate = 'Enter open date'
    if (!form.maturityDate) e.maturityDate = 'Enter maturity date'
    if (form.openDate && form.maturityDate && form.maturityDate <= form.openDate) e.maturityDate = 'Maturity must be after open date'
    if (!form.interestRate || isNaN(Number(form.interestRate)) || Number(form.interestRate) <= 0) e.interestRate = 'Enter a valid rate'
    return e
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        principal: Number(form.principal),
        openDate: form.openDate,
        maturityDate: form.maturityDate,
        interestRate: Number(form.interestRate),
        compoundingFrequency: form.compoundingFrequency,
        notes: form.notes.trim(),
        isMatured: false,
      }
      if (isEdit) {
        await db.fdRecords.update(fd.id, payload)
      } else {
        await db.fdRecords.add({ uuid: crypto.randomUUID(), ...payload })
      }
      onSaved?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete FD "${fd.name}"? This cannot be undone.`)) return
    await db.fdRecords.delete(fd.id)
    onSaved?.()
    onClose()
  }

  const Field = ({ label, error, children }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )

  const inputClass = (key) => `w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition ${errors[key] ? 'border-red-300 bg-red-50' : 'border-slate-200'}`

  return (
    <BottomSheet open={open} onClose={onClose} title={isEdit ? 'Edit Fixed Deposit' : 'Add Fixed Deposit'}>
      <div className="px-5 pb-8 pt-3 space-y-4">

        <Field label="Name" error={errors.name}>
          <input type="text" placeholder="e.g. SBI FD 2024" value={form.name} onChange={set('name')} className={inputClass('name')} />
        </Field>

        <Field label="Principal Amount (₹)" error={errors.principal}>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
            <input
              type="number" inputMode="decimal" placeholder="0"
              value={form.principal} onChange={set('principal')}
              className={`w-full pl-9 pr-4 py-3 text-xl font-bold rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition ${errors.principal ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
            />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Open Date" error={errors.openDate}>
            <input type="date" value={form.openDate} onChange={set('openDate')} className={inputClass('openDate')} />
          </Field>
          <Field label="Maturity Date" error={errors.maturityDate}>
            <input type="date" value={form.maturityDate} onChange={set('maturityDate')} min={form.openDate} className={inputClass('maturityDate')} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Interest Rate (%)" error={errors.interestRate}>
            <div className="relative">
              <input
                type="number" inputMode="decimal" placeholder="7.5"
                value={form.interestRate} onChange={set('interestRate')}
                className={`w-full pr-8 pl-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition ${errors.interestRate ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">%</span>
            </div>
          </Field>
          <Field label="Compounding">
            <select value={form.compoundingFrequency} onChange={set('compoundingFrequency')} className={inputClass('compoundingFrequency')}>
              {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Notes (optional)">
          <input type="text" placeholder="Bank, branch, lock-in period…" value={form.notes} onChange={set('notes')} className={inputClass('notes')} />
        </Field>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-needs text-white font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add FD'}
        </button>

        {isEdit && (
          <button onClick={handleDelete}
            className="w-full py-3 rounded-2xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors">
            Remove FD
          </button>
        )}
      </div>
    </BottomSheet>
  )
}
