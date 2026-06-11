import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { db, seedDefaults, applyDueRecurring, DEFAULT_PILLARS, PILLAR_META } from '../db/db'
import { getCurrentMonth } from '../utils/formatters'

const AppContext = createContext(null)

const DEFAULT_MONTH_CONFIG = {
  income: 0,
  budget_needs: 50,
  budget_wants: 30,
  budget_savings: 10,
  budget_investments: 10,
}

// Read budget for a pillar — supports both old camelCase format and new budget_{key} format
const OLD_KEYS = { needs: 'budgetNeeds', wants: 'budgetWants', savings: 'budgetSavings', investments: 'budgetInvestments' }
export function readBudget(config, pillarKey, defaultVal = 0) {
  const newKey = `budget_${pillarKey}`
  if (config[newKey] != null) return config[newKey]
  const oldKey = OLD_KEYS[pillarKey]
  if (oldKey && config[oldKey] != null) return config[oldKey]
  return defaultVal
}

export function AppProvider({ children }) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth)
  const [categories, setCategories] = useState([])
  const [pillarList, setPillarList] = useState(DEFAULT_PILLARS)
  const [pillarMeta, setPillarMeta] = useState(PILLAR_META)
  const [monthConfig, setMonthConfigState] = useState(DEFAULT_MONTH_CONFIG)
  const [settings, setSettingsState] = useState({ apiKey: '' })
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isReady, setIsReady] = useState(false)

  const triggerRefresh = useCallback(() => setRefreshTrigger(t => t + 1), [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('et_settings')
      if (stored) setSettingsState(JSON.parse(stored))
    } catch {}
  }, [])

  const setSettings = useCallback((updates) => {
    setSettingsState(prev => {
      const next = { ...prev, ...updates }
      localStorage.setItem('et_settings', JSON.stringify(next))
      return next
    })
  }, [])

  useEffect(() => {
    seedDefaults()
      .then(() => applyDueRecurring())
      .then(() => Promise.all([
        db.categories.toArray(),
        db.pillars.toArray(),
      ]))
      .then(([cats, pillars]) => {
        const sorted = [...pillars].sort((a, b) => a.id - b.id)
        const meta = Object.fromEntries(sorted.map(p => [p.key, p]))
        setCategories(cats.filter(c => !c.isArchived))
        setPillarList(sorted)
        setPillarMeta(meta)
        setIsReady(true)
      })
      .catch(console.error)
  }, [refreshTrigger])

  useEffect(() => {
    db.monthConfig.get(selectedMonth).then(cfg => {
      setMonthConfigState(cfg ? { ...DEFAULT_MONTH_CONFIG, ...cfg } : { ...DEFAULT_MONTH_CONFIG, month: selectedMonth })
    })
  }, [selectedMonth, refreshTrigger])

  const setMonthConfig = useCallback(async (updates) => {
    const merged = { ...monthConfig, ...updates, month: selectedMonth }
    await db.monthConfig.put(merged)
    setMonthConfigState(merged)
  }, [monthConfig, selectedMonth])

  return (
    <AppContext.Provider value={{
      selectedMonth, setSelectedMonth,
      categories, triggerRefresh,
      pillarList, pillarMeta,
      monthConfig, setMonthConfig,
      settings, setSettings,
      isReady,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be inside AppProvider')
  return ctx
}
