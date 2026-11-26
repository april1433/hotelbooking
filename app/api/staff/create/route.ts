/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { ROLE_LABELS } from "@/constants";

const DEFAULT_HOTEL_ID =
  process.env.NEXT_PUBLIC_HOTEL_ID || "11111111-0000-0000-0000-000000000001";

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password, phone, role } = await req.json();

    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const supabase = (await createAdminClient()) as any;
    const cleanEmail = email.trim();
    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
    }

    // 2. Upsert profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          hotel_id: DEFAULT_HOTEL_ID,
          email: cleanEmail,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: displayName,
          phone: phone || null,
          role,
          is_active: true,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      // Roll back auth user if profile fails
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 3. Send login credentials directly to the new staff member's email
    const hotelName = process.env.NEXT_PUBLIC_HOTEL_NAME || "Grand Azure Hotel & Resort";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const loginUrl = `${siteUrl}/auth/login`;
    const roleLabel = ROLE_LABELS[role] || role;

    const subject = `Your ${hotelName} Staff Account Credentials`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
        <div style="background:#1a2744;color:#ffffff;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:20px;color:#e2ae38;">${hotelName}</h1>
          <p style="margin:6px 0 0 0;font-size:13px;color:#cbd5e1;">Staff Portal Account Credentials</p>
        </div>
        <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;background:#ffffff;">
          <p style="font-size:15px;">Hello <strong>${displayName}</strong>,</p>
          <p style="font-size:14px;color:#334155;line-height:1.6;">
            Your staff account for <strong>${hotelName}</strong> has been created with the role of <strong>${roleLabel}</strong>. Here are your login details:
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:18px 0;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:6px 0;color:#475569;">Username / Email</td>
                <td style="padding:6px 0;text-align:right;font-weight:700;color:#0f172a;">${cleanEmail}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#475569;">Password</td>
                <td style="padding:6px 0;text-align:right;font-weight:700;font-family:monospace;color:#0f172a;">${password}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#475569;">Assigned Role</td>
                <td style="padding:6px 0;text-align:right;font-weight:600;color:#b45309;">${roleLabel}</td>
              </tr>
            </table>
          </div>
          <p style="margin:20px 0;">
            <a href="${loginUrl}" style="display:inline-block;background:#c9a96e;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px;font-size:14px;">
              Sign In to Staff Portal
            </a>
          </p>
          <p style="font-size:12px;color:#64748b;line-height:1.5;">
            Login URL: <a href="${loginUrl}">${loginUrl}</a><br/>
            Please keep your credentials confidential and change your password after signing in.
          </p>
        </div>
      </div>
    `;

    const text = [
      `Hello ${displayName},`,
      "",
      `Your staff account for ${hotelName} has been created.`,
      `Role: ${roleLabel}`,
      `Username / Email: ${cleanEmail}`,
      `Password: ${password}`,
      `Login URL: ${loginUrl}`,
      "",
      "Please keep your login details confidential.",
    ].join("\n");

    const emailResult = await sendEmail({
      to: cleanEmail,
      subject,
      html,
      text,
      template: "staff_credentials",
      hotelId: DEFAULT_HOTEL_ID,
    });

    return NextResponse.json({
      success: true,
      userId,
      recipientEmail: cleanEmail,
      emailSent: emailResult.sent,
      emailMode: emailResult.mode,
    });
  } catch (err: any) {
    console.error("Staff create error:", err);
    return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
  }
}
