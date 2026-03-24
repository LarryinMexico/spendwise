import { useState, useRef, useCallback } from "react";

export function useAIStream(apiEndpoint: string = "/api/simulator") {
  const [response, setResponse] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamRequest = useCallback(
    async (body: Record<string, any>) => {
      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsStreaming(true);
      setResponse("");
      setError(null);

      try {
        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("API stream failed");
        }

        const responseBody = res.body;
        if (!responseBody) {
          throw new Error("No response body");
        }

        const reader = responseBody.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Process chunk recursively (using async loop instead of promise recursion for stability)
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          setResponse((prev) => prev + buffer);
          buffer = ""; // flush buffer
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Streaming error:", err);
          setError(err);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          setIsStreaming(false);
          abortControllerRef.current = null;
        }
      }
    },
    [apiEndpoint]
  );

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return { response, isStreaming, error, streamRequest, abortStream, setResponse };
}
