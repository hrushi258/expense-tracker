import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { db, seedDefaultCategories } from '../db/db'
import { getCurrentMonth } from '../utils/formatters'

const AppContext = createContext(null)

const DEFAULT_MONTH_CONFIG = {
  income: 0,
  budgetNeeds: 50,
  budgetWants: 30,
  budgetSavings: 10,
  budgetInvestments: 10,
}

export function AppProvider({ children }) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth)
  const [categories, setCategories] = useState([])
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
    seedDefaultCategories()
      .then(() => db.categories.toArray())
      .then(cats => {
        setCategories(cats.filter(c => !c.isArchived))
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
