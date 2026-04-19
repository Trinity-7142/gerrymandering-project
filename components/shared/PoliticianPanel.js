// components/shared/PoliticianPanel.js
// Server Component — politician profile card shared by state (senators) and district (rep) pages
//
// Props:
//   politician: {
//     name, party, photo_url,
//     assumed_office,            // "2024-01-03" or "NA"
//     alignment: { overall_score, issue_scores },
//     votes_by_issue,
//     overall_voting_stats: { attendance_rate, total_tracked_votes },
//   }
//   bio: string | null           // markdown body (frontmatter already stripped)
//   chamber: "senator" | "representative"

import Markdown from "@/components/shared/Markdown";
import PoliticianIssueTabs from "@/components/shared/PoliticianIssueTabs";
import {
  cardStyle, textColors, fonts, partyColors, colors, issueLabels, alignmentColors,
} from "@/lib/constants";

// ── Helpers ─────────────────────────────────────────────────────────────────

function isPlaceholder(score, label) {
  return typeof score !== "number" || label?.startsWith("Placeholder");
}

function formatScore(score, label) {
  if (isPlaceholder(score, label)) return "Pending";
  return `${(score * 100).toFixed(0)}%`;
}

function alignmentColor(score, label) {
  if (isPlaceholder(score, label)) return textColors.muted;
  if (score < 0.3) return alignmentColors.low;
  if (score < 0.6) return alignmentColors.partial;
  if (score < 0.8) return alignmentColors.moderate;
  return alignmentColors.high;
}

function formatAttendance(rate) {
  if (rate === "NA" || rate == null || typeof rate !== "number") return "—";
  return `${(rate * 100).toFixed(0)}%`;
}

function formatDate(raw) {
  if (!raw || raw === "NA") return "—";
  // Year-only value (e.g. 2002 or "2002")
  if (/^\d{4}$/.test(String(raw))) return String(raw);
  // Full ISO date string (e.g. "2024-01-03")
  try {
    const d = new Date(raw + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(raw);
  }
}

function formatDirection(d) {
  if (!d) return "—";
  return d.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatVote(v) {
  if (!v) return "—";
  const map = { yea: "Yea", nay: "Nay", not_voting: "Not Voting", present: "Present" };
  return map[v.toLowerCase()] ?? v;
}

function topIssues(issueScores) {
  if (!issueScores?.length) return { highest: null, lowest: null };
  const real = issueScores.filter((s) => typeof s.score === "number");
  if (!real.length) return { highest: null, lowest: null };
  const sorted = [...real].sort((a, b) => b.score - a.score);
  return { highest: sorted[0], lowest: sorted[sorted.length - 1] };
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatBox({ label, value, valueStyle, noBorder }) {
  return (
    <div style={{ ...styles.statBox, ...(noBorder ? { borderRight: "none" } : {}) }}>
      <p style={styles.statLabel}>{label}</p>
      <p style={{ ...styles.statValue, ...valueStyle }}>{value}</p>
    </div>
  );
}

function BillCard({ vote, chamber }) {
  const voteLabel = formatVote(vote.vote);
  const voteColor = vote.vote === "yea" ? "#16a34a" : vote.vote === "nay" ? colors.primarySoftRed : textColors.muted;

  return (
    <div style={styles.billCard}>
      {/* Bill title + link */}
      {vote.source_url ? (
        <a href={vote.source_url} target="_blank" rel="noopener noreferrer" style={styles.billLink}>
          {vote.title ?? vote.bill}
        </a>
      ) : (
        <p style={styles.billTitleNoLink}>{vote.title ?? vote.bill}</p>
      )}

      {/* Vote metadata row */}
      <div style={styles.billMeta}>
        <div style={styles.billMetaCol}>
          <p style={styles.billMetaLabel}>{chamber === "representative" ? "Representative Vote" : "Senator Vote"}</p>
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

      {/* Bill description (if provided) */}
      {vote.description && (
        <p style={styles.billDescription}>{vote.description}</p>
      )}
    </div>
  );
}

function IssuePanel({ issueGroup, chamber }) {
  const votes = issueGroup.votes ?? [];

  if (!votes.length) {
    return (
      <div style={styles.issuePanelEmpty}>
        <p style={styles.pendingNote}>No votes found for this issue.</p>
      </div>
    );
  }

  return (
    <div style={styles.issuePanel}>
      {votes.map((vote, i) => (
        <BillCard key={`${vote.bill}-${i}`} vote={vote} chamber={chamber} />
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function PoliticianPanel({ politician, bio, chamber = "senator" }) {
  if (!politician) {
    return (
      <div style={{ ...cardStyle, padding: "32px", marginBottom: "24px" }}>
        <p style={{ fontFamily: fonts.sans, color: textColors.muted, fontStyle: "italic" }}>
          Politician data not yet available.
        </p>
      </div>
    );
  }

  const { name, party, photo_url, assumed_office, alignment, votes_by_issue, overall_voting_stats } = politician;

  const pc = partyColors[party] ?? partyColors.I;
  const partyLabel = party === "D" ? "Democrat" : party === "R" ? "Republican" : party === "I" ? "Independent" : (party ?? "Unknown");
  const score = alignment?.overall_score;
  const scoreLabel = alignment?.overall_label;
  const { highest, lowest } = topIssues(alignment?.issue_scores ?? []);

  // Build a lookup from the politician's actual vote data
  const votesByIssueId = Object.fromEntries(
    (votes_by_issue ?? []).map((g) => [g.issue_id, g])
  );

  // Show all 9 issues in taxonomy order; empty issues get the "no votes" message
  const ALL_ISSUES = [
    "economy", "immigration", "environment", "abortion",
    "healthcare", "criminal_justice", "guns", "election_integrity", "foreign_policy",
  ];
  const tabs = ALL_ISSUES.map((issue_id) => ({
    id: issue_id,
    label: issueLabels[issue_id] ?? issue_id,
    content: <IssuePanel issueGroup={votesByIssueId[issue_id] ?? { issue_id, votes: [] }} chamber={chamber} />,
  }));

  return (
    <div style={{ ...cardStyle, padding: "32px", marginBottom: "24px" }}>
      {/* ── Top section: photo + bio ─────────────────────────────── */}
      <div style={styles.topRow}>
        {/* Left: avatar + name + party */}
        <div style={styles.avatarCol}>
          <div style={styles.avatarWrap}>
            {photo_url ? (
              <img src={photo_url} alt={name} style={styles.avatarImg} />
            ) : (
              <svg viewBox="0 0 80 80" width="80" height="80" style={{ display: "block" }}>
                <circle cx="40" cy="28" r="18" fill="#1A1A1A" />
                <ellipse cx="40" cy="70" rx="28" ry="20" fill="#1A1A1A" />
              </svg>
            )}
          </div>
          <h2 style={styles.name}>{name}</h2>
          <span style={{ ...styles.partyBadge, background: pc.bg, color: pc.text }}>{partyLabel}</span>
        </div>

        {/* Right: bio */}
        <div style={styles.bioCol}>
          {bio ? (
            <Markdown>{bio}</Markdown>
          ) : (
            <p style={styles.pendingNote}>Information about {name} coming soon.</p>
          )}
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────── */}
      <div style={styles.statsRow}>
        <StatBox
          label="Alignment Score"
          value={formatScore(score, scoreLabel)}
          valueStyle={isPlaceholder(score, scoreLabel) ? { color: textColors.muted } : { color: alignmentColor(score, scoreLabel), fontWeight: 700 }}
        />
        <StatBox
          label={/^\d{4}$/.test(String(assumed_office ?? "")) ? "Year Started" : "Date Started"}
          value={formatDate(assumed_office)}
        />
        <StatBox label="Attendance Rate" value={formatAttendance(overall_voting_stats?.attendance_rate)} />
        <StatBox
          label="Highest Alignment Issue"
          value={highest ? `${issueLabels[highest.issue_id] ?? highest.issue_id}: ${(highest.score * 100).toFixed(0)}%` : "—"}
        />
        <StatBox
          label="Lowest Alignment Issue"
          value={lowest ? `${issueLabels[lowest.issue_id] ?? lowest.issue_id}: ${(lowest.score * 100).toFixed(0)}%` : "—"}
          noBorder
        />
      </div>

      {/* ── Issue voting record ──────────────────────────────────── */}
      {tabs.length > 0 ? (
        <PoliticianIssueTabs tabs={tabs} />
      ) : (
        <div style={styles.pendingVotes}>
          <p style={styles.pendingNote}>Voting record pending data pipeline completion.</p>
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  topRow: {
    display: "grid",
    gridTemplateColumns: "200px 1fr",
    gap: "32px",
    marginBottom: "24px",
    alignItems: "flex-start",
  },
  avatarCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  avatarWrap: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #E8E6E3, #D5D3D0)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  name: {
    fontFamily: fonts.serif,
    fontSize: "1.5rem",
    fontWeight: 700,
    color: textColors.primary,
    marginBottom: "8px",
    lineHeight: 1.2,
  },
  partyBadge: {
    display: "inline-block",
    fontSize: "0.8rem",
    fontWeight: 600,
    padding: "3px 12px",
    borderRadius: "20px",
    fontFamily: fonts.sans,
  },
  bioCol: {
    paddingTop: "4px",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "0",
    borderTop: "1px solid #E8E6E3",
    borderBottom: "1px solid #E8E6E3",
    padding: "16px 0",
    marginBottom: "4px",
  },
  statBox: {
    textAlign: "center",
    padding: "0 12px",
    borderRight: "1px solid #E8E6E3",
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: "0.72rem",
    fontWeight: 700,
    color: textColors.primary,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "6px",
  },
  statValue: {
    fontFamily: fonts.sans,
    fontSize: "0.95rem",
    color: textColors.secondary,
  },
  issuePanel: {
    paddingTop: "16px",
  },
  issuePanelEmpty: {
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
    color: colors.primarySoftRed,
    textDecoration: "none",
    display: "block",
    marginBottom: "8px",
    transition: "opacity 0.2s",
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
  pendingNote: {
    fontFamily: fonts.sans,
    fontSize: "0.84rem",
    color: textColors.muted,
    fontStyle: "italic",
    lineHeight: 1.5,
  },
  pendingVotes: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #E8E6E3",
  },
};
