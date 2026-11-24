import { NextResponse } from "next/server";
import { getCurrentUser, isOwnerUser } from "@/lib/auth";
import {
  askOpenAiCompatible, getStoredProvider, loadSiteInstructions, providerPresets, resolveProvider, saveStoredProvider,
  type ProviderConfig,
} from "@/lib/providers";
import { db } from "@/db";
import { adminAudit, appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 90;

const testHistory = [{ role: "user" as const, content: "Reply in one short sentence: are you connected to SwiftSite?" }];

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isOwnerUser(user)) return NextResponse.json({ error: "Owner only." }, { status: 403 });
  const stored = await getStoredProvider();
  const active = await resolveProvider();
  const instructions = await loadSiteInstructions();
  return NextResponse.json({
    presets: providerPresets,
    stored: { provider: stored.provider, hasKey: Boolean(stored.apiKey), model: stored.model, baseUrl: stored.baseUrl },
    active: { provider: active.provider, hasKey: Boolean(active.apiKey), model: active.model, source: active.provider === "none" ? "free" : "connected" },
    instructions,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isOwnerUser(user)) return NextResponse.json({ error: "Only the owner can change the AI connection." }, { status: 403 });

  try {
    const body = (await request.json()) as {
      action?: "save" | "test" | "clear" | "instructions";
      provider?: string; apiKey?: string; baseUrl?: string; model?: string; instructions?: string;
    };
    const action = body.action ?? "save";

    if (action === "instructions") {
      const text = (body.instructions ?? "").slice(0, 4000);
      await db.insert(appSettings)
        .values({ key: "ai_instructions", value: text })
        .onConflictDoUpdate({ target: appSettings.key, set: { value: text, updatedAt: new Date() } });
      await db.insert(adminAudit).values({ actorId: user.id, action: "ai.instructions", detail: `Updated ${text.length} characters` });
      return NextResponse.json({ ok: true, saved: true, instructions: text });
    }

    if (action === "clear") {
      await saveStoredProvider(null);
      await db.insert(adminAudit).values({ actorId: user.id, action: "provider.disconnect", detail: "AI provider disconnected" });
      return NextResponse.json({ ok: true, cleared: true });
    }

    const provider = body.provider ?? "gemini";
    const preset = providerPresets[provider];
    const apiKey = body.apiKey?.trim() ?? "";
    if (!apiKey) return NextResponse.json({ error: "Paste an API key first." }, { status: 400 });
    if (!preset && provider !== "custom") return NextResponse.json({ error: "Unknown provider." }, { status: 400 });

    const config: ProviderConfig = {
      provider: provider as ProviderConfig["provider"],
      apiKey,
      baseUrl: body.baseUrl?.trim() || preset?.baseUrl || providerPresets.openai.baseUrl,
      model: body.model?.trim() || preset?.model || providerPresets.openai.model,
    };

    let result: { text: string } | null = null;
    if (config.provider === "gemini") {
      const model = config.model ?? providerPresets.gemini.model;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply with: SwiftSite connected" }] }] }),
        signal: AbortSignal.timeout(30_000), cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        return NextResponse.json({ error: `Gemini ${res.status}: ${(body.error?.message ?? "API request failed").slice(0, 350)}` }, { status: 400 });
      }
      const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = data.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("").trim();
      result = text ? { text } : null;
    } else result = await askOpenAiCompatible(config, testHistory, "assistant", "english");
    if (!result) return NextResponse.json({ error: "Provider returned an empty response. Check the key, model and account quota." }, { status: 400 });

    if (action === "save") {
      await saveStoredProvider({ provider: config.provider, apiKey: config.apiKey ?? "", baseUrl: config.baseUrl ?? "", model: config.model ?? "" });
      await db.insert(adminAudit).values({ actorId: user.id, action: "provider.connect", detail: `${config.provider} · ${config.model ?? "default"}` });
    }

    return NextResponse.json({ ok: true, saved: action === "save", reply: result.text.slice(0, 240), model: config.model, provider: config.provider });
  } catch (error) {
    console.error("provider settings failed", error);
    return NextResponse.json({ error: "Could not update the AI connection." }, { status: 500 });
  }
}
