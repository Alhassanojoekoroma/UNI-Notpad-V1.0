import { NextResponse } from "next/server";

/**
 * Stripe webhook — NOT IMPLEMENTED.
 *
 * `TokenBalance` and `TokenTransaction` exist and the AI billing path reads
 * them, but nothing credits a balance yet. This handler deliberately returns
 * 501 rather than the previous `200 {status:"ok"}`: answering OK told Stripe a
 * payment event had been processed successfully when nothing was recorded,
 * so failed top-ups would never be retried and money could be taken without
 * tokens being granted.
 *
 * Implementing this requires signature verification with STRIPE_WEBHOOK_SECRET
 * before any body parsing. See docs/SYSTEM_AUDIT.md → Remaining deployment risks.
 */
export async function POST() {
  return NextResponse.json(
    { success: false, error: "Stripe webhook handling is not implemented" },
    { status: 501 },
  );
}
