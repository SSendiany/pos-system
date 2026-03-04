'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/shared/Header'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { RecentOrders } from '@/components/dashboard/RecentOrders'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface DashboardData {
  stats: {
    todayRevenue: number
    todayOrders: number
    totalProducts: number
    lowStockCount: number
  }
  chartData: { date: string; revenue: number; orders: number }[]
  recentOrders: {
    id: string
    orderNumber: string
    total: number
    paymentMethod: string
    status: string
    createdAt: string
    user: { name: string }
    items: { quantity: number }[]
  }[]
  lowStockProducts: {
    id: string
    name: string
    stock: number
    minStock: number
    category?: { name: string } | null
  }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening today."
        actions={
          <button onClick={fetchData} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        }
      />
      <div className="p-6 space-y-6">
        <StatsCards stats={data.stats} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <SalesChart data={data.chartData} />
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-semibold text-gray-900">Low Stock Alert</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {data.lowStockProducts.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">All stock levels are healthy</p>
              ) : (
                data.lowStockProducts.map((p) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 leading-tight">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category?.name || 'No category'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {p.stock}
                      </p>
                      <p className="text-xs text-gray-400">min: {p.minStock}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <RecentOrders orders={data.recentOrders} />
      </div>
    </div>
  )
}
