"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dropzone } from "@/components/ui/dropzone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { parseCSV, type ParsedTransaction } from "@/lib/csv/parser";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [bankFormat, setBankFormat] = useState<string>("");

  const handleFileAccepted = async (acceptedFile: File) => {
    setFile(acceptedFile);
    const result = await parseCSV(acceptedFile);
    
    if (result.success) {
      setParsedData(result.transactions);
      setBankFormat(result.bankFormat);
      toast.success(`偵測到 ${result.bankFormat} 格式，共 ${result.transactions.length} 筆交易`);
    } else {
      toast.error("CSV 解析失敗", { description: result.errors.join(", ") });
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        router.push("/dashboard");
      } else {
        toast.error(data.error || "上傳失敗");
      }
    } catch (error) {
      toast.error("上傳失敗");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">上傳對帳單</h1>
        <p className="text-muted-foreground mt-2">
          上傳銀行 CSV 格式的對帳單，系統會自動解析交易記錄
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>選擇 CSV 檔案</CardTitle>
          <CardDescription>
            支援玉山銀行、國泰世華、中國信託等常見格式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dropzone onFileAccepted={handleFileAccepted} />

          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{bankFormat}</p>
                  <p className="text-sm text-muted-foreground">
                    共 {parsedData.length} 筆交易
                  </p>
                </div>
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? "上傳中..." : "確認上傳"}
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">日期</th>
                      <th className="px-4 py-2 text-left">摘要</th>
                      <th className="px-4 py-2 text-right">金額</th>
                      <th className="px-4 py-2 text-center">類型</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((tx, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2">{tx.date}</td>
                        <td className="px-4 py-2 truncate max-w-xs">
                          {tx.description}
                        </td>
                        <td
                          className={`px-4 py-2 text-right ${
                            tx.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          ${Math.abs(tx.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {tx.type === "income" ? "收入" : "支出"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="px-4 py-2 text-sm text-muted-foreground bg-muted">
                    顯示前 10 筆，共 {parsedData.length} 筆
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
