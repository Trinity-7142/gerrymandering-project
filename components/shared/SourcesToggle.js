"use client";

// components/shared/SourcesToggle.js
// Collapsible "Sources" footer for content pages.
// Matches the sources footer styling in PoliticianPanel and StateKeyFacts.
// Sources come from the `sources:` YAML frontmatter array in the .md file.

import { useState } from "react";
import { fonts, textColors } from "@/lib/constants";

export default function SourcesToggle({ sources }) {
  const [open, setOpen] = useState(false);

  if (!sources?.length) return null;

  return (
    <div style={styles.wrapper}>
      <button style={styles.toggle} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span style={styles.label}>Sources</span>
        <span style={{ ...styles.chevron, transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>
          ▾
        </span>
      </button>

      {open && (
        <div style={styles.footer}>
          <span style={styles.text}>Sources: </span>
          {sources.map((s, i) => (
            <span key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                {s.name}
              </a>
              {i < sources.length - 1 && <span style={styles.text}>, </span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    marginTop: "20px",
    borderTop: "1px solid #E8E6E3",
  },
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    paddingTop: "14px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: fonts.sans,
    fontSize: "0.78rem",
    fontWeight: 600,
    color: textColors.muted,
    letterSpacing: "0.02em",
  },
  chevron: {
    fontSize: "0.82rem",
    color: textColors.muted,
    transition: "transform 0.18s ease",
    display: "inline-block",
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: "0.78rem",
    color: textColors.muted,
  },
  footer: {
    paddingTop: "10px",
    fontFamily: fonts.sans,
    fontSize: "0.78rem",
    color: textColors.muted,
  },
  text: {
    fontFamily: fonts.sans,
    fontSize: "0.78rem",
    color: textColors.muted,
  },
  link: {
    fontFamily: fonts.sans,
    fontSize: "0.78rem",
    color: textColors.muted,
    textDecoration: "underline",
    textDecorationColor: textColors.muted,
    textUnderlineOffset: "2px",
  },
};
