'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { useToast } from '@/components/shared/Toast'

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  image?: string | null
  category?: Category | null
  categoryId?: string | null
}

export function ProductGrid({
  products,
  categories,
}: {
  products: Product[]
  categories: Category[]
}) {
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const addItem = useCartStore((s) => s.addItem)
  const { showToast } = useToast()

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = selectedCat === 'all' || p.categoryId === selectedCat
    return matchSearch && matchCat
  })

  const handleAdd = (product: Product) => {
    if (product.stock === 0) {
      showToast('Out of stock', 'warning')
      return
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock,
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or scan barcode..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 py-3 border-b border-gray-200 bg-white overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            selectedCat === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCat === c.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Products grid */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Package className="w-12 h-12 mb-2" />
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((product) => (
              <button
                key={product.id}
                onClick={() => handleAdd(product)}
                disabled={product.stock === 0}
                className={`group bg-white rounded-xl border-2 p-3 text-left transition-all hover:shadow-md ${
                  product.stock === 0
                    ? 'border-gray-200 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-blue-400 cursor-pointer'
                }`}
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2 mb-1">
                  {product.name}
                </p>
                <p className="text-sm font-bold text-blue-600">{formatCurrency(product.price)}</p>
                <p className={`text-xs mt-0.5 ${product.stock <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                  Stock: {product.stock}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
