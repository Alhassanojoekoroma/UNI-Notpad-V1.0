import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SetupWizard } from "@/components/admin/setup-wizard";
import { RoleSetupForm } from "@/components/auth/role-setup-form";

export default async function SetupPage() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });

  // If setup isn't complete, show admin setup wizard
  if (!settings?.isSetupComplete) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-8">
        <SetupWizard />
      </div>
    );
  }

  // If setup is complete, this page is for user profile/role setup
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // If user already has faculty set, they don't need setup
  if (session.user.facultyId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-8">
      <RoleSetupForm />
    </div>
  );
}
