import { eq } from "drizzle-orm";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

export type Turn = { role: "user" | "assistant"; content: string };
export type Language =
  | "english" | "roman-urdu" | "spanish" | "french" | "german" | "italian"
  | "portuguese" | "arabic" | "hindi" | "turkish" | "mirror";
export type ProviderReply = { text: string; provider: string };

/** Keep a long rolling context without letting one pasted file consume it all. */
function conversationContext(history: Turn[], maxChars = 120_000, maxTurns = 80) {
  const picked: Turn[] = [];
  let chars = 0;
  for (let index = history.length - 1; index >= 0 && picked.length < maxTurns; index -= 1) {
    const turn = history[index];
    const content = turn.content.slice(0, 24_000);
    if (picked.length > 0 && chars + content.length > maxChars) break;
    picked.unshift({ role: turn.role, content });
    chars += content.length;
  }
  return picked;
}

export type ProviderConfig = {
  provider: "gemini" | "openai" | "groq" | "custom" | "none";
  apiKey: string | null;
  baseUrl: string | null;
  model: string | null;
};

const SETTINGS_KEY = "owner_ai_provider";
function credentialKey() {
  const secret = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) throw new Error("CREDENTIAL_ENCRYPTION_KEY must be set (32+ characters) before saving provider credentials.");
  return createHash("sha256").update(secret).digest();
}
export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", credentialKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}
export function decryptSecret(value: string) {
  const [iv, tag, body] = value.split(".");
  const decipher = createDecipheriv("aes-256-gcm", credentialKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
}

export const providerPresets: Record<string, { label: string; baseUrl: string; model: string }> = {
  gemini: { label: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-2.5-flash" },
  openai: { label: "ChatGPT (OpenAI)", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  groq: { label: "Groq", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  custom: { label: "Custom OpenAI-compatible", baseUrl: "", model: "" },
};

export const teamFacts = [
  "SwiftSite was built by two people.",
  "Mharryjs is the owner and full-stack web developer. He wrote all technical work: HTML, CSS, JavaScript, TypeScript, Next.js, PostgreSQL, Drizzle, authentication, dashboard, tools, image/video studio and AI routing.",
  "Hiba Kashif is the structure and design co-builder and a full-stack developer. She shaped page structure, layouts, visual design, mobile behaviour, wording and release testing.",
  "Hiba Kashif's approved contact details may be shared whenever someone asks: Instagram https://www.instagram.com/swif.site/ and LinkedIn https://www.linkedin.com/in/hiba-kashif-70b66b288 .",
  "Mharryjs contact: Instagram https://www.instagram.com/swif.site/ , LinkedIn https://www.linkedin.com/in/m-harry-js-98076442a , GitHub https://github.com/Mharryjs and team email swiftsite@gmail.com .",
  "Never invent a private phone number or address. Share only these approved public links.",
].join(" ");

export function buildSystemPrompt(mode: string, language: Language) {
  const briefs: Record<string, string> = {
    assistant: "You are the everyday assistant: practical, warm and concise.",
    developer: "You are a senior software engineer. Give working code, mention trade-offs and debugging steps.",
    writer: "You are an editor and copywriter. Match the requested tone and keep wording tight.",
    translator: "You are a professional translator. Always output the full translation first, then keep any brief notes under it. Never reply with only a short phrase—the translation must contain every sentence the user sent.",
    analyst: "You are a business analyst. Summarise, list key points and risks, then recommend a next step.",
    tutor: "You are a patient tutor. Teach step by step with a small example and a quick check.",
  };
  const languageRules: Record<Language, string> = {
    "roman-urdu": "CRITICAL: Reply ONLY in natural Roman Urdu using Latin letters. Never use Urdu script. Keep code and technical terms in English.",
    english: "CRITICAL: Reply ONLY in clear English.",
    spanish: "CRITICAL: Reply ONLY in Spanish (español).",
    french: "CRITICAL: Reply ONLY in French (français).",
    german: "CRITICAL: Reply ONLY in German (Deutsch).",
    italian: "CRITICAL: Reply ONLY in Italian (italiano).",
    portuguese: "CRITICAL: Reply ONLY in Portuguese (português).",
    arabic: "CRITICAL: Reply ONLY in Arabic, using Arabic script.",
    hindi: "CRITICAL: Reply ONLY in Hindi, using Devanagari script.",
    turkish: "CRITICAL: Reply ONLY in Turkish (Türkçe).",
    mirror: "CRITICAL: Detect the language of the latest user message and reply in that same language and script.",
  };
  const rule = languageRules[language];
  return [
    "You are SwiftSite — a friendly AI companion inside the SwiftSite website, with the same relaxed, human tone as Google Gemini.",
    briefs[mode] ?? briefs.assistant,
    rule,
    "CONVERSATIONAL STYLE (very important): talk like a real friend and match the user's energy and message length. A short casual message like 'hey bt suno', 'kasy ho', 'ok', 'acha' gets a short natural reply of one or two lines — never a list, never a lecture.",
    "Never repeat or translate the user's own words back at them. Never start with 'I understood your question', 'You asked:' or 'Here is a plan'. Never say 'please send that again' or 'Maazrat'.",
    "For a genuine question, keep the same warm tone, use everyday words, and give a complete answer with short paragraphs or a small list when it helps. A real question still deserves real substance — just not robotic length.",
    "Continue the conversation naturally and remember earlier messages provided in context.",
    `About the people behind SwiftSite: ${teamFacts}`,
    "If someone asks who Mharryjs or Hiba Kashif is, say they built SwiftSite, and share the approved contact links when contact is requested.",
    "Use headings and Markdown lists only for genuinely multi-part answers; casual chat stays plain sentences. Never invent sources, private details or fake links.",
    ...(siteInstructions ? [`HIGHEST PRIORITY — live directives from the site owner, overriding any conflicting style or language rule above: ${siteInstructions}`] : []),
  ].join(" ");
}

// Live owner instructions: the admin panel writes these to the database, and
// every single reply reads them fresh — so a dashboard change reaches the AI
// within seconds, with no rebuild and no restart.
let siteInstructions = "";
export function setSiteInstructions(value: string) {
  siteInstructions = (value ?? "").slice(0, 4000);
}
export async function loadSiteInstructions(): Promise<string> {
  try {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "ai_instructions")).limit(1);
    const value = typeof row?.value === "string" ? row.value : "";
    setSiteInstructions(value);
    return value;
  } catch {
    return siteInstructions;
  }
}

export async function getStoredProvider(): Promise<ProviderConfig> {
  try {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, SETTINGS_KEY)).limit(1);
    if (!row?.value) return { provider: "none", apiKey: null, baseUrl: null, model: null };
    const parsed = JSON.parse(row.value) as { provider?: ProviderConfig["provider"]; apiKey?: string; baseUrl?: string; model?: string };
    return {
      provider: parsed.provider ?? "none",
      apiKey: parsed.apiKey?.startsWith("enc:") ? decryptSecret(parsed.apiKey.slice(4)) : null,
      baseUrl: parsed.baseUrl?.trim() || null,
      model: parsed.model?.trim() || null,
    };
  } catch {
    return { provider: "none", apiKey: null, baseUrl: null, model: null };
  }
}

export async function saveStoredProvider(config: { provider: string; apiKey: string; baseUrl?: string; model?: string } | null) {
  if (!config || !config.provider || config.provider === "none") {
    await db.delete(appSettings).where(eq(appSettings.key, SETTINGS_KEY));
    return;
  }
  const value = JSON.stringify({ provider: config.provider, apiKey: `enc:${encryptSecret(config.apiKey)}`, baseUrl: config.baseUrl ?? "", model: config.model ?? "" });
  await db.insert(appSettings)
    .values({ key: SETTINGS_KEY, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
}

export async function resolveProvider(): Promise<ProviderConfig> {
  const stored = await getStoredProvider();
  if (stored.provider !== "none" && stored.apiKey) return stored;

  const envGemini = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (envGemini) return { provider: "gemini", apiKey: envGemini, baseUrl: providerPresets.gemini.baseUrl, model: process.env.GEMINI_MODEL ?? providerPresets.gemini.model };

  const envOpenAi = process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY;
  if (envOpenAi) return {
    provider: "openai", apiKey: envOpenAi,
    baseUrl: process.env.AI_BASE_URL ?? process.env.OPENAI_BASE_URL ?? providerPresets.openai.baseUrl,
    model: process.env.AI_MODEL ?? process.env.OPENAI_MODEL ?? providerPresets.openai.model,
  };

  const envGroq = process.env.GROQ_API_KEY;
  if (envGroq) return { provider: "groq", apiKey: envGroq, baseUrl: providerPresets.groq.baseUrl, model: providerPresets.groq.model };

  return { provider: "none", apiKey: null, baseUrl: null, model: null };
}

/** Gemini's native API is not OpenAI-shaped, so it gets its own call. */
export async function askGemini(config: ProviderConfig, history: Turn[], mode: string, language: Language): Promise<ProviderReply | null> {
  if (!config.apiKey) return null;
  const model = config.model || providerPresets.gemini.model;
  const base = (config.baseUrl || providerPresets.gemini.baseUrl).replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt(mode, language) }] },
        contents: conversationContext(history).map((turn) => ({ role: turn.role === "assistant" ? "model" : "user", parts: [{ text: turn.content }] })),
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
      signal: AbortSignal.timeout(22_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    return text ? { text, provider: `SwiftSite AI · ${model}` } : null;
  } catch {
    return null;
  }
}

export async function askOpenAiCompatible(config: ProviderConfig, history: Turn[], mode: string, language: Language): Promise<ProviderReply | null> {
  if (!config.apiKey || !config.baseUrl) return null;
  const model = config.model || providerPresets.openai.model;
  try {
    const res = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 4096,
        messages: [{ role: "system", content: buildSystemPrompt(mode, language) }, ...conversationContext(history)],
      }),
      signal: AbortSignal.timeout(22_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }>; model?: string };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text ? { text, provider: `SwiftSite AI · ${data.model ?? model}` } : null;
  } catch {
    return null;
  }
}

async function askFreePollinations(history: Turn[], mode: string, language: Language): Promise<ProviderReply | null> {
  try {
    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        temperature: 0.65,
        max_tokens: 4096,
        messages: [{ role: "system", content: buildSystemPrompt(mode, language) }, ...conversationContext(history)],
      }),
      signal: AbortSignal.timeout(18_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }>; model?: string };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text ? { text, provider: "SwiftSite AI" } : null;
  } catch {
    return null;
  }
}

async function askFreeLlm7(history: Turn[], mode: string, language: Language): Promise<ProviderReply | null> {
  for (const model of ["gpt-oss:20b", "mistral-Nemo-Instruct-2407"]) {
    try {
      const res = await fetch("https://api.llm7.io/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer unused" },
        body: JSON.stringify({
          model, temperature: 0.7, max_tokens: 4096,
          messages: [{ role: "system", content: buildSystemPrompt(mode, language) }, ...conversationContext(history)],
        }),
        signal: AbortSignal.timeout(18_000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return { text, provider: "SwiftSite AI" };
    } catch { /* try next */ }
  }
  return null;
}

async function askFreeChatAt(history: Turn[], mode: string, language: Language): Promise<ProviderReply | null> {
  try {
    const transcript = conversationContext(history, 72_000, 50).map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.content}`).join("\n");
    const res = await fetch("https://ch.at/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `${buildSystemPrompt(mode, language)}\n\n${transcript}\n\nReply to the last User message only.` }),
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const raw = (await res.text()).trim();
    const marker = raw.lastIndexOf("A:");
    const text = (marker >= 0 ? raw.slice(marker + 2) : raw).trim();
    return text ? { text, provider: "SwiftSite AI" } : null;
  } catch {
    return null;
  }
}

type StreamArgs = {
  history: Turn[];
  mode: string;
  language: Language;
  onMeta: (provider: string) => void;
  onDelta: (text: string) => void;
};

/** Reads an OpenAI/Gemini style SSE body and forwards every text delta. */
async function readSseBody(res: Response, emit: (text: string) => void): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const delta =
          json.choices?.[0]?.delta?.content ??
          json.choices?.[0]?.message?.content ??
          json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ??
          "";
        if (delta) { full += delta; emit(delta); }
      } catch { /* partial json, keep buffering */ }
    }
  }
  return full;
}

/**
 * Streams from every available route at once. The first route to produce text
 * becomes the answer, the rest are aborted, so the user sees words immediately
 * instead of waiting for a full completion.
 */

type UpstreamRoute = { id: string; label: string; url: string; headers: Record<string, string>; body: unknown; sse: boolean; get?: boolean };

function pickRoutes(config: ProviderConfig, history: Turn[], mode: string, language: Language): UpstreamRoute[] {
  const context = conversationContext(history);
  const system = buildSystemPrompt(mode, language);
  const chatBody = { temperature: 0.7, max_tokens: 4096, stream: true, messages: [{ role: "system", content: system }, ...context] };
  const routes: UpstreamRoute[] = [];
  let routeIndex = 0;
  const nextId = () => `route-${++routeIndex}`;

  if (config.provider === "gemini" && config.apiKey) {
    const model = config.model || providerPresets.gemini.model;
    const base = (config.baseUrl || providerPresets.gemini.baseUrl).replace(/\/$/, "");
    routes.push({
      id: nextId(), label: `SwiftSite AI · Gemini`,
      url: `${base}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(config.apiKey)}`,
      headers: { "Content-Type": "application/json" },
      body: {
        system_instruction: { parts: [{ text: system }] },
        contents: context.map((turn) => ({ role: turn.role === "assistant" ? "model" : "user", parts: [{ text: turn.content }] })),
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      },
      sse: true,
    });
  } else if (config.provider !== "none" && config.apiKey && config.baseUrl) {
    routes.push({
      id: nextId(), label: `SwiftSite AI · ${config.model || providerPresets.openai.model}`,
      url: `${config.baseUrl.replace(/\/$/, "")}/chat/completions`,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: { ...chatBody, model: config.model || providerPresets.openai.model },
      sse: true,
    });
  }

  routes.push({ id: nextId(), label: "SwiftSite AI", url: "https://api.llm7.io/v1/chat/completions", headers: { "Content-Type": "application/json", Authorization: "Bearer unused" }, body: { ...chatBody, model: "gpt-oss:20b" }, sse: true });
  routes.push({ id: nextId(), label: "SwiftSite AI", url: "https://text.pollinations.ai/openai", headers: { "Content-Type": "application/json" }, body: { ...chatBody, model: "openai" }, sse: true });
  routes.push({
    id: nextId(), label: "SwiftSite AI",
    url: "https://ch.at/api/chat",
    headers: { "Content-Type": "application/json" },
    body: { message: `${system}\n\n${conversationContext(history, 72_000, 50).map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.content}`).join("\n")}\n\nReply to the last User message only.` },
    sse: false,
  });
  const lastUserText = [...history].reverse().find((t) => t.role === "user")?.content ?? "hello";
  const guidedPrompt = siteInstructions
    ? `Follow these instructions: ${siteInstructions}\n\nUser message: ${lastUserText}`
    : lastUserText;
  routes.push({
    id: nextId(), label: "SwiftSite AI",
    url: `https://text.pollinations.ai/${encodeURIComponent(guidedPrompt.slice(0, 1500))}?model=openai`,
    headers: {},
    body: null,
    sse: false,
    get: true,
  });
  return routes;
}

/**
 * Streams from every available route at once. The first route that produces
 * text wins, the rest are aborted, so words appear immediately instead of the
 * user waiting for a whole completion.
 */
export async function streamFromProviders(args: StreamArgs): Promise<string | null> {
  const { history, mode, language, onMeta, onDelta } = args;
  const config = await resolveProvider();
  const routes = pickRoutes(config, history, mode, language);
  const controllers: AbortController[] = [];
  let winner: string | null = null;

  const emit = (label: string, chunk: string) => {
    if (!chunk) return;
    if (winner && winner !== label) return;
    if (!winner) { winner = label; onMeta(winner); }
    if (winner !== label) return;
    onDelta(chunk);
  };

  const runRoute = async (route: UpstreamRoute): Promise<string | null> => {
    const label = route.id;
    const controller = new AbortController();
    controllers.push(controller);
    try {
      const res = route.get
        ? await fetch(route.url, { signal: controller.signal, cache: "no-store" })
        : await fetch(route.url, {
            method: "POST",
            headers: route.headers,
            body: JSON.stringify(route.body),
            signal: controller.signal,
            cache: "no-store",
          });
      if (!res.ok || !res.body) return null;
      if (!route.sse) {
        if (winner) return null;
        const raw = (await res.text()).trim();
        const marker = raw.lastIndexOf("A:");
        const text = (marker >= 0 ? raw.slice(marker + 2) : raw).trim();
        if (!text) return null;
        emit(route.id, text);
        return text;
      }
      const text = await readSseBody(res, (chunk) => emit(route.id, chunk));
      return text.trim() ? text : null;
    } catch {
      return null;
    }
  };

  // Round 1 races every route. Free models are flaky, so any route that came
  // back empty gets one more parallel chance before we give up.
  const succeeded = new Set<string>();
  let collected = "";
  for (let round = 0; round < 2 && !winner; round += 1) {
    const batch = round === 0 ? routes : routes.filter((route) => !succeeded.has(route.id));
    if (!batch.length) break;
    const settled = await Promise.allSettled(batch.map((route) => runRoute(route)));
    settled.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value?.trim()) {
        succeeded.add(batch[index].id);
        if (batch[index].id === winner) collected = result.value ?? "";
      }
    });
  }
  controllers.forEach((controller) => { try { controller.abort(); } catch { /* already finished */ } });
  // Return the winner's own streamed text (never a loser's), so the caller
  // never shows a placeholder word like "streamed" in the chat.
  return collected.trim() ? collected : null;
}

/** Non-streaming race used as a safety net when a client cannot stream. */
export async function raceFreeProviders(history: Turn[], mode: string, language: Language): Promise<ProviderReply | null> {
  const last = [...history].reverse().find((turn) => turn.role === "user")?.content ?? "";
  const userWantsShort = /\b(short|brief|concise|one line|chhota|chota|thora|kam lafz)\b/i.test(last)
    || /^(hi|hello|hey|salam|assalam|thanks|thank you)[!.? ]*$/i.test(last.trim());
  const isTranslation = /(translate|translation|tarjuma|into\s+(english|urdu|spanish|french|arabic|german))/i.test(last);
  const minimumLength = userWantsShort ? 1 : isTranslation ? 60 : last.length > 60 ? 320 : 180;

  return new Promise((resolve) => {
    let settled = false;
    let shortFallback: ProviderReply | null = null;
    const finish = (reply: ProviderReply | null) => {
      if (settled || !reply) return;
      if (reply.text.trim().length >= minimumLength) {
        settled = true;
        resolve(reply);
      } else if (!shortFallback) {
        shortFallback = reply;
      }
    };
    const system = buildSystemPrompt(mode, language);
    const context = conversationContext(history);
    const call = (url: string, headers: Record<string, string>, body: unknown) =>
      fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(18_000), cache: "no-store" })
        .then(async (res) => {
          if (!res.ok) return null;
          const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          const text = data.choices?.[0]?.message?.content?.trim();
          return text ? { text, provider: "SwiftSite AI" } : null;
        })
        .catch(() => null);

    const guidedRacePrompt = siteInstructions
      ? `Follow these instructions: ${siteInstructions}\n\nUser message: ${last}`
      : last;
    const callGet = (prompt: string) =>
      fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt.slice(0, 1500))}?model=openai`, { signal: AbortSignal.timeout(18_000), cache: "no-store" })
        .then(async (res) => {
          if (!res.ok) return null;
          const text = (await res.text()).trim();
          return text ? { text, provider: "SwiftSite AI" } : null;
        })
        .catch(() => null);

    const calls = [
      call("https://api.llm7.io/v1/chat/completions", { "Content-Type": "application/json", Authorization: "Bearer unused" }, { model: "gpt-oss:20b", temperature: 0.7, max_tokens: 4096, messages: [{ role: "system", content: system }, ...context] }),
      call("https://text.pollinations.ai/openai", { "Content-Type": "application/json" }, { model: "openai", temperature: 0.65, max_tokens: 4096, messages: [{ role: "system", content: system }, ...context] }),
      callGet(guidedRacePrompt || "hello"),
    ];
    calls.forEach((item) => { void item.then(finish).catch(() => {}); });
    void Promise.allSettled(calls).then(() => { if (!settled) { settled = true; resolve(shortFallback); } });
    setTimeout(() => { if (!settled) { settled = true; resolve(shortFallback); } }, 19_000);
  });
}
