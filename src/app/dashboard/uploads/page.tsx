"use client";

import { useUploads } from "@/hooks/use-uploads";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Calendar, Hash, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function UploadCard({
  upload,
  onDelete,
  deleting,
}: {
  upload: {
    id: string;
    fileName: string;
    transactionCount: number;
    dateRangeStart: string | null;
    dateRangeEnd: string | null;
    createdAt: string;
  };
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-medium">
              {upload.fileName}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={deleting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription className="text-xs">
          上傳時間：{formatDateTime(upload.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Hash className="h-4 w-4" />
            <span>{upload.transactionCount} 筆交易</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(upload.dateRangeStart)} ~ {formatDate(upload.dateRangeEnd)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UploadsPage() {
  const { uploads, loading, error, deleteUpload } = useUploads();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (uploadId: string) => {
    setDeletingId(uploadId);
    await deleteUpload(uploadId);
    setDeletingId(null);
    router.refresh();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">上傳記錄</h1>
        <p className="text-muted-foreground">管理你的 CSV 匯入記錄</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : uploads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">尚無上傳記錄</p>
            <p className="text-sm text-muted-foreground mt-1">
              前往「上傳」頁面匯入 CSV 檔案
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {uploads.map((upload) => (
            <UploadCard
              key={upload.id}
              upload={upload}
              onDelete={() => handleDelete(upload.id)}
              deleting={deletingId === upload.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
