// components/state/VoteCastPanel.js
// Client Component — renders AP VoteCast issue salience as ranked bar chart
// Shows which issues voters in this state care about most, ranked by pct
//
// Data source: votecast_salience.json (Data Contract Section 4.3)
// Data arrives pre-sorted by rank — rendering order is purely data-driven

"use client";

import { useState } from "react";
import { issueLabels, issueIcons, stateNames, alignmentColors } from "@/lib/constants";

// ── Bar width scaling config ───────────────────────────────────────────
// Switch BAR_MODE to change how bar fills are rendered:
//   "absolute"  → pct maps directly to width (28.3% pct = 28.3% bar fill)
//   "relative"  → top issue fills 100%, others scaled proportionally
//   "amplified" → pct × AMPLIFY_FACTOR, capped at 100%
//
// The percentage *label* always shows the real value regardless of mode.
const BAR_MODE = "amplified";
const AMPLIFY_FACTOR = 2.5;

function getBarWidth(pct, maxPct) {
  switch (BAR_MODE) {
    case "absolute":
      return `${(pct * 100).toFixed(1)}%`;
    case "relative":
      return `${((pct / maxPct) * 100).toFixed(1)}%`;
    case "amplified":
      return `${Math.min(pct * 100 * AMPLIFY_FACTOR, 100).toFixed(1)}%`;
    default:
      return `${(pct * 100).toFixed(1)}%`;
  }
}

// ── How many issues to show before the toggle ──────────────────────────
const INITIAL_VISIBLE = 5;

// ── Gradient for bar fills (uses alignment blue ramp) ──────────────────
const BAR_GRADIENT = `linear-gradient(
  90deg,
  ${alignmentColors.low} 0%,
  #9BBDD0 25%,
  ${alignmentColors.partial} 50%,
  ${alignmentColors.moderate} 75%,
  ${alignmentColors.high} 100%
)`;

export default function VoteCastPanel({ data }) {
  const [showAll, setShowAll] = useState(false);

  // ── Null guard ─────────────────────────────────────────────────────
  if (!data) {
    return (
      <div style={styles.card}>
        <h2 style={styles.title}>Top Voter Concerns</h2>
        <p style={styles.unavailable}>
          Issue salience data is not yet available for this state.
        </p>
      </div>
    );
  }

  const { state_code, source, sample_size, salience, methodology_note } = data;
  const stateName = stateNames[state_code] || state_code;
  const maxPct = salience[0]?.pct || 1;

  const visibleIssues = showAll ? salience : salience.slice(0, INITIAL_VISIBLE);
  const hiddenCount = salience.length - INITIAL_VISIBLE;

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>{stateName}&rsquo;s Top Concerns</h2>

      <div style={styles.barList}>
        {visibleIssues.map((item) => (
          <div key={item.issue_id} style={styles.row}>
            <span style={styles.icon}>
              {issueIcons[item.issue_id] || "📊"}
            </span>
            <span style={styles.label}>
              {issueLabels[item.issue_id] || item.issue_id}
            </span>
            <div style={styles.barTrack}>
              <div
                style={{
                  ...styles.barFill,
                  width: getBarWidth(item.pct, maxPct),
                }}
              />
            </div>
            <span style={styles.pct}>
              {(item.pct * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={styles.toggleBtn}
          aria-expanded={showAll}
        >
          <span>{showAll ? "Show less" : `Show ${hiddenCount} more`}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: showAll ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.25s ease",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      <div style={styles.footer}>
        <p style={styles.footnote}>
          Source: {source} · n = {sample_size?.toLocaleString()}
        </p>
        {methodology_note && (
          <p style={styles.methodology}>{methodology_note}</p>
        )}
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────
// Inline styles used here to keep the component self-contained.
// These can be migrated to Tailwind classes or a CSS module if preferred.
const styles = {
  card: {
    padding: "32px",
    marginBottom: "28px",
    background: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E8E6E3",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
  },
  title: {
    fontFamily: "var(--font-serif, 'Source Serif 4', Georgia, serif)",
    fontSize: "1.6rem",
    fontWeight: 700,
    marginBottom: "24px",
    color: "#1A1A1A",
  },
  barList: {
    display: "flex",
    flexDirection: "column",
    gap: "0px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "10px 8px",
    borderRadius: "8px",
    transition: "background 0.15s ease",
    cursor: "default",
  },
  icon: {
    fontSize: "1.15rem",
    width: "28px",
    textAlign: "center",
    flexShrink: 0,
  },
  label: {
    fontSize: "0.88rem",
    fontWeight: 500,
    color: "#555555",
    width: "200px",
    flexShrink: 0,
    fontFamily: "var(--font-sans, 'DM Sans', system-ui, sans-serif)",
  },
  barTrack: {
    flex: 1,
    height: "14px",
    background: "#EDEBE8",
    borderRadius: "7px",
    overflow: "hidden",
    position: "relative",
  },
  barFill: {
    height: "100%",
    borderRadius: "7px",
    background: BAR_GRADIENT,
    transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
  },
  pct: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#555555",
    width: "42px",
    textAlign: "right",
    flexShrink: 0,
    fontVariantNumeric: "tabular-nums",
    fontFamily: "var(--font-sans, 'DM Sans', system-ui, sans-serif)",
  },
  toggleBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "16px",
    padding: "8px 14px",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#BF4545",
    background: "rgba(139,58,58,0.06)",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "var(--font-sans, 'DM Sans', system-ui, sans-serif)",
    transition: "background 0.15s ease",
  },
  footer: {
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid #EDEBE8",
  },
  footnote: {
    fontSize: "0.75rem",
    color: "#888888",
    fontFamily: "var(--font-sans, 'DM Sans', system-ui, sans-serif)",
  },
  methodology: {
    fontSize: "0.7rem",
    color: "#AAAAAA",
    marginTop: "6px",
    lineHeight: 1.5,
    fontFamily: "var(--font-sans, 'DM Sans', system-ui, sans-serif)",
  },
  unavailable: {
    fontSize: "0.9rem",
    color: "#888888",
    fontStyle: "italic",
    padding: "24px 0",
  },
};