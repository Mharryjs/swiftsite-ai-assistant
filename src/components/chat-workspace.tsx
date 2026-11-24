"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { BookMarked, Copy, ImageIcon, MessageSquare, Paperclip, Pencil, RotateCcw, Search, Settings, Square, Trash2, Wrench, X } from "lucide-react";
import InstallButton from "@/components/install-button";

type Attachment = { id: string; name: string; mime: string; bytes: number; url: string };
type ChatMessage = { id: string; role: "user" | "assistant"; content: string; provider?: string; artifact?: { url: string; title: string }; files?: Attachment[]; error?: boolean };
type HistoryItem = { id: string; title: string; mode: string; updatedAt: string };
type StreamEvent = { type: "meta" | "delta" | "done" | "error" | "heartbeat"; conversationId?: string; provider?: string; text?: string; message?: string; artifact?: { url: string; title: string } };
const modes = ["assistant", "developer", "writer", "translator", "analyst", "tutor"];
const suggestions = [
  ["Explain something", "Explain how the internet works, in simple words"],
  ["Roman Urdu", "Mujhe ek acha sa birthday message likh ke do"],
  ["Simple website", "Make a simple website for a coffee shop"],
  ["3D glass login", "Make a login page HTML CSS JavaScript use and 3D transparent"],
];

function RichText({ content }: { content: string }) {
  return <div className="message-body md" style={{ whiteSpace: "pre-wrap" }}>{content}</div>;
}

export default function ChatWorkspace() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("assistant");
  const [provider, setProvider] = useState("Checking connection…");
  const [working, setWorking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [installed, setInstalled] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activeConversation = useRef<string | null>(null);

  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    const current = localStorage.getItem("swiftsite_workspace") ?? `ws_${crypto.randomUUID().replaceAll("-", "")}`;
    localStorage.setItem("swiftsite_workspace", current);
    setWorkspaceId(current);
    const prompt = new URLSearchParams(location.search).get("prompt");
    if (prompt) { setInput(prompt); window.history.replaceState({}, "", "/chat"); }
    fetch("/api/health", { cache: "no-store" }).then(res => { if (!res.ok) setError("Server is unavailable. Check your connection."); }).catch(() => setError("You are offline. Connect to send messages."));
    fetch(`/api/chat?workspaceId=${current}&provider=1`, { cache: "no-store" }).then(res => res.json()).then((data: { provider?: string; connected?: boolean }) => setProvider(data.provider ?? "AI unavailable")).catch(() => setProvider("Offline"));
  }, []);

  const refreshHistory = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/chat?workspaceId=${encodeURIComponent(workspaceId)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load chats.");
      const data = await res.json() as { conversations: HistoryItem[] };
      setHistory(data.conversations ?? []);
    } catch { setError("Conversation history could not load. Retry by refreshing."); }
  }, [workspaceId]);
  useEffect(() => { void refreshHistory(); }, [refreshHistory]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: working ? "instant" : "smooth", block: "end" }); }, [messages, working]);

  function newChat() {
    abortRef.current?.abort(); activeConversation.current = null;
    setConversationId(null); setMessages([]); setInput(""); setFiles([]); setError(""); setSidebarOpen(false);
    textRef.current?.focus();
  }
  async function loadConversation(id: string) {
    try {
      const res = await fetch(`/api/chat?workspaceId=${encodeURIComponent(workspaceId)}&conversationId=${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Conversation not found.");
      const data = await res.json() as { conversation: HistoryItem; messages: ChatMessage[] };
      activeConversation.current = id; setConversationId(id); setMode(data.conversation.mode);
      setMessages(data.messages.map(msg => ({ ...msg, role: msg.role === "user" ? "user" : "assistant" })));
      setSidebarOpen(false); setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not open conversation."); }
  }
  async function renameChat(item: HistoryItem) {
    const title = prompt("Rename conversation", item.title)?.trim();
    if (!title || title === item.title) return;
    const res = await fetch(`/api/conversations/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-workspace-id": workspaceId }, body: JSON.stringify({ title }) });
    if (res.ok) void refreshHistory(); else setError("Could not rename the chat.");
  }
  async function deleteChat(item: HistoryItem) {
    if (!confirm(`Permanently delete “${item.title}” and its messages?`)) return;
    const res = await fetch(`/api/conversations/${item.id}`, { method: "DELETE", headers: { "x-workspace-id": workspaceId } });
    if (!res.ok) { setError("Could not delete the chat."); return; }
    if (conversationId === item.id) newChat();
    void refreshHistory();
  }
  async function attach(selected: FileList | null) {
    if (!selected?.length) return;
    setUploading(true); setError("");
    for (const file of Array.from(selected).slice(0, 5 - files.length)) {
      const form = new FormData(); form.append("file", file);
      try {
        const res = await fetch(`/api/chat/attachments?workspaceId=${encodeURIComponent(workspaceId)}`, { method: "POST", body: form });
        const data = await res.json() as Attachment & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Upload failed.");
        setFiles(prev => [...prev, data]);
      } catch (caught) { setError(caught instanceof Error ? caught.message : "File upload failed."); }
    }
    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
  }
  async function removeFile(file: Attachment) {
    setFiles(prev => prev.filter(item => item.id !== file.id));
    await fetch(`/api/chat/attachments?id=${file.id}&workspaceId=${encodeURIComponent(workspaceId)}`, { method: "DELETE" }).catch(() => {});
  }

  async function send(text: string, options?: { regenerate?: boolean }) {
    if ((!text.trim() && !files.length) || working || !workspaceId) return;
    if (!navigator.onLine) { setError("You are offline. Reconnect before sending; your draft is safe."); return; }
    const selected = [...files];
    const currentId = activeConversation.current;
    const userId = crypto.randomUUID();
    const answerId = crypto.randomUUID();
    setError(""); setWorking(true); setProvider("Connecting to AI…");
    if (!options?.regenerate) setMessages(prev => [...prev, { id: userId, role: "user", content: text, files: selected }]);
    setMessages(prev => [...prev, { id: answerId, role: "assistant", content: "" }]);
    if (!options?.regenerate) { setInput(""); setFiles([]); }
    const controller = new AbortController(); abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 90000);
    let received = "";
    let completed = false;
    let doneMeta: StreamEvent | null = null;
    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ workspaceId, conversationId: currentId, message: text, mode, attachmentIds: selected.map(file => file.id), regenerate: options?.regenerate }),
      });
      if (!res.ok || !res.body) {
        const info = await res.json().catch(() => ({ error: "Server unavailable." })) as { error?: string };
        throw new Error(info.error ?? `Server error ${res.status}`);
      }
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const lines = buffer.split("\n"); buffer = done ? "" : (lines.pop() ?? "");
        for (const line of lines) {
          if (!line.trim()) continue;
          let item: StreamEvent;
          try { item = JSON.parse(line) as StreamEvent; } catch { continue; }
          if (item.conversationId) { activeConversation.current = item.conversationId; setConversationId(item.conversationId); }
          if (item.provider) setProvider(item.provider);
          if (item.type === "delta" && item.text) {
            received += item.text;
            setMessages(prev => prev.map(msg => msg.id === answerId ? { ...msg, content: received } : msg));
          }
          if (item.type === "done") { completed = true; doneMeta = item; }
          if (item.type === "error") throw new Error(item.message ?? "AI provider error.");
        }
        if (done) break;
      }
      if (!completed || !received.trim()) throw new Error("Provider stopped before finishing. Your conversation is saved; retry this message.");
      const artifact = (doneMeta as StreamEvent | null)?.artifact;
      if (artifact) setMessages(prev => prev.map(msg => msg.id === answerId ? { ...msg, artifact } : msg));
      await refreshHistory();
    } catch (caught) {
      const stopped = controller.signal.aborted;
      const reason = stopped ? "Generation stopped. Partial answer kept; you can regenerate it." : caught instanceof Error ? caught.message : "Connection failed. Retry when online.";
      setError(reason);
      if (received) setMessages(prev => prev.map(msg => msg.id === answerId ? { ...msg, content: received, error: true } : msg));
      else setMessages(prev => prev.filter(msg => msg.id !== answerId));
      if (!received && !options?.regenerate) setInput(text);
    } finally { clearTimeout(timeout); abortRef.current = null; setWorking(false); }
  }
  function onSubmit(event: FormEvent) { event.preventDefault(); void send(input.trim()); }
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(input.trim()); }
  }
  function regenerate() {
    const last = [...messages].reverse().find(msg => msg.role === "user");
    if (last) void send(last.content, { regenerate: true });
  }

  return <div className="chat-app">
    <aside className={sidebarOpen ? "chat-sidebar open" : "chat-sidebar"}>
      <div className="sidebar-head"><Link href="/" className="chat-brand"><Image src="/icon.svg" alt="" width={36} height={36}/><strong><span>Swift</span><span>Site</span></strong></Link><button className="sidebar-close icon-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="new-chat-wrap"><button className="new-chat btn btn-primary" onClick={newChat}>＋ New chat</button></div>
      <div className="history-search"><Search/><input className="field" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search conversations" aria-label="Search conversations"/></div>
      <div className="history-label">Recent chats</div>
      <div className="history-list">{history.filter(item => item.title.toLowerCase().includes(search.toLowerCase())).map(item => <div className="history-entry" key={item.id}><button className={conversationId === item.id ? "active" : ""} onClick={() => void loadConversation(item.id)} title={item.title}><span className="history-bubble">◌</span><span><strong>{item.title}</strong><small>{item.mode}</small></span></button><button className="entry-action" aria-label={`Rename ${item.title}`} onClick={() => void renameChat(item)}><Pencil size={13}/></button><button className="entry-action" aria-label={`Delete ${item.title}`} onClick={() => void deleteChat(item)}><Trash2 size={13}/></button></div>)}{!history.length && <p className="empty-history">Your conversations will appear here.</p>}</div>
      <nav className="sidebar-nav" aria-label="Workspace"><Link href="/chat"><MessageSquare size={17}/> Chat</Link><Link href="/prompts"><BookMarked size={17}/> Prompts</Link><Link href="/tools"><Wrench size={17}/> Tools</Link><Link href="/studio"><ImageIcon size={17}/> Studio</Link><Link href="/settings"><Settings size={17}/> Settings</Link></nav>
      {!installed && <p className="sidebar-privacy">Chats are saved to your private workspace. The owner can review conversation activity; see Privacy.</p>}
    </aside>
    {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"/>}
    <main className="chat-main">
      <header className="chat-header"><button className="sidebar-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button><div className="chat-title"><strong data-brand-name>SwiftSite Assistant</strong><span><i className={provider.includes("Offline") ? "offline" : ""}/>{provider}</span></div><label className="mode-select"><span>Mode</span><select value={mode} onChange={event => setMode(event.target.value)}>{modes.map(item => <option key={item} value={item}>{item[0].toUpperCase()+item.slice(1)}</option>)}</select></label><InstallButton/><button className="header-new" onClick={newChat}>＋ New</button></header>
      <div className="message-stage">
        {!messages.length ? <section className="chat-welcome"><Image src="/icon.svg" alt="" width={58} height={58} className="welcome-mark"/><h1>Kya banayein aaj?</h1><p className="welcome-copy">Ask a question in your language, or open a saved chat.</p><div className="suggestion-grid">{suggestions.map(([title,prompt]) => <button key={title} onClick={() => void send(prompt)}><span>✦</span><div><strong>{title}</strong><small>{prompt}</small></div></button>)}</div></section> : <div className="messages-list">{messages.map(msg => <div className={`message-row ${msg.role}`} key={msg.id}><div className="message-avatar">{msg.role === "user" ? "Y" : "S"}</div><div className="message-content"><div className="message-meta">{msg.role === "user" ? "You" : msg.provider ?? "Assistant"}</div><div className="message-body" style={{ whiteSpace: "pre-wrap" }}>{msg.content || (working ? <span className="typing"><i/><i/><i/></span> : "")}</div>{msg.files?.length ? <div className="sent-files">{msg.files.map(file => <a href={file.url} key={file.id} target="_blank" rel="noreferrer">{file.mime.startsWith("image/") ? <Image src={file.url} alt={file.name} width={120} height={80} unoptimized/> : file.mime.startsWith("video/") ? <video src={file.url} controls width={160}/> : <span>📄 {file.name}</span>}</a>)}</div> : null}{msg.artifact && <div className="artifact-row"><a className="btn btn-ghost" href={msg.artifact.url} target="_blank" rel="noreferrer">Preview</a><a className="btn btn-ghost" href={`${msg.artifact.url}?download=1`}>Download HTML</a></div>}{msg.role === "assistant" && msg.content && <div className="message-actions"><button onClick={() => void navigator.clipboard.writeText(msg.content)} title="Copy response" aria-label="Copy response"><Copy size={14}/></button><button onClick={regenerate} disabled={working} title="Regenerate response" aria-label="Regenerate response"><RotateCcw size={14}/></button></div>}</div></div>)}<div ref={endRef}/></div>}
      </div>
      <div className="composer-wrap">{error && <div className="chat-error" role="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={14}/></button></div>}{files.length > 0 && <div className="pending-files">{files.map(file => <span key={file.id}>{file.mime.startsWith("image/") ? <Image src={file.url} alt="" width={30} height={30} unoptimized/> : file.mime.startsWith("video/") ? "🎬" : "📄"}{file.name}<button aria-label={`Remove ${file.name}`} onClick={() => void removeFile(file)}><X size={12}/></button></span>)}</div>}<form className="composer" onSubmit={onSubmit}><textarea ref={textRef} rows={2} value={input} onChange={event => setInput(event.target.value)} onKeyDown={onKeyDown} placeholder={working ? "Generating… you can type the next message" : "Message SwiftSite…"}/><div className="composer-bottom"><button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || files.length >= 5} aria-label="Attach files"><Paperclip size={17}/></button><input ref={fileRef} type="file" multiple className="sr-only" accept="image/*,video/mp4,video/webm,.pdf,.txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.html,.css,.py,.sql" onChange={event => void attach(event.target.files)}/><span>{uploading ? "Uploading…" : `${files.length}/5 files · Shift+Enter for a new line`}</span>{working ? <button type="button" onClick={() => abortRef.current?.abort()} className="send-action" aria-label="Stop generation"><Square size={14}/></button> : <button className="send-action" type="submit" disabled={(!input.trim() && !files.length) || uploading} aria-label="Send message">↑</button>}</div></form><p className="chat-disclaimer">AI may make mistakes. Files and conversations are saved in your workspace.</p></div>
    </main>
  </div>;
}
