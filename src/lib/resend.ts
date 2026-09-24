import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

/**
 * Resend client, created lazily.
 *
 * `new Resend(undefined)` throws "Missing API key" at construction, so building
 * this at module scope crashed `next build` on any deployment without
 * RESEND_API_KEY set. (It previously went unnoticed only because nothing
 * imported this file.) Email is optional infrastructure — a missing key must
 * degrade to a logged warning, not a failed build.
 */
let client: Resend | null = null;
let clientKey: string | null = null;

function getClient(apiKey: string): Resend {
  if (!client || clientKey !== apiKey) {
    client = new Resend(apiKey);
    clientKey = apiKey;
  }
  return client;
}

/**
 * Resolve the API key. Environment variables take precedence over the copy in
 * `AppSettings` so operators can keep secrets out of Postgres entirely.
 */
async function resolveApiKey(): Promise<string | null> {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY;
  try {
    const settings = await prisma.appSettings.findFirst({
      select: { resendApiKey: true },
    });
    return settings?.resendApiKey ?? null;
  } catch {
    return null;
  }
}

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  );
}

function fromAddress(): string {
  return process.env.EMAIL_FROM ?? "UniNotepad <onboarding@resend.dev>";
}

/** True when this instance can actually deliver email. */
export async function isEmailConfigured(): Promise<boolean> {
  return (await resolveApiKey()) !== null;
}

interface SendEmailArgs {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  /** Overrides the default From address. */
  from?: string;
}

/**
 * Send a transactional email. Returns whether it was actually delivered.
 *
 * Never throws: callers are side paths (account-deletion notices, reset links)
 * where a mail outage must not fail the operation the user actually requested.
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  from,
}: SendEmailArgs): Promise<boolean> {
  const apiKey = await resolveApiKey();
  if (!apiKey) {
    console.error(
      `[email] No Resend API key configured — "${subject}" was NOT sent to the user.`,
    );
    return false;
  }

  try {
    await getClient(apiKey).emails.send({
      from: from ?? fromAddress(),
      to,
      subject,
      ...(html ? { html } : { text: text ?? "" }),
    } as Parameters<Resend["emails"]["send"]>[0]);
    return true;
  } catch (error) {
    console.error(`[email] Failed to send "${subject}":`, error);
    return false;
  }
}

interface PasswordResetEmail {
  to: string;
  name: string | null;
  token: string;
}

/**
 * Send the password-reset link.
 *
 * Delivery failures are logged but never thrown: the caller must return the
 * same generic success response whether or not the address exists, otherwise
 * the endpoint becomes a user-enumeration oracle.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  token,
}: PasswordResetEmail): Promise<void> {
  const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const apiKey = await resolveApiKey();

  if (!apiKey) {
    // Loud on the server, silent to the client. Without this an operator has no
    // signal that password resets are going nowhere.
    console.error(
      "[email] No Resend API key configured — password reset email was NOT sent. " +
        "Set RESEND_API_KEY, or configure it in Admin → Settings.",
    );
    if (process.env.NODE_ENV === "development") {
      console.info(`[email] Development reset link: ${resetUrl}`);
    }
    return;
  }

  const greeting = name ? `Hi ${name},` : "Hi,";

  try {
    await getClient(apiKey).emails.send({
      from: fromAddress(),
      to,
      subject: "Reset your UniNotepad password",
      text: [
        greeting,
        "",
        "We received a request to reset your UniNotepad password.",
        "Open the link below to choose a new one. It expires in one hour.",
        "",
        resetUrl,
        "",
        "If you did not request this, you can safely ignore this email — your password will not change.",
      ].join("\n"),
    });
  } catch (error) {
    console.error("[email] Failed to send password reset email:", error);
  }
}
