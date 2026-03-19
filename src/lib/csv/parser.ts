import Papa from "papaparse";
import { BANK_FORMATS, detectBankFormat } from "./bank-formats";

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  originalCategory?: string;
}

export interface ParseResult {
  success: boolean;
  bankFormat: string;
  transactions: ParsedTransaction[];
  errors: string[];
}

export function parseCSV(
  file: File,
  bankFormatKey?: string
): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      encoding: "UTF-8",
      complete: (results) => {
        const headers = results.meta.fields || [];
        const formatKey = bankFormatKey || detectBankFormat(headers);
        const format = BANK_FORMATS[formatKey];

        if (!format) {
          resolve({
            success: false,
            bankFormat: "unknown",
            transactions: [],
            errors: ["無法識別的銀行格式"],
          });
          return;
        }

        const transactions: ParsedTransaction[] = [];
        const errors: string[] = [];

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i] as Record<string, string>;
          
          try {
            const dateStr = row[format.dateColumn]?.trim();
            const description = row[format.descriptionColumn]?.trim() || "";
            
            if (!dateStr || !description) continue;

            let amount = 0;
            let type: "expense" | "income" = "expense";

            if (format.amountColumn) {
              const amountStr = row[format.amountColumn]?.replace(/[,$]/g, "");
              if (amountStr) {
                amount = parseFloat(amountStr);
                if (amount > 0) type = "income";
              }
            } else if (format.debitColumn && format.creditColumn) {
              const debit = parseFloat(
                row[format.debitColumn]?.replace(/[,$]/g, "") || "0"
              );
              const credit = parseFloat(
                row[format.creditColumn]?.replace(/[,$]/g, "") || "0"
              );
              amount = credit > 0 ? credit : debit;
              type = credit > 0 ? "income" : "expense";
            }

            if (isNaN(amount)) continue;

            transactions.push({
              date: parseDate(dateStr, format.dateFormat),
              description,
              amount,
              type,
            });
          } catch (e) {
            errors.push(`列 ${i + 1}: 解析錯誤`);
          }
        }

        resolve({
          success: transactions.length > 0,
          bankFormat: format.name,
          transactions,
          errors,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          bankFormat: "unknown",
          transactions: [],
          errors: [error.message],
        });
      },
    });
  });
}

function parseDate(dateStr: string, format: string): string {
  const parts = dateStr.split(/[\/\-.]/);
  
  if (format === "YYYY/MM/DD" && parts.length === 3) {
    return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
  }
  
  if (format === "MM/DD/YYYY" && parts.length === 3) {
    return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
  }
  
  if (format === "DD/MM/YYYY" && parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  
  return dateStr;
}
