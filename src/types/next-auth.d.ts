import type { DefaultSession } from "next-auth";

type AppRole = "ADMIN" | "USER";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: AppRole;
      authVersion: number;
    };
  }

  interface User {
    role: AppRole;
    authVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole;
    authVersion?: number;
  }
}
