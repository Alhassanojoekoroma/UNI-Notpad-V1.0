const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test users...');

  const passwordHash = await bcrypt.hash('Lecturer123!', 12);

  // Get or create a faculty for the lecturer
  let faculty = await prisma.faculty.findFirst();
  if (!faculty) {
    faculty = await prisma.faculty.create({
      data: {
        code: 'FBMG',
        name: 'Faculty of Business Management and Globalization'
      }
    });
  }

  // Upsert test lecturer
  const lecturer = await prisma.user.upsert({
    where: { email: 'fatmata@demo.edu' },
    update: {},
    create: {
      name: 'Prof. Fatmata Sesay',
      email: 'fatmata@demo.edu',
      password: passwordHash,
      role: 'LECTURER',
      facultyId: faculty.id,
      termsAccepted: true,
      privacyAccepted: true,
      isActive: true,
    },
  });

  console.log('✅ Created lecturer:', lecturer.email);

  // Upsert test student
  const student = await prisma.user.upsert({
    where: { email: 'student@demo.edu' },
    update: {},
    create: {
      name: 'Test Student',
      email: 'student@demo.edu',
      password: await bcrypt.hash('Student123!', 12),
      role: 'STUDENT',
      studentId: '905001001',
      facultyId: faculty.id,
      semester: 1,
      termsAccepted: true,
      privacyAccepted: true,
      isActive: true,
    },
  });

  console.log('✅ Created student:', student.email);
  console.log('\n📝 Test Credentials:');
  console.log('Lecturer: fatmata@demo.edu / Lecturer123!');
  console.log('Student: student@demo.edu / Student123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
