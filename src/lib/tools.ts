import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";

export type ToolResult = {
  command: string;
  input: string;
  result: string;
  detail?: string;
};

class MathParser {
  private position = 0;

  constructor(private readonly source: string) {}

  parse() {
    const value = this.expression();
    this.space();
    if (this.position !== this.source.length || !Number.isFinite(value)) {
      throw new Error("Invalid mathematical expression");
    }
    return value;
  }

  private expression(): number {
    let value = this.term();
    while (true) {
      if (this.take("+")) value += this.term();
      else if (this.take("-")) value -= this.term();
      else return value;
    }
  }

  private term(): number {
    let value = this.power();
    while (true) {
      if (this.take("*")) value *= this.power();
      else if (this.take("/")) value /= this.power();
      else if (this.take("%")) value %= this.power();
      else return value;
    }
  }

  private power(): number {
    const value = this.unary();
    return this.take("^") ? value ** this.power() : value;
  }

  private unary(): number {
    if (this.take("+")) return this.unary();
    if (this.take("-")) return -this.unary();
    return this.primary();
  }

  private primary(): number {
    this.space();
    if (this.take("(")) {
      const value = this.expression();
      if (!this.take(")")) throw new Error("Missing closing parenthesis");
      return value;
    }

    const rest = this.source.slice(this.position);
    const number = rest.match(/^(?:\d+\.?\d*|\.\d+)/)?.[0];
    if (number) {
      this.position += number.length;
      return Number(number);
    }

    const identifier = rest.match(/^[a-zA-Z]+/)?.[0]?.toLowerCase();
    if (!identifier) throw new Error("Expected a number or function");
    this.position += identifier.length;
    if (identifier === "pi") return Math.PI;
    if (identifier === "e") return Math.E;
    if (!this.take("(")) throw new Error(`Use ${identifier}(value)`);
    const value = this.expression();
    if (!this.take(")")) throw new Error("Missing closing parenthesis");
    const functions: Record<string, (input: number) => number> = {
      sqrt: Math.sqrt,
      abs: Math.abs,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      log: Math.log10,
      ln: Math.log,
      round: Math.round,
      floor: Math.floor,
      ceil: Math.ceil,
    };
    const fn = functions[identifier];
    if (!fn) throw new Error(`Unknown function: ${identifier}`);
    return fn(value);
  }

  private take(token: string) {
    this.space();
    if (this.source.startsWith(token, this.position)) {
      this.position += token.length;
      return true;
    }
    return false;
  }

  private space() {
    while (/\s/.test(this.source[this.position] ?? "")) this.position += 1;
  }
}

const formatNumber = (number: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 10 }).format(number);

const units: Record<string, { group: string; factor: number }> = {
  m: { group: "length", factor: 1 }, meter: { group: "length", factor: 1 }, meters: { group: "length", factor: 1 },
  km: { group: "length", factor: 1000 }, cm: { group: "length", factor: 0.01 }, mm: { group: "length", factor: 0.001 },
  mi: { group: "length", factor: 1609.344 }, mile: { group: "length", factor: 1609.344 }, miles: { group: "length", factor: 1609.344 },
  ft: { group: "length", factor: 0.3048 }, feet: { group: "length", factor: 0.3048 }, inch: { group: "length", factor: 0.0254 }, inches: { group: "length", factor: 0.0254 },
  kg: { group: "weight", factor: 1 }, g: { group: "weight", factor: 0.001 }, lb: { group: "weight", factor: 0.45359237 }, lbs: { group: "weight", factor: 0.45359237 },
  l: { group: "volume", factor: 1 }, liter: { group: "volume", factor: 1 }, liters: { group: "volume", factor: 1 }, ml: { group: "volume", factor: 0.001 }, gal: { group: "volume", factor: 3.785411784 },
  b: { group: "data", factor: 1 }, kb: { group: "data", factor: 1024 }, mb: { group: "data", factor: 1024 ** 2 }, gb: { group: "data", factor: 1024 ** 3 }, tb: { group: "data", factor: 1024 ** 4 },
};

const zones: Record<string, string> = {
  karachi: "Asia/Karachi", lahore: "Asia/Karachi", islamabad: "Asia/Karachi",
  london: "Europe/London", paris: "Europe/Paris", dubai: "Asia/Dubai", tokyo: "Asia/Tokyo",
  "new york": "America/New_York", chicago: "America/Chicago", sydney: "Australia/Sydney",
};

function convertUnits(input: string) {
  const match = input.toLowerCase().trim().match(/^(-?\d+(?:\.\d+)?)\s*([a-z]+)\s+(?:to|in)\s+([a-z]+)$/);
  if (!match) throw new Error("Try: 5 miles to km");
  const value = Number(match[1]);
  const from = match[2];
  const to = match[3];
  if (["c", "f", "k"].includes(from) && ["c", "f", "k"].includes(to)) {
    const celsius = from === "c" ? value : from === "f" ? (value - 32) * 5 / 9 : value - 273.15;
    const result = to === "c" ? celsius : to === "f" ? celsius * 9 / 5 + 32 : celsius + 273.15;
    return `${formatNumber(result)} °${to.toUpperCase()}`;
  }
  const fromUnit = units[from];
  const toUnit = units[to];
  if (!fromUnit || !toUnit || fromUnit.group !== toUnit.group) throw new Error("Those units are not compatible");
  return `${formatNumber((value * fromUnit.factor) / toUnit.factor)} ${to}`;
}

function worldTime(input: string) {
  const places = input.split(",").map((item) => item.trim()).filter(Boolean);
  if (!places.length) throw new Error("Try: Karachi, London, New York");
  return places.map((place) => {
    const zone = zones[place.toLowerCase()] ?? place;
    try {
      const time = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date());
      return `${place}: ${time}`;
    } catch {
      return `${place}: unknown location`;
    }
  }).join("  •  ");
}

function dateDays(input: string) {
  const values = input.trim().split(/\s+/);
  if (values.length < 2) throw new Error("Try: today 2026-12-25");
  const parseDate = (value: string) => value.toLowerCase() === "today" ? new Date() : new Date(`${value}T00:00:00Z`);
  const first = parseDate(values[0]);
  const second = parseDate(values[1]);
  if (Number.isNaN(first.valueOf()) || Number.isNaN(second.valueOf())) throw new Error("Use dates as YYYY-MM-DD");
  const days = Math.round(Math.abs(second.valueOf() - first.valueOf()) / 86_400_000);
  return `${days.toLocaleString("en-US")} day${days === 1 ? "" : "s"}`;
}

function changeCase(input: string) {
  const [style = "lower", ...parts] = input.trim().split(/\s+/);
  const text = parts.join(" ");
  const words = text.trim().split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const lower = words.map((word) => word.toLowerCase());
  const cap = (word: string) => word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word;
  const outputs: Record<string, string> = {
    upper: text.toUpperCase(), lower: text.toLowerCase(), title: words.map(cap).join(" "),
    camel: lower.map((word, index) => index ? cap(word) : word).join(""),
    snake: lower.join("_"), kebab: lower.join("-"), slug: lower.join("-"),
  };
  if (!outputs[style.toLowerCase()]) throw new Error("Use upper, lower, title, camel, snake, kebab or slug");
  return outputs[style.toLowerCase()];
}

export function runTool(commandValue: string, rawInput: string): ToolResult {
  const command = commandValue.replace(/^\//, "").toLowerCase().trim();
  const input = rawInput.trim();
  if (!input && !["uuid", "password", "random"].includes(command)) throw new Error("Please enter a value");
  let result = "";

  switch (command) {
    case "calc": result = formatNumber(new MathParser(input).parse()); break;
    case "convert": result = convertUnits(input); break;
    case "time": result = worldTime(input); break;
    case "days": result = dateDays(input); break;
    case "password": {
      const length = Math.min(64, Math.max(8, Number.parseInt(input || "20", 10) || 20));
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
      const bytes = randomBytes(length);
      result = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
      break;
    }
    case "uuid": {
      const amount = Math.min(20, Math.max(1, Number.parseInt(input || "1", 10) || 1));
      result = Array.from({ length: amount }, () => randomUUID()).join("\n");
      break;
    }
    case "hash": {
      const [algorithm = "sha256", ...text] = input.split(" ");
      const allowed = ["md5", "sha1", "sha256", "sha384", "sha512"];
      if (!allowed.includes(algorithm.toLowerCase())) throw new Error(`Use: ${allowed.join(", ")}`);
      result = createHash(algorithm.toLowerCase()).update(text.join(" ")).digest("hex");
      break;
    }
    case "base64": {
      const [operation = "encode", ...text] = input.split(" ");
      result = operation === "decode" ? Buffer.from(text.join(" "), "base64").toString("utf8") : Buffer.from(text.join(" "), "utf8").toString("base64");
      break;
    }
    case "json": {
      const parsed: unknown = JSON.parse(input);
      result = JSON.stringify(parsed, null, 2);
      break;
    }
    case "count": {
      const words = input.match(/[\p{L}\p{N}’'-]+/gu)?.length ?? 0;
      const sentences = input.split(/[.!?]+/).filter((part) => part.trim()).length;
      result = `${words} words  •  ${input.length} characters  •  ${sentences} sentence${sentences === 1 ? "" : "s"}  •  ${Math.max(1, Math.ceil(words / 220))} min read`;
      break;
    }
    case "case": result = changeCase(input); break;
    case "random": {
      const [minValue = "1", maxValue = "100"] = input.split(/\s+/);
      const min = Number.parseInt(minValue, 10); const max = Number.parseInt(maxValue, 10);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) throw new Error("Try: 1 100");
      result = String(randomInt(min, max + 1));
      break;
    }
    default: throw new Error("Unknown tool. Try calc, convert, time, days, password, uuid, hash, base64, json, count, case or random.");
  }

  return { command, input, result };
}
