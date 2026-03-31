import { SettingsForm } from "@/components/admin/settings-form";

export default function UniversitySettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">University Settings</h1>
        <p className="text-muted-foreground">
          Manage university configuration, academic structure, and policies
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
