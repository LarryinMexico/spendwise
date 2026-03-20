"use client";

import { useEffect, useState } from "react";

export interface Upload {
  id: string;
  clerkUserId: string;
  fileName: string;
  transactionCount: number;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  createdAt: string;
}

export function useUploads() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUploads() {
      try {
        const res = await fetch("/api/uploads");
        if (!res.ok) throw new Error("取得上傳記錄失敗");
        const data = await res.json();
        setUploads(data.uploads || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "發生錯誤");
      } finally {
        setLoading(false);
      }
    }

    fetchUploads();
  }, []);

  const deleteUpload = async (uploadId: string) => {
    try {
      const res = await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId }),
      });
      if (!res.ok) throw new Error("刪除失敗");
      setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "刪除失敗");
      return false;
    }
  };

  return { uploads, loading, error, deleteUpload, refresh: () => {} };
}
