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
import { Trash2 } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [bankFormat, setBankFormat] = useState<string>("");

  const handleClearData = async () => {
    if (!confirm("Are you sure you want to delete all transaction records? This action cannot be undone.")) return;

    setIsClearing(true);
    try {
      const res = await fetch("/api/transactions", { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        toast.success("All data cleared successfully");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to clear data");
      }
    } catch {
      toast.error("An error occurred while clearing data");
    } finally {
      setIsClearing(false);
    }
  };

  const handleFileAccepted = async (acceptedFile: File) => {
    setFile(acceptedFile);
    const result = await parseCSV(acceptedFile);
    
    if (result.success) {
      setParsedData(result.transactions);
      setBankFormat(result.bankFormat);
      toast.success(`Detected ${result.bankFormat} format with ${result.transactions.length} items`);
    } else {
      toast.error("CSV Parsing Failed", { description: result.errors.join(", ") });
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
        toast.success("Statements uploaded successfully");
        router.push("/dashboard");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Financial Data</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Support bank standard CSV statements with automated parsing layout
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClearData}
          disabled={isClearing}
          className="bg-rose-500 hover:bg-rose-600 text-white"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isClearing ? "Clearing..." : "Clear All Records"}
        </Button>
      </div>

      <Card className="border border-[#E5E5E5] shadow-none bg-white rounded-md">
        <CardHeader className="border-b border-[#E5E5E5] pb-4">
          <CardTitle className="text-base font-semibold text-[#111111]">Import CSV File</CardTitle>
          <CardDescription className="text-[#666666] text-xs">
            Automatically maps generic financial formats upon file drop
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Dropzone onFileAccepted={handleFileAccepted} />

          {parsedData.length > 0 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-md border border-[#E5E5E5]">
                <div>
                  <p className="font-semibold text-sm text-[#111111]">{bankFormat}</p>
                  <p className="text-xs text-[#666666]">
                    {parsedData.length} records processed
                  </p>
                </div>
                <Button onClick={handleUpload} disabled={isUploading} className="bg-[#111111] hover:bg-[#222222] text-white rounded-md text-xs h-8">
                  {isUploading ? "Uploading..." : "Confirm Upload"}
                </Button>
              </div>

              <div className="border border-[#E5E5E5] rounded-md overflow-hidden bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-[#FAFAFA] text-[#111111] border-b border-[#E5E5E5]">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {parsedData.slice(0, 10).map((tx, i) => (
                      <tr key={i} className="hover:bg-[#F7F7F7] transition-colors">
                        <td className="px-4 py-3 text-[#111111]">{tx.date}</td>
                        <td className="px-4 py-3 truncate max-w-xs text-[#111111] font-sans">
                          {tx.description}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[#111111] tabular-nums">
                          {tx.type === "income" ? "+" : "-"}
                          ${Math.abs(tx.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            tx.type === "income" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600" : "border-rose-500/30 bg-rose-500/5 text-rose-600"
                          }`}>
                            {tx.type === "income" ? "Income" : "Expense"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <p className="px-4 py-2 text-xs text-[#666666] bg-[#FAFAFA] text-center border-t border-[#E5E5E5]">
                    Showing first 10 items out of {parsedData.length} total.
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
