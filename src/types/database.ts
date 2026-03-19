export type Account = {
  id: string;
  clerkUserId: string;
  bankName: string;
  accountName: string | null;
  accountType: "checking" | "savings" | "credit_card" | "investment" | null;
  currency: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Category = {
  id: string;
  clerkUserId: string;
  name: string;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  isSystem: boolean | null;
  createdAt: Date;
};

export type Transaction = {
  id: string;
  clerkUserId: string;
  accountId: string | null;
  originalDate: Date;
  originalDescription: string;
  originalAmount: string;
  originalCategory: string | null;
  rawCsvData: string | null;
  aiCategory: string | null;
  aiCategoryConfidence: string | null;
  aiSubcategory: string | null;
  normalizedAmount: string;
  transactionType: "expense" | "income" | "transfer" | null;
  isRecurring: boolean | null;
  isAnomaly: boolean | null;
  anomalyScore: string | null;
  status: "pending" | "categorized" | "confirmed" | "ignored" | null;
  autoClassifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
