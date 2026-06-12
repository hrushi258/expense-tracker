import React, { useState, useEffect, useCallback } from 'react'
import BottomSheet from '../ui/BottomSheet.jsx'
import { useAppContext } from '../../context/AppContext.jsx'
import { db } from '../../db/db.js'
import { categorizeExpense } from '../../services/gemini.js'
import { todayDateString } from '../../utils/formatters.js'
import { useFormSheet } from '../../hooks/useFormSheet.js'
import CategoryPicker from './CategoryPicker.jsx'

const DEFAULT_FORM = {
  type: 'expense',
  amount: '',
  description: '',
  date: '',
  mainCategory: '',
  subCategoryId: null,
  costType: 'variable',
  paymentMethod: null,
}

function getInitialForm(prefill) {
  if (!prefill) return { ...DEFAULT_FORM, date: todayDateString() }
  return {
    type: prefill.type,
    amount: String(prefill.amount),
    description: prefill.description,
    date: new Date(prefill.timestamp).toISOString().slice(0, 10),
    mainCategory: prefill.mainCategory || '',
    subCategoryId: prefill.subCategoryId || null,
    costType: prefill.costType || 'variable',
    paymentMethod: prefill.paymentMethod || null,
  }
}

export default function AddTransactionSheet({ open, onClose, prefillTransaction }) {
  const { categories, pillarList, settings, triggerRefresh } = useAppContext()
  const { form, setForm, errors, setErrors, set } = useFormSheet(open, prefillTransaction, getInitialForm)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [aiConfidence, setAiConfidence] = useState(null)
  const [saving, setSaving] = useState(false)
  const [creditCards, setCreditCards] = useState([])

  useEffect(() => {
    if (open) {
      setAiError(null)
      setAiConfidence(null)
      db.creditCards.toArray().then(cards => setCreditCards(cards.filter(c => !c.isArchived)))
    }
  }, [open])

  const handleAutoTag = useCallback(async () => {
    if (!form.description.trim()) { setAiError('Enter a description first.'); return }
    setAiLoading(true)
    setAiError(null)
    setAiConfidence(null)
    try {
      const result = await categorizeExpense(form.description, settings.apiKey, categories)
      setForm(f => ({
        ...f,
        mainCategory: result.mainCategory || f.mainCategory,
        subCategoryId: result.subCategoryId || null,
        costType: result.costType || f.costType,
      }))
      setAiConfidence(result.confidence)
    } catch (err) {
      setAiError(err.message)
    } finally {
      setAiLoading(false)
    }
  }, [form.description, settings.apiKey, categories])

  const validate = () => {
    const e = {}
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Enter a valid amount'
    if (!form.description.trim()) e.description = 'Enter a description'
    if (form.type === 'expense' && !form.mainCategory) e.mainCategory = 'Select a category'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const d = new Date(form.date)
    const monthFromDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    setSaving(true)
    try {
      const payload = {
        uuid: crypto.randomUUID(),
        timestamp: d.getTime(),
        month: monthFromDate,
        description: form.description.trim(),
        amount: Number(form.amount),
        type: form.type,
        mainCategory: form.type === 'income' ? 'income' : form.mainCategory,
        subCategoryId: form.type === 'income' ? null : (form.subCategoryId ? Number(form.subCategoryId) : null),
        costType: form.type === 'income' ? 'variable' : form.costType,
        aiTagged: aiConfidence !== null,
        paymentMethod: form.type === 'expense' ? (form.paymentMethod || null) : null,
      }
      if (prefillTransaction?.id) {
        await db.transactions.update(prefillTransaction.id, payload)
      } else {
        await db.transactions.add(payload)
      }
      triggerRefresh()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={prefillTransaction ? 'Edit Transaction' : 'Add Transaction'}>
      <form onSubmit={handleSubmit} className="px-5 pb-6 pt-2 space-y-4">

        {/* Income / Expense toggle */}
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
          {['expense', 'income'].map(t => (
            <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                form.type === t
                  ? t === 'expense' ? 'bg-white text-red-500 shadow-sm' : 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-400'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-semibold">₹</span>
            <input
              type="number" inputMode="decimal" placeholder="0"
              value={form.amount} onChange={set('amount')}
              className={`w-full pl-9 pr-4 py-3 text-2xl font-bold rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition ${errors.amount ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
            />
          </div>
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>

        {/* Description + AI */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Description</label>
          <div className="flex gap-2">
            <input
              type="text" placeholder="e.g. Swiggy lunch order"
              value={form.description} onChange={set('description')}
              className={`flex-1 px-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition ${errors.description ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
            />
            {form.type === 'expense' && (
              <button type="button" onClick={handleAutoTag} disabled={aiLoading || !form.description.trim()}
                className="px-3 py-2.5 rounded-xl bg-needs text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap"
                title="Auto-categorize with AI (amounts are never sent)">
                {aiLoading
                  ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                  : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                }
                AI Tag
              </button>
            )}
          </div>
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          {aiError && (
            <p className="text-amber-600 text-xs mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
              {aiError}
            </p>
          )}
          {aiConfidence !== null && !aiError && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-500">
                AI confidence: {Math.round(aiConfidence * 100)}%
                <span className="ml-1 text-slate-400">(amounts were not sent)</span>
              </span>
            </div>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Date</label>
          <input type="date" value={form.date} onChange={set('date')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition" />
        </div>

        {/* Payment Method (expense + credit cards exist) */}
        {form.type === 'expense' && creditCards.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Payment Method</label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, paymentMethod: null }))}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  !form.paymentMethod ? 'bg-slate-700 border-slate-700 text-white' : 'border-slate-200 text-slate-500'
                }`}
              >
                Cash / Bank
              </button>
              {creditCards.map(card => (
                <button
                  key={card.uuid}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, paymentMethod: card.uuid }))}
                  className="px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={form.paymentMethod === card.uuid
                    ? { backgroundColor: card.color, borderColor: card.color, color: 'white' }
                    : { borderColor: '#e2e8f0', color: '#64748b' }}
                >
                  {card.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category (expense only) */}
        {form.type === 'expense' && (
          <CategoryPicker
            pillarList={pillarList}
            categories={categories}
            mainCategory={form.mainCategory}
            subCategoryId={form.subCategoryId}
            costType={form.costType}
            onPillarChange={key => {
              setForm(f => ({ ...f, mainCategory: key, subCategoryId: null }))
              setErrors(e => ({ ...e, mainCategory: undefined }))
            }}
            onSubCategoryChange={id => setForm(f => ({ ...f, subCategoryId: id }))}
            onCostTypeChange={type => setForm(f => ({ ...f, costType: type }))}
            mainCategoryError={errors.mainCategory}
          />
        )}

        <button type="submit" disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-needs text-white font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform mt-2">
          {saving ? 'Saving…' : prefillTransaction ? 'Save Changes' : 'Add Transaction'}
        </button>
      </form>
    </BottomSheet>
  )
}
