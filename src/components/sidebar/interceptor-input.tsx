"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export function InterceptorInput() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/interceptor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) throw new Error("API error");

      const body = res.body;
      if (!body) throw new Error("No response body");
      const reader = body.getReader();

      const decoder = new TextDecoder();
      let buffer = "";

      function processChunk({ done, value }: ReadableStreamReadResult<Uint8Array>) {
        if (done) {
          setIsLoading(false);
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        setResponse(buffer);

        reader.read().then(processChunk);
      }

      reader.read().then(processChunk);
    } catch (e) {
      console.error("Interceptor error:", e);
      setResponse("分析失敗，請稍後再試。");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Lightbulb className="h-4 w-4 text-primary" />
        <span>消費決策助手</span>
      </div>

      <div className="relative">
        <Textarea
          placeholder="我想買..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          className="resize-none pr-10"
          rows={2}
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1 h-8 w-8"
          onClick={handleSubmit}
          disabled={isLoading || !question.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {response && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto animate-in fade-in duration-200">
          {response}
        </div>
      )}
    </div>
  );
}
