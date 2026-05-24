import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [userCount, noteCount] = await Promise.all([
    prisma.user.count(),
    prisma.note.count(),
  ]);

  console.log(`✅ Connected. Users: ${userCount}, Notes: ${noteCount}`);
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

