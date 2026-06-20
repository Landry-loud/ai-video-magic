// Always-on AI Copilot — streaming chat about the current project.
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { Send, Bot, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUICK = [
  "How can I improve this edit?",
  "What should I cut?",
  "Where should I zoom?",
  "Suggest a better hook.",
  "Make subtitles tighter.",
  "Give 3 title variants.",
];

export function CopilotPanel({ projectContext }: { projectContext: string }) {
  const [input, setInput] = useState("");
  const transport = useRef(new DefaultChatTransport({ api: "/api/copilot", body: { projectContext } }));
  const { messages, sendMessage, status } = useChat({
    transport: transport.current,
  });
  const isLoading = status === "submitted" || status === "streaming";

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;
    setInput("");
    sendMessage({ text: t });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border-subtle p-3">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <div className="text-sm font-medium">AI Copilot</div>
          <div className="text-[10px] text-muted-foreground">Always analyzing your project</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto scrollbar-thin p-3">
        {messages.length === 0 && (
          <div>
            <div className="rounded-lg border border-border bg-elevated/40 p-3 text-xs text-muted-foreground">
              Ask anything about pacing, cuts, subtitles, hooks, titles. The Copilot sees your current brief and analysis.
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button key={q} onClick={() => send(q)} className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m: UIMessage) => (
          <Message key={m.id} role={m.role} text={textOf(m)} />
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <Message role="assistant" text="" thinking />
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="border-t border-border-subtle p-2"
      >
        <div className="flex items-end gap-2 rounded-lg border border-border bg-background p-1.5 focus-within:border-primary/50">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            rows={1}
            placeholder="Ask the Copilot…"
            className="max-h-32 min-h-[28px] flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-8 w-8 shrink-0 bg-primary-gradient text-primary-foreground">
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Message({ role, text, thinking }: { role: string; text: string; thinking?: boolean }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30">
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${isUser ? "bg-primary text-primary-foreground" : "bg-elevated/60 text-foreground"}`}>
        {thinking ? <span className="inline-flex gap-1"><Dot /><Dot d={0.15} /><Dot d={0.3} /></span> : <span className="whitespace-pre-wrap">{text}</span>}
      </div>
    </div>
  );
}

function Dot({ d = 0 }: { d?: number }) {
  return <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d}s` }} />;
}

function textOf(m: UIMessage): string {
  return (m.parts ?? []).map((p) => (p.type === "text" ? p.text : "")).join("");
}
