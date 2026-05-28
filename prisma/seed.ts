import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/server/password";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required for seed.");
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
    },
    create: {
      email,
      name: "YXY",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Seeded admin user: ${email}`);
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
