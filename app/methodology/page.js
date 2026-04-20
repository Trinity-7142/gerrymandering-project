// app/methodology/page.js

import Markdown from "@/components/shared/Markdown";
import TableOfContents from "@/components/methodology/TableOfContents";
import { loadContentWithMeta } from "@/lib/loadData";
import { extractHeadings } from "@/lib/slugify";
import { fonts, textColors, pageWidths } from "@/lib/constants";

export const metadata = { title: "Methodology — Gerrymandering Project" };

function formatDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export default function MethodologyPage() {
  const { body, meta } = loadContentWithMeta("methodology", "methodology.md");

  const dateCreated = formatDate(meta?.date_created);
  const lastEdited  = formatDate(meta?.last_edited);
  const authors     = meta?.["author(s)"];
  const authorList  = Array.isArray(authors) ? authors.join(", ") : (authors || null);
  const hasMeta     = dateCreated || lastEdited || authorList;

  const showToC  = meta?.table_of_contents !== false && meta?.table_of_contents != null;
  const headings = showToC && body ? extractHeadings(body) : [];

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Methodology</h1>

      {hasMeta && (
        <div style={styles.metaRow}>
          {authorList && (
            <span style={styles.metaItem}>
              <span style={styles.metaLabel}>Authors</span> {authorList}
            </span>
          )}
          {dateCreated && (
            <span style={styles.metaItem}>
              <span style={styles.metaLabel}>Created</span> {dateCreated}
            </span>
          )}
          {lastEdited && (
            <span style={styles.metaItem}>
              <span style={styles.metaLabel}>Last edited</span> {lastEdited}
            </span>
          )}
        </div>
      )}

      {body && (
        <div style={styles.body}>
          {headings.length > 0 && <TableOfContents headings={headings} />}
          <Markdown>{body}</Markdown>
        </div>
      )}
    </main>
  );
}

const styles = {
  main: {
    minHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 24px",
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: "3rem",
    fontWeight: 700,
    color: textColors.primary,
    textAlign: "center",
    marginBottom: "12px",
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0 24px",
    justifyContent: "center",
    marginBottom: "32px",
    fontFamily: fonts.sans,
    fontSize: "0.8rem",
    color: textColors.muted,
  },
  metaItem: {
    whiteSpace: "nowrap",
  },
  metaLabel: {
    fontWeight: 600,
    color: textColors.secondary,
  },
  body: {
    maxWidth: pageWidths.methodology,
    width: "100%",
  },
};
