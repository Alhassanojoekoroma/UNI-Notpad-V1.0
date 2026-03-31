import { prisma } from "@/lib/prisma";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";

export const metadata = {
  title: "Terms of Service — UniNotepad",
};

export default async function TermsPage() {
  const settings = await prisma.appSettings.findFirst({
    select: { termsOfService: true },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      {settings?.termsOfService ? (
        <MarkdownRenderer content={settings.termsOfService} />
      ) : (
        <p className="text-muted-foreground">
          Terms of Service have not been configured yet.
        </p>
      )}
    </div>
  );
}
