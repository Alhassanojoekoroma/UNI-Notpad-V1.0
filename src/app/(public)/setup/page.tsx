import { RoleSetupForm } from "@/components/auth/role-setup-form";

export default function SetupPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-8">
      <RoleSetupForm />
    </div>
  );
}
