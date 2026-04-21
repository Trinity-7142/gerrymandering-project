// app/methodology/page.js

import Markdown from "@/components/shared/Markdown";
import PageMeta from "@/components/shared/PageMeta";
import TableOfContents from "@/components/shared/TableOfContents";
import { loadContentWithMeta } from "@/lib/loadData";
import { resolveFeatures } from "@/lib/contentPageFeatures";
import { extractHeadings } from "@/lib/slugify";
import { fonts, textColors, pageWidths } from "@/lib/constants";

export const metadata = { title: "Methodology — Gerrymandering Project" };

const SECTION_FILES = [
  "methodology-intro.md",
  "research-design.md",
  "data-sources.md",
  "procedures.md",
  "ethical-considerations.md",
  "limitations.md",
  "conclusion.md",
];

export default function MethodologyPage() {
  const sections = SECTION_FILES.map((file) =>
    loadContentWithMeta("methodology", file)
  );

  // Page features and meta come from methodology-intro.md
  const { meta } = sections[0];
  const features = resolveFeatures(meta);

  // Build ToC from all section bodies combined
  const allBodies = sections.map((s) => s.body ?? "").join("\n\n");
  const headings = features.tableOfContents && allBodies.trim()
    ? extractHeadings(allBodies)
    : [];

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Methodology</h1>

      <PageMeta meta={meta} />

      <div style={styles.body}>
        {headings.length > 0 && <TableOfContents headings={headings} />}
        {sections.map((section, i) =>
          section.body ? <Markdown key={i}>{section.body}</Markdown> : null
        )}
      </div>
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
  body: {
    maxWidth: pageWidths.methodology,
    width: "100%",
  },
};
