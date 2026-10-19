import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  provider: z.enum(["Google Gemini", "OpenAI", "Anthropic Claude", "OpenRouter"]),
  prompt: z.string().trim().min(1).max(4000),
});

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Fournisseur ou prompt invalide." }, { status: 400 });

  // Pas de faux résultat : l'adaptateur officiel et le stockage sécurisé restent à implémenter.
  return NextResponse.json({
    configured: false,
    provider: parsed.data.provider,
    message: "Fournisseur non configuré. Ajoute l'adaptateur serveur officiel et un secret dans l'environnement sécurisé avant de tester."
  }, { status: 501 });
}