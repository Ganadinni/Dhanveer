import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";

// NextAuth v5 uses AUTH_SECRET; fall back to NEXTAUTH_SECRET for Vercel deployments
const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
