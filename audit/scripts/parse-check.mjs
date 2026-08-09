#!/usr/bin/env node
/**
 * PATCH HYGIENE GUARD (mission Part I.2.1 / I.2.2).
 *
 * Parses every tracked .ts/.tsx file with the TypeScript compiler API and
 * fails on ANY parse diagnostic. Also fails on two specific corruption modes
 * that have broken sibling repos:
 *
 *   1. A literal two-character  \n  sequence inside a file that was meant to
 *      be a real newline (source written by a generator that escaped it).
 *   2. A ${...} interpolation sitting inside a plain quoted string rather
 *      than a template literal — detected via the AST, not a regex.
 *
 * Dependency-free apart from the repo's own typescript devDependency.
 * Usage: node audit/scripts/parse-check.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const files = execSync("git ls-files '*.ts' '*.tsx'", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

let failures = 0;
const report = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");

  // --- 1. parse diagnostics -------------------------------------------------
  const sf = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const diags = sf.parseDiagnostics ?? [];
  for (const d of diags) {
    const { line, character } = sf.getLineAndCharacterOfPosition(d.start ?? 0);
    report.push(`${file}:${line + 1}:${character + 1}  parse: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
    failures++;
  }

  // --- 2. literal backslash-n where a newline belongs ----------------------
  // Only flag a literal \n that is NOT inside a string/template/regex/comment.
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, /* skipTrivia */ false, ts.LanguageVariant.JSX, text);
  let tok;
  while ((tok = scanner.scan()) !== ts.SyntaxKind.EndOfFileToken) {
    const kind = tok;
    const isLiteralish =
      kind === ts.SyntaxKind.StringLiteral ||
      kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
      kind === ts.SyntaxKind.TemplateHead ||
      kind === ts.SyntaxKind.TemplateMiddle ||
      kind === ts.SyntaxKind.TemplateTail ||
      kind === ts.SyntaxKind.RegularExpressionLiteral ||
      kind === ts.SyntaxKind.SingleLineCommentTrivia ||
      kind === ts.SyntaxKind.MultiLineCommentTrivia ||
      kind === ts.SyntaxKind.JsxText;
    if (isLiteralish) continue;
    const raw = text.slice(scanner.getTokenStart?.() ?? scanner.getTokenPos(), scanner.getTextPos());
    if (raw.includes("\\n")) {
      report.push(`${file}: literal \\n outside a string/template/regex/comment`);
      failures++;
    }
  }

  // --- 3. stranded ${...} in a plain string literal -------------------------
  const visit = (node) => {
    if (ts.isStringLiteral(node) && /\$\{[^}]*\}/.test(node.text)) {
      const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      report.push(`${file}:${line + 1}  stranded \${...} inside a plain string literal (should be a template literal)`);
      failures++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

if (failures) {
  console.error(report.join("\n"));
  console.error(`\nparse-check: ${failures} problem(s) across ${files.length} file(s)`);
  process.exit(1);
}
console.log(`parse-check: ${files.length} file(s) parsed clean, no stranded interpolations, no literal \\n.`);
