'use client'

import { TrendingUp, ShoppingBag, Package, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Stats {
  todayRevenue: number
  todayOrders: number
  totalProducts: number
  lowStockCount: number
}

export function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      icon: TrendingUp,
      color: 'bg-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders.toString(),
      icon: ShoppingBag,
      color: 'bg-green-500',
      bg: 'bg-green-50',
      text: 'text-green-700',
    },
    {
      title: 'Active Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'bg-purple-500',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStockCount.toString(),
      icon: AlertTriangle,
      color: stats.lowStockCount > 0 ? 'bg-red-500' : 'bg-gray-400',
      bg: stats.lowStockCount > 0 ? 'bg-red-50' : 'bg-gray-50',
      text: stats.lowStockCount > 0 ? 'text-red-700' : 'text-gray-700',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
            <card.icon className={`w-6 h-6 ${card.text}`} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
