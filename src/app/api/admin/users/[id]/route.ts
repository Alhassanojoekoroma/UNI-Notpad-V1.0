import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/validators/admin";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        isSuspended: true,
        suspendedReason: true,
        isActive: true,
        studentId: true,
        createdAt: true,
        faculty: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
        _count: {
          select: {
            content: true,
            aiInteractions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Prevent admin from changing their own role
    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot modify your own account via admin panel" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = userUpdateSchema.parse(body);

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    // Determine action for audit log
    let action = "user.updated";
    if (data.role !== undefined) action = "user.role_changed";
    if (data.isSuspended === true) action = "user.suspended";
    if (data.isSuspended === false) action = "user.unsuspended";
    if (data.isActive === false) action = "user.deactivated";

    await createAuditLog({
      userId: session.user.id!,
      action,
      entityType: "user",
      entityId: id,
      metadata: data as Record<string, unknown>,
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      userId: session.user.id!,
      action: "user.deleted",
      entityType: "user",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
