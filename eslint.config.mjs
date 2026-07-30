import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // Task 2b: TypeScript — promoted from `warn` to `error` (per project
    // analysis report §4.7). The codebase has been cleaned up so these
    // now fail CI rather than silently accumulating debt.
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/ban-ts-comment": "error",

    // React
    "react-hooks/exhaustive-deps": "error",
    "react-hooks/purity": "off",
    "react-hooks/set-state-in-effect": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",

    // Next.js
    "@next/next/no-img-element": "error",
    "@next/next/no-html-link-for-pages": "off",

    // General — Task 2b: promoted from `warn` to `error`.
    "prefer-const": "error",
    "no-unused-vars": "off",
    // `no-console` intentionally stays at `warn` (allows console.warn / console.error
    // for diagnostic logging — promoted to `error` would block this legitimate use).
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "no-empty": "error",
    "no-irregular-whitespace": "error",
    "no-unreachable": "error",
    "no-useless-escape": "error",
  },
}, {
  ignores: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "examples/**",
    "skills",
    "mini-services/**",
    "prisma/**",
    "scripts/**",
    // V11 Fix #13: ignore upload/ (reference files, not part of the project)
    "upload/**",
    // V11 Fix #13: ignore tool-results/ (internal agent artifacts)
    "tool-results/**",
  ],
}];

export default eslintConfig;
