import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Downgrade rules that produce false positives for common Next.js patterns.
  {
    rules: {
      // useEffect(() => { setState(true) }, []) is the standard SSR hydration
      // mounting pattern in Next.js — not a real performance concern.
      "react-hooks/set-state-in-effect": "off",
      // `any` is acceptable when handling unknown API response shapes.
      "@typescript-eslint/no-explicit-any": "off",
      // shadcn UI components use empty interfaces to extend HTML element props.
      "@typescript-eslint/no-empty-object-type": "off",
      // Unused vars from named destructuring are common in UI components.
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
