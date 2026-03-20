import type { NextAuthConfig } from "next-auth";
import { env } from "@/lib/env";

const base = env.NEXT_PUBLIC_BASE_PATH;

export const authConfig = {
  basePath: "/api/auth",
  trustHost: true,
  pages: {
    signIn: `${base}/login`,
    newUser: `${base}/`,
  },
  providers: [],
  callbacks: {},
} satisfies NextAuthConfig;
