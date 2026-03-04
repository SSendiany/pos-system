import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('categoryId') || undefined
  const activeOnly = searchParams.get('activeOnly') === 'true'

  const products = await prisma.product.findMany({
    where: {
      AND: [
        search ? { name: { contains: search } } : {},
        categoryId ? { categoryId } : {},
        activeOnly ? { isActive: true } : {},
      ],
    },
    include: { category: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, description, price, cost, stock, minStock, barcode, image, categoryId, isActive } = body

  if (!name || price === undefined)
    return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: Number(price),
      cost: Number(cost || 0),
      stock: Number(stock || 0),
      minStock: Number(minStock || 5),
      barcode: barcode || null,
      image: image || null,
      categoryId: categoryId || null,
      isActive: isActive !== undefined ? isActive : true,
    },
    include: { category: true },
  })

  // Log initial stock
  if (Number(stock) > 0) {
    await prisma.stockLog.create({
      data: {
        productId: product.id,
        userId: session.user.id,
        type: 'IN',
        quantity: Number(stock),
        previousStock: 0,
        newStock: Number(stock),
        note: 'Initial stock',
      },
    })
  }

  return NextResponse.json(product, { status: 201 })
}
