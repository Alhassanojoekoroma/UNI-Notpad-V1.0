import { prisma } from "@/lib/prisma";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";

export const metadata = {
  title: "Privacy Policy — UniNotepad",
};

export default async function PrivacyPage() {
  const settings = await prisma.appSettings.findFirst({
    select: { privacyPolicy: true },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      {settings?.privacyPolicy ? (
        <MarkdownRenderer content={settings.privacyPolicy} />
      ) : (
        <p className="text-muted-foreground">
          Privacy Policy has not been configured yet.
        </p>
      )}
    </div>
  );
}
