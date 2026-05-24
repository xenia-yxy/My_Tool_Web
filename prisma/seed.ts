import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Admin",
    },
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash: "seed-placeholder-replace-when-auth-is-implemented",
      notes: {
        create: [
          {
            title: "MVP 框架初始化记录",
            slug: "mvp-framework-initialized",
            excerpt: "记录个人网站 MVP 的技术框架和数据库初始化。",
            content:
              "这是第一条种子笔记，用于验证 Prisma Postgres 连接、迁移和写入流程。",
            status: "PUBLISHED",
            publishedAt: new Date(),
          },
          {
            title: "私人工作台待办",
            slug: "private-workbench-todo",
            excerpt: "后续实现登录、笔记管理、发布和撤回。",
            content:
              "这是一条私密种子笔记，后续用于验证后台列表和状态标签。",
            status: "PRIVATE",
          },
        ],
      },
    },
  });

  console.log(`Seeded admin user: ${admin.email}`);
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

