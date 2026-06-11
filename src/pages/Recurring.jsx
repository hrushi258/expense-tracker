import React, { useState, useEffect, useCallback } from 'react'
import BottomSheet from '../components/ui/BottomSheet.jsx'
import { useAppContext } from '../context/AppContext.jsx'
import { db } from '../db/db.js'
import { formatCurrency, getCurrentMonth } from '../utils/formatters.js'

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

const EMPTY_FORM = {
  description: '',
  amount: '',
  type: 'expense',
  dayOfMonth: 1,
  startMonth: getCurrentMonth(),
  endMonth: '',
  mainCategory: '',
  subCategoryId: null,
  costType: 'fixed',
}

export default function Recurring() {
  const { categories, pillarList, triggerRefresh } = useAppContext()
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const pillarMap = Object.fromEntries(pillarList.map(p => [p.key, p]))

  const load = useCallback(async () => {
    setLoading(true)
    const all = await db.recurringTransactions.toArray()
    setRules(all.sort((a, b) => a.id - b.id))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openAdd = () => {
    setEditingRule(null)
    setForm({ ...EMPTY_FORM, startMonth: getCurrentMonth() })
    setErrors({})
    setSheetOpen(true)
  }

  const openEdit = (rule) => {
    setEditingRule(rule)
    setForm({
      description: rule.description,
      amount: String(rule.amount),
      type: rule.type,
      dayOfMonth: rule.dayOfMonth,
      startMonth: rule.startMonth,
      endMonth: rule.endMonth || '',
      mainCategory: rule.mainCategory || '',
      subCategoryId: rule.subCategoryId || null,
      costType: rule.costType || 'fixed',
    })
    setErrors({})
    setSheetOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.description.trim()) e.description = 'Required'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter a valid amount'
    if (form.type === 'expense' && !form.mainCategory) e.mainCategory = 'Select a pillar'
    return e
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const payload = {
        uuid: editingRule?.uuid || crypto.randomUUID(),
        description: form.description.trim(),
        amount: Number(form.amount),
        type: form.type,
        dayOfMonth: form.dayOfMonth,
        startMonth: form.startMonth || getCurrentMonth(),
        endMonth: form.endMonth || null,
        mainCategory: form.type === 'expense' ? form.mainCategory : 'income',
        subCategoryId: form.type === 'expense' && form.subCategoryId ? Number(form.subCategoryId) : null,
        costType: form.type === 'expense' ? form.costType : 'variable',
        isActive: editingRule ? editingRule.isActive : true,
      }
      if (editingRule) {
        await db.recurringTransactions.update(editingRule.id, payload)
      } else {
        await db.recurringTransactions.add(payload)
      }
      setSheetOpen(false)
      triggerRefresh()
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (rule) => {
    await db.recurringTransactions.update(rule.id, { isActive: !rule.isActive })
    triggerRefresh()
    await load()
  }

  const handleDelete = async (rule) => {
    if (!window.confirm(`Delete "${rule.description}"? Transactions already applied are kept.`)) return
    await db.recurringTransactions.delete(rule.id)
    await load()
  }

  const subCategories = categories.filter(c => c.pillar === form.mainCategory)
  const currentMonth = getCurrentMonth()

  return (
    <div className="pb-4 px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Recurring</h1>
          <p className="text-xs text-slate-400 mt-0.5">Auto-applied on the specified date each month</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 bg-needs text-white text-sm font-semibold px-4 py-2 rounded-xl active:scale-95 transition-transform">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center pt-12">
          <div className="w-6 h-6 rounded-full border-2 border-needs border-t-transparent animate-spin" />
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-10 text-center">
          <p className="text-4xl mb-3">🔄</p>
          <p className="text-slate-600 font-medium mb-1">No recurring rules</p>
          <p className="text-slate-400 text-sm">Set up rent, salary, SIP — anything that repeats</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => {
            const pillar = rule.type === 'income' ? null : pillarMap[rule.mainCategory]
            const subcat = categories.find(c => c.id === rule.subCategoryId)
            return (
              <div key={rule.id} className={`bg-white rounded-2xl shadow-card p-4 ${!rule.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: rule.type === 'income' ? '#ECFDF5' : (pillar?.lightColor || '#F1F5F9') }}>
                    {subcat?.icon || (rule.type === 'income' ? '💵' : (pillar?.icon || '💸'))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{rule.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-xs font-bold ${rule.type === 'income' ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {rule.type === 'income' ? '+' : '-'}{formatCurrency(rule.amount)}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 flex-shrink-0" stroke="currentColor" strokeWidth={2}>
                          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        {ordinal(rule.dayOfMonth)} of every month
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {pillar && (
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${pillar.color}18`, color: pillar.color }}>
                          {pillar.icon} {pillar.label}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">from {rule.startMonth}</span>
                      {rule.endMonth && <span className="text-[11px] text-slate-400">until {rule.endMonth}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(rule)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-needs hover:bg-indigo-50 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(rule)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <span className="text-xs text-slate-400">
                    {rule.isActive ? 'Active — applied automatically' : 'Paused'}
                  </span>
                  <button onClick={() => handleToggle(rule)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rule.isActive ? 'bg-needs' : 'bg-slate-200'}`}>
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${rule.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}
        title={editingRule ? 'Edit Recurring' : 'New Recurring Rule'}>
        <div className="px-5 pb-8 pt-2 space-y-4">

          {/* Type */}
          <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
            {['expense', 'income'].map(t => (
              <button key={t} type="button"
                onClick={() => setForm(f => ({ ...f, type: t, mainCategory: '', subCategoryId: null }))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                  form.type === t
                    ? t === 'expense' ? 'bg-white text-red-500 shadow-sm' : 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-400'
                }`}>
                {t}
              </button>
            ))}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Description</label>
            <input type="text" placeholder="e.g. Rent, Salary, SIP"
              value={form.description}
              onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(v => ({ ...v, description: undefined })) }}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition ${errors.description ? 'border-red-300' : 'border-slate-200'}`} />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-semibold">₹</span>
              <input type="number" inputMode="decimal" placeholder="0"
                value={form.amount}
                onChange={e => { setForm(f => ({ ...f, amount: e.target.value })); setErrors(v => ({ ...v, amount: undefined })) }}
                className={`w-full pl-9 pr-4 py-3 text-2xl font-bold rounded-xl border bg-slate-50 outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition ${errors.amount ? 'border-red-300' : 'border-slate-200'}`} />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Day of month picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              Day of Month — <span className="text-needs normal-case font-bold">{ordinal(form.dayOfMonth)}</span>
            </label>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <button key={d} type="button"
                  onClick={() => setForm(f => ({ ...f, dayOfMonth: d }))}
                  className={`aspect-square rounded-lg text-xs font-semibold transition-all ${
                    form.dayOfMonth === d
                      ? 'bg-needs text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {d}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">If the month has fewer days, the last day is used.</p>
          </div>

          {/* Start / End month */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Starts</label>
              <input type="month" value={form.startMonth}
                onChange={e => setForm(f => ({ ...f, startMonth: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition" />
              {form.startMonth < currentMonth && (
                <p className="text-amber-600 text-xs mt-1">Past months will be back-filled.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Ends (opt.)</label>
              <input type="month" value={form.endMonth}
                onChange={e => setForm(f => ({ ...f, endMonth: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition" />
            </div>
          </div>

          {/* Pillar + subcategory (expense only) */}
          {form.type === 'expense' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Pillar</label>
                <div className="grid grid-cols-2 gap-2">
                  {pillarList.map(p => (
                    <button key={p.key} type="button"
                      onClick={() => { setForm(f => ({ ...f, mainCategory: p.key, subCategoryId: null })); setErrors(v => ({ ...v, mainCategory: undefined })) }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
                      style={form.mainCategory === p.key
                        ? { backgroundColor: p.color, borderColor: p.color, color: 'white' }
                        : { borderColor: '#e2e8f0', color: '#64748b', backgroundColor: 'white' }}>
                      <span className="text-base">{p.icon}</span>{p.label}
                    </button>
                  ))}
                </div>
                {errors.mainCategory && <p className="text-red-500 text-xs mt-1">{errors.mainCategory}</p>}
              </div>

              {form.mainCategory && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Subcategory</label>
                  <select value={form.subCategoryId || ''}
                    onChange={e => setForm(f => ({ ...f, subCategoryId: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition">
                    <option value="">— None —</option>
                    {subCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Cost Behavior</label>
                <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
                  {['fixed', 'variable'].map(ct => (
                    <button key={ct} type="button"
                      onClick={() => setForm(f => ({ ...f, costType: ct }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${form.costType === ct ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}>
                      {ct}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button type="button" disabled={saving} onClick={handleSave}
            className="w-full py-3.5 rounded-2xl bg-needs text-white font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-transform mt-2">
            {saving ? 'Saving…' : editingRule ? 'Save Changes' : 'Create Rule'}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
