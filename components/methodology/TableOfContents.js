"use client";

// components/methodology/TableOfContents.js
// Notion-style collapsible table of contents.
// Headings are passed from the server; clicking one smooth-scrolls to its section.

import { useState } from "react";
import { colors, fonts, textColors } from "@/lib/constants";

export default function TableOfContents({ headings }) {
  const [open, setOpen] = useState(true);

  if (!headings || headings.length === 0) return null;

  function handleClick(slug) {
    const el = document.getElementById(slug);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={styles.wrapper}>
      {/* Header row — always visible */}
      <button style={styles.header} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span style={styles.headerLabel}>
          <span style={styles.icon}>☰</span> Contents
        </span>
        <span style={{ ...styles.chevron, transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>
          ▾
        </span>
      </button>

      {/* Collapsible list */}
      {open && (
        <nav style={styles.list}>
          {headings.map(({ level, text, slug }) => (
            <button
              key={slug}
              onClick={() => handleClick(slug)}
              style={{
                ...styles.item,
                paddingLeft: level === 1 ? "12px" : level === 2 ? "20px" : "32px",
                fontSize: level === 1 ? "0.88rem" : level === 2 ? "0.85rem" : "0.82rem",
                fontWeight: level === 1 ? 600 : 400,
                color: level === 1 ? textColors.secondary : textColors.muted,
              }}
            >
              {level > 1 && <span style={styles.bullet}>—</span>}
              {text}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    border: "1px solid #E8E6E3",
    borderRadius: "10px",
    background: "#FAFAF9",
    marginBottom: "28px",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "10px 14px",
    background: "none",
    border: "none",
    cursor: "pointer",
    gap: "8px",
  },
  headerLabel: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontFamily: fonts.sans,
    fontSize: "0.82rem",
    fontWeight: 600,
    color: textColors.secondary,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  icon: {
    fontSize: "0.78rem",
    color: textColors.muted,
  },
  chevron: {
    fontSize: "0.9rem",
    color: textColors.muted,
    transition: "transform 0.18s ease",
    display: "inline-block",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    borderTop: "1px solid #E8E6E3",
    padding: "6px 0 8px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    textAlign: "left",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 12px",
    fontFamily: fonts.sans,
    lineHeight: 1.4,
    transition: "color 0.15s",
    borderRadius: "4px",
  },
  bullet: {
    color: "#D1CFC9",
    fontSize: "0.75rem",
    flexShrink: 0,
  },
};
