"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string };

type ChatResponse = {
  reply: string;
  model: string;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ChatShell() {
  const [messages, setMessages] = React.useState<Message[]>([
    { id: uid(), role: "assistant", content: "Hi — how can I help you today?" },
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

    setMessages((m) => [...m, { id: uid(), role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = (await res.json()) as Partial<ChatResponse> & { error?: string; detail?: any };

      if (!res.ok) {
        const err =
          data?.error ??
          (typeof data?.detail === "string" ? data.detail : "Request failed");
        setMessages((m) => [...m, { id: uid(), role: "assistant", content: `Error: ${err}` }]);
        return;
      }

      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", content: data.reply ?? "(empty reply)" },
      ]);
    } catch {
      setMessages((m) => [...m, { id: uid(), role: "assistant", content: "Error: network issue" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-3">
  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ring-border shadow-sm">
    <Image
      src="/logo/clicktap.png"
      alt="Clicktap"
      width={28}
      height={28}
      priority
    />
  </div>

  <div className="flex flex-col">
    <h1 className="text-2xl font-semibold tracking-tight">
      Clicktap Chat
    </h1>
    <p className="text-sm text-muted-foreground">
      Internal assistant — fast answers, clean responses.
    </p>
  </div>
</div>

        {/* <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 ring-1 ring-primary/15" />
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold tracking-tight">Clicktap Chat</h1>
            <p className="text-sm text-muted-foreground">
              Internal assistant — fast answers, clean responses.
            </p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2">
            <Badge variant="secondary">Production</Badge>
            <Badge variant="outline">RAG</Badge>
          </div>
        </div> */}
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Chat</p>
            <p className="text-xs text-muted-foreground">Type a question and press Enter</p>
          </div>
          <Separator />
        </CardHeader>

        <CardContent className="space-y-3">
          <ScrollArea className="h-[62vh] rounded-xl border bg-background">
            <div className="space-y-3 p-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-4 py-2 text-sm shadow-sm">Thinking…</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something…"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <Button onClick={send} disabled={loading || input.trim().length === 0}>
              Send
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Tip: Don’t paste secrets. This chat is for internal knowledge and workflows.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
