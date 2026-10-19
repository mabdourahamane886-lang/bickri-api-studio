import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
const schema = z.object({
  name: z.string().trim().min(2).max(80),
  mode: z.enum(["test", "live"]).default("test"),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Création désactivée en production tant que l’authentification et le stockage ne sont pas configurés." },
      { status: 503 }
    );
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Nom ou environnement invalide." }, { status: 400 });

  const secret = `bck_${parsed.data.mode === "live" ? "live" : "test"}_${randomBytes(32).toString("base64url")}`;
  const fingerprint = createHash("sha256").update(secret).digest("hex").slice(0, 12);

  // Démonstration uniquement : la clé n'est pas persistée et ne valide aucune requête.
  return NextResponse.json({
    name: parsed.data.name,
    mode: parsed.data.mode,
    key: secret,
    prefix: secret.slice(0, 14),
    fingerprint,
    warning: "Clé temporaire de démonstration : non persistée et non utilisable pour authentifier des requêtes."
  }, { status: 201 });
}