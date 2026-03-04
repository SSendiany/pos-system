import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const [todayOrders, totalProducts, weekOrders, recentOrders] = await Promise.all([
    prisma.order.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.order.findMany({
      where: { status: 'COMPLETED' },
      include: {
        user: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0)
  const todayOrderCount = todayOrders.length

  // 7-day chart data
  const dailyMap: Record<string, { date: string; revenue: number; orders: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dailyMap[key] = { date: key, revenue: 0, orders: 0 }
  }
  for (const order of weekOrders) {
    const key = order.createdAt.toISOString().split('T')[0]
    if (dailyMap[key]) {
      dailyMap[key].revenue += order.total
      dailyMap[key].orders += 1
    }
  }

  // Low stock products
  const lowStockProducts = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { stock: 'asc' },
    take: 5,
  })
  const actualLowStock = lowStockProducts.filter((p) => p.stock <= p.minStock)

  return NextResponse.json({
    stats: {
      todayRevenue,
      todayOrders: todayOrderCount,
      totalProducts,
      lowStockCount: actualLowStock.length,
    },
    chartData: Object.values(dailyMap),
    recentOrders,
    lowStockProducts: actualLowStock,
  })
}
