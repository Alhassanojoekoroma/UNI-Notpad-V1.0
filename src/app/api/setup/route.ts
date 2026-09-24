import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setupWizardSchema } from "@/lib/validators/admin";
import { DEFAULT_PRIVACY_POLICY } from "@/lib/defaults/privacy-policy";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";

/** Constant-time string comparison that tolerates differing lengths. */
function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still burn a comparison so length is not leaked by timing.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * First-run installation wizard.
 *
 * Creating the first ADMIN account and writing every API key is the most
 * privileged operation in the system, so `isSetupComplete === false` is not a
 * sufficient gate on its own: between deployment and the operator finishing the
 * wizard, anyone who found the URL could claim the instance. A `SETUP_TOKEN`
 * from the server environment must also be presented.
 */
export async function POST(request: Request) {
  try {
    const expectedToken = process.env.SETUP_TOKEN;
    if (!expectedToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Setup is disabled. Set SETUP_TOKEN in the server environment to enable the installation wizard.",
        },
        { status: 503 }
      );
    }

    const providedToken = request.headers.get("x-setup-token") ?? "";
    if (!timingSafeEqualString(providedToken, expectedToken)) {
      return NextResponse.json(
        { success: false, error: "Invalid setup token" },
        { status: 403 }
      );
    }

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
          email: data.adminEmail.trim().toLowerCase(),
          password: hashedPassword,
          role: "ADMIN",
          termsAccepted: true,
          privacyAccepted: true,
          tokenBalance: { create: {} },
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
