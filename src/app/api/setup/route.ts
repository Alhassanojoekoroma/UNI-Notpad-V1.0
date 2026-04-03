import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setupWizardSchema } from "@/lib/validators/admin";
import { DEFAULT_PRIVACY_POLICY } from "@/lib/defaults/privacy-policy";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    // Check if setup is already complete
    const existing = await prisma.appSettings.findUnique({
      where: { id: "default" },
    });

    if (existing?.isSetupComplete) {
      return NextResponse.json(
        { success: false, error: "Setup is already complete" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = setupWizardSchema.parse(body);

    const hashedPassword = await bcrypt.hash(data.adminPassword, 12);

    await prisma.$transaction(async (tx) => {
      // Create admin user
      await tx.user.create({
        data: {
          name: data.adminName,
          email: data.adminEmail,
          password: hashedPassword,
          role: "ADMIN",
        },
      });

      // Create faculties and programs
      for (const faculty of data.faculties) {
        const created = await tx.faculty.create({
          data: {
            name: faculty.name,
            code: faculty.code,
          },
        });

        if (faculty.programs?.length) {
          await tx.program.createMany({
            data: faculty.programs.map((p) => ({
              name: p.name,
              code: p.code,
              facultyId: created.id,
            })),
          });
        }
      }

      // Upsert AppSettings
      await tx.appSettings.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          universityName: data.universityName,
          universityLogo: data.universityLogo ?? null,
          primaryColor: data.primaryColor ?? "#7c3aed",
          secondaryColor: data.secondaryColor ?? "#1e1e1e",
          studentIdPattern: data.studentIdPattern ?? "^90500\\d{4,}$",
          geminiApiKey: data.geminiApiKey,
          resendApiKey: data.resendApiKey,
          cloudinaryCloudName: data.cloudinaryCloudName,
          cloudinaryApiKey: data.cloudinaryApiKey,
          cloudinaryApiSecret: data.cloudinaryApiSecret,
          elevenlabsApiKey: data.elevenlabsApiKey ?? null,
          monimeApiKey: data.monimeApiKey ?? null,
          stripeSecretKey: data.stripeSecretKey ?? null,
          termsOfService: data.termsOfService ?? null,
          privacyPolicy: data.privacyPolicy || DEFAULT_PRIVACY_POLICY,
          codeOfConduct: data.codeOfConduct ?? null,
          isSetupComplete: true,
        },
        update: {
          universityName: data.universityName,
          universityLogo: data.universityLogo ?? null,
          primaryColor: data.primaryColor ?? "#7c3aed",
          secondaryColor: data.secondaryColor ?? "#1e1e1e",
          studentIdPattern: data.studentIdPattern ?? "^90500\\d{4,}$",
          geminiApiKey: data.geminiApiKey,
          resendApiKey: data.resendApiKey,
          cloudinaryCloudName: data.cloudinaryCloudName,
          cloudinaryApiKey: data.cloudinaryApiKey,
          cloudinaryApiSecret: data.cloudinaryApiSecret,
          elevenlabsApiKey: data.elevenlabsApiKey ?? null,
          monimeApiKey: data.monimeApiKey ?? null,
          stripeSecretKey: data.stripeSecretKey ?? null,
          termsOfService: data.termsOfService ?? null,
          privacyPolicy: data.privacyPolicy || DEFAULT_PRIVACY_POLICY,
          codeOfConduct: data.codeOfConduct ?? null,
          isSetupComplete: true,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    console.error("Setup error:", error);
    return NextResponse.json(
      { success: false, error: "Setup failed" },
      { status: 500 }
    );
  }
}
