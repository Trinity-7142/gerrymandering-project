// lib/loadContent.js
// Reads a markdown file from the /public/content directory at build time.
// Splits YAML frontmatter (metadata) from the markdown body.
//
// Content lives in public/content/ so that both:
//   - Server Components can read .md files at build time (via fs)
//   - Images in public/content/infographics/ are served to the browser
//
// Usage:
//   import { loadContent } from "@/lib/loadContent";
//   const { metadata, body } = loadContent("home/intro.md");
//
// This runs in Server Components only — never shipped to the browser.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

export function loadContent(contentPath) {
  const fullPath = path.join(process.cwd(), "public", "content", contentPath);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  return { metadata: data, body: content };
}