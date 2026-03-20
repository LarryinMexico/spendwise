"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold text-destructive">發生錯誤</h2>
        <p className="text-muted-foreground">
          載入儀表板時發生問題。請嘗試重新整理頁面。
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          重新嘗試
        </button>
        <p className="text-xs text-muted-foreground">
          Error ID: {error.digest || "unknown"}
        </p>
      </div>
    </div>
  );
}
