import React from 'react'
import { formatCurrency } from '../../utils/formatters.js'

export default function SummaryCards({ income, totalExpense, balance }) {
  const savingsRate = income > 0 ? Math.round(((income - totalExpense) / income) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-3 px-4 pt-4">
      {/* Income */}
      <div className="col-span-2 bg-gradient-to-br from-needs to-indigo-700 rounded-2xl p-4 text-white shadow-md">
        <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wide mb-1">Monthly Income</p>
        <p className="text-3xl font-bold">{formatCurrency(income)}</p>
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-indigo-200 text-xs">Spent</p>
            <p className="text-base font-semibold">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-xs">Balance</p>
            <p className={`text-base font-semibold ${balance < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-xs">Saved</p>
            <p className={`text-base font-semibold ${savingsRate < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
              {savingsRate}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
