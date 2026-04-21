// app/page.js
// Home page — intro section + interactive US map + policy content
// Server Component: reads markdown content at build time, passes to styled renderer
//
// Content lives in /content/home/*.md — policy team edits those files directly.
// See components/shared/Markdown.js for how markdown maps to styled elements.

import StateSelector from "../components/home/StateSelector";
import ExplainerSections from "@/components/home/ExplainerSections";
import Markdown from "@/components/shared/Markdown";
import { loadContent } from "@/lib/loadContent";
import { loadAllStateAlignments } from "@/lib/loadData";
import { colors, pageWidths } from "@/lib/constants";

function formatDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export default function HomePage() {
  // ── Load content from markdown files at build time ──
  const intro            = loadContent("home/intro.md");
  const { date_created, last_edited } = intro.metadata ?? {};
  const authors   = intro.metadata?.["author(s)"];
  const authorList  = Array.isArray(authors) ? authors.join(", ") : (authors || null);
  const authorLabel = Array.isArray(authors) && authors.length > 1 ? "Authors" : (authorList?.includes(",") ? "Authors" : "Author");
  const dateCreated = formatDate(date_created);
  const lastEdited  = formatDate(last_edited);
  const hasMeta     = authorList || dateCreated || lastEdited;
  const policyIntro      = loadContent("home/policy-intro.md");
  const explainer        = loadContent("home/explainer.md");
  const support          = loadContent("home/support.md");
  const conclusion       = loadContent("home/conclusion.md");
  const alignmentScores  = loadAllStateAlignments();

  return (
    <main
      style={{
        width: "min(100%, 1000px)",
        margin: "0 auto",
        padding: "10px clamp(22px, 5vw, 86px) 56px",
      }}
    >
      {/* ════════════════════════════════════════════════════════
          HERO SECTION
          Headline stays in JSX (it's a design element).
          Body copy comes from /content/home/intro.md
          ════════════════════════════════════════════════════════ */}
      <section
        style={{ paddingTop: "8px", textAlign: "center" }}
        aria-labelledby="hero-title"
      >
        <h1
          id="hero-title"
          style={{
            margin: "0 auto 18px",
            maxWidth: pageWidths.home,
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(2.6rem, 7vw, 4rem)",
            lineHeight: 0.98,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "#000",
          }}
        >
          Is your representative
          <br />
          <span
            style={{
              color: colors.primarySoftRed,
              fontStyle: "italic",
              fontWeight: 700,
            }}
          >
            actually
          </span>{" "}
          representing you?
        </h1>

        {hasMeta && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0 24px", justifyContent: "center", marginBottom: "16px", fontSize: "0.8rem", color: "#888" }}>
            {authorList  && <span><span style={{ fontWeight: 600, color: "#555" }}>{authorLabel}</span> {authorList}</span>}
            {dateCreated && <span><span style={{ fontWeight: 600, color: "#555" }}>Created</span> {dateCreated}</span>}
            {lastEdited  && <span><span style={{ fontWeight: 600, color: "#555" }}>Last edited</span> {lastEdited}</span>}
          </div>
        )}

        <Markdown
          style={{
            width: "min(100%, 830px)",
            margin: "0 auto",
            textAlign: "left",
          }}
        >
          {intro.body}
        </Markdown>
      </section>

      {/* ════════════════════════════════════════════════════════
          MAP SECTION
          Client Component — D3 choropleth + routing
          ════════════════════════════════════════════════════════ */}
      <StateSelector alignmentScores={alignmentScores} />

      {/* ════════════════════════════════════════════════════════
          POLICY INTRO
          Content from /content/home/policy-intro.md
          *italic* renders as red lead-in, **bold** as blue emphasis
          ════════════════════════════════════════════════════════ */}
      <section style={{ marginTop: "26px" }}>
        <Markdown>{policyIntro.body}</Markdown>
      </section>

      {/* ════════════════════════════════════════════════════════
          EXPLAINER + FEATURE SECTIONS
          Two-column grids: text from markdown, infographic placeholders
          Images go in public/content/infographics/ when ready
          ════════════════════════════════════════════════════════ */}
      <ExplainerSections
        explainerBody={explainer.body}
        supportBody={support.body}
      />

      {conclusion.body && (
        <section style={{ marginTop: "36px" }}>
          <Markdown>{conclusion.body}</Markdown>
        </section>
      )}
    </main>
  );
}