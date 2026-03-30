import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskInviteSchema } from "@/lib/validators/task";
import { createNotification } from "@/lib/notifications";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task || task.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = taskInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { inviteeEmail } = parsed.data;

    // Check if already invited
    const existing = await prisma.taskInvitation.findUnique({
      where: { taskId_inviteeEmail: { taskId: id, inviteeEmail } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "User already invited" },
        { status: 409 }
      );
    }

    const invitation = await prisma.taskInvitation.create({
      data: {
        taskId: id,
        inviterId: session.user.id,
        inviteeEmail,
      },
    });

    // Notify the invitee if they have an account
    const invitee = await prisma.user.findUnique({
      where: { email: inviteeEmail },
    });

    if (invitee) {
      await createNotification(
        invitee.id,
        "TASK_DEADLINE",
        "Task Invitation",
        `${session.user.name ?? "Someone"} invited you to collaborate on "${task.title}"`,
        "task",
        task.id
      );
    }

    return NextResponse.json(
      { success: true, data: invitation },
      { status: 201 }
    );
  } catch (error) {
    console.error("Task invite error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
