import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId') || undefined
  const lowStock = searchParams.get('lowStock') === 'true'

  if (productId) {
    const logs = await prisma.stockLog.findMany({
      where: { productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(logs)
  }

  const products = await prisma.product.findMany({
    where: lowStock ? { isActive: true } : { isActive: true },
    include: { category: true },
    orderBy: { name: 'asc' },
  })

  const result = lowStock ? products.filter((p) => p.stock <= p.minStock) : products
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { productId, type, quantity, note } = body

  if (!productId || !type || quantity === undefined)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const delta = type === 'IN' ? Number(quantity) : type === 'OUT' ? -Number(quantity) : Number(quantity)
  const newStock = product.stock + delta

  if (newStock < 0)
    return NextResponse.json({ error: 'Stock cannot go below 0' }, { status: 400 })

  const [updatedProduct, log] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    }),
    prisma.stockLog.create({
      data: {
        productId,
        userId: session.user.id,
        type,
        quantity: Math.abs(Number(quantity)),
        previousStock: product.stock,
        newStock,
        note,
      },
    }),
  ])

  return NextResponse.json({ product: updatedProduct, log }, { status: 201 })
}
