"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, Send, Loader2, Sparkles, MessageSquare, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "I want to buy the new iPhone 16. Will it overload my budget this month?",
  "I am planning a $3,000 dinner tonight. Is this reasonable given my trend?",
  "I need a dehumidifier. Is installments or upfront better for my cashflow?",
  "If I want to save $10,000 this month, which category should I cut first?",
];

export default function AdvisorPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (textToSubmit = question) => {
    const finalQuestion = textToSubmit.trim();
    if (!finalQuestion || isLoading) return;

    setIsLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/interceptor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: finalQuestion }),
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
      setResponse("Analysis failed. Please try again later.");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
    handleSubmit(suggestion);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111]">
          <BrainCircuit className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#111111]">AI Financial Advisor</h1>
          <p className="text-[#666666] text-xs">Analyze balance sheets to make structured, evidence-based decisions</p>
        </div>
      </div>

      {/* Main Chat / Result Area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 rounded-xl">
        {!response && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#FAFAFA] border border-dashed border-[#E5E5E5] rounded-md">
            <Sparkles className="h-8 w-8 text-[#999999] mb-4" />
            <h3 className="text-lg font-semibold mb-1 text-[#111111]">What purchase are we analyzing today?</h3>
            <p className="text-[#666666] max-w-sm mb-6 text-xs">
              This will be evaluated against available surplus and 3-month rolling category averages.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="flex items-start gap-2 text-left text-xs p-3 rounded-md border border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] hover:border-[#111111] transition-all duration-150"
                >
                  <Lightbulb className="h-3.5 w-3.5 text-[#111111] mt-0.5 shrink-0" />
                  <span className="text-[#666666] hover:text-[#111111]">{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Message */}
            <div className="flex justify-end">
              <div className="bg-[#111111] text-white rounded-md px-4 py-2.5 max-w-md shadow-sm">
                <p className="text-xs">{question}</p>
              </div>
            </div>

            {/* AI Response Card */}
            <Card className="border border-[#E5E5E5] shadow-none bg-white rounded-md">
              <CardHeader className="pb-2 flex flex-row items-center gap-2 border-b border-[#E5E5E5]">
                <BrainCircuit className="h-4 w-4 text-[#111111]" />
                <CardTitle className="text-sm font-semibold text-[#111111]">SpendWise Advisory</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading && !response ? (
                  <div className="flex items-center gap-2 text-[#666666]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#111111]" />
                    <span className="text-xs">Processing data sheet...</span>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-[#111111] font-sans">
                    {response}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Input Area */}
      <div className="border-t border-[#E5E5E5] pt-4">
        <div className="relative">
          <Textarea
            placeholder="Type your budget inquiry..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none pr-14 min-h-[48px] shadow-none border-[#E5E5E5] focus-visible:ring-[#111111] rounded-md text-sm"
            rows={2}
          />
          <Button
            size="icon"
            className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-md bg-[#111111] hover:bg-[#222222] text-white"
            onClick={() => handleSubmit()}
            disabled={isLoading || !question.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
