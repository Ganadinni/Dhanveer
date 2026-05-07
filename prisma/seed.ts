import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin123", 12);

  const admin = await db.user.upsert({
    where: { email: "admin@theteaplanet.com" },
    update: {},
    create: {
      email: "admin@theteaplanet.com",
      name: "Admin",
      role: "ADMIN",
      passwordHash: hash,
    },
  });

  console.log("Seeded admin user:", admin.email);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
