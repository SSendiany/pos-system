'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/shared/Badge'

interface Order {
  id: string
  orderNumber: string
  total: number
  paymentMethod: string
  status: string
  createdAt: string
  user: { name: string }
  items: { quantity: number }[]
}

export function RecentOrders({ orders }: { orders: Order[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">Recent Orders</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {orders.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">No orders yet</p>
        )}
        {orders.map((order) => (
          <div key={order.id} className="px-5 py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
              <p className="text-xs text-gray-400">
                {formatDate(order.createdAt)} · {order.user.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</p>
              <p className="text-xs text-gray-400">{order.items.reduce((s, i) => s + i.quantity, 0)} items</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={order.status === 'COMPLETED' ? 'success' : 'danger'}>
                {order.status}
              </Badge>
              <Badge variant="info">{order.paymentMethod}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
