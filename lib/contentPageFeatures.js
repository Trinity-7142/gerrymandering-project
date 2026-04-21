// lib/pageFeatures.js
// Global feature toggles for content pages (methodology, case-studies, etc.).
// Set a flag to false here to disable it site-wide.
// Per-page frontmatter can additionally disable tableOfContents by setting
// `table_of_contents: false` in the markdown file's YAML front matter.

export const PAGE_FEATURES = {
  tableOfContents: true,
  author:          true,
  created:         true,
  lastEdited:      false,
};

// Merge global defaults with per-page frontmatter overrides.
// Only tableOfContents can be overridden from frontmatter.
export function resolveFeatures(meta = {}) {
  return {
    tableOfContents: PAGE_FEATURES.tableOfContents && meta.table_of_contents !== false,
    author:          PAGE_FEATURES.author,
    created:         PAGE_FEATURES.created,
    lastEdited:      PAGE_FEATURES.lastEdited,
  };
}

export function formatDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}
