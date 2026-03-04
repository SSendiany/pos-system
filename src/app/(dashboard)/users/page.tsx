'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/shared/Header'
import { Modal } from '@/components/shared/Modal'
import { Badge } from '@/components/shared/Badge'
import { useToast } from '@/components/shared/Toast'
import { Plus, Edit, UserX, UserCheck } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useSession } from 'next-auth/react'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'CASHIER'>('CASHIER')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  const { data: session } = useSession()

  const fetchUsers = async () => {
    const res = await fetch('/api/users')
    setUsers(await res.json())
  }

  useEffect(() => { fetchUsers() }, [])

  const openAdd = () => {
    setEditUser(null)
    setName('')
    setEmail('')
    setPassword('')
    setRole('CASHIER')
    setFormOpen(true)
  }

  const openEdit = (user: User) => {
    setEditUser(user)
    setName(user.name)
    setEmail(user.email)
    setPassword('')
    setRole(user.role as 'ADMIN' | 'CASHIER')
    setFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editUser) {
        const body: Record<string, unknown> = { name, role }
        if (password) body.password = password
        await fetch(`/api/users/${editUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        showToast('User updated')
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error)
        }
        showToast('User created')
      }
      setFormOpen(false)
      fetchUsers()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (user: User) => {
    if (user.id === session?.user?.id) {
      showToast('Cannot deactivate your own account', 'warning')
      return
    }
    await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    })
    showToast(`User ${user.isActive ? 'deactivated' : 'activated'}`)
    fetchUsers()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Users"
        subtitle={`${users.length} users`}
        actions={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Created</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {user.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                      {user.id === session?.user?.id && (
                        <span className="text-xs text-gray-400">(you)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={user.role === 'ADMIN' ? 'secondary' : 'info'}>{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={user.isActive ? 'success' : 'default'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(user)}
                        disabled={user.id === session?.user?.id}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                          user.isActive
                            ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {!editUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {editUser ? '(leave blank to keep)' : '*'}
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required={!editUser} minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'ADMIN' | 'CASHIER')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="CASHIER">Cashier</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
