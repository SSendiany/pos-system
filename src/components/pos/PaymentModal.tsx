'use client'

import { useState } from 'react'
import { CreditCard, Banknote, CheckCircle } from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'

interface CompletedOrder {
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
  items: { name: string; price: number; quantity: number; subtotal: number }[]
}

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (order: CompletedOrder) => void
}

export function PaymentModal({ open, onClose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<'CASH' | 'CARD'>('CASH')
  const [amountPaid, setAmountPaid] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { items, discount, discountType } = useCartStore()
  const total = useCartStore((s) => s.total())
  const subtotal = useCartStore((s) => s.subtotal())
  const discountAmt = useCartStore((s) => s.discountAmount())
  const tax = useCartStore((s) => s.taxAmount())

  const paid = Number(amountPaid) || 0
  const change = method === 'CASH' ? Math.max(0, paid - total) : 0

  const quickAmounts = [
    Math.ceil(total),
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 20) * 20,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total)

  const handleConfirm = async () => {
    if (method === 'CASH' && paid < total) {
      setError('Amount paid must be at least the total')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          discount,
          discountType,
          paymentMethod: method,
          amountPaid: method === 'CASH' ? paid : total,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Payment failed')
      }
      const order = await res.json()
      onSuccess(order)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Checkout" size="md">
      <div className="space-y-5">
        {/* Order summary */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
          </div>
          {discountAmt > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span><span>-{formatCurrency(discountAmt)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-500">
            <span>Tax (8%)</span><span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span><span className="text-blue-600">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Payment Method</p>
          <div className="grid grid-cols-2 gap-3">
            {(['CASH', 'CARD'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 font-medium text-sm transition-all ${
                  method === m
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {m === 'CASH' ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                {m === 'CASH' ? 'Cash' : 'Card'}
              </button>
            ))}
          </div>
        </div>

        {/* Cash input */}
        {method === 'CASH' && (
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Amount Received</label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="Enter amount..."
              min={total}
              step="0.01"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 mt-2">
              {quickAmounts.slice(0, 4).map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmountPaid(amt.toString())}
                  className="flex-1 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>
            {paid >= total && (
              <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-bold text-green-800">Change: {formatCurrency(change)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (method === 'CASH' && paid < total)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-colors"
          >
            {loading ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
