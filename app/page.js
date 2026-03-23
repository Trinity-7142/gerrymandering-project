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
import { colors } from "@/lib/constants";

export default function HomePage() {
  // ── Load content from markdown files at build time ──
  const intro       = loadContent("home/intro.md");
  const policyIntro = loadContent("home/policy-intro.md");
  const explainer   = loadContent("home/explainer.md");
  const support     = loadContent("home/support.md");

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
            maxWidth: "860px",
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
      <StateSelector />

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
    </main>
  );
}