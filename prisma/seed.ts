import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import {
  readAdminSeedAccounts,
  readUserSeedAccounts,
} from "../src/server/admin-seed-accounts";
import { hashPassword } from "../src/server/password";

async function main() {
  const accounts = [...readAdminSeedAccounts(), ...readUserSeedAccounts()];

  for (const account of accounts) {
    const passwordHash = await hashPassword(account.password);
    const passwordChangedAt = new Date();

    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.username,
        passwordHash,
        passwordChangedAt,
        failedLoginCount: 0,
        lockedUntil: null,
        role: account.role,
      },
      create: {
        email: account.email,
        name: account.username,
        passwordHash,
        passwordChangedAt,
        role: account.role,
      },
    });

    console.log(`Seeded ${account.role.toLowerCase()} user: ${account.email}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
