import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  provider: z.enum(["gemini", "openai", "anthropic", "openrouter"]).default("gemini"),
  prompt: z.string().trim().min(1).max(12000),
});

const config = {
  gemini: { env: "GEMINI_API_KEY", model: "gemini-2.5-flash" },
  openai: { env: "OPENAI_API_KEY", model: "gpt-4o-mini" },
  anthropic: { env: "ANTHROPIC_API_KEY", model: "claude-3-5-haiku-latest" },
  openrouter: { env: "OPENROUTER_API_KEY", model: "openai/gpt-4o-mini" },
} as const;

type ProviderPayload = {
  error?: { message?: string };
  choices?: Array<{ message?: { content?: string } }>;
  content?: Array<{ text?: string }>;
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function validateBickriKey(rawKey: string): Promise<{ valid: boolean; message?: string }> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return { valid: false, message: "La base Supabase n'est pas configurée." };

  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const endpoint = new URL("/rest/v1/api_keys", url);
  endpoint.searchParams.set("select", "id,mode,status");
  endpoint.searchParams.set("key_hash", `eq.${keyHash}`);
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return { valid: false, message: "Impossible de vérifier la clé Bickri." };
  const rows = await response.json() as Array<{ id: string; mode: string; status: string }>;
  const row = rows[0];
  if (!row || row.status !== "active") return { valid: false };
  if (row.mode === "test" && process.env.NODE_ENV === "production") return { valid: false };
  // Update only usage metadata; never persist prompts, responses, or raw keys.
  void fetch(new URL(`/rest/v1/api_keys?id=eq.${row.id}`, url), {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ last_used_at: new Date().toISOString() }),
    cache: "no-store",
  }).catch(() => undefined);
  return { valid: true };
}

export async function POST(request: Request) {
  // Avoid allowing paid provider calls until a persistent Bickri key and Supabase are configured.
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(bck_(?:live|test)_[A-Za-z0-9_-]+)$/);
  if (!match) return jsonError("Clé API Bickri manquante ou invalide.", 401);

  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("Corps JSON invalide.", 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Fournisseur ou prompt invalide.", 400);

  try {
    const validation = await validateBickriKey(match[1]);
    if (!validation.valid) return jsonError(validation.message || "Clé API Bickri non autorisée.", 401);
  } catch {
    return jsonError("Vérification de la clé impossible. Vérifie la configuration Supabase.", 503);
  }

  const provider = parsed.data.provider;
  const prompt = parsed.data.prompt;
  const providerConfig = config[provider];
  const apiKey = process.env[providerConfig.env];
  if (!apiKey) return jsonError(`Le fournisseur ${provider} n'est pas configuré côté serveur.`, 503);

  try {
    let response: Response;
    if (provider === "gemini") {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${providerConfig.model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      });
    } else if (provider === "anthropic") {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: providerConfig.model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] }),
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      });
    } else {
      const endpoint = provider === "openrouter" ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
      const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
      if (provider === "openrouter") {
        headers["HTTP-Referer"] = process.env.APP_PUBLIC_URL || "https://bickriserviceagency.com";
        headers["X-Title"] = "BICKRI API STUDIO";
      }
      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ model: providerConfig.model, messages: [{ role: "user", content: prompt }], max_tokens: 1024 }),
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      });
    }

    const data = await response.json().catch(() => ({} as ProviderPayload)) as ProviderPayload;
    if (!response.ok) {
      const providerMessage = typeof data.error?.message === "string" ? data.error.message.slice(0, 250) : "Le fournisseur a refusé la requête.";
      return NextResponse.json({ error: providerMessage, provider, model: providerConfig.model }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }

    const text = data.choices?.[0]?.message?.content
      ?? data.content?.map((part) => part.text || "").join("")
      ?? data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("")
      ?? "";
    if (!text) return jsonError("Le fournisseur n'a retourné aucun texte exploitable.", 502);

    return NextResponse.json({
      brand: "BICKRI AI",
      provider,
      model: providerConfig.model,
      text,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return jsonError(timedOut ? "Le fournisseur a dépassé le délai de 25 secondes." : "Connexion au fournisseur impossible.", 502);
  }
}
