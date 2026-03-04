import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, description } = body

  const category = await prisma.category.update({
    where: { id: params.id },
    data: { name, description },
    include: { _count: { select: { products: true } } },
  })

  return NextResponse.json(category)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const productCount = await prisma.product.count({ where: { categoryId: params.id } })
  if (productCount > 0)
    return NextResponse.json({ error: 'Cannot delete category with products' }, { status: 400 })

  await prisma.category.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
