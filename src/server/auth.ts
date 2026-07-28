import { redirect } from "next/navigation";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { buildAdminCredentialWhere } from "@/server/admin-credentials";
import {
  canAccessAdmin,
  canUseActiveSession,
  canUseMemberTools,
} from "@/server/auth-permissions";
import { buildUserLoginHref } from "@/server/user-auth-redirects";
import {
  adminSessionMaxAgeSeconds,
  buildFailedLoginUpdate,
  getClientIpFromHeaders,
  getUserAgentFromHeaders,
  isAccountLocked,
  isSafeAuthRedirect,
} from "@/server/admin-login-security";
import { verifyPassword } from "@/server/password";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: adminSessionMaxAgeSeconds,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "登录账号",
      credentials: {
        identifier: { label: "账号或邮箱", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials, request) {
        const identifier = credentials?.identifier;
        const password = credentials?.password;
        const normalizedIdentifier = identifier?.trim().toLowerCase() || "";
        const headers = request?.headers;
        const ipAddress = getClientIpFromHeaders(headers);
        const userAgent = getUserAgentFromHeaders(headers);

        if (!normalizedIdentifier || !password) {
          await writeLoginAudit({
            identifier: normalizedIdentifier || "unknown",
            outcome: "FAILED",
            reason: "MISSING_CREDENTIALS",
            ipAddress,
            userAgent,
          });
          return null;
        }

        const user = await prisma.user.findFirst({
          where: buildAdminCredentialWhere(normalizedIdentifier),
        });

        if (!user?.passwordHash) {
          await writeLoginAudit({
            identifier: normalizedIdentifier,
            userId: user?.id,
            outcome: "FAILED",
            reason: "INVALID_CREDENTIALS",
            ipAddress,
            userAgent,
          });
          return null;
        }

        if (user.disabledAt) {
          await writeLoginAudit({
            identifier: normalizedIdentifier,
            userId: user.id,
            outcome: "FAILED",
            reason: "ACCOUNT_DISABLED",
            ipAddress,
            userAgent,
          });
          return null;
        }

        if (isAccountLocked(user.lockedUntil)) {
          await writeLoginAudit({
            identifier: normalizedIdentifier,
            userId: user.id,
            outcome: "FAILED",
            reason: "ACCOUNT_LOCKED",
            ipAddress,
            userAgent,
          });
          return null;
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash);

        if (!isValidPassword) {
          const failedLoginUpdate = buildFailedLoginUpdate(user.failedLoginCount);

          await Promise.all([
            prisma.user.update({
              where: { id: user.id },
              data: failedLoginUpdate,
            }),
            writeLoginAudit({
              identifier: normalizedIdentifier,
              userId: user.id,
              outcome: "FAILED",
              reason: failedLoginUpdate.lockedUntil
                ? "INVALID_CREDENTIALS_LOCKED"
                : "INVALID_CREDENTIALS",
              ipAddress,
              userAgent,
            }),
          ]);
          return null;
        }

        queueLoginSuccessSideEffects({
          identifier: normalizedIdentifier,
          userId: user.id,
          ipAddress,
          userAgent,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          authVersion: user.authVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.authVersion = user.authVersion;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id && typeof token.role === "string" && typeof token.authVersion === "number") {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.authVersion = token.authVersion;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (isSafeAuthRedirect(url, baseUrl)) {
        return url.startsWith("/") ? `${baseUrl}${url}` : url;
      }

      return `${baseUrl}/account`;
    },
  },
};

async function writeLoginAudit(input: {
  identifier: string;
  userId?: string;
  outcome: "SUCCESS" | "FAILED";
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  await prisma.loginAudit.create({
    data: {
      identifier: input.identifier,
      userId: input.userId,
      outcome: input.outcome,
      reason: input.reason,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

function queueLoginSuccessSideEffects(input: {
  identifier: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  void Promise.all([
    prisma.user.update({
      where: { id: input.userId },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: input.ipAddress,
      },
    }),
    writeLoginAudit({
      identifier: input.identifier,
      userId: input.userId,
      outcome: "SUCCESS",
      reason: null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    }),
  ]).catch((error) => {
    console.error("Failed to write successful login audit.", error);
  });
}

export async function getAppSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return session;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { authVersion: true, disabledAt: true, role: true },
  });

  if (!user || !canUseActiveSession(user, session.user.authVersion)) {
    return null;
  }

  session.user.role = user.role;
  return session;
}

export async function requireAdminUser() {
  const session = await getAppSession();

  if (!session?.user?.id || !canAccessAdmin(session.user.role)) {
    redirect("/login");
  }

  return session.user;
}

export async function requireSignedInUser(callbackPath = "/account") {
  const session = await getAppSession();

  if (!session?.user?.id || !canUseMemberTools(session.user.role)) {
    redirect(buildUserLoginHref(callbackPath));
  }

  return session.user;
}
