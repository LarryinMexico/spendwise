"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export function AICategorizeButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCategorize = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        window.location.reload();
      } else {
        toast.error(data.error || "Categorize Failed");
      }
    } catch (e) {
      toast.error("Categorize Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleCategorize} disabled={isLoading} variant="outline">
      <Sparkles className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "AI Categorizing..." : "AI Categorize"}
    </Button>
  );
}
