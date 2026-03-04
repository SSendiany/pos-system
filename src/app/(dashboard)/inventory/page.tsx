'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/shared/Header'
import { Modal } from '@/components/shared/Modal'
import { Badge } from '@/components/shared/Badge'
import { useToast } from '@/components/shared/Toast'
import { Plus, Minus, History, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Product {
  id: string
  name: string
  stock: number
  minStock: number
  category?: { name: string } | null
}

interface StockLog {
  id: string
  type: string
  quantity: number
  previousStock: number
  newStock: number
  note?: string | null
  createdAt: string
  user: { name: string }
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [logs, setLogs] = useState<StockLog[]>([])
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const fetchProducts = async () => {
    const res = await fetch('/api/inventory')
    setProducts(await res.json())
  }

  useEffect(() => { fetchProducts() }, [])

  const fetchLogs = async (productId: string) => {
    const res = await fetch(`/api/inventory?productId=${productId}`)
    setLogs(await res.json())
  }

  const openAdjust = (product: Product, type: 'IN' | 'OUT' | 'ADJUSTMENT') => {
    setSelectedProduct(product)
    setAdjustType(type)
    setQuantity('')
    setNote('')
    setAdjustOpen(true)
  }

  const openHistory = async (product: Product) => {
    setSelectedProduct(product)
    await fetchLogs(product.id)
    setHistoryOpen(true)
  }

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    setLoading(true)
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: adjustType,
          quantity: Number(quantity),
          note,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      showToast('Stock adjusted successfully')
      setAdjustOpen(false)
      fetchProducts()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error', 'error')
    } finally {
      setLoading(false)
    }
  }

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Inventory"
        subtitle={`${products.length} products · ${lowStockCount} low stock`}
      />

      <div className="flex-1 overflow-auto p-6">
        {lowStockCount > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              {lowStockCount} product{lowStockCount > 1 ? 's' : ''} below minimum stock level
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Current Stock</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Min Stock</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => {
                const isLow = product.stock <= product.minStock
                return (
                  <tr key={product.id} className={`hover:bg-gray-50/50 transition-colors ${isLow ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3">
                      {product.category ? (
                        <Badge variant="info">{product.category.name}</Badge>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-lg font-bold ${product.stock === 0 ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{product.minStock}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={product.stock === 0 ? 'danger' : isLow ? 'warning' : 'success'}>
                        {product.stock === 0 ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openAdjust(product, 'IN')}
                          title="Add stock"
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium transition-colors"
                        >
                          <Plus className="w-3 h-3" />IN
                        </button>
                        <button
                          onClick={() => openAdjust(product, 'OUT')}
                          title="Remove stock"
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium transition-colors"
                        >
                          <Minus className="w-3 h-3" />OUT
                        </button>
                        <button
                          onClick={() => openHistory(product)}
                          title="Stock history"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      <Modal open={adjustOpen} onClose={() => setAdjustOpen(false)} title={`Stock Adjustment — ${selectedProduct?.name}`}>
        <form onSubmit={handleAdjust} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['IN', 'OUT', 'ADJUSTMENT'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAdjustType(t)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                    adjustType === t
                      ? t === 'IN' ? 'bg-green-600 text-white' : t === 'OUT' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t === 'IN' ? 'Stock In' : t === 'OUT' ? 'Stock Out' : 'Adjustment'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedProduct && (
              <p className="text-xs text-gray-400 mt-1">Current stock: {selectedProduct.stock}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note / Reason</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional note..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setAdjustOpen(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title={`Stock History — ${selectedProduct?.name}`} size="lg">
        <div className="max-h-96 overflow-y-auto scrollbar-thin space-y-2">
          {logs.length === 0 && <p className="text-center text-gray-400 py-8">No history yet</p>}
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
              <Badge variant={log.type === 'IN' ? 'success' : log.type === 'OUT' ? 'danger' : 'info'}>
                {log.type}
              </Badge>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {log.previousStock} → {log.newStock}
                  <span className={`ml-2 text-xs font-bold ${log.type === 'IN' ? 'text-green-600' : log.type === 'OUT' ? 'text-red-600' : 'text-blue-600'}`}>
                    {log.type === 'IN' ? `+${log.quantity}` : log.type === 'OUT' ? `-${log.quantity}` : `±${log.quantity}`}
                  </span>
                </p>
                {log.note && <p className="text-xs text-gray-500">{log.note}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{log.user.name}</p>
                <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
