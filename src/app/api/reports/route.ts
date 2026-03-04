import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const period = searchParams.get('period') || '7d'

  let startDate: Date
  let endDate: Date = new Date()

  if (from && to) {
    startDate = new Date(from)
    endDate = new Date(to)
    endDate.setHours(23, 59, 59, 999)
  } else {
    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7
    startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)
  }

  const orders = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      items: { include: { product: { select: { name: true, categoryId: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Summary
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const totalTax = orders.reduce((sum, o) => sum + o.tax, 0)
  const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0)

  // Daily breakdown
  const dailyMap: Record<string, { date: string; revenue: number; orders: number }> = {}
  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().split('T')[0]
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { date: dateKey, revenue: 0, orders: 0 }
    }
    dailyMap[dateKey].revenue += order.total
    dailyMap[dateKey].orders += 1
  }
  const dailySales = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

  // Payment method breakdown
  const cashOrders = orders.filter((o) => o.paymentMethod === 'CASH')
  const cardOrders = orders.filter((o) => o.paymentMethod === 'CARD')
  const paymentBreakdown = {
    cash: { count: cashOrders.length, revenue: cashOrders.reduce((sum, o) => sum + o.total, 0) },
    card: { count: cardOrders.length, revenue: cardOrders.reduce((sum, o) => sum + o.total, 0) },
  }

  // Top products
  const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {}
  for (const order of orders) {
    for (const item of order.items) {
      if (!productMap[item.productId]) {
        productMap[item.productId] = { name: item.name, quantity: 0, revenue: 0 }
      }
      productMap[item.productId].quantity += item.quantity
      productMap[item.productId].revenue += item.subtotal
    }
  }
  const topProducts = Object.entries(productMap)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  return NextResponse.json({
    summary: { totalRevenue, totalOrders, avgOrderValue, totalTax, totalDiscount },
    dailySales,
    paymentBreakdown,
    topProducts,
    period: { from: startDate, to: endDate },
  })
}
