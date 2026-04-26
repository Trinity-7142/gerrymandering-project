"use client";

import { useState } from "react";
import { textColors, fonts, colors } from "@/lib/constants";

const INITIAL_VISIBLE = 3;

function formatVote(v) {
  if (!v) return "—";
  const map = { yea: "Yea", nay: "Nay", not_voting: "Not Voting", present: "Present" };
  return map[v.toLowerCase()] ?? v;
}

function formatDirection(d) {
  if (!d) return "—";
  return d.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(raw) {
  if (!raw || raw === "NA") return "—";
  try {
    const d = new Date(raw + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(raw);
  }
}

function BillCard({ vote, chamber }) {
  const voteLabel = formatVote(vote.vote);
  const voteColor =
    vote.vote === "yea" ? "#194973"
    : vote.vote === "nay" ? colors.primarySoftRed
    : textColors.muted;

  return (
    <div style={styles.billCard}>
      {vote.source_url ? (
        <a href={vote.source_url} target="_blank" rel="noopener noreferrer" style={styles.billLink}>
          {vote.title ?? vote.bill}
        </a>
      ) : (
        <p style={styles.billTitleNoLink}>{vote.title ?? vote.bill}</p>
      )}

      <div style={styles.billMeta}>
        <div style={styles.billMetaCol}>
          <p style={styles.billMetaLabel}>
            {chamber === "representative" ? "Representative Vote" : "Senator Vote"}
          </p>
          <p style={{ ...styles.billMetaValue, color: voteColor, fontWeight: 600 }}>{voteLabel}</p>
        </div>
        <div style={styles.billMetaCol}>
          <p style={styles.billMetaLabel}>Bill Direction</p>
          <p style={styles.billMetaValue}>{formatDirection(vote.bill_direction)}</p>
        </div>
        {(vote.status ?? vote.outcome) && (
          <div style={styles.billMetaCol}>
            <p style={styles.billMetaLabel}>Bill Status</p>
            <p style={styles.billMetaValue}>{vote.status ?? vote.outcome}</p>
          </div>
        )}
        {vote.date && (
          <div style={styles.billMetaCol}>
            <p style={styles.billMetaLabel}>Date</p>
            <p style={styles.billMetaValue}>{formatDate(vote.date)}</p>
          </div>
        )}
      </div>

      {vote.description && (
        <p style={styles.billDescription}>{vote.description}</p>
      )}
    </div>
  );
}

export default function VoteShowMoreList({ votes, chamber }) {
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? votes : votes.slice(0, INITIAL_VISIBLE);
  const hiddenCount = votes.length - INITIAL_VISIBLE;

  return (
    <div style={styles.issuePanel}>
      {visible.map((vote, i) => (
        <BillCard key={`${vote.bill}-${i}`} vote={vote} chamber={chamber} />
      ))}

      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll((s) => !s)}
          onTouchEnd={(e) => { e.preventDefault(); setShowAll((s) => !s); }}
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
    </div>
  );
}

const styles = {
  issuePanel: {
    paddingTop: "16px",
  },
  billCard: {
    paddingBottom: "20px",
    marginBottom: "20px",
    borderBottom: "1px solid #F0EEEB",
  },
  billLink: {
    fontFamily: fonts.sans,
    fontSize: "0.92rem",
    fontWeight: 600,
    color: textColors.primary,
    textDecoration: "none",
    display: "block",
    marginBottom: "8px",
  },
  billTitleNoLink: {
    fontFamily: fonts.sans,
    fontSize: "0.92rem",
    fontWeight: 600,
    color: textColors.primary,
    marginBottom: "8px",
  },
  billMeta: {
    display: "flex",
    gap: "32px",
    flexWrap: "wrap",
  },
  billMetaCol: {
    minWidth: "120px",
  },
  billMetaLabel: {
    fontFamily: fonts.sans,
    fontSize: "0.72rem",
    fontWeight: 700,
    color: textColors.primary,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "3px",
  },
  billMetaValue: {
    fontFamily: fonts.sans,
    fontSize: "0.88rem",
    color: textColors.secondary,
  },
  billDescription: {
    fontFamily: fonts.sans,
    fontSize: "0.84rem",
    color: textColors.muted,
    lineHeight: 1.55,
    marginTop: "10px",
  },
  toggleBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "4px",
    padding: "8px 14px",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#BF4545",
    background: "rgba(139,58,58,0.06)",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: fonts.sans,
    transition: "background 0.15s ease",
    touchAction: "manipulation",
  },
};
