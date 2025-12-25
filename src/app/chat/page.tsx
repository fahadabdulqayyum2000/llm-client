"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
};

type ChatResponse = {
  reply: string;
  model: string;
  sources?: { source: string }[] | null;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ChatPage() {
  const [messages, setMessages] = React.useState<Message[]>([
    { id: uid(), role: "assistant", content: "Hi! Ask me anything about the company knowledge base." },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: uid(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = (await res.json()) as ChatResponse & { detail?: any; error?: string };

      if (!res.ok) {
        const errText =
          data?.error ??
          (typeof data?.detail === "string" ? data.detail : "Request failed");
        setMessages((m) => [
          ...m,
          { id: uid(), role: "assistant", content: `Error: ${errText}` },
        ]);
        return;
      }

      const answer = data.reply ?? "(empty reply)";
      setMessages((m) => [...m, { id: uid(), role: "assistant", content: answer }]);

      // Optional: show sources as a follow-up message
    //   if (data.sources && data.sources.length > 0) {
    //     const srcLine = data.sources.map((s) => s.source).join(", ");
    //     setMessages((m) => [...m, { id: uid(), role: "assistant", content: `Sources: ${srcLine}` }]);
    //   }
    } catch {
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", content: "Error: network issue" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Clicktap Chat <Badge variant="secondary">RAG</Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <ScrollArea className="h-[60vh] rounded-xl border p-3">
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-3 py-2 text-sm shadow-sm">
                    Thinking…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <Separator />

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              disabled={loading}
            />
            <Button onClick={send} disabled={loading || input.trim().length === 0}>
              Send
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Tip: token is handled server-side via /api/chat (safe for production).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
