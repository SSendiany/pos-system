'use client'

import { Minus, Plus, Trash2, ShoppingCart, Tag } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency, TAX_RATE } from '@/lib/utils'

interface CartProps {
  onCheckout: () => void
}

export function Cart({ onCheckout }: CartProps) {
  const { items, discount, discountType, updateQuantity, removeItem, setDiscount, clearCart } = useCartStore()
  const subtotal = useCartStore((s) => s.subtotal())
  const discountAmount = useCartStore((s) => s.discountAmount())
  const taxAmount = useCartStore((s) => s.taxAmount())
  const total = useCartStore((s) => s.total())

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Cart</h2>
          {items.length > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 font-bold">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 font-medium">
            Clear all
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <ShoppingCart className="w-12 h-12 mb-2" />
            <p className="text-sm text-center">Cart is empty<br />Click a product to add it</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((item) => (
              <div key={item.id} className="px-4 py-3 flex gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-tight truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(item.price)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-40 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="w-16 text-right text-sm font-bold text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discount */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-600">Discount</span>
          <div className="flex-1 flex items-center gap-2">
            <select
              value={discountType}
              onChange={(e) => setDiscount(discount, e.target.value as 'percent' | 'fixed')}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="percent">%</option>
              <option value="fixed">$</option>
            </select>
            <input
              type="number"
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value), discountType)}
              min="0"
              max={discountType === 'percent' ? '100' : undefined}
              placeholder="0"
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="px-4 py-3 border-t border-gray-200 space-y-1.5">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-500">
          <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
          <span>{formatCurrency(taxAmount)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200">
          <span>Total</span>
          <span className="text-blue-600">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Checkout button */}
      <div className="p-4">
        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors text-sm tracking-wide"
        >
          {items.length === 0 ? 'Add items to checkout' : `Checkout · ${formatCurrency(total)}`}
        </button>
      </div>
    </div>
  )
}
