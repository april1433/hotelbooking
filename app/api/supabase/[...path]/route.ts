/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getLocalDb } from "@/lib/local-db/db";
import { handlePostgrestRequest } from "@/lib/local-db/postgrest-parser";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, await params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, await params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, await params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, await params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(request, await params);
}

async function handleRequest(request: NextRequest, params: { path: string[] }) {
  try {
    const db = await getLocalDb();
    const pathParts = params.path || [];
    const url = new URL(request.url);

    // ── 1. AUTH API HANDLERS ────────────────────────────────────────────────
    if (pathParts[0] === "auth" && pathParts[1] === "v1") {
      const authEndpoint = pathParts.slice(2).join("/");

      // ── LOGIN / TOKEN ─────────────────────────────────────────────────────
      if (authEndpoint === "token" || authEndpoint.startsWith("token?")) {
        let body: any = {};
        try {
          body = await request.json();
        } catch {
          body = {};
        }

        const inputEmail = (body.email || url.searchParams.get("email") || "").trim();
        const password = body.password || "123123";

        if (!inputEmail) {
          return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const emailShortcuts: Record<string, string> = {
          super: "super@grandazure.com",
          admin: "admin@grandazure.com",
          manager: "manager@grandazure.com",
          reception: "reception@grandazure.com",
          housekeeping: "housekeeping@grandazure.com",
          cashier: "cashier@grandazure.com",
          maintenance: "maintenance@grandazure.com",
          guest: "guest@grandazure.com",
        };

        const email = emailShortcuts[inputEmail.toLowerCase()] || inputEmail;

        const userRes = await db.query<any>(
          `SELECT * FROM auth.users WHERE LOWER(email) = LOWER($1) LIMIT 1;`,
          [email]
        );

        let user = userRes.rows[0];

        // Check password against encrypted_password (or default '123123')
        if (user && user.encrypted_password && user.encrypted_password !== password && password !== "123123") {
          return NextResponse.json(
            { error: "Invalid login credentials", code: "invalid_credentials" },
            { status: 400 }
          );
        }

        if (!user && password !== "123123") {
          return NextResponse.json(
            { error: "Invalid login credentials", code: "invalid_credentials" },
            { status: 400 }
          );
        }

        // Auto-create in auth.users if in profiles but not yet in auth.users
        if (!user) {
          const profileRes = await db.query<any>(
            `SELECT * FROM profiles WHERE LOWER(email) = LOWER($1) LIMIT 1;`,
            [email]
          );
          const profile = profileRes.rows[0];
          const newId = profile?.id ?? crypto.randomUUID();
          const role = profile?.role ?? "guest";
          const newUserRes = await db.query<any>(
            `INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
             RETURNING *;`,
            [newId, email, password, JSON.stringify({ first_name: profile?.first_name ?? "User", last_name: profile?.last_name ?? "Guest", role })]
          );
          user = newUserRes.rows[0];
        }

        const token = `local_token_${user.id}_${Date.now()}`;
        const responseData = {
          access_token: token,
          token_type: "bearer",
          expires_in: 86400,
          refresh_token: `refresh_${token}`,
          user: {
            id: user.id,
            aud: "authenticated",
            role: "authenticated",
            email: user.email,
            email_confirmed_at: user.email_confirmed_at ?? new Date().toISOString(),
            app_metadata: { provider: "email", providers: ["email"] },
            user_metadata: typeof user.raw_user_meta_data === "string"
              ? JSON.parse(user.raw_user_meta_data)
              : (user.raw_user_meta_data ?? {}),
            created_at: user.created_at,
            updated_at: user.updated_at,
          },
        };

        return NextResponse.json(responseData);
      }

      // ── GET USER ──────────────────────────────────────────────────────────
      if (authEndpoint === "user") {
        const authHeader = request.headers.get("authorization") || "";
        let userId = "28537215-8bb7-49b9-85d0-2abeeafdbe6e"; // fallback default admin UUID

        const match = authHeader.match(/local_token_([a-f0-9-]+)_/);
        if (match) userId = match[1];

        const userRes = await db.query<any>(
          `SELECT * FROM auth.users WHERE id = $1 LIMIT 1;`,
          [userId]
        );
        const user = userRes.rows[0];

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        return NextResponse.json({
          id: user.id,
          aud: "authenticated",
          role: "authenticated",
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          app_metadata: { provider: "email" },
          user_metadata: typeof user.raw_user_meta_data === "string"
            ? JSON.parse(user.raw_user_meta_data)
            : (user.raw_user_meta_data ?? {}),
          created_at: user.created_at,
          updated_at: user.updated_at,
        });
      }

      // ── SIGN OUT ──────────────────────────────────────────────────────────
      if (authEndpoint === "logout") {
        return new NextResponse(null, { status: 204 });
      }

      // ── ADMIN USER UPDATE ─────────────────────────────────────────────────
      if (authEndpoint.startsWith("admin/users/")) {
        const userId = authEndpoint.split("/")[2];
        let body: any = {};
        try {
          body = await request.json();
        } catch {
          body = {};
        }

        if (userId) {
          await db.query(
            `UPDATE auth.users SET raw_user_meta_data = $1 WHERE id = $2;`,
            [JSON.stringify(body.user_metadata ?? {}), userId]
          );
        }
        return NextResponse.json({ id: userId, updated: true });
      }
    }

    // ── 2. REST API HANDLERS (PostgREST) ────────────────────────────────────
    if (pathParts[0] === "rest" && pathParts[1] === "v1") {
      const tableName = pathParts[2];
      if (!tableName) {
        return NextResponse.json({ error: "Table name is required" }, { status: 400 });
      }

      let body: any = null;
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        try {
          body = await request.json();
        } catch {
          body = null;
        }
      }

      const result = await handlePostgrestRequest(
        db,
        tableName,
        request.method,
        url.searchParams,
        body,
        request.headers
      );

      return NextResponse.json(result.data, {
        status: result.status,
        headers: result.headers,
      });
    }

    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  } catch (err: any) {
    console.error("❌ Local Supabase Route Error:", err.message ?? err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}
