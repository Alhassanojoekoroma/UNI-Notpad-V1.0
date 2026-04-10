import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { contentUploadSchema } from "@/lib/validators/content";
import { createNotification } from "@/lib/notifications";
import { MAX_FILE_SIZE, SUPPORTED_FILE_TYPES } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "LECTURER") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    const where: Record<string, unknown> = {
      lecturerId: session.user.id,
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
    const session = await auth();
    if (!session?.user || session.user.role !== "LECTURER") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    // Parse metadata from form data
    const metadata = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      facultyId: formData.get("facultyId") as string,
      semester: Number(formData.get("semester")),
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

    // Validate lecturer has authority over the target faculty
    if (session.user.facultyId && parsed.data.facultyId !== session.user.facultyId) {
      return NextResponse.json(
        { success: false, error: "You can only upload content to your assigned faculty" },
        { status: 403 }
      );
    }

    // Upload file to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "content",
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    // Derive file type extension
    const fileTypeMap: Record<string, string> = {
      "application/pdf": "pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "pptx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "image/jpeg": "jpeg",
      "image/png": "png",
    };

    const content = await prisma.content.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        fileUrl: uploadResult.secure_url,
        filePublicId: uploadResult.public_id,
        fileType: fileTypeMap[file.type] ?? file.type,
        fileSize: file.size,
        facultyId: parsed.data.facultyId,
        semester: parsed.data.semester,
        programId: parsed.data.programId,
        module: parsed.data.module,
        moduleCode: parsed.data.moduleCode,
        contentType: parsed.data.contentType,
        lecturerId: session.user.id,
        tutorialLink: parsed.data.tutorialLink,
      },
    });

    // Notify students in matching faculty/semester
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        facultyId: parsed.data.facultyId,
        semester: parsed.data.semester,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (students.length > 0) {
      await Promise.all(
        students.map((s) =>
          createNotification(
            s.id,
            "NEW_CONTENT",
            "New Content Available",
            `${session.user.name} uploaded "${parsed.data.title}" in ${parsed.data.module}`,
            "content",
            content.id
          )
        )
      );
    }

    return NextResponse.json(
      { success: true, data: content },
      { status: 201 }
    );
  } catch (error) {
    console.error("Content upload error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
