import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  decimal,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enum types
export const accountTypeEnum = pgEnum("account_type", [
  "checking",
  "savings",
  "credit_card",
  "investment",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "expense",
  "income",
  "transfer",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "categorized",
  "confirmed",
  "ignored",
]);

// Uploads table - tracks CSV import batches
export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull(),
  fileName: text("file_name").notNull(),
  transactionCount: integer("transaction_count").notNull().default(0),
  dateRangeStart: date("date_range_start"),
  dateRangeEnd: date("date_range_end"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Accounts table
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull(),
  bankName: text("bank_name").notNull(),
  accountName: text("account_name"),
  accountType: accountTypeEnum("account_type").default("checking"),
  currency: text("currency").default("TWD"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull(),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
  parentId: uuid("parent_id"),
  isSystem: boolean("is_system").default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull(),
  accountId: uuid("account_id").references(() => accounts.id, {
    onDelete: "cascade",
  }),
  uploadId: uuid("upload_id"),

  // Original data from CSV
  originalDate: date("original_date").notNull(),
  originalDescription: text("original_description").notNull(),
  originalAmount: decimal("original_amount", { precision: 12, scale: 2 }).notNull(),
  originalCategory: text("original_category"),
  rawCsvData: text("raw_csv_data"),

  // AI categorization
  aiCategory: text("ai_category"),
  aiCategoryConfidence: decimal("ai_category_confidence", {
    precision: 5,
    scale: 4,
  }),
  aiSubcategory: text("ai_subcategory"),

  // Normalized data
  normalizedAmount: decimal("normalized_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),
  transactionType: transactionTypeEnum("transaction_type"),

  // Analysis flags
  isRecurring: boolean("is_recurring").default(false),
  isAnomaly: boolean("is_anomaly").default(false),
  anomalyScore: decimal("anomaly_score", { precision: 5, scale: 4 }),

  // Status
  status: transactionStatusEnum("transaction_status").default("pending"),
  autoClassifiedAt: timestamp("auto_classified_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  upload: one(uploads, {
    fields: [transactions.uploadId],
    references: [uploads.id],
  }),
}));

export const uploadsRelations = relations(uploads, ({ one, many }) => ({
  clerkUser: one(accounts, {
    fields: [uploads.clerkUserId],
    references: [accounts.clerkUserId],
  }),
  transactions: many(transactions),
}));
