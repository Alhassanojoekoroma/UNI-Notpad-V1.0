import { LecturerCodes } from "@/components/admin/lecturer-codes";

export default function LecturerCodesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lecturer Codes</h1>
        <p className="text-muted-foreground">
          Generate and manage lecturer access codes
        </p>
      </div>
      <LecturerCodes />
    </div>
  );
}
