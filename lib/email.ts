/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@supabase/ssr";
import { Resend } from "resend";
import type { Database } from "@/types/supabase.types";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string;
  hotelId?: string | null;
}

export interface SendEmailResult {
  sent: boolean;
  mode: "resend" | "simulated";
  providerId?: string | null;
  error?: string | null;
}

function createStatelessSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  }) as any;
}

function isConfiguredResendKey(key?: string): key is string {
  if (!key) return false;
  const trimmed = key.trim();
  if (!trimmed) return false;
  if (trimmed === "re_your_resend_key" || trimmed.includes("your_resend_key")) {
    return false;
  }
  return true;
}

function resolveFromAddress(): string {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  const hotelName = process.env.NEXT_PUBLIC_HOTEL_NAME?.trim() || "Grand Azure Hotel";
  if (!configured || configured === "noreply@yourdomain.com") {
    return `${hotelName} <onboarding@resend.dev>`;
  }
  return configured.includes("<") ? configured : `${hotelName} <${configured}>`;
}

/**
 * Sends an email via Resend when a valid RESEND_API_KEY is configured,
 * logs every dispatch in `email_logs`, and gracefully simulates delivery
 * in local/dev environments without crashing the caller.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = resolveFromAddress();
  const hotelId =
    input.hotelId ||
    process.env.NEXT_PUBLIC_HOTEL_ID ||
    "11111111-0000-0000-0000-000000000001";

  let sent = false;
  let mode: "resend" | "simulated" = "simulated";
  let providerId: string | null = null;
  let errorMsg: string | null = null;
  let logStatus = "logged_local";

  if (isConfiguredResendKey(apiKey)) {
    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      });

      if (error) {
        errorMsg = error.message || "Resend delivery failed";
        logStatus = "failed";
        console.error("[Email] Resend error:", errorMsg);
      } else {
        sent = true;
        mode = "resend";
        providerId = data?.id ?? null;
        logStatus = "sent";
      }
    } catch (err: any) {
      errorMsg = err?.message || "Unexpected Resend exception";
      logStatus = "failed";
      console.error("[Email] Exception sending via Resend:", errorMsg);
    }
  } else {
    console.info(
      `[Email Simulated] To: ${input.to} | Subject: ${input.subject}\n${input.text}`
    );
  }

  // Persist audit entry in email_logs (non-fatal if DB unavailable)
  try {
    const supabase = createStatelessSupabase();
    if (supabase) {
      await supabase.from("email_logs").insert({
        hotel_id: hotelId,
        recipient_email: input.to,
        subject: input.subject,
        template: input.template,
        status: logStatus,
        provider: "resend",
        provider_id: providerId,
        error: errorMsg,
        sent_at: new Date().toISOString(),
      });
    }
  } catch (logErr: any) {
    console.warn("[Email] Failed to write email_logs:", logErr?.message ?? logErr);
  }

  return { sent, mode, providerId, error: errorMsg };
}

export function formatPhp(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}
