"use client";

import { useState } from "react";
import { Play } from "lucide-react";

const tools = [
  ["calc","Calculator","Evaluates maths safely: operators, powers, percentages and functions like sqrt, log, sin.","(1250 * 12) / 7 + sqrt(144)"],
  ["convert","Unit converter","Length, weight, volume, speed, area, data, time and temperature.","5 miles to km"],
  ["days","Date calculator","Days between two dates, or the date after adding or removing days.","today 2026-12-25"],
  ["password","Password generator","Strong random passwords from a cryptographically secure generator.","24"],
  ["uuid","UUID generator","Random v4 UUIDs, up to 20 at a time.","3"],
  ["hash","Hash generator","MD5, SHA-1, SHA-256, SHA-384 and SHA-512 digests of any text.","sha256 hello swiftsite"],
  ["base64","Base64","Encode text to Base64 or decode it back, UTF-8 safe.","encode Hello, world"],
  ["json","JSON formatter","Validate, pretty-print or minify JSON with clear error messages.","{\"name\":\"SwiftSite\"}"],
  ["count","Text statistics","Words, characters, sentences and estimated reading time.","The quick brown fox jumps over the lazy dog."],
  ["case","Case converter","UPPER, lower, Title, camelCase, snake_case, kebab-case and slugs.","snake Hello World From SwiftSite"],
  ["random","Random picker","A random number in a range, a coin flip or a dice roll.","1 100"],
] as const;

function ToolCard({ tool }: { tool: typeof tools[number] }) {
  const [input,setInput] = useState<string>(tool[3]);
  const [output,setOutput] = useState("");
  const [busy,setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const response = await fetch('/api/tools',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({command:tool[0],input})});
      const data = await response.json() as {result?:string;error?:string};
      setOutput(data.result ?? data.error ?? 'Could not run tool');
    } catch { setOutput('Could not run tool'); } finally { setBusy(false); }
  }
  return <article className="glass rounded-3xl p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-leaf-950">{tool[1]}</h2><p className="mt-1 text-xs leading-relaxed text-leaf-950/65">{tool[2]}</p></div><span className="chip font-mono">/{tool[0]}</span></div><div className="mt-4 flex gap-2"><input className="field min-w-0 flex-1 font-mono !text-xs" value={input} onChange={event=>setInput(event.target.value)} aria-label={`${tool[1]} input`}/><button className="btn btn-primary !px-3" onClick={run} disabled={busy} aria-label={`Run ${tool[1]}`}><Play/>{busy?'…':'Run'}</button></div>{output && <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-white/60 p-3 font-mono text-xs leading-relaxed text-leaf-900">{output}</pre>}</article>;
}

export default function ToolsWorkspace(){return <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tools.map(tool=><ToolCard key={tool[0]} tool={tool}/>)}</div>}
