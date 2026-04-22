"use client";

// components/shared/TableOfContents.js
// Notion-style collapsible table of contents with tree-line indentation.
// Headings are extracted server-side and passed as props; clicking smooth-scrolls.

import { useState } from "react";
import { fonts, textColors } from "@/lib/constants";

const TRACK_W = 16; // px width per depth column

// ── For each heading, compute:
//   isLast        — no same-level sibling before the parent closes
//   continuations — per ancestor depth, whether that ancestor still has siblings below
function annotateHeadings(headings) {
  const isLastArr = headings.map((h, i) => {
    for (let j = i + 1; j < headings.length; j++) {
      if (headings[j].level < h.level) return true;
      if (headings[j].level === h.level) return false;
    }
    return true;
  });

  return headings.map((h, i) => {
    const continuations = [];
    for (let d = 1; d < h.level; d++) {
      let ancIdx = -1;
      for (let j = i - 1; j >= 0; j--) {
        if (headings[j].level === d) { ancIdx = j; break; }
        if (headings[j].level < d) break;
      }
      continuations.push(ancIdx !== -1 && !isLastArr[ancIdx]);
    }
    return { ...h, isLast: isLastArr[i], continuations };
  });
}

const COLLAPSE_THRESHOLD = 12;

export default function TableOfContents({ headings }) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);

  if (!headings || headings.length === 0) return null;

  const annotated = annotateHeadings(headings);
  const needsToggle = annotated.length > COLLAPSE_THRESHOLD;
  const visible = needsToggle && !expanded ? annotated.slice(0, COLLAPSE_THRESHOLD) : annotated;
  const hiddenCount = annotated.length - COLLAPSE_THRESHOLD;

  function handleClick(slug) {
    const el = document.getElementById(slug);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={styles.wrapper}>
      <style>{`.toc-btn:hover .toc-label { text-decoration: underline; }`}</style>

      {/* ── Header row ── */}
      <button style={styles.header} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span style={styles.headerLabel}>
          <span style={styles.icon}>☰</span> Contents
        </span>
        <span style={{ ...styles.chevron, transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>
          ▾
        </span>
      </button>

      {/* ── Item list ── */}
      {open && (
        <nav style={styles.list}>
          {visible.map(({ level, text, slug, isLast, continuations }) => (
            <button
              key={slug}
              className="toc-btn"
              onClick={() => handleClick(slug)}
              style={{
                ...styles.item,
                paddingLeft: level === 1 ? "12px" : "0",
                fontSize: level === 1 ? "0.88rem" : level === 2 ? "0.85rem" : "0.82rem",
                fontWeight: level === 1 ? 600 : 400,
                color: level === 1 ? textColors.secondary : textColors.muted,
              }}
            >
              {/* Tree prefix — only for nested headings */}
              {level > 1 && (
                <span style={styles.treePrefix}>
                  {/* Vertical track lines for each ancestor depth */}
                  {continuations.map((cont, ci) => (
                    <span
                      key={ci}
                      style={{
                        display: "inline-block",
                        width: `${TRACK_W}px`,
                        flexShrink: 0,
                        alignSelf: "stretch",
                        borderLeft: cont ? "1px solid #D1CFC9" : "none",
                      }}
                    />
                  ))}

                  {/* Connector: └─ (isLast) or ├─ (not last) */}
                  <span style={{ ...styles.connector, width: `${TRACK_W}px` }}>
                    {/* Vertical segment — full height for ├, top-half only for └ */}
                    <span style={{
                      position: "absolute", left: 0, top: 0,
                      bottom: isLast ? "50%" : 0,
                      borderLeft: "1px solid #D1CFC9",
                    }} />
                    {/* Horizontal segment at midpoint */}
                    <span style={{
                      position: "absolute", left: 0,
                      top: "calc(50% - 0.5px)",
                      width: "100%",
                      borderBottom: "1px solid #D1CFC9",
                    }} />
                  </span>
                </span>
              )}

              <span className="toc-label" style={{ paddingLeft: "4px" }}>{text}</span>
            </button>
          ))}

          {/* ── Show more / Show less toggle ── */}
          {needsToggle && (
            <button
              onClick={() => setExpanded((e) => !e)}
              style={styles.showMore}
            >
              {expanded ? "Show less ▲" : `Show ${hiddenCount} more ▼`}
            </button>
          )}
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
    textAlign: "left",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px 12px 2px 0",
    fontFamily: fonts.sans,
    lineHeight: 1.5,
    transition: "color 0.15s",
    borderRadius: "4px",
    width: "100%",
  },
  treePrefix: {
    display: "flex",
    alignSelf: "stretch",
    alignItems: "stretch",
    flexShrink: 0,
  },
  connector: {
    display: "inline-block",
    flexShrink: 0,
    position: "relative",
    alignSelf: "stretch",
  },
  showMore: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "4px 12px 2px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: fonts.sans,
    fontSize: "0.78rem",
    fontWeight: 600,
    color: textColors.muted,
    letterSpacing: "0.02em",
    transition: "color 0.15s",
  },
};
