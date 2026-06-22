import { Resend } from "resend";
import { readEnv } from "./env";

let emailClient: Resend | null = null;

/** Returns null when RESEND_API_KEY is unset — callers should treat email as best-effort. */
function getEmailClient(): Resend | null {
  const apiKey = readEnv("RESEND_API_KEY");
  if (!apiKey) {
    return null;
  }
  if (!emailClient) {
    emailClient = new Resend(apiKey);
  }
  return emailClient;
}

function getFromAddress(): string {
  return readEnv("EMAIL_FROM") || "ADUflow <onboarding@resend.dev>";
}

/**
 * Best-effort transactional email. Returns true if a send was attempted and
 * accepted by Resend, false if email isn't configured or the send failed —
 * callers should never let a false result block the action that triggered it.
 */
export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<boolean> {
  const client = getEmailClient();
  if (!client) return false;

  try {
    const { error } = await client.emails.send({
      from: getFromAddress(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.warn("Resend send error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("Resend send exception:", e);
    return false;
  }
}
