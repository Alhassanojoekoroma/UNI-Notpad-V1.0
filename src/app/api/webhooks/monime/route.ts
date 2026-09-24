import { NextResponse } from "next/server";

/**
 * Monime webhook — NOT IMPLEMENTED.
 *
 * See the Stripe handler for the rationale: returning 200 to a payment
 * provider for an event that was never recorded suppresses the provider's
 * retries and can take payment without granting tokens.
 *
 * See docs/SYSTEM_AUDIT.md → Remaining deployment risks.
 */
export async function POST() {
  return NextResponse.json(
    { success: false, error: "Monime webhook handling is not implemented" },
    { status: 501 },
  );
}
