// app/methodology/page.js

import Markdown from "@/components/shared/Markdown";
import PageMeta from "@/components/shared/PageMeta";
import TableOfContents from "@/components/shared/TableOfContents";
import { loadContentWithMeta } from "@/lib/loadData";
import { resolveFeatures } from "@/lib/contentPageFeatures";
import { extractHeadings } from "@/lib/slugify";
import { fonts, textColors, pageWidths } from "@/lib/constants";

export const metadata = { title: "Methodology — Gerrymandering Project" };

export default function MethodologyPage() {
  const { body, meta } = loadContentWithMeta("methodology", "methodology.md");
  const features = resolveFeatures(meta);
  const headings = features.tableOfContents && body ? extractHeadings(body) : [];

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Methodology</h1>

      <PageMeta meta={meta} />

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
  body: {
    maxWidth: pageWidths.methodology,
    width: "100%",
  },
};
