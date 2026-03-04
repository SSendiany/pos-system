'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Header } from '@/components/shared/Header'
import { ProductForm } from '@/components/shared/ProductForm'
import { Badge } from '@/components/shared/Badge'
import { useToast } from '@/components/shared/Toast'
import { Plus, Search, Edit, ToggleLeft, ToggleRight, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  name: string
  description?: string | null
  price: number
  cost: number
  stock: number
  minStock: number
  barcode?: string | null
  image?: string | null
  isActive: boolean
  categoryId?: string | null
  category?: { id: string; name: string } | null
}

interface Category {
  id: string
  name: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  const fetchData = async () => {
    const [prodRes, catRes] = await Promise.all([
      fetch(`/api/products?search=${search}`),
      fetch('/api/categories'),
    ])
    const [prods, cats] = await Promise.all([prodRes.json(), catRes.json()])
    setProducts(prods)
    setCategories(cats)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [search])

  const toggleActive = async (product: Product) => {
    await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !product.isActive }),
    })
    showToast(`Product ${product.isActive ? 'deactivated' : 'activated'}`)
    fetchData()
  }

  const handleEdit = (product: Product) => {
    setEditProduct(product)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditProduct(null)
    setFormOpen(true)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Products"
        subtitle={`${products.length} products total`}
        actions={
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Search */}
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Price</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Cost</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Stock</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              )}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">No products found</p>
                  </td>
                </tr>
              )}
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        {product.barcode && <p className="text-xs text-gray-400">{product.barcode}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {product.category ? (
                      <Badge variant="info">{product.category.name}</Badge>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(product.cost)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${product.stock <= product.minStock ? 'text-red-600' : 'text-gray-900'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={product.isActive ? 'success' : 'default'}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(product)}
                        className={`p-1.5 rounded-lg transition-colors ${product.isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        title={product.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {product.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        product={editProduct}
        categories={categories}
        onSaved={fetchData}
      />
    </div>
  )
}
