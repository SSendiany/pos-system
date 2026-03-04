import { create } from 'zustand'
import { TAX_RATE } from '@/lib/utils'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string | null
  stock: number
}

interface CartStore {
  items: CartItem[]
  discount: number
  discountType: 'percent' | 'fixed'
  addItem: (product: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  setDiscount: (amount: number, type: 'percent' | 'fixed') => void
  clearCart: () => void
  subtotal: () => number
  discountAmount: () => number
  taxAmount: () => number
  total: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  discount: 0,
  discountType: 'percent',

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return state
        return {
          items: state.items.map((i) =>
            i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      return { items: [...state.items, { ...product, quantity: 1 }] }
    })
  },

  removeItem: (id) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }))
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id)
      return
    }
    set((state) => ({
      items: state.items.map((i) => {
        if (i.id !== id) return i
        const newQty = Math.min(quantity, i.stock)
        return { ...i, quantity: newQty }
      }),
    }))
  },

  setDiscount: (amount, type) => {
    set({ discount: amount, discountType: type })
  },

  clearCart: () => {
    set({ items: [], discount: 0, discountType: 'percent' })
  },

  subtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  discountAmount: () => {
    const { discount, discountType } = get()
    const subtotal = get().subtotal()
    if (discountType === 'percent') {
      return (subtotal * discount) / 100
    }
    return Math.min(discount, subtotal)
  },

  taxAmount: () => {
    const subtotal = get().subtotal()
    const discountAmt = get().discountAmount()
    return (subtotal - discountAmt) * TAX_RATE
  },

  total: () => {
    const subtotal = get().subtotal()
    const discountAmt = get().discountAmount()
    const tax = get().taxAmount()
    return subtotal - discountAmt + tax
  },
}))
