/**
 * Auth utilities — placeholder until NextAuth or Clerk is wired up.
 * Import and expand this file when adding authentication.
 */

export type UserRole = "ADMIN" | "SALES" | "VIEWER";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/** Returns the current server session. Stub — implement with NextAuth. */
export async function getServerSession(): Promise<SessionUser | null> {
  // TODO: replace with: return await auth() from next-auth/v5 or Clerk
  return null;
}

/** Returns true if the user has admin privileges. */
export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "ADMIN";
}
