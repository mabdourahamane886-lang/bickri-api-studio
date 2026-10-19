import { NextResponse } from "next/server";

export const runtime = "nodejs";

const providers = [
  { id: "gemini", name: "Google Gemini", env: "GEMINI_API_KEY" },
  { id: "openai", name: "OpenAI", env: "OPENAI_API_KEY" },
  { id: "anthropic", name: "Anthropic Claude", env: "ANTHROPIC_API_KEY" },
  { id: "openrouter", name: "OpenRouter", env: "OPENROUTER_API_KEY" },
] as const;

export async function GET() {
  const status = providers.map(provider => ({
    id: provider.id,
    name: provider.name,
    configured: Boolean(process.env[provider.env]),
    // Deliberately do not return secret values or key fragments.
  }));
  return NextResponse.json({ providers: status }, {
    headers: { "Cache-Control": "no-store" }
  });
}