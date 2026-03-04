'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/shared/Header'
import { Modal } from '@/components/shared/Modal'
import { useToast } from '@/components/shared/Toast'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string | null
  _count: { products: number }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    setCategories(await res.json())
  }

  useEffect(() => { fetchCategories() }, [])

  const openAdd = () => {
    setEditCategory(null)
    setName('')
    setDescription('')
    setFormOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditCategory(cat)
    setName(cat.name)
    setDescription(cat.description || '')
    setFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editCategory ? `/api/categories/${editCategory.id}` : '/api/categories'
      const method = editCategory ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      showToast(`Category ${editCategory ? 'updated' : 'created'}`)
      setFormOpen(false)
      fetchCategories()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      showToast(err.error, 'error')
    } else {
      showToast('Category deleted')
      fetchCategories()
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Categories"
        subtitle={`${categories.length} categories`}
        actions={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Tag className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={cat._count.products > 0}
                    title={cat._count.products > 0 ? 'Has products' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900">{cat.name}</h3>
              {cat.description && <p className="text-xs text-gray-500 mt-1">{cat.description}</p>}
              <p className="text-xs text-gray-400 mt-3">{cat._count.products} products</p>
            </div>
          ))}
        </div>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editCategory ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : editCategory ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
