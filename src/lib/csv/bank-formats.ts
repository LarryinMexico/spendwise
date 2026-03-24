export interface BankFormat {
  name: string;
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  debitColumn?: string;
  creditColumn?: string;
  dateFormat: string;
  encoding: "UTF-8" | "BIG5" | "UTF-8-SIG";
}

export const BANK_FORMATS: Record<string, BankFormat> = {
  esun: {
    name: "玉山銀行",
    dateColumn: "TransactionsDate",
    descriptionColumn: "TransactionsDescription",
    amountColumn: "Expense",
    creditColumn: "Deposit",
    dateFormat: "YYYY/MM/DD",
    encoding: "UTF-8",
  },
  cathay: {
    name: "國泰世華銀行",
    dateColumn: "Date",
    descriptionColumn: "Description",
    amountColumn: "Expense",
    creditColumn: "Deposit",
    dateFormat: "YYYY/MM/DD",
    encoding: "UTF-8",
  },
  ctab: {
    name: "中國信託",
    dateColumn: "TransactionsDate",
    descriptionColumn: "Description",
    amountColumn: "Expense",
    creditColumn: "Deposit",
    dateFormat: "YYYY/MM/DD",
    encoding: "UTF-8",
  },
  generic: {
    name: "通用格式",
    dateColumn: "date",
    descriptionColumn: "description",
    amountColumn: "amount",
    dateFormat: "YYYY/MM/DD",
    encoding: "UTF-8",
  },
};

export function detectBankFormat(headers: string[]): string {
  const headerSet = new Set(headers.map((h) => h.trim()));
  
  for (const [key, format] of Object.entries(BANK_FORMATS)) {
    if (key === "generic") continue;
    if (headerSet.has(format.dateColumn) && headerSet.has(format.descriptionColumn)) {
      return key;
    }
  }
  
  return "generic";
}
