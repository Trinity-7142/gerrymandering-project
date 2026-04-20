// lib/slugify.js
// Converts a heading string to a URL-safe id — shared between Markdown.js (IDs) and ToC (hrefs)

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Extracts { level, text, slug } for every h1/h2/h3 in a raw markdown string
export function extractHeadings(markdown) {
  const headings = [];
  for (const line of markdown.split("\n")) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[*_`[\]]/g, "").trim();
      headings.push({ level, text, slug: slugify(text) });
    }
  }
  return headings;
}
