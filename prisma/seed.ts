import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pos.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@pos.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create cashier user
  const cashierPassword = await bcrypt.hash('cashier123', 10)
  await prisma.user.upsert({
    where: { email: 'cashier@pos.com' },
    update: {},
    create: {
      name: 'John Cashier',
      email: 'cashier@pos.com',
      password: cashierPassword,
      role: 'CASHIER',
    },
  })

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Beverages' },
      update: {},
      create: { name: 'Beverages', description: 'Drinks and beverages' },
    }),
    prisma.category.upsert({
      where: { name: 'Food' },
      update: {},
      create: { name: 'Food', description: 'Food items and snacks' },
    }),
    prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: { name: 'Electronics', description: 'Electronic devices and accessories' },
    }),
    prisma.category.upsert({
      where: { name: 'Clothing' },
      update: {},
      create: { name: 'Clothing', description: 'Apparel and fashion' },
    }),
    prisma.category.upsert({
      where: { name: 'Household' },
      update: {},
      create: { name: 'Household', description: 'Home and household items' },
    }),
  ])

  const [beverages, food, electronics, clothing, household] = categories

  // Create products
  const products = [
    // Beverages
    { name: 'Coffee - Americano', price: 3.50, cost: 0.80, stock: 100, minStock: 10, categoryId: beverages.id, barcode: 'BEV001', image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=300' },
    { name: 'Coffee - Latte', price: 4.50, cost: 1.20, stock: 100, minStock: 10, categoryId: beverages.id, barcode: 'BEV002', image: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=300' },
    { name: 'Green Tea', price: 2.50, cost: 0.50, stock: 80, minStock: 15, categoryId: beverages.id, barcode: 'BEV003', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300' },
    { name: 'Orange Juice', price: 3.00, cost: 0.90, stock: 50, minStock: 10, categoryId: beverages.id, barcode: 'BEV004', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300' },
    { name: 'Mineral Water', price: 1.50, cost: 0.30, stock: 200, minStock: 20, categoryId: beverages.id, barcode: 'BEV005', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300' },
    // Food
    { name: 'Chocolate Cake Slice', price: 5.50, cost: 2.00, stock: 20, minStock: 5, categoryId: food.id, barcode: 'FOOD001', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300' },
    { name: 'Caesar Salad', price: 8.00, cost: 3.00, stock: 30, minStock: 5, categoryId: food.id, barcode: 'FOOD002', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300' },
    { name: 'Sandwich - Club', price: 6.50, cost: 2.50, stock: 25, minStock: 5, categoryId: food.id, barcode: 'FOOD003', image: 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=300' },
    { name: 'Croissant', price: 2.50, cost: 0.80, stock: 40, minStock: 10, categoryId: food.id, barcode: 'FOOD004', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300' },
    { name: 'Chips & Dip', price: 4.00, cost: 1.50, stock: 3, minStock: 10, categoryId: food.id, barcode: 'FOOD005', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300' },
    // Electronics
    { name: 'USB-C Cable 2m', price: 12.99, cost: 4.00, stock: 50, minStock: 10, categoryId: electronics.id, barcode: 'ELEC001', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300' },
    { name: 'Wireless Earbuds', price: 49.99, cost: 18.00, stock: 15, minStock: 5, categoryId: electronics.id, barcode: 'ELEC002', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300' },
    { name: 'Phone Stand', price: 9.99, cost: 3.00, stock: 30, minStock: 8, categoryId: electronics.id, barcode: 'ELEC003', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300' },
    { name: 'Power Bank 10000mAh', price: 29.99, cost: 10.00, stock: 2, minStock: 5, categoryId: electronics.id, barcode: 'ELEC004', image: 'https://images.unsplash.com/photo-1609592173729-e62b1e5e1aed?w=300' },
    // Clothing
    { name: 'Cotton T-Shirt', price: 19.99, cost: 6.00, stock: 60, minStock: 10, categoryId: clothing.id, barcode: 'CLO001', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300' },
    { name: 'Denim Jeans', price: 49.99, cost: 18.00, stock: 25, minStock: 5, categoryId: clothing.id, barcode: 'CLO002', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300' },
    { name: 'Baseball Cap', price: 14.99, cost: 4.00, stock: 4, minStock: 8, categoryId: clothing.id, barcode: 'CLO003', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300' },
    // Household
    { name: 'Scented Candle', price: 12.99, cost: 3.50, stock: 35, minStock: 8, categoryId: household.id, barcode: 'HH001', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300' },
    { name: 'Coffee Mug', price: 9.99, cost: 2.50, stock: 45, minStock: 10, categoryId: household.id, barcode: 'HH002', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=300' },
    { name: 'Plant Pot Small', price: 7.99, cost: 2.00, stock: 20, minStock: 5, categoryId: household.id, barcode: 'HH003', image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300' },
  ]

  for (const product of products) {
    const existing = await prisma.product.findUnique({ where: { barcode: product.barcode } })
    if (!existing) {
      await prisma.product.create({ data: product })
    }
  }

  // Create some sample orders (last 7 days)
  const allProducts = await prisma.product.findMany()
  const now = new Date()

  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const ordersPerDay = Math.floor(Math.random() * 8) + 3 // 3-10 orders per day
    for (let i = 0; i < ordersPerDay; i++) {
      const orderDate = new Date(now)
      orderDate.setDate(orderDate.getDate() - daysAgo)
      orderDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0)

      const itemCount = Math.floor(Math.random() * 4) + 1
      const selectedProducts = allProducts.sort(() => 0.5 - Math.random()).slice(0, itemCount)

      const items = selectedProducts.map(p => ({
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: Math.floor(Math.random() * 3) + 1,
        subtotal: 0,
      }))
      items.forEach(item => { item.subtotal = item.price * item.quantity })

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
      const tax = subtotal * 0.08
      const total = subtotal + tax
      const amountPaid = Math.ceil(total / 5) * 5 + (Math.random() > 0.7 ? 5 : 0)
      const paymentMethod = Math.random() > 0.4 ? 'CASH' : 'CARD'
      const orderNumber = `ORD-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`

      await prisma.order.create({
        data: {
          orderNumber,
          userId: admin.id,
          subtotal,
          tax,
          discount: 0,
          total,
          paymentMethod: paymentMethod as 'CASH' | 'CARD',
          amountPaid: paymentMethod === 'CASH' ? amountPaid : total,
          change: paymentMethod === 'CASH' ? amountPaid - total : 0,
          status: 'COMPLETED',
          createdAt: orderDate,
          items: {
            create: items,
          },
        },
      })
    }
  }

  console.log('Seed completed!')
  console.log('Admin login: admin@pos.com / admin123')
  console.log('Cashier login: cashier@pos.com / cashier123')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
