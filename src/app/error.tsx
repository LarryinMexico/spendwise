"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="zh-TW">
      <body className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md p-6">
          <h1 className="text-4xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground">
            An unexpected error occurred。Please try refreshing the page.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
