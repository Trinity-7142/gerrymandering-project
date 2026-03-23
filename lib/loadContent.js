// lib/loadContent.js
// Reads a markdown file from the /content directory at build time.
// Splits YAML frontmatter (metadata) from the markdown body.
//
// Usage:
//   import { loadContent } from "@/lib/loadContent";
//   const { metadata, body } = loadContent("home/hero.md");
//
// This runs in Server Components only — never shipped to the browser.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

export function loadContent(contentPath) {
  const fullPath = path.join(process.cwd(), "content", contentPath);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  return { metadata: data, body: content };
}