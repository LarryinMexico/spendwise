import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });
const localEnv = config({ path: ".env.local" }).parsed;
if (localEnv?.DATABASE_URL) {
  // 強制讓 Drizzle-kit 使用 5432（Session Pooler），同時讓 Next.js Runtime 保持使用 6543 (Transaction Pooler)
  process.env.DATABASE_URL = localEnv.DATABASE_URL.replace(":6543/", ":5432/");
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
