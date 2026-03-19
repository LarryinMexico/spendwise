CREATE TYPE "public"."account_type" AS ENUM('checking', 'savings', 'credit_card', 'investment');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'categorized', 'confirmed', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('expense', 'income', 'transfer');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"bank_name" text NOT NULL,
	"account_name" text,
	"account_type" "account_type" DEFAULT 'checking',
	"currency" text DEFAULT 'TWD',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"color" text,
	"parent_id" uuid,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"account_id" uuid,
	"original_date" date NOT NULL,
	"original_description" text NOT NULL,
	"original_amount" numeric(12, 2) NOT NULL,
	"original_category" text,
	"raw_csv_data" text,
	"ai_category" text,
	"ai_category_confidence" numeric(5, 4),
	"ai_subcategory" text,
	"normalized_amount" numeric(12, 2) NOT NULL,
	"transaction_type" "transaction_type",
	"is_recurring" boolean DEFAULT false,
	"is_anomaly" boolean DEFAULT false,
	"anomaly_score" numeric(5, 4),
	"transaction_status" "transaction_status" DEFAULT 'pending',
	"auto_classified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;