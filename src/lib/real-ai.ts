import { buildSystemPrompt, loadSiteInstructions, resolveProvider, type Language, type Turn } from "@/lib/providers";

export type AiStream = { provider: string; chunks: AsyncGenerator<string>; abort: () => void };
export type MediaPart = { mime: string; data: string };

function recentTurns(history: Turn[]) {
  const result: Turn[] = [];
  let size = 0;
  for (let i = history.length - 1; i >= 0 && result.length < 36; i--) {
    const content = history[i].content.slice(0, 12000);
    if (size + content.length > 48000 && result.length) break;
    result.unshift({ role: history[i].role, content });
    size += content.length;
  }
  return result;
}

export class AiUpstreamError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}

async function* parseSse(body: ReadableStream<Uint8Array>, kind: "gemini" | "openai"): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let previous = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const lines = pending.split(/\r?\n/);
      pending = done ? "" : (lines.pop() ?? "");
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const event = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            error?: { message?: string };
          };
          if (event.error) throw new AiUpstreamError(event.error.message ?? "Provider error");
          let text = kind === "gemini"
            ? event.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("") ?? ""
            : event.choices?.[0]?.delta?.content ?? "";
          if (kind === "gemini" && text.startsWith(previous) && previous) text = text.slice(previous.length);
          if (text) {
            if (kind === "gemini") previous += text;
            yield text;
          }
        } catch (error) {
          if (error instanceof AiUpstreamError) throw error;
        }
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
}

export async function openRealAiStream(history: Turn[], mode: string, language: Language, requestSignal?: AbortSignal, media: MediaPart[] = []): Promise<AiStream> {
  await loadSiteInstructions();
  const config = await resolveProvider();
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  requestSignal?.addEventListener("abort", onAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(), 75_000);
  const close = () => { clearTimeout(timeout); requestSignal?.removeEventListener("abort", onAbort); controller.abort(); };
  const context = recentTurns(history);
  const system = buildSystemPrompt(mode, language);
  if (media.length && config.provider !== "gemini") {
    close();
    throw new AiUpstreamError("Image and video analysis requires a connected vision-capable Gemini key in owner settings.", 422);
  }

  let url: string;
  let init: RequestInit;
  let kind: "gemini" | "openai";
  let provider: string;
  if (config.provider === "gemini" && config.apiKey) {
    const model = config.model || "gemini-2.5-flash";
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
    provider = `Google Gemini · ${model}`;
    kind = "gemini";
    init = {
      method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": config.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: context.map((turn, index) => ({
          role: turn.role === "assistant" ? "model" : "user",
          parts: [
            { text: turn.content },
            ...(index === context.length - 1 ? media.map(item => ({ inlineData: { mimeType: item.mime, data: item.data } })) : []),
          ],
        })),
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    };
  } else {
    kind = "openai";
    const hasConfiguredProvider = config.provider !== "none" && !!config.apiKey && !!config.baseUrl;
    provider = hasConfiguredProvider ? `${config.provider} · ${config.model ?? "model"}` : "Community AI · Pollinations";
    url = hasConfiguredProvider ? `${config.baseUrl!.replace(/\/$/, "")}/chat/completions` : "https://text.pollinations.ai/openai";
    init = {
      method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(hasConfiguredProvider ? { Authorization: `Bearer ${config.apiKey}` } : {}) },
      body: JSON.stringify({ model: hasConfiguredProvider ? config.model : "openai", stream: true, temperature: 0.7, max_tokens: 4096,
        messages: [{ role: "system", content: system }, ...context] }),
    };
  }
  try {
    const response = await fetch(url, { ...init, cache: "no-store" });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 280);
      close();
      const cause = response.status === 429 ? "Quota/rate limit reached" : response.status === 401 || response.status === 403 ? "API key rejected" : `Provider returned ${response.status}`;
      throw new AiUpstreamError(`${cause}. ${detail}`, response.status);
    }
    if (!response.body) { close(); throw new AiUpstreamError("Provider returned no response body."); }
    return { provider, abort: close, chunks: (async function* () {
      try { yield* parseSse(response.body!, kind); }
      finally { close(); }
    })() };
  } catch (error) {
    close();
    if (error instanceof AiUpstreamError) throw error;
    throw new AiUpstreamError("Cannot reach the AI provider. Check the network or try again.");
  }
}
