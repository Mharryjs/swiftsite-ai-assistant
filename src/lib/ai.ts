import {
  askGemini, askOpenAiCompatible, buildSystemPrompt, loadSiteInstructions, raceFreeProviders, resolveProvider, streamFromProviders,
  type Language, type Turn,
} from "@/lib/providers";

export type { Language } from "@/lib/providers";
export type AiReply = { text: string; provider: string };
export type LanguagePref = "auto" | "english" | "roman-urdu";

const romanUrduWords = /\b(kya|ky|kaise|kaisay|kaun|kon|kahan|kab|mujhe|mujhay|mera|meri|meray|hamara|hum|apna|aap|ap|tum|hai|hain|ho|nahi|nahin|mat|batao|bata|karo|karna|krna|kaam|acha|achha|bhai|janu|sakta|sakti|chahiye|chaiye|banana|banao|likho|dedo|kuch|kuchh|yeh|woh|aur|se|ko|mein|main|me|ka|ki|ke|rabb|yaar|wala|wali|wla|rha|raha|gya|gaya)\b/gi;
const englishWords = /\b(the|and|please|what|how|with|this|that|give|make|write|explain|who|is|are|can|could|would|website|page)\b/gi;

function matchCount(text: string, pattern: RegExp) {
  return text.match(pattern)?.length ?? 0;
}

export function detectLanguage(text: string, pref: LanguagePref = "auto"): Language {
  if (pref === "roman-urdu") return "roman-urdu";
  if (pref === "english") return "english";
  const romanScore = matchCount(text, romanUrduWords);
  const englishScore = matchCount(text, englishWords);
  if (romanScore >= 2 || (romanScore >= 1 && romanScore >= englishScore)) return "roman-urdu";
  if (/[\u0600-\u06FF]/.test(text)) return "arabic";
  if (/[\u0900-\u097F]/.test(text)) return "hindi";
  if (/\b(hola|gracias|cómo|como|dónde|donde|porque|por qué|explícame|quiero|crear|sitio web)\b/i.test(text)) return "spanish";
  if (/\b(bonjour|merci|salut|comment|pourquoi|explique|français|créer|site web)\b/i.test(text)) return "french";
  if (/\b(hallo|danke|warum|wie|erkläre|deutsch|webseite|erstellen)\b/i.test(text)) return "german";
  if (/\b(ciao|buongiorno|grazie|come|perché|spiega|italiano|creare)\b/i.test(text)) return "italian";
  if (/\b(olá|obrigado|como|porquê|explique|português|criar)\b/i.test(text)) return "portuguese";
  if (/\b(merhaba|teşekkür|nasıl|neden|açıkla|türkçe|oluştur)\b/i.test(text)) return "turkish";
  if (/[^\u0000-\u024F]/.test(text)) return "mirror";
  return "english";
}

export function isTeamQuestion(text: string) {
  const namedPerson = /(mharryjs|harry ?js|hiba(?: kashif)?|dua)/i.test(text);
  const swiftIdentity = /(who built|who made|kis ne banaya|kisne banaya|owner|founder)\s*(?:of\s*)?(?:swiftsite)?/i.test(text)
    || /(swiftsite).*(team|owner|founder|developer|contact)/i.test(text);
  const approvedContact = /(contact|instagram|linkedin|github|email|rabta)/i.test(text)
    && /(mharryjs|harry ?js|hiba|dua|swiftsite)/i.test(text);
  const needsWebDeveloper = /(web\s*developer.*(?:chahiye|chaiya|need|hire)|(?:website|web site).*(?:banwa|banwana|banao|developer chahiye)|need (?:a )?web developer)/i.test(text);
  return namedPerson || swiftIdentity || approvedContact || needsWebDeveloper;
}

export function teamAnswer(language: Language): string {
  if (language === "roman-urdu") {
    return [
      "SwiftSite do logon ne banai hai — dono full-stack web developers hain:",
      "",
      "**Mharryjs** — owner aur full-stack web developer. HTML, CSS, JavaScript, TypeScript, Next.js app, PostgreSQL database (Drizzle), tools engine, AI connection aur poori website ka code inhone likha hai. Design ke ilawa har technical kaam Mharryjs ka hai.",
      "",
      "**Hiba Kashif** — co-builder aur designer. Website ka structure aur designing inhone ki hai: page order, layout, spacing, green glass look, mobile/tablet behaviour, wording aur har release se pehle testing.",
      "",
      "Rabta (contact — Mharryjs ki ijazat se share kiya ja raha hai):",
      "",
      "**Mharryjs (owner)**",
      "- Email: swiftsite@gmail.com",
      "- LinkedIn: https://www.linkedin.com/in/m-harry-js-98076442a",
      "- GitHub: https://github.com/Mharryjs",
      "",
      "**Hiba Kashif (structure & design)**",
      "- Instagram: https://www.instagram.com/swif.site/",
      "- LinkedIn: https://www.linkedin.com/in/hiba-kashif-70b66b288?utm_source=share_via&utm_content=profile&utm_medium=member_android",
      "",
      "Dono ko email par likh sakte hain — team inbox swiftsite@gmail.com hai.",
      "",
      "Kuch aur poochna ho to main hazir hoon.",
    ].join("\n");
  }
  return [
    "SwiftSite was built by two people — both full-stack web developers:",
    "",
    "**Mharryjs** — owner and full-stack web developer. He wrote all of the code: HTML, CSS, JavaScript, TypeScript, the Next.js app, the PostgreSQL + Drizzle database, the tools engine, the AI connection and the deployment. Everything technical that is not the design brief is his work.",
    "",
    "**Hiba Kashif** — co-builder and designer. The website structure and designing are hers: page order, layout, spacing, the green glass look, mobile behaviour, the wording people read, and testing every release before it shipped.",
    "",
    "Contact (shared with the owner's permission — Mharryjs approved this):",
    "",
    "**Mharryjs (owner)**",
    "- Email: swiftsite@gmail.com",
    "- Instagram: https://www.instagram.com/swif.site/",
    "- LinkedIn: https://www.linkedin.com/in/m-harry-js-98076442a",
    "- GitHub: https://github.com/Mharryjs",
    "",
    "**Hiba Kashif (structure & design)**",
    "- Instagram: https://www.instagram.com/swif.site/",
    "- LinkedIn: https://www.linkedin.com/in/hiba-kashif-70b66b288?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    "",
    "You can email both of them at the team inbox: swiftsite@gmail.com.",
    "",
    "Ask me anything else and I will help.",
  ].join("\n");
}

const romanCasual = [
  ["kasy ho|kaise ho|kya haal|kya haal hai", "Main bilkul theek hoon! Aap sunao, kya chal raha hai?"],
  ["bt suno|bat suno|sun no|suno|sunao|halla", "Haan sun raha hoon, batao! Kya baat hai?"],
  ["acha|achha|ok|okay|theek|han|haan", "Theek hai ji. Aage batao, main hazir hoon."],
  ["thanks|shukriya", "Koi baat nahi! Aur kuch chahiye ho to batana."],
];
const englishCasual = [
  ["how are you|what.s up|wassup", "All good here! What are you working on?"],
  ["listen|hey bt|hey tell|talk to me", "I'm listening — what's on your mind?"],
  ["okay|ok|nice|great|cool", "Great. Tell me what's next."],
  ["thanks|thank you", "Anytime! Need anything else, just say."],
];

/** Instant no-network answers for greetings/thanks/ok/bye — zero waiting, always correct. */
export function quickReply(text: string, language: Language): string | null {
  const t = text.trim();
  if (t.length > 50) return null;
  if (/^(tnx|thnx|thanks|thank you|shukriya|shukria|bohat shukriya)[!. ]*$/i.test(t) || (/^(tnx|thanks|shukriya)/i.test(t) && t.length <= 40)) {
    return language === "roman-urdu" ? "Koi baat nahi janu! 😊 Aur kuch chahiye ho to bas batao." : "Anytime! 😊 Just tell me if you need anything else.";
  }
  if (/^(ok|okay|acha|achha|theek|sahi|han|haan|ji|hmm)[!. ]*$/i.test(t)) {
    return language === "roman-urdu" ? "Theek hai! 👍 Aage batao, kya karna hai?" : "Got it! 👍 What's next?";
  }
  if (/^(bye|allah hafiz|khuda hafiz|good night|shabba khair|phir milenge)[!. ]*$/i.test(t)) {
    return language === "roman-urdu" ? "Allah Hafiz! 👋 Phir milte hain." : "Bye! 👋 See you soon.";
  }
  return null;
}

function offlineReply(history: Turn[], language: Language): AiReply {
  const last = [...history].reverse().find((turn) => turn.role === "user")?.content ?? "";
  const greeting = /^(hi|hello|hey|salam|assalam|aoa|hola|bonjour)[!.? ]*$/i.test(last.trim());
  if (language === "roman-urdu") {
    const casual = romanCasual.find(([pattern]) => new RegExp(pattern, "i").test(last));
    if (casual) return { provider: "SwiftSite AI", text: casual[1] };
    return {
      provider: "SwiftSite AI",
      text: `Main ne aapka sawal samjha: “${last.slice(0, 240)}”\n\nIs waqt main best practical jawab de raha hoon:\n1. Pehle exact natija define karein jo aap chahte hain.\n2. Zaroori context, limits aur available cheezein likhein.\n3. Kaam ko sab se chhote working step se shuru karein.\n4. Result test karke jo ghalat ho usay ek-ek karke theek karein.\n\nAapka message aur pichli conversation save hai. Exact calculation ya conversion ho to /calc aur /convert foran kaam karte hain.`,
    };
  }
  if (greeting) return { provider: "SwiftSite AI", text: "Hello! I'm here. What are we working on today?" };
  const casual = englishCasual.find(([pattern]) => new RegExp(pattern, "i").test(last));
  if (casual) return { provider: "SwiftSite AI", text: casual[1] };
  return {
    provider: "SwiftSite AI",
    text: `I understood your question: “${last.slice(0, 240)}”\n\nHere is the most practical path I can give right now:\n1. Define the exact outcome you need.\n2. List the important context, constraints and available resources.\n3. Start with the smallest working step.\n4. Test the result and correct one issue at a time.\n\nYour message and earlier conversation are saved. Exact calculations and conversions remain available through /calc and /convert.`,
  };
}

export async function generateReply(history: Turn[], mode: string, pref: LanguagePref = "auto"): Promise<AiReply> {
  await loadSiteInstructions();
  const lastUser = [...history].reverse().find((turn) => turn.role === "user")?.content ?? "";
  const language = detectLanguage(lastUser, pref);

  const quick = quickReply(lastUser, language);
  if (quick) return { text: quick, provider: "SwiftSite AI" };

  // Identity questions are answered deterministically, so they are always right
  // and never depend on a third-party model.
  if (isTeamQuestion(lastUser)) {
    return { text: teamAnswer(language), provider: "SwiftSite team card" };
  }

  const config = await resolveProvider();
  const attempts: Array<Promise<AiReply | null>> = [raceFreeProviders(history, mode, language)];
  if (config.provider === "gemini") {
    attempts.unshift(askGemini(config, history, mode, language));
  } else if (config.provider !== "none") {
    attempts.unshift(askOpenAiCompatible(config, history, mode, language));
  }

  void buildSystemPrompt;
  const fallback = offlineReply(history, language);
  const streamed = await streamFromProviders({
    history, mode, language,
    onMeta: () => {},
    onDelta: () => {},
  });
  let answer = streamed?.trim() ?? "";
  const casualMessage = /^(hi|hello|hey|salam|assalam|aoa|ok|okay|thanks|thank you|acha|achha|theek|han|haan|nahi|bye)[!.? ]*$/i.test(lastUser.trim())
    || (lastUser.trim().length <= 28 && /\b(bt suno|bat suno|sun no|sunao|suno|kasy ho|kaise ho|kya ha|kya kar rahe|halla)\b/i.test(lastUser));
  const userAskedShort = casualMessage
    || /\b(short|brief|concise|one line|chhota|chota|kam lafz)\b/i.test(lastUser);
  // Models sometimes stop after one line on a substantive question. Ask them to
  // continue once so every real question gets a complete answer.
  if (answer && !userAskedShort && answer.length < 240 && lastUser.length > 40) {
    const continued = await streamFromProviders({
      history: [...history, { role: "assistant", content: answer }, { role: "user", content: language === "roman-urdu" ? "Isay complete karo: mazeed tafseel, points aur ek example ke sath poora jawab likho." : "Continue this answer: add the missing detail, points and one practical example so it is complete." }],
      mode, language,
      onMeta: () => {},
      onDelta: () => {},
    });
    if (continued?.trim() && continued.trim().length > answer.length) {
      answer = `${answer}\n\n${continued.trim()}`;
    }
  }
  if (answer) return { text: answer, provider: "SwiftSite AI" };

  return new Promise<AiReply>((resolve) => {
    let settled = false;
    let remaining = attempts.length;
    const finish = (reply: AiReply | null) => {
      if (settled) return;
      remaining -= 1;
      if (reply) {
        settled = true;
        resolve(reply);
      } else if (remaining === 0) {
        settled = true;
        resolve(fallback);
      }
    };
    attempts.forEach((attempt) => { void attempt.then(finish).catch(() => finish(null)); });
    setTimeout(() => {
      if (!settled) { settled = true; resolve(fallback); }
    }, 22_000);
  });
}
