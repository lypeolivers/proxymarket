import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const name = (process.env.ADMIN_NAME ?? 'Administrador').trim();
  const salt = Number(process.env.PASSWORD_HASH_SALT_ROUNDS ?? 10);

  if (!email || !password) {
    throw new Error(
      'Seed cancelado: defina ADMIN_EMAIL e ADMIN_PASSWORD no .env antes de rodar `yarn db:seed`.'
    );
  }

  const passwordHash = await hash(password, salt);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: passwordHash,
      status: 'active',
      is_deleted: false,
    },
    create: {
      name,
      email,
      password: passwordHash,
      status: 'active',
    },
  });

  console.log(`✅ Admin pronto: ${user.email} (id=${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
