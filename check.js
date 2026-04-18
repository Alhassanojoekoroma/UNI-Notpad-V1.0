const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.faculty.count();
  console.log("Count is:", c);
  const f = await prisma.faculty.findMany();
  console.log("Faculties:", f);
}
main().finally(() => prisma.$disconnect());
