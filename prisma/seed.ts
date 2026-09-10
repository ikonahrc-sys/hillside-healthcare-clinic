import "dotenv/config";
import { prisma } from "../lib/db";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const department = await prisma.department.upsert({
    where: { code: "ADMIN" },
    update: {},
    create: { name: "Administration", code: "ADMIN" },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMINISTRATOR" },
    update: {},
    create: { name: "ADMINISTRATOR", description: "Full administrative access" },
  });

  const passwordHash = await hashPassword("Password123!");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@hillside.local" },
    update: {},
    create: {
      email: "admin@hillside.local",
      passwordHash,
      fullName: "System Administrator",
      roleId: adminRole.id,
      departmentId: department.id,
    },
  });

  console.log("Seeded:", { department, adminRole, adminUser: adminUser.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
