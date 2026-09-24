import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SetupWizard } from "@/components/admin/setup-wizard";
import { RoleSetupForm } from "@/components/auth/role-setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  let settings: Awaited<ReturnType<typeof prisma.appSettings.findUnique>> | null = null;

  try {
    settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
    });
  } catch (error) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-4 py-8">
        <div className="max-w-xl rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">
            Database unavailable
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The app could not reach the database. Please check the DATABASE_URL in
            your .env file and start the Postgres instance, then reload this page.
          </p>
          {process.env.NODE_ENV !== "production" && (
            <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
              {String(error)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  // Before installation, this is the first-run wizard. Submitting it also
  // requires the server's SETUP_TOKEN, so simply reaching this page grants
  // nothing.
  if (!settings?.isSetupComplete) {
    return (
      <div className="flex w-full items-center justify-center px-4 py-8">
        <SetupWizard />
      </div>
    );
  }

  // After installation, this is student profile completion (post-OAuth).
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only students choose their own faculty. A lecturer's faculty is assigned by
  // the admin-issued access code, and an admin has none — sending either here
  // would offer a choice the API (correctly) refuses.
  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  if (session.user.facultyId && session.user.studentId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex w-full items-center justify-center px-4 py-8">
      <RoleSetupForm />
    </div>
  );
}
