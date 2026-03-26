// Mock script to test the Context Injection logic of the API
const promptTemplate = (income, expense, balance, categories, q) => `You are an elite financial advisor.
**User Financial Statement:**
- Monthly Income: $${income}
- Monthly Expense: $${expense}
- Current Net Balance (This Month): $${balance}
- Average Category Spend (Last 3 Months):
${Object.entries(categories).map(([c, a]) => `  - ${c}: $${a}/mo`).join("\n")}
**User Question:** "${q}"`;

console.log("TEST 001: Context Injection check");
const prompt = promptTemplate(50000, 1200, 48800, {"Coffee": 1200}, "請問我這個月花多少錢喝咖啡？我現在的結餘還能買一台 $30,000 的電腦嗎？");
if (prompt.includes("$1200") && prompt.includes("$48800")) {
  console.log("✅ PASS: Financial data injected perfectly into prompt instead of relying on Hallucination.");
} else {
  console.log("❌ FAIL");
}
