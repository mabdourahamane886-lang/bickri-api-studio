import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  mode: z.enum(["test", "live"]).default("test"),
});

function isAuthorized(request: Request): boolean {
  const expected = process.env.BICKRI_ADMIN_SETUP_TOKEN;
  const supplied = request.headers.get("x-admin-token");
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Configure SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY côté serveur." }, { status: 503 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Nom ou environnement invalide." }, { status: 400 });

  const secret = `bck_${parsed.data.mode === "live" ? "live" : "test"}_${randomBytes(32).toString("base64url")}`;
  const keyHash = createHash("sha256").update(secret).digest("hex");
  const keyPrefix = secret.slice(0, 14);

  try {
    const response = await fetch(new URL("/rest/v1/api_keys", supabaseUrl), {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        name: parsed.data.name,
        mode: parsed.data.mode,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        status: "active",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json({
        error: response.status === 404 || response.status === 400
          ? "Table api_keys absente ou schéma non appliqué. Exécute la migration SQL du dépôt."
          : "Impossible d'enregistrer la clé dans Supabase.",
      }, { status: 502 });
    }

    const rows = await response.json() as Array<{ id: string; created_at: string }>;
    return NextResponse.json({
      id: rows[0]?.id,
      name: parsed.data.name,
      mode: parsed.data.mode,
      key: secret,
      prefix: keyPrefix,
      createdAt: rows[0]?.created_at,
      warning: "Copie cette clé maintenant : elle ne sera plus affichée. La base conserve uniquement son empreinte SHA-256.",
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Connexion à Supabase impossible." }, { status: 502 });
  }
}
