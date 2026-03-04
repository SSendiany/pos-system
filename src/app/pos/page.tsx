'use client'

import { useEffect, useState } from 'react'
import { ProductGrid } from '@/components/pos/ProductGrid'
import { Cart } from '@/components/pos/Cart'
import { PaymentModal } from '@/components/pos/PaymentModal'
import { Receipt } from '@/components/pos/Receipt'
import { useCartStore } from '@/store/cartStore'
import { useToast } from '@/components/shared/Toast'
import { Store } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  image?: string | null
  categoryId?: string | null
  category?: { id: string; name: string } | null
}

interface Category {
  id: string
  name: string
}

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

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const clearCart = useCartStore((s) => s.clearCart)
  const { showToast } = useToast()
  const { data: session } = useSession()

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products?activeOnly=true'),
        fetch('/api/categories'),
      ])
      const [prods, cats] = await Promise.all([prodRes.json(), catRes.json()])
      setProducts(prods)
      setCategories(cats)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handlePaymentSuccess = (order: CompletedOrder) => {
    setShowPayment(false)
    setCompletedOrder(order)
    clearCart()
    showToast('Order completed successfully!')
    fetchData() // refresh stock
  }

  const handleReceiptClose = () => {
    setCompletedOrder(null)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading POS...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left: product grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* POS Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">POS Terminal</p>
              <p className="text-xs text-gray-400">{session?.user?.name}</p>
            </div>
          </div>
          {session?.user?.role === 'ADMIN' && (
            <a href="/dashboard" className="text-xs text-gray-400 hover:text-white border border-gray-600 px-3 py-1.5 rounded-lg">
              Dashboard
            </a>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs text-gray-400 hover:text-white"
          >
            Sign out
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-white">
          <ProductGrid products={products} categories={categories} />
        </div>
      </div>

      {/* Right: cart panel */}
      <div className="w-80 xl:w-96 border-l border-gray-200 flex flex-col bg-white shadow-xl">
        <Cart onCheckout={() => setShowPayment(true)} />
      </div>

      {/* Payment modal */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Receipt */}
      {completedOrder && (
        <Receipt order={completedOrder} onClose={handleReceiptClose} />
      )}
    </div>
  )
}
