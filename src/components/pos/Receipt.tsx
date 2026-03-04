'use client'

import { Printer, X } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface OrderItem {
  name: string
  price: number
  quantity: number
  subtotal: number
}

interface Order {
  id: string
  orderNumber: string
  total: number
  subtotal: number
  tax: number
  discount: number
  amountPaid: number
  change: number
  paymentMethod: string
  createdAt: string
  user: { name: string }
  items: OrderItem[]
}

interface ReceiptProps {
  order: Order
  onClose: () => void
}

export function Receipt({ order, onClose }: ReceiptProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Receipt content */}
        <div id="receipt" className="p-6">
          {/* Store header */}
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-2">
              <span className="text-white font-black text-lg">POS</span>
            </div>
            <h2 className="font-bold text-gray-900 text-lg">POS System</h2>
            <p className="text-xs text-gray-500">123 Main Street, City</p>
            <p className="text-xs text-gray-500">Tel: (555) 123-4567</p>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Order: <span className="text-gray-800 font-medium">{order.orderNumber}</span></span>
            <span>Cashier: {order.user?.name}</span>
          </div>
          <p className="text-xs text-gray-500 mb-3">{formatDate(order.createdAt)}</p>

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Items */}
          <div className="space-y-2 mb-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 leading-tight">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>
                <span className="font-medium text-gray-900 ml-2">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Tax (8%)</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-200">
              <span>TOTAL</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between text-gray-500 pt-1">
              <span>Payment ({order.paymentMethod})</span>
              <span>{formatCurrency(order.amountPaid)}</span>
            </div>
            {order.change > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Change</span>
                <span>{formatCurrency(order.change)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-300 my-4" />
          <p className="text-center text-xs text-gray-400">Thank you for your purchase!</p>
          <p className="text-center text-xs text-gray-400">Please come again</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
