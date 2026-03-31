import { PrismaClient, UserRole, ContentType, ContentStatus, Priority, TaskStatus, GoalStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_MODE = process.env.SEED_MODE || "minimal";
const BCRYPT_ROUNDS = 12;

async function main() {
  console.log(`Seeding database (mode: ${SEED_MODE})...\n`);

  // --- AppSettings (always created) ---
  console.log("Seeding AppSettings...");
  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      universityName: "Demo University",
      primaryColor: "#7c3aed",
      secondaryColor: "#1e1e1e",
      studentIdPattern: "^90500\\d{4,}$",
      maxSemesters: 8,
      geminiModel: "gemini-2.0-flash",
      freeQueriesPerDay: 20,
      freeSuspensionHours: 7,
      referralBonusTokens: 5,
      tokenPackages: [
        { amount: 10, priceSLE: 50, priceUSD: 2 },
        { amount: 50, priceSLE: 200, priceUSD: 8 },
        { amount: 100, priceSLE: 350, priceUSD: 14 },
      ],
      isSetupComplete: true,
    },
  });

  // --- Admin user (always created) ---
  console.log("Seeding admin user...");
  const adminPassword = await bcrypt.hash("Admin123!", BCRYPT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.edu" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@demo.edu",
      password: adminPassword,
      role: UserRole.ADMIN,
      termsAccepted: true,
      privacyAccepted: true,
      isActive: true,
    },
  });

  if (SEED_MODE === "minimal") {
    console.log("\nMinimal seed complete.");
    console.log("  Admin login: admin@demo.edu / Admin123!");
    return;
  }

  // ===== FULL SEED MODE =====
  console.log("\nRunning full seed...\n");

  // --- Faculties ---
  console.log("Seeding faculties...");
  const fict = await prisma.faculty.upsert({
    where: { code: "FICT" },
    update: {},
    create: {
      name: "Faculty of Information, Communication and Technology",
      code: "FICT",
    },
  });

  const fbmg = await prisma.faculty.upsert({
    where: { code: "FBMG" },
    update: {},
    create: {
      name: "Faculty of Business Management and Globalization",
      code: "FBMG",
    },
  });

  // --- Programs ---
  console.log("Seeding programs...");
  const se = await prisma.program.upsert({
    where: { facultyId_code: { facultyId: fict.id, code: "SE" } },
    update: {},
    create: { name: "Software Engineering", code: "SE", facultyId: fict.id },
  });

  const it = await prisma.program.upsert({
    where: { facultyId_code: { facultyId: fict.id, code: "IT" } },
    update: {},
    create: { name: "Information Technology", code: "IT", facultyId: fict.id },
  });

  const ba = await prisma.program.upsert({
    where: { facultyId_code: { facultyId: fbmg.id, code: "BA" } },
    update: {},
    create: { name: "Business Administration", code: "BA", facultyId: fbmg.id },
  });

  const mkt = await prisma.program.upsert({
    where: { facultyId_code: { facultyId: fbmg.id, code: "MKT" } },
    update: {},
    create: { name: "Marketing", code: "MKT", facultyId: fbmg.id },
  });

  // --- Lecturer codes ---
  console.log("Seeding lecturer codes...");
  const lecturerCode1Hash = await bcrypt.hash("LECT-FICT-001", BCRYPT_ROUNDS);
  const lecturerCode2Hash = await bcrypt.hash("LECT-FBMG-001", BCRYPT_ROUNDS);

  await prisma.lecturerCode.upsert({
    where: { code: lecturerCode1Hash },
    update: {},
    create: {
      code: lecturerCode1Hash,
      lecturerName: "Dr. Amara Kamara",
      facultyId: fict.id,
      createdBy: admin.id,
    },
  });

  await prisma.lecturerCode.upsert({
    where: { code: lecturerCode2Hash },
    update: {},
    create: {
      code: lecturerCode2Hash,
      lecturerName: "Prof. Fatmata Sesay",
      facultyId: fbmg.id,
      createdBy: admin.id,
    },
  });

  // --- Lecturers ---
  console.log("Seeding lecturers...");
  const lecturerPassword = await bcrypt.hash("Lecturer123!", BCRYPT_ROUNDS);

  const lecturer1 = await prisma.user.upsert({
    where: { email: "amara@demo.edu" },
    update: {},
    create: {
      name: "Dr. Amara Kamara",
      email: "amara@demo.edu",
      password: lecturerPassword,
      role: UserRole.LECTURER,
      facultyId: fict.id,
      termsAccepted: true,
      privacyAccepted: true,
      isActive: true,
    },
  });

  const lecturer2 = await prisma.user.upsert({
    where: { email: "fatmata@demo.edu" },
    update: {},
    create: {
      name: "Prof. Fatmata Sesay",
      email: "fatmata@demo.edu",
      password: lecturerPassword,
      role: UserRole.LECTURER,
      facultyId: fbmg.id,
      termsAccepted: true,
      privacyAccepted: true,
      isActive: true,
    },
  });

  // --- Students ---
  console.log("Seeding students...");
  const studentPassword = await bcrypt.hash("Student123!", BCRYPT_ROUNDS);

  const studentData = [
    { name: "Mohamed Bangura", email: "mohamed@demo.edu", studentId: "905001001", facultyId: fict.id, programId: se.id, semester: 1, referralCode: "MOH-REF" },
    { name: "Aminata Conteh", email: "aminata@demo.edu", studentId: "905001002", facultyId: fict.id, programId: it.id, semester: 2, referralCode: "AMI-REF" },
    { name: "Ibrahim Koroma", email: "ibrahim@demo.edu", studentId: "905001003", facultyId: fict.id, programId: se.id, semester: 3, referralCode: "IBR-REF" },
    { name: "Mariama Jalloh", email: "mariama@demo.edu", studentId: "905001004", facultyId: fbmg.id, programId: ba.id, semester: 1, referralCode: "MAR-REF" },
    { name: "Abdul Sesay", email: "abdul@demo.edu", studentId: "905001005", facultyId: fbmg.id, programId: mkt.id, semester: 4, referralCode: "ABD-REF" },
  ];

  const students = [];
  for (const data of studentData) {
    const student = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        ...data,
        password: studentPassword,
        role: UserRole.STUDENT,
        termsAccepted: true,
        privacyAccepted: true,
        isActive: true,
      },
    });
    students.push(student);
  }

  // --- Token balances ---
  console.log("Seeding token balances...");
  for (const student of students) {
    await prisma.tokenBalance.upsert({
      where: { userId: student.id },
      update: {},
      create: {
        userId: student.id,
        available: 10,
        used: 0,
        total: 10,
        bonus: 5,
      },
    });
  }

  // --- Content ---
  console.log("Seeding content...");
  const contentItems = [
    {
      title: "Introduction to Programming - Lecture Notes",
      description: "Covers variables, data types, and control flow in Python.",
      fileUrl: "https://res.cloudinary.com/demo/raw/upload/v1/uninotepad/intro-programming.pdf",
      fileType: "application/pdf",
      fileSize: 245000,
      facultyId: fict.id,
      programId: se.id,
      semester: 1,
      module: "Introduction to Programming",
      moduleCode: "SE101",
      contentType: ContentType.LECTURE_NOTES,
      lecturerId: lecturer1.id,
    },
    {
      title: "Data Structures Assignment 1",
      description: "Implement a linked list and binary search tree in Java.",
      fileUrl: "https://res.cloudinary.com/demo/raw/upload/v1/uninotepad/ds-assignment1.pdf",
      fileType: "application/pdf",
      fileSize: 120000,
      facultyId: fict.id,
      programId: se.id,
      semester: 2,
      module: "Data Structures and Algorithms",
      moduleCode: "SE201",
      contentType: ContentType.ASSIGNMENT,
      lecturerId: lecturer1.id,
    },
    {
      title: "Networking Fundamentals - Tutorial",
      description: "OSI model, TCP/IP stack, and basic socket programming.",
      fileUrl: "https://res.cloudinary.com/demo/raw/upload/v1/uninotepad/networking-tutorial.pdf",
      fileType: "application/pdf",
      fileSize: 180000,
      facultyId: fict.id,
      programId: it.id,
      semester: 2,
      module: "Computer Networks",
      moduleCode: "IT202",
      contentType: ContentType.TUTORIAL,
      lecturerId: lecturer1.id,
    },
    {
      title: "Principles of Management - Lecture Notes",
      description: "Planning, organizing, leading, and controlling.",
      fileUrl: "https://res.cloudinary.com/demo/raw/upload/v1/uninotepad/management-notes.pdf",
      fileType: "application/pdf",
      fileSize: 310000,
      facultyId: fbmg.id,
      programId: ba.id,
      semester: 1,
      module: "Principles of Management",
      moduleCode: "BA101",
      contentType: ContentType.LECTURE_NOTES,
      lecturerId: lecturer2.id,
    },
    {
      title: "Marketing Strategy Case Study",
      description: "Analyze a real-world marketing campaign and propose improvements.",
      fileUrl: "https://res.cloudinary.com/demo/raw/upload/v1/uninotepad/marketing-case.pdf",
      fileType: "application/pdf",
      fileSize: 95000,
      facultyId: fbmg.id,
      programId: mkt.id,
      semester: 3,
      module: "Marketing Strategy",
      moduleCode: "MKT301",
      contentType: ContentType.PROJECT,
      lecturerId: lecturer2.id,
    },
  ];

  for (const item of contentItems) {
    await prisma.content.create({ data: item });
  }

  // --- Forum posts ---
  console.log("Seeding forum posts...");
  const post1 = await prisma.forumPost.create({
    data: {
      module: "Introduction to Programming",
      facultyId: fict.id,
      authorId: students[0].id,
      title: "How do you reverse a string in Python?",
      body: "I know about slicing but are there other ways to reverse a string? Looking for the most efficient approach.",
    },
  });

  await prisma.forumPost.create({
    data: {
      module: "Introduction to Programming",
      facultyId: fict.id,
      authorId: students[1].id,
      body: "You can use `reversed()` with `''.join()`, or just slice with `[::-1]`. Slicing is usually fastest for short strings.",
      parentId: post1.id,
      isAcceptedAnswer: true,
    },
  });

  const post2 = await prisma.forumPost.create({
    data: {
      module: "Principles of Management",
      facultyId: fbmg.id,
      authorId: students[3].id,
      title: "Difference between leadership and management?",
      body: "The textbook treats them as separate concepts but they overlap a lot in practice. How do you think about the distinction?",
    },
  });

  await prisma.forumPost.create({
    data: {
      module: "Principles of Management",
      facultyId: fbmg.id,
      authorId: students[4].id,
      body: "Management is about processes and systems. Leadership is about people and direction. You need both, but they draw on different skills.",
      parentId: post2.id,
    },
  });

  // --- Tasks ---
  console.log("Seeding tasks...");
  const now = new Date();

  await prisma.task.createMany({
    data: [
      {
        userId: students[0].id,
        title: "Complete Python assignment",
        description: "Finish the linked list implementation before Friday.",
        deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        priority: Priority.HIGH,
        status: TaskStatus.PENDING,
      },
      {
        userId: students[0].id,
        title: "Review lecture notes for midterm",
        deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        priority: Priority.MEDIUM,
        status: TaskStatus.PENDING,
      },
      {
        userId: students[3].id,
        title: "Read Chapter 5 - Organizational Structure",
        deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        priority: Priority.LOW,
        status: TaskStatus.PENDING,
      },
      {
        userId: students[4].id,
        title: "Submit marketing case study draft",
        description: "First draft of the campaign analysis.",
        deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        priority: Priority.HIGH,
        status: TaskStatus.PENDING,
      },
    ],
  });

  // --- Learning goals ---
  console.log("Seeding learning goals...");
  await prisma.learningGoal.createMany({
    data: [
      {
        userId: students[0].id,
        title: "Master Python fundamentals",
        description: "Complete all exercises and score 80%+ on quizzes.",
        targetDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: GoalStatus.ACTIVE,
        progressPercent: 35,
      },
      {
        userId: students[3].id,
        title: "Understand management frameworks",
        targetDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        status: GoalStatus.ACTIVE,
        progressPercent: 15,
      },
    ],
  });

  // --- Schedules ---
  console.log("Seeding schedules...");
  await prisma.schedule.createMany({
    data: [
      { userId: students[0].id, dayOfWeek: 1, startTime: "09:00", endTime: "11:00", subject: "Introduction to Programming", location: "Lab A", type: "lecture" },
      { userId: students[0].id, dayOfWeek: 3, startTime: "14:00", endTime: "16:00", subject: "Data Structures", location: "Room 201", type: "lecture" },
      { userId: students[3].id, dayOfWeek: 2, startTime: "10:00", endTime: "12:00", subject: "Principles of Management", location: "Hall B", type: "lecture" },
      { userId: students[4].id, dayOfWeek: 4, startTime: "13:00", endTime: "15:00", subject: "Marketing Strategy", location: "Room 105", type: "lecture" },
    ],
  });

  console.log("\nFull seed complete.");
  console.log("  Admin:    admin@demo.edu / Admin123!");
  console.log("  Lecturer: amara@demo.edu / Lecturer123!");
  console.log("  Lecturer: fatmata@demo.edu / Lecturer123!");
  console.log("  Student:  mohamed@demo.edu / Student123!");
  console.log("  Student:  aminata@demo.edu / Student123!");
  console.log("  Student:  ibrahim@demo.edu / Student123!");
  console.log("  Student:  mariama@demo.edu / Student123!");
  console.log("  Student:  abdul@demo.edu / Student123!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
