import { UploadForm } from "@/components/lecturer/upload-form";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Content</h1>
        <p className="text-muted-foreground">
          Share course materials with students in your faculty
        </p>
      </div>
      <UploadForm />
    </div>
  );
}
