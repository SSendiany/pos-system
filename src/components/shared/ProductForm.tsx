'use client'

import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { useToast } from './Toast'

interface Category {
  id: string
  name: string
}

interface Product {
  id?: string
  name: string
  description?: string | null
  price: number
  cost: number
  stock: number
  minStock: number
  barcode?: string | null
  image?: string | null
  categoryId?: string | null
  isActive: boolean
}

interface ProductFormProps {
  open: boolean
  onClose: () => void
  product?: Product | null
  categories: Category[]
  onSaved: () => void
}

const empty: Omit<Product, 'id'> = {
  name: '',
  description: '',
  price: 0,
  cost: 0,
  stock: 0,
  minStock: 5,
  barcode: '',
  image: '',
  categoryId: '',
  isActive: true,
}

export function ProductForm({ open, onClose, product, categories, onSaved }: ProductFormProps) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description || '',
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        minStock: product.minStock,
        barcode: product.barcode || '',
        image: product.image || '',
        categoryId: product.categoryId || '',
        isActive: product.isActive,
      })
    } else {
      setForm(empty)
    }
  }, [product, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = product?.id ? `/api/products/${product.id}` : '/api/products'
      const method = product?.id ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          cost: Number(form.cost),
          stock: Number(form.stock),
          minStock: Number(form.minStock),
          categoryId: form.categoryId || null,
          barcode: form.barcode || null,
          image: form.image || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save product')
      }
      showToast(`Product ${product?.id ? 'updated' : 'created'} successfully`)
      onSaved()
      onClose()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Something went wrong', 'error')
    } finally {
      setLoading(false)
    }
  }

  const field = (key: keyof typeof form, label: string, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={String(form[key])}
        onChange={(e) => setForm((f) => ({ ...f, [key]: type === 'number' ? e.target.value : e.target.value }))}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
        step={type === 'number' ? '0.01' : undefined}
        min={type === 'number' ? '0' : undefined}
      />
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title={product?.id ? 'Edit Product' : 'Add Product'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">{field('name', 'Product Name', 'text', true)}</div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {field('price', 'Selling Price ($)', 'number', true)}
          {field('cost', 'Cost Price ($)', 'number')}
          {field('stock', 'Current Stock', 'number')}
          {field('minStock', 'Min Stock Alert', 'number')}
          {field('barcode', 'Barcode / SKU')}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.categoryId || ''}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">{field('image', 'Image URL')}</div>
          <div className="col-span-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (visible in POS)</label>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : product?.id ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
