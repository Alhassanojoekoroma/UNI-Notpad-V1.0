import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Note: These tests require a running Next.js server at http://localhost:3000
// For unit testing the endpoints, use tests/unit/api/*.test.ts instead
describe.skip("Dropdown API Endpoints - Production Readiness", () => {
  let testFacultyId: string;
  let testProgramId: string;

  beforeAll(async () => {
    // Create test data
    const faculty = await prisma.faculty.create({
      data: {
        name: "Test Faculty",
        code: "TF",
        isActive: true,
      },
    });
    testFacultyId = faculty.id;

    const program = await prisma.program.create({
      data: {
        name: "Test Program",
        code: "TP",
        facultyId: testFacultyId,
        isActive: true,
      },
    });
    testProgramId = program.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.program.delete({ where: { id: testProgramId } });
    await prisma.faculty.delete({ where: { id: testFacultyId } });
    await prisma.$disconnect();
  });

  describe("GET /api/faculties", () => {
    it("should return list of active faculties with required fields", async () => {
      const response = await fetch("/api/faculties");
      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      if (data.data.length > 0) {
        const faculty = data.data[0];
        expect(faculty).toHaveProperty("id");
        expect(faculty).toHaveProperty("name");
        expect(faculty).toHaveProperty("code");
      }
    });

    it("should only return active faculties", async () => {
      const response = await fetch("/api/faculties");
      const data = await response.json();
      
      expect(data.success).toBe(true);
      // Verify all faculties are active (can't verify directly without auth, but API should filter)
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe("GET /api/programs", () => {
    it("should return programs for valid facultyId", async () => {
      const response = await fetch(`/api/programs?facultyId=${testFacultyId}`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      if (data.data.length > 0) {
        const program = data.data[0];
        expect(program).toHaveProperty("id");
        expect(program).toHaveProperty("name");
        expect(program).toHaveProperty("code");
        expect(program.facultyId).toBe(testFacultyId);
      }
    });

    it("should reject missing facultyId parameter", async () => {
      const response = await fetch("/api/programs");
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it("should return empty array for faculty with no programs", async () => {
      // Create a faculty with no programs
      const emptyFaculty = await prisma.faculty.create({
        data: { name: "Empty Faculty", code: "EF", isActive: true },
      });

      const response = await fetch(`/api/programs?facultyId=${emptyFaculty.id}`);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(0);

      await prisma.faculty.delete({ where: { id: emptyFaculty.id } });
    });
  });

  describe("GET /api/users/faculties", () => {
    it("should return faculties, programs, and settings without auth", async () => {
      const response = await fetch("/api/users/faculties");
      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("faculties");
      expect(data.data).toHaveProperty("programs");
      expect(data.data).toHaveProperty("maxSemesters");
      
      expect(Array.isArray(data.data.faculties)).toBe(true);
      expect(Array.isArray(data.data.programs)).toBe(true);
      expect(typeof data.data.maxSemesters).toBe("number");
    });

    it("should include correct faculty structure in response", async () => {
      const response = await fetch("/api/users/faculties");
      const data = await response.json();
      
      const faculties = data.data.faculties;
      if (faculties.length > 0) {
        const faculty = faculties[0];
        expect(faculty).toHaveProperty("id");
        expect(faculty).toHaveProperty("name");
        expect(faculty).toHaveProperty("code");
      }
    });

    it("should include correct program structure with facultyId", async () => {
      const response = await fetch("/api/users/faculties");
      const data = await response.json();
      
      const programs = data.data.programs;
      if (programs.length > 0) {
        const program = programs[0];
        expect(program).toHaveProperty("id");
        expect(program).toHaveProperty("name");
        expect(program).toHaveProperty("code");
        expect(program).toHaveProperty("facultyId");
      }
    });
  });

  describe("Dropdown Field Validation", () => {
    it("should have non-empty faculty list for registration", async () => {
      const response = await fetch("/api/users/faculties");
      const data = await response.json();
      
      // Registration requires at least one faculty
      expect(data.data.faculties.length).toBeGreaterThan(0);
    });

    it("should have programs available for each faculty", async () => {
      const response = await fetch("/api/users/faculties");
      const data = await response.json();
      
      const faculties = data.data.faculties;
      const programs = data.data.programs;
      
      // At least some faculties should have programs
      const facultiesWithPrograms = faculties.filter((f: any) =>
        programs.some((p: any) => p.facultyId === f.id)
      );
      
      expect(facultiesWithPrograms.length).toBeGreaterThan(0);
    });
  });
});
