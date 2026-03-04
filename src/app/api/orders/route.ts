import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 20)
  const status = searchParams.get('status') || undefined

  const orders = await prisma.order.findMany({
    where: status ? { status: status as 'COMPLETED' | 'CANCELLED' | 'REFUNDED' } : {},
    include: {
      user: { select: { name: true } },
      items: { include: { product: { select: { name: true, image: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })

  const total = await prisma.order.count({
    where: status ? { status: status as 'COMPLETED' | 'CANCELLED' | 'REFUNDED' } : {},
  })

  return NextResponse.json({ orders, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { items, discount, discountType, paymentMethod, amountPaid } = body

  if (!items || items.length === 0)
    return NextResponse.json({ error: 'No items in order' }, { status: 400 })

  // Validate stock availability
  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } })
    if (!product) return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 })
    if (product.stock < item.quantity)
      return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 })
  }

  // Calculate totals
  const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0)
  let discountAmount = 0
  if (discount > 0) {
    discountAmount = discountType === 'percent' ? (subtotal * discount) / 100 : Math.min(discount, subtotal)
  }
  const tax = (subtotal - discountAmount) * 0.08
  const total = subtotal - discountAmount + tax

  const orderNumber = generateOrderNumber()

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        subtotal,
        tax,
        discount: discountAmount,
        total,
        paymentMethod: paymentMethod || 'CASH',
        amountPaid: Number(amountPaid),
        change: paymentMethod === 'CASH' ? Number(amountPaid) - total : 0,
        status: 'COMPLETED',
        items: {
          create: items.map((item: { productId: string; name: string; price: number; quantity: number }) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        user: { select: { name: true } },
      },
    })

    // Update stock for each item
    for (const item of items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } })
      if (!product) continue

      const newStock = product.stock - item.quantity
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: newStock },
      })

      await tx.stockLog.create({
        data: {
          productId: item.productId,
          userId: session.user.id,
          type: 'OUT',
          quantity: item.quantity,
          previousStock: product.stock,
          newStock,
          note: `Order ${orderNumber}`,
        },
      })
    }

    return newOrder
  })

  return NextResponse.json(order, { status: 201 })
}
