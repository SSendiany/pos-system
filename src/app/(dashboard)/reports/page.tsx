'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/shared/Header'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { TrendingUp, ShoppingBag, DollarSign, CreditCard } from 'lucide-react'

interface ReportData {
  summary: {
    totalRevenue: number
    totalOrders: number
    avgOrderValue: number
    totalTax: number
    totalDiscount: number
  }
  dailySales: { date: string; revenue: number; orders: number }[]
  paymentBreakdown: {
    cash: { count: number; revenue: number }
    card: { count: number; revenue: number }
  }
  topProducts: { id: string; name: string; quantity: number; revenue: number }[]
}

const PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

const PIE_COLORS = ['#3b82f6', '#10b981']

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)

  const fetchReport = async (p: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?period=${p}`)
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport(period) }, [period])

  const chartData = data?.dailySales.map((d) => ({ ...d, label: formatDateShort(d.date) })) || []

  const pieData = data ? [
    { name: 'Cash', value: data.paymentBreakdown.cash.revenue },
    { name: 'Card', value: data.paymentBreakdown.card.revenue },
  ] : []

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Sales Reports"
        subtitle="Analyze your sales performance"
        actions={
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === p.value ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: formatCurrency(data.summary.totalRevenue), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Total Orders', value: data.summary.totalOrders, icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Avg Order Value', value: formatCurrency(data.summary.avgOrderValue), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Total Tax', value: formatCurrency(data.summary.totalTax), icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                    <p className="text-xl font-bold text-gray-900">{card.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sales Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Daily Revenue</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Methods</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx]} />
                        ))}
                      </Pie>
                      <Legend iconType="circle" iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {[
                      { label: 'Cash', data: data.paymentBreakdown.cash, color: 'bg-blue-500' },
                      { label: 'Card', data: data.paymentBreakdown.card, color: 'bg-emerald-500' },
                    ].map((pm) => (
                      <div key={pm.label} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${pm.color}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{pm.label}</p>
                          <p className="text-xs text-gray-400">{pm.data.count} orders</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(pm.data.revenue)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top products */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Top Products by Revenue</h3>
                <div className="space-y-3">
                  {data.topProducts.slice(0, 7).map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-bold text-gray-400">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.quantity} units sold</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(p.revenue)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
