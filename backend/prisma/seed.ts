import 'dotenv/config'; // load DATABASE_URL from .env when run via `tsx` (not the Prisma CLI)
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Idempotent seed: safe to run repeatedly (uses upsert / existence checks).
 * Creates a default admin account plus a few categories and products so the
 * app is usable immediately after setup.
 */
const prisma = new PrismaClient();

async function main(): Promise<void> {
  // 1. Default admin user.
  const email = 'admin@example.com';
  const password = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password },
  });

  // 2. Categories.
  const categoryNames = ['Electronics', 'Books', 'Clothing', 'Home & Kitchen'];
  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  // 3. A handful of products (only if none exist yet).
  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    const electronics = categories.find((c) => c.name === 'Electronics')!;
    const books = categories.find((c) => c.name === 'Books')!;
    await prisma.product.createMany({
      data: [
        { name: 'Wireless Mouse', price: new Prisma.Decimal(24.99), categoryId: electronics.id },
        { name: 'Mechanical Keyboard', price: new Prisma.Decimal(89.0), categoryId: electronics.id },
        { name: 'Clean Architecture', price: new Prisma.Decimal(39.5), categoryId: books.id },
        { name: 'The Pragmatic Programmer', price: new Prisma.Decimal(42.0), categoryId: books.id },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete. Login with admin@example.com / Admin@123');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
