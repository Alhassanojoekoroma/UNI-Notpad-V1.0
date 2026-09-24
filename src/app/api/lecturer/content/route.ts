import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { contentUploadSchema } from "@/lib/validators/content";
import { requireLecturerScope, requireRole } from "@/lib/rbac";
import { verifyFileType } from "@/lib/file-signature";
import { MAX_FILE_SIZE, SUPPORTED_FILE_TYPES } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const guard = await requireRole("LECTURER");
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    const where: Record<string, unknown> = {
      lecturerId: guard.user.id,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { module: { contains: search, mode: "insensitive" } },
      ];
    }

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
        include: {
          faculty: { select: { name: true } },
          program: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.content.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: content,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Lecturer content fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Requires a lecturer who has been assigned a faculty by an administrator.
    const guard = await requireLecturerScope();
    if (!guard.ok) return guard.response;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 }
      );
    }

    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported file type. Allowed: PDF, PPTX, DOCX, JPEG, PNG",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Read once, then verify the bytes actually match the declared type.
    // `file.type` is a client-supplied header, so on its own it let any payload
    // be uploaded as "application/pdf" and served from the university's CDN.
    const buffer = Buffer.from(await file.arrayBuffer());
    const verified = verifyFileType(buffer, file.type, file.name);
    if (!verified.ok) {
      return NextResponse.json(
        { success: false, error: verified.error },
        { status: 400 }
      );
    }

    // Parse metadata from form data
    const metadata = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      facultyId: formData.get("facultyId") as string,
      semester: Number(formData.get("semester")),
      week: Number(formData.get("week")) || 1,
      programId: (formData.get("programId") as string) || undefined,
      module: formData.get("module") as string,
      moduleCode: (formData.get("moduleCode") as string) || undefined,
      contentType: formData.get("contentType") as string,
      tutorialLink: (formData.get("tutorialLink") as string) || undefined,
    };

    const parsed = contentUploadSchema.safeParse(metadata);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Lecturers may only publish into the faculty an administrator assigned
    // them. `requireLecturerScope` has already guaranteed a faculty exists.
    if (parsed.data.facultyId !== guard.user.facultyId) {
      return NextResponse.json(
        { success: false, error: "You can only upload content to your assigned faculty" },
        { status: 403 }
      );
    }

    // Program, when supplied, must belong to that same faculty.
    if (parsed.data.programId) {
      const program = await prisma.program.findFirst({
        where: {
          id: parsed.data.programId,
          facultyId: guard.user.facultyId,
          isActive: true,
        },
        select: { id: true },
      });
      if (!program) {
        return NextResponse.json(
          { success: false, error: "Invalid program for your faculty" },
          { status: 400 }
        );
      }
    }

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const upload_stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "content",
          timeout: 60000, // 60 second timeout
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else if (!result) {
            reject(new Error("Cloudinary returned no result"));
          } else {
            resolve(result);
          }
        }
      );
      
      // Handle stream errors
      upload_stream.on("error", (err) => {
        reject(new Error(`Upload stream error: ${err.message}`));
      });
      
      // Write buffer to stream
      upload_stream.end(buffer);
    });

    const content = await prisma.content.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        fileUrl: uploadResult.secure_url,
        filePublicId: uploadResult.public_id,
        // Extension comes from the verified signature, not the client header.
        fileType: verified.extension!,
        fileSize: file.size,
        facultyId: parsed.data.facultyId,
        semester: parsed.data.semester,
        week: parsed.data.week,
        programId: parsed.data.programId,
        module: parsed.data.module,
        moduleCode: parsed.data.moduleCode,
        contentType: parsed.data.contentType,
        lecturerId: guard.user.id,
        tutorialLink: parsed.data.tutorialLink,
      },
    }).catch(async (dbError) => {
      // The upload already succeeded, so a failed insert would strand the file
      // in Cloudinary forever. Roll it back before rethrowing.
      await cloudinary.uploader
        .destroy(uploadResult.public_id, { resource_type: "auto" })
        .catch((cleanupError) =>
          console.error(
            "Failed to clean up orphaned Cloudinary asset",
            uploadResult.public_id,
            cleanupError
          )
        );
      throw dbError;
    });

    // Notify active students in the matching faculty/semester.
    // A single `createMany` replaces one INSERT per student issued through an
    // unbounded `Promise.all`, which could open thousands of concurrent queries
    // (and exhaust the Neon pool) on a large faculty.
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        facultyId: parsed.data.facultyId,
        semester: parsed.data.semester,
        deletedAt: null,
        isSuspended: false,
        isActive: true,
      },
      select: { id: true },
    });

    if (students.length > 0) {
      const body = `${guard.user.name ?? "A lecturer"} uploaded "${parsed.data.title}" in ${parsed.data.module}`;
      await prisma.notification.createMany({
        data: students.map((s) => ({
          userId: s.id,
          type: "NEW_CONTENT" as const,
          title: "New Content Available",
          body,
          referenceType: "content",
          referenceId: content.id,
        })),
      });
    }

    return NextResponse.json(
      { success: true, data: content },
      { status: 201 }
    );
  } catch (error) {
    // Details stay in the server log — returning `error.message` leaked
    // Cloudinary and Prisma internals to the client.
    console.error("Content upload error:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
