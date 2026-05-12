import { cache } from "react";
import { db } from "./db";
import { getSession } from "./session";
import { getEffectivePermissions } from "./permissions";

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, status: true, permissions: true },
  });
  if (!user) return null;

  return {
    ...user,
    effectivePermissions: getEffectivePermissions(user.role, user.permissions),
  };
});
