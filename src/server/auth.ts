import { redirect } from "next/navigation";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/server/password";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "管理员账号",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash || user.role !== "ADMIN") {
          return null;
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: "ADMIN",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id && token.role === "ADMIN") {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
  },
};

export function getAdminSession() {
  return getServerSession(authOptions);
}

export async function requireAdminUser() {
  const session = await getAdminSession();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return session.user;
}
