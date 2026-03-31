"use client";

import { use } from "react";
import Link from "next/link";
import { PostDetail } from "@/components/forum/post-detail";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ module: string; postId: string }>;
}) {
  const { module, postId } = use(params);
  const decodedModule = decodeURIComponent(module);

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/forum" />}>
              Forum
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={
                <Link href={`/forum/${encodeURIComponent(decodedModule)}`} />
              }
            >
              {decodedModule}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Post</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PostDetail postId={postId} />
    </div>
  );
}
