"use client";

import { useEffect } from "react";

export function ContentAccessLogger({ contentId }: { contentId: string }) {
  useEffect(() => {
    fetch(`/api/content/${contentId}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessType: "view" }),
    }).catch(() => {});
  }, [contentId]);

  return null;
}
