import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  provider: z.enum(["Google Gemini", "OpenAI", "Anthropic Claude", "OpenRouter"]),
  prompt: z.string().trim().min(1).max(4000),
});

const providerConfig = {
  "Google Gemini": { env: "GEMINI_API_KEY", model: "gemini-2.5-flash" },
  OpenAI: { env: "OPENAI_API_KEY", model: "gpt-4o-mini" },
  "Anthropic Claude": { env: "ANTHROPIC_API_KEY", model: "claude-3-5-haiku-latest" },
  OpenRouter: { env: "OPENROUTER_API_KEY", model: "openai/gpt-4o-mini" },
} as const;

type ProviderResponse = {
  choices?: Array<{ message?: { content?: unknown } }>;
  content?: Array<{ text?: unknown }>;
  candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
  error?: { message?: unknown };
};

function getText(data: ProviderResponse): string {
  if (typeof data?.choices?.[0]?.message?.content === "string") return data.choices[0].message.content;
  if (typeof data?.content?.[0]?.text === "string") return data.content[0].text;
  if (typeof data?.candidates?.[0]?.content?.parts?.[0]?.text === "string") return data.candidates[0].content.parts[0].text;
  return "";
}

export async function POST(request: Request) {
  // Until authentication, authorization and rate limits exist, never expose paid provider calls publicly.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({
      configured: false,
      message: "Les tests fournisseurs sont désactivés en production jusqu'à l'ajout de l'authentification et des quotas."
    }, { status: 503 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Fournisseur ou prompt invalide." }, { status: 400 });

  const { provider, prompt } = parsed.data;
  const config = providerConfig[provider];
  const apiKey = process.env[config.env];

  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      provider,
      message: `La variable serveur ${config.env} est absente. Configure-la dans les variables d'environnement du déploiement, puis réessaie.`
    }, { status: 503 });
  }

  try {
    let response: Response;
    if (provider === "Google Gemini") {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(25000),
        cache: "no-store",
      });
    } else if (provider === "Anthropic Claude") {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: config.model, max_tokens: 512, messages: [{ role: "user", content: prompt }] }),
        signal: AbortSignal.timeout(25000),
        cache: "no-store",
      });
    } else {
      const url = provider === "OpenRouter" ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
      const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
      if (provider === "OpenRouter") {
        headers["HTTP-Referer"] = process.env.APP_PUBLIC_URL || "https://bickriserviceagency.com";
        headers["X-Title"] = "BICKRI API STUDIO";
      }
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ model: config.model, messages: [{ role: "user", content: prompt }], max_tokens: 512 }),
        signal: AbortSignal.timeout(25000),
        cache: "no-store",
      });
    }

    const data: ProviderResponse = await response.json().catch(() => ({} as ProviderResponse));
    if (!response.ok) {
      // Never return provider headers or secrets; keep provider error text short.
      const message = typeof data.error?.message === "string" ? data.error.message.slice(0, 350) : "Le fournisseur a refusé la requête.";
      return NextResponse.json({ configured: true, ok: false, provider, status: response.status, message }, { status: 502 });
    }

    const text = getText(data);
    if (!text) return NextResponse.json({ configured: true, ok: false, provider, message: "Réponse reçue, mais aucun texte exploitable n'a été retourné." }, { status: 502 });
    return NextResponse.json({ configured: true, ok: true, provider, model: config.model, text });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json({
      configured: true,
      ok: false,
      provider,
      message: timedOut ? "Le fournisseur a dépassé le délai de 25 secondes." : "Connexion au fournisseur impossible. Vérifie le réseau et la configuration."
    }, { status: 502 });
  }
}