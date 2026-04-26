// app/page.js
// Home page — intro section + interactive US map + policy content
// Server Component: reads markdown content at build time, passes to styled renderer
//
// Content lives in /content/home/*.md — policy team edits those files directly.
// See components/shared/Markdown.js for how markdown maps to styled elements.

import StateSelector from "../components/home/StateSelector";
import ExplainerSections, { Infographic } from "@/components/home/ExplainerSections";
import Markdown from "@/components/shared/Markdown";
import { loadContent } from "@/lib/loadContent";
import { loadAllStateAlignments } from "@/lib/loadData";
import { colors, pageWidths } from "@/lib/constants";
import { PAGE_FEATURES, formatDate } from "@/lib/contentPageFeatures";

export default function HomePage() {
  // ── Load content from markdown files at build time ──
  const intro            = loadContent("home/intro.md");
  const { date_created, last_edited } = intro.metadata ?? {};
  const authors    = intro.metadata?.["author(s)"];
  const authorList  = Array.isArray(authors) ? authors.join(", ") : (authors || null);
  const authorLabel = Array.isArray(authors) && authors.length > 1 ? "Authors" : (authorList?.includes(",") ? "Authors" : "Author");
  const authorLink  = PAGE_FEATURES.authorLink ? (intro.metadata?.author_link ?? null) : null;
  const dateCreated = formatDate(date_created);
  const lastEdited  = formatDate(last_edited);
  const hasMeta     = authorList || dateCreated || lastEdited;
  const cracking         = loadContent("home/cracking.md");
  const packing          = loadContent("home/packing.md");
  const partisanRacial   = loadContent("home/partisan-racial.md");
  const explainer        = loadContent("home/explainer.md");
  const support          = loadContent("home/support.md");
  const conclusion       = loadContent("home/conclusion.md");
  const alignmentScores  = loadAllStateAlignments();

  return (
    <main
      style={{
        width: `min(100%, ${pageWidths.home})`,
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
            {authorList && (
              <span>
                <style>{`.home-author-link:hover .home-author-label { text-decoration: underline; }`}</style>
                <span style={{ fontWeight: 600, color: "#555" }}>{authorLabel}</span>{" "}
                {authorLink ? (
                  <a href={authorLink} target="_blank" rel="noopener noreferrer" className="home-author-link" style={{ color: "inherit", textDecoration: "none" }}>
                    <span className="home-author-label">{authorList}</span>
                  </a>
                ) : authorList}
              </span>
            )}
            {dateCreated && <span><span style={{ fontWeight: 600, color: "#555" }}>Created</span> {dateCreated}</span>}
            {lastEdited  && <span><span style={{ fontWeight: 600, color: "#555" }}>Last edited</span> {lastEdited}</span>}
          </div>
        )}

        <Markdown
          style={{
            width: `min(100%, ${pageWidths.homeIntro})`,
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
          CRACKING EXPLAINER + INFOGRAPHIC
          Content from /content/home/cracking.md
          ════════════════════════════════════════════════════════ */}
      <section style={{ marginTop: "26px" }}>
        <Markdown>{cracking.body}</Markdown>
      </section>
      <div className="home-infographic" style={{ marginTop: "36px", maxWidth: "65%", margin: "36px auto 0" }}>
        <Infographic filename="cracking.png" label="Cracking infographic" alt="Diagram illustrating how cracking splits voter groups across districts" />
      </div>

      {/* ════════════════════════════════════════════════════════
          PACKING EXPLAINER + INFOGRAPHIC
          Content from /content/home/packing.md
          ════════════════════════════════════════════════════════ */}
      <section style={{ marginTop: "36px" }}>
        <Markdown>{packing.body}</Markdown>
      </section>
      <div className="home-infographic" style={{ marginTop: "36px", maxWidth: "65%", margin: "36px auto 0" }}>
        <Infographic filename="packing.png" label="Packing infographic" alt="Diagram illustrating how packing concentrates voters into fewer districts" />
      </div>

      {/* ════════════════════════════════════════════════════════
          PARTISAN VS RACIAL GERRYMANDERING
          Content from /content/home/partisan-racial.md
          ════════════════════════════════════════════════════════ */}
      <section style={{ marginTop: "36px" }}>
        <Markdown>{partisanRacial.body}</Markdown>
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