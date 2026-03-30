import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, ExternalLink, Eye, Star } from "lucide-react";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { PdfViewer } from "@/components/content/pdf-viewer";
import { ContentRating } from "@/components/content/content-rating";
import { ContentFlag } from "@/components/content/content-flag";
import { ContentAccessLogger } from "./access-logger";

export default async function ContentViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) notFound();

  const content = await prisma.content.findUnique({
    where: { id, status: "ACTIVE" },
    include: {
      faculty: { select: { name: true } },
      program: { select: { name: true } },
      lecturer: { select: { id: true, name: true } },
      ratings: {
        where: { userId: session.user.id },
        select: { rating: true, feedbackText: true },
      },
    },
  });

  if (!content) notFound();

  // Faculty/semester check for students
  if (
    session.user.role === "STUDENT" &&
    (content.facultyId !== session.user.facultyId ||
      content.semester !== session.user.semester)
  ) {
    notFound();
  }

  const userRating = content.ratings[0];
  const contentTypeLabel =
    CONTENT_TYPE_LABELS[content.contentType as keyof typeof CONTENT_TYPE_LABELS] ??
    content.contentType;

  return (
    <div className="space-y-6">
      <ContentAccessLogger contentId={id} />

      <Link
        href="/content"
        className="inline-flex items-center text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="mr-1 size-3" />
        Back to materials
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{content.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{content.module}</span>
          <span>by {content.lecturer.name}</span>
          <Badge variant="secondary">{contentTypeLabel}</Badge>
          <Badge variant="outline">{content.fileType.toUpperCase()}</Badge>
        </div>
        {content.description && (
          <p className="mt-3 text-muted-foreground">{content.description}</p>
        )}
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="size-3" />
            {content.viewCount} views
          </span>
          <span className="flex items-center gap-1">
            <Download className="size-3" />
            {content.downloadCount} downloads
          </span>
          {content.averageRating && (
            <span className="flex items-center gap-1">
              <Star className="size-3 fill-yellow-500 text-yellow-500" />
              {content.averageRating.toFixed(1)}
            </span>
          )}
          <span>Uploaded {formatDate(content.createdAt)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button render={<a href={content.fileUrl} download target="_blank" rel="noopener" />}>
          <Download className="mr-2 size-4" />
          Download
        </Button>
        {content.tutorialLink && (
          <Button variant="outline" render={<a href={content.tutorialLink} target="_blank" rel="noopener noreferrer" />}>
            <ExternalLink className="mr-2 size-4" />
            Tutorial
          </Button>
        )}
      </div>

      <Separator />

      {/* Viewer */}
      {content.fileType === "pdf" && (
        <PdfViewer url={content.fileUrl} title={content.title} />
      )}
      {content.fileType === "pptx" && (
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(content.fileUrl)}&embedded=true`}
          className="w-full min-h-[600px] rounded-lg border"
          title={content.title}
        />
      )}
      {(content.fileType === "jpeg" || content.fileType === "png") && (
        <img
          src={content.fileUrl}
          alt={content.title}
          className="max-w-full rounded-lg border"
        />
      )}

      <Separator />

      <div className="flex items-start justify-between gap-4">
        <ContentRating
          contentId={id}
          currentRating={userRating?.rating}
          currentFeedback={userRating?.feedbackText}
        />
        <ContentFlag contentId={id} />
      </div>
    </div>
  );
}
