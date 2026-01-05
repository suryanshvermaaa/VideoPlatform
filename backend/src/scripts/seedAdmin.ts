import bcrypt from 'bcryptjs';
import { z } from 'zod';
import dotenv from 'dotenv';

import { prisma } from '../lib/prisma.js';

dotenv.config();

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional()
});

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;

  if (!email || !password) {
    console.error('Missing ADMIN_EMAIL / ADMIN_PASSWORD.');
    console.error('Set them in your shell or in backend/.env, then re-run.');
    console.error('Example:');
    console.error('  export ADMIN_EMAIL="admin@example.com"');
    console.error('  export ADMIN_PASSWORD="Admin@1234"');
    console.error('  pnpm --dir backend seed:admin');
    process.exit(1);
  }

  const input = schema.parse({ email, password, name });

  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    return;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash,
      role: 'ADMIN'
    },
    select: { id: true, email: true, role: true }
  });

  console.log('Created admin:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
