import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext, readBudget } from '../context/AppContext.jsx'
import { db } from '../db/db.js'
import { formatCurrency, monthToLabel } from '../utils/formatters.js'

export default function Settings() {
  const { settings, setSettings, monthConfig, setMonthConfig, selectedMonth, triggerRefresh, pillarList } = useAppContext()
  const navigate = useNavigate()
  const [apiKey, setApiKey] = useState(settings.apiKey || '')
  const [showKey, setShowKey] = useState(false)
  const [income, setIncome] = useState(String(monthConfig.income || ''))
  const [budgets, setBudgets] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setApiKey(settings.apiKey || '')
  }, [settings.apiKey])

  useEffect(() => {
    setIncome(String(monthConfig.income || ''))
    const b = {}
    pillarList.forEach(p => {
      b[p.key] = readBudget(monthConfig, p.key, p.defaultBudget ?? 0)
    })
    setBudgets(b)
  }, [monthConfig, pillarList])

  const budgetTotal = pillarList.reduce((s, p) => s + (Number(budgets[p.key]) || 0), 0)

  const handleSave = async () => {
    setSettings({ apiKey: apiKey.trim() })
    const budgetUpdates = {}
    pillarList.forEach(p => { budgetUpdates[`budget_${p.key}`] = Number(budgets[p.key]) || 0 })
    await setMonthConfig({ income: Number(income) || 0, ...budgetUpdates })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExportJSON = async () => {
    const [transactions, categories, monthConfigs] = await Promise.all([
      db.transactions.toArray(),
      db.categories.toArray(),
      db.monthConfig.toArray(),
    ])
    const blob = new Blob(
      [JSON.stringify({ transactions, categories, monthConfigs, exportedAt: new Date().toISOString() }, null, 2)],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = async () => {
    const [transactions, categories] = await Promise.all([
      db.transactions.toArray(),
      db.categories.toArray(),
    ])
    const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
    const header = 'Date,Description,Amount,Type,Pillar,Subcategory,CostType'
    const rows = transactions.map(t => [
      new Date(t.timestamp).toISOString().slice(0, 10),
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount, t.type, t.mainCategory || '',
      catMap[t.subCategoryId] ? `"${catMap[t.subCategoryId].name}"` : '',
      t.costType || '',
    ].join(','))
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.transactions) await db.transactions.bulkPut(data.transactions)
        if (data.categories)   await db.categories.bulkPut(data.categories)
        if (data.monthConfigs) await db.monthConfig.bulkPut(data.monthConfigs)
        triggerRefresh()
        alert(`Imported ${data.transactions?.length ?? 0} transactions successfully.`)
      } catch (err) {
        alert('Import failed: ' + err.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClearData = async () => {
    if (!window.confirm('This will delete ALL your transaction data permanently. This cannot be undone. Are you sure?')) return
    if (!window.confirm('Last chance — delete everything?')) return
    await db.transactions.clear()
    await db.monthConfig.clear()
    triggerRefresh()
    alert('All data cleared.')
  }

  return (
    <div className="pb-8 space-y-4 px-4 pt-4">

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mb-1">
        <button onClick={() => navigate('/history')}
          className="flex items-center gap-3 bg-white rounded-2xl shadow-card px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">
          <span className="text-xl">📈</span>
          <div>
            <p className="text-sm font-semibold text-slate-700">History</p>
            <p className="text-xs text-slate-400">Multi-month trends</p>
          </div>
        </button>
        <button onClick={() => navigate('/categories')}
          className="flex items-center gap-3 bg-white rounded-2xl shadow-card px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">
          <span className="text-xl">🏷️</span>
          <div>
            <p className="text-sm font-semibold text-slate-700">Categories</p>
            <p className="text-xs text-slate-400">Manage pillars & subcategories</p>
          </div>
        </button>
        <button onClick={() => navigate('/recurring')}
          className="col-span-2 flex items-center gap-3 bg-white rounded-2xl shadow-card px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">
          <span className="text-xl">🔄</span>
          <div>
            <p className="text-sm font-semibold text-slate-700">Recurring Transactions</p>
            <p className="text-xs text-slate-400">Auto-apply rent, salary, SIPs on a set date</p>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <span>Budget settings for:</span>
        <span className="text-slate-700 font-semibold">{monthToLabel(selectedMonth)}</span>
      </div>

      {/* Income */}
      <div className="bg-white rounded-2xl shadow-card p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span className="text-base">💵</span> Monthly Income
        </h3>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
          <input type="number" inputMode="decimal" value={income} onChange={e => setIncome(e.target.value)} placeholder="0"
            className="w-full pl-9 pr-4 py-3 text-xl font-bold rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition" />
        </div>
        <p className="text-xs text-slate-400 mt-2">Used to calculate budget targets and savings rate.</p>
      </div>

      {/* Budget Allocation */}
      <div className="bg-white rounded-2xl shadow-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span className="text-base">📊</span> Budget Allocation
          </h3>
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${budgetTotal === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {budgetTotal}% {budgetTotal === 100 ? '✓' : `(${100 - budgetTotal > 0 ? '+' : ''}${100 - budgetTotal} to go)`}
          </span>
        </div>
        <div className="space-y-4">
          {pillarList.map(p => (
            <div key={p.key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-600 flex items-center gap-1.5">
                  <span>{p.icon}</span>{p.label}
                </span>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={100}
                    value={budgets[p.key] ?? 0}
                    onChange={e => setBudgets(b => ({ ...b, [p.key]: Number(e.target.value) }))}
                    className="w-24 h-1.5 rounded-full"
                    style={{ accentColor: p.color }}
                  />
                  <span className="text-sm font-bold text-slate-700 w-8 text-right">{budgets[p.key] ?? 0}%</span>
                </div>
              </div>
              {Number(income) > 0 && (
                <p className="text-xs text-slate-400">
                  Target: {formatCurrency(Number(income) * ((budgets[p.key] ?? 0) / 100))} /month
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gemini API Key */}
      <div className="bg-white rounded-2xl shadow-card p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
          <span className="text-base">🤖</span> Gemini API Key
        </h3>
        <p className="text-xs text-slate-400 mb-3">Used only for text categorization. Your amounts are never sent.</p>
        <div className="relative">
          <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder="AIza…"
            className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition font-mono" />
          <button type="button" onClick={() => setShowKey(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
              {showKey
                ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
                : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
            </svg>
          </button>
        </div>
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
          className="text-xs text-needs underline mt-1.5 block">
          Get a free API key from Google AI Studio →
        </a>
      </div>

      {/* Save */}
      <button onClick={handleSave}
        className={`w-full py-3.5 rounded-2xl font-semibold text-base transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-needs text-white active:scale-[0.98]'}`}>
        {saved ? '✓ Saved' : 'Save Settings'}
      </button>

      {/* Export / Import */}
      <div className="bg-white rounded-2xl shadow-card p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span className="text-base">💾</span> Data Backup
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Export JSON (full backup)', fn: handleExportJSON },
            { label: 'Export CSV (spreadsheet)', fn: handleExportCSV },
          ].map(({ label, fn }) => (
            <button key={label} onClick={fn}
              className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors text-left px-4 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              {label}
            </button>
          ))}
          <label className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors text-left px-4 flex items-center gap-2 cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Import JSON backup
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
          <span>⚠️</span> Danger Zone
        </h3>
        <p className="text-xs text-red-400 mb-3">
          Browsers may clear local storage if device storage is low. Export a backup regularly.
        </p>
        <button onClick={handleClearData}
          className="w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
          Clear All Transaction Data
        </button>
      </div>
    </div>
  )
}
