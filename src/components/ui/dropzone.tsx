"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFileAccepted: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

export function Dropzone({
  onFileAccepted,
  accept = { "text/csv": [".csv"], "text/plain": [".txt"] },
  maxSize = 5 * 1024 * 1024,
}: DropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted]
  );

  const onDropRejected = useCallback(() => {
    setError("Invalid file type or size limit exceeded");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept,
    maxSize,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50"
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      {isDragActive ? (
        <p className="text-sm text-muted-foreground">Release to upload file</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Drag and drop CSV file here, or click to select
          </p>
          <p className="text-xs text-muted-foreground/60">
            Supports .csv up to 5MB
          </p>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
