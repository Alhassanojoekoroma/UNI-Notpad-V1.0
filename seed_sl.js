const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const faculties = [
    { code: "FICT", name: "Faculty of Information & Communication Technology" },
    { code: "FCMB", name: "Faculty of Communication, Media & Broadcasting" },
    { code: "FBMG", name: "Faculty of Business Management and Globalization" },
    { code: "FABE", name: "Faculty of Built Environment" },
    { code: "FDI", name: "Faculty of Design Innovation" },
    { code: "FCTH", name: "Faculty of Creative Technology and Heritage" },
    { code: "ENG", name: "Faculty of Engineering & Architecture (FBC)" },
    { code: "SOC", name: "Faculty of Social Sciences & Law (FBC)" },
    { code: "SCI", name: "Faculty of Pure & Applied Sciences (FBC)" },
    { code: "ARTS", name: "Faculty of Arts & Communication (FBC)" },
    { code: "EDU", name: "Faculty of Education (FBC)" },
    { code: "IPAM", name: "Institute of Public Administration & Management" },
    { code: "COMAHS", name: "College of Medicine and Allied Health Sciences" },
    { code: "AGRI", name: "Faculty of Agriculture and Natural Resources (EBKUST)" },
    { code: "EDSS", name: "Faculty of Education and Social Sciences (EBKUST)" },
    { code: "FET", name: "Faculty of Engineering and Technology (EBKUST)" },
    { code: "NURS", name: "Faculty of Nursing and Health Sciences (UOL)" },
  ];

  for (const f of faculties) {
    const dbFac = await prisma.faculty.upsert({
      where: { code: f.code },
      update: { name: f.name },
      create: { name: f.name, code: f.code },
    });
    console.log(`Upserted Faculty: ${dbFac.name}`);
  }

  const getFac = async (code) => prisma.faculty.findUnique({ where: { code } });

  const fict = await getFac("FICT");
  const fcmb = await getFac("FCMB");
  const fbmg = await getFac("FBMG");
  const eng = await getFac("ENG");
  const ipam = await getFac("IPAM");
  const comahs = await getFac("COMAHS");
  const agri = await getFac("AGRI");
  const fet = await getFac("FET");
  const edss = await getFac("EDSS");
  const nurs = await getFac("NURS");
  const soc = await getFac("SOC");
  const arts = await getFac("ARTS");


  const programs = [
    // FICT
    { fac: fict, code: "SE", name: "BSc. (Hons) in Software Engineering" },
    { fac: fict, code: "BIT", name: "BSc. (Hons) in Business Information Technology" },
    { fac: fict, code: "IT", name: "BSc. (Hons) in Information Technology" },
    { fac: fict, code: "ICT", name: "BSc. (Hons) in Information Communication and Technology" },
    { fac: fict, code: "DIT", name: "Diploma in Information Technology" },

    // FCMB
    { fac: fcmb, code: "BPC", name: "Bachelor of Arts (Hons) in Professional Communication" },
    { fac: fcmb, code: "BDM", name: "Bachelor of Communication (Hons) in Digital Media" },
    { fac: fcmb, code: "BBJ", name: "Bachelor of Arts (Hons) in Broadcasting and Journalism" },
    { fac: fcmb, code: "DMAB", name: "Diploma in Multimedia, Advertisement, and Broadcasting" },

    // FBMG
    { fac: fbmg, code: "ENT", name: "Entrepreneurship" },
    { fac: fbmg, code: "IB", name: "International Business" },
    { fac: fbmg, code: "TM", name: "Tourism Management" },

    // ENG (FBC)
    { fac: eng, code: "MECH", name: "Mechanical & Maintenance Engineering" },
    { fac: eng, code: "CIV", name: "Civil Engineering" },
    { fac: eng, code: "EE", name: "Electrical & Electronic Engineering" },
    { fac: eng, code: "MINE", name: "Mining Engineering" },

    // SOC (FBC)
    { fac: soc, code: "LLB", name: "Law (LLB)" },
    { fac: soc, code: "SW", name: "Social Work" },
    
    // ARTS
    { fac: arts, code: "BJ", name: "Broadcast Journalism" },

    // IPAM
    { fac: ipam, code: "AF", name: "Accounting and Finance" },
    { fac: ipam, code: "BF", name: "Banking & Finance" },
    { fac: ipam, code: "BADMIN", name: "Business Administration" },
    { fac: ipam, code: "PA", name: "Public Administration" },

    // COMAHS
    { fac: comahs, code: "MBBS", name: "Medicine and Surgery (MBBS)" },
    { fac: comahs, code: "PHARM", name: "Pharmacy" },
    { fac: comahs, code: "NURS", name: "Nursing" },

    // EBKUST - AGRI
    { fac: agri, code: "AGECON", name: "BSc (Hons) in Agricultural Economics" },
    { fac: agri, code: "AGBUS", name: "BSc (Hons) in Agribusiness Management" },

    // EBKUST - EDSS
    { fac: edss, code: "MCOM", name: "Bachelor of Arts (B.A.) in Mass Communication" },
    { fac: edss, code: "BSW", name: "Bachelor of Science (BSc) in Social Work" },

    // EBKUST - FET
    { fac: fet, code: "CS", name: "Computer Science" },
    { fac: fet, code: "CIV-E", name: "Civil Engineering" },

    // UOL - NURS
    { fac: nurs, code: "MSNE", name: "Master of Science in Nursing Education (MSNE)" },
    { fac: nurs, code: "SOC-BSc", name: "Bachelor of Science in Sociology" },
    { fac: nurs, code: "AF-BSc", name: "Bachelor of Science in Accounting and Finance" },
    { fac: nurs, code: "BAM", name: "Bachelor of Science in Business Administration and Management" },
  ];

  for (const p of programs) {
    if (!p.fac) continue;
    const dbProg = await prisma.program.upsert({
      where: { facultyId_code: { facultyId: p.fac.id, code: p.code } },
      update: { name: p.name },
      create: { facultyId: p.fac.id, name: p.name, code: p.code },
    });
    console.log(`Upserted Program: ${dbProg.name} under ${p.fac.code}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
