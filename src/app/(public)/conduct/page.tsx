import { prisma } from "@/lib/prisma";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";

export const metadata = {
  title: "Code of Conduct — UniNotepad",
};

export default async function ConductPage() {
  const settings = await prisma.appSettings.findFirst({
    select: { codeOfConduct: true },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Code of Conduct</h1>
      {settings?.codeOfConduct ? (
        <MarkdownRenderer content={settings.codeOfConduct} />
      ) : (
        <p className="text-muted-foreground">
          Code of Conduct has not been configured yet.
        </p>
      )}
    </div>
  );
}
