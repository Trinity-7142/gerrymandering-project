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
import VoteShowMoreList from "@/components/shared/VoteShowMoreList";
import {
  cardStyle, textColors, fonts, partyColors, issueLabels, alignmentColors,
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
  if (score < 0.25) return alignmentColors.veryLow;
  if (score < 0.40) return alignmentColors.low;
  if (score < 0.55) return alignmentColors.moderate;
  if (score < 0.70) return alignmentColors.good;
  if (score < 0.85) return alignmentColors.strong;
  return alignmentColors.veryStrong;
}

function formatAttendance(rate) {
  if (rate === "NA" || rate == null || typeof rate !== "number") return "—";
  return `${(rate * 100).toFixed(0)}%`;
}

function formatDate(raw) {
  if (!raw || raw === "NA") return "—";
  if (/^\d{4}$/.test(String(raw))) return String(raw);
  try {
    const d = new Date(raw + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(raw);
  }
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
    <div className="pol-stat-box" style={noBorder ? { borderRight: "none" } : {}}>
      <p style={styles.statLabel}>{label}</p>
      <p style={{ ...styles.statValue, ...valueStyle }}>{value}</p>
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
  return <VoteShowMoreList votes={votes} chamber={chamber} />;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function PoliticianPanel({ politician, bio, sources, chamber = "senator" }) {
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

  const votesByIssueId = Object.fromEntries(
    (votes_by_issue ?? []).map((g) => [g.issue_id, g])
  );

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
      <style>{`
        /* ── Top row: avatar + bio ── */
        .pol-top-row {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 32px;
          margin-bottom: 24px;
          align-items: flex-start;
        }
        @media (max-width: 640px) {
          .pol-top-row {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .pol-avatar-col {
            flex-direction: row !important;
            align-items: center !important;
            text-align: left !important;
            gap: 16px;
          }
          .pol-avatar-wrap {
            width: 72px !important;
            height: 72px !important;
            flex-shrink: 0;
            margin-bottom: 0 !important;
          }
          .pol-avatar-wrap img {
            width: 72px !important;
            height: 72px !important;
          }
          .pol-name {
            font-size: 1.2rem !important;
            margin-bottom: 4px !important;
          }
        }

        /* ── Stats row ── */
        .pol-stats-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0;
          border-top: 1px solid #E8E6E3;
          border-bottom: 1px solid #E8E6E3;
          padding: 16px 0;
          margin-bottom: 4px;
        }
        .pol-stat-box {
          text-align: center;
          padding: 0 12px;
          border-right: 1px solid #E8E6E3;
        }
        @media (max-width: 900px) {
          .pol-stats-row {
            grid-template-columns: repeat(3, 1fr);
          }
          .pol-stat-box:nth-child(3) {
            border-right: none;
          }
          .pol-stat-box:nth-child(4),
          .pol-stat-box:nth-child(5) {
            border-top: 1px solid #E8E6E3;
            padding-top: 16px;
            margin-top: 0;
          }
          .pol-stat-box:nth-child(5) {
            border-right: none;
          }
        }
        @media (max-width: 640px) {
          .pol-stats-row {
            grid-template-columns: repeat(2, 1fr);
            padding: 12px 0;
          }
          .pol-stat-box {
            padding: 8px 10px;
          }
          .pol-stat-box:nth-child(2) {
            border-right: none;
          }
          .pol-stat-box:nth-child(3) {
            border-right: 1px solid #E8E6E3;
            border-top: 1px solid #E8E6E3;
          }
          .pol-stat-box:nth-child(4) {
            border-right: none;
            border-top: 1px solid #E8E6E3;
          }
          .pol-stat-box:nth-child(5) {
            grid-column: 1 / -1;
            border-right: none;
            border-top: 1px solid #E8E6E3;
          }
        }

        /* ── Card padding on mobile ── */
        @media (max-width: 640px) {
          .pol-card-inner {
            padding: 20px 16px !important;
          }
        }
      `}</style>

      <div className="pol-card-inner" style={{ padding: "32px" }}>
        {/* ── Top section: photo + bio ─────────────────────────────── */}
        <div className="pol-top-row">
          {/* Left: avatar + name + party */}
          <div className="pol-avatar-col" style={styles.avatarCol}>
            <div className="pol-avatar-wrap" style={styles.avatarWrap}>
              {photo_url ? (
                <img src={photo_url} alt={name} style={styles.avatarImg} />
              ) : (
                <svg viewBox="0 0 80 80" width="80" height="80" style={{ display: "block" }}>
                  <circle cx="40" cy="28" r="18" fill="#1A1A1A" />
                  <ellipse cx="40" cy="70" rx="28" ry="20" fill="#1A1A1A" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="pol-name" style={styles.name}>{name}</h2>
              <span style={{ ...styles.partyBadge, background: pc.bg, color: pc.text }}>{partyLabel}</span>
            </div>
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
        <div className="pol-stats-row">
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

        {/* ── Sources footer ───────────────────────────────────────── */}
        {sources?.length > 0 && (
          <div style={styles.sourcesFooter}>
            <span style={styles.sourcesLabel}>Sources: </span>
            {sources.map((s, i) => (
              <span key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={styles.sourceLink}>
                  {s.name}
                </a>
                {i < sources.length - 1 && <span style={styles.sourcesLabel}>, </span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = {
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
    fontFamily: "Georgia, serif",
    fontSize: "0.95rem",
    color: textColors.secondary,
  },
  issuePanelEmpty: {
    paddingTop: "16px",
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
  sourcesFooter: {
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid #E8E6E3",
    fontFamily: fonts.sans,
    fontSize: "0.78rem",
    color: textColors.muted,
  },
  sourcesLabel: {
    fontFamily: fonts.sans,
    fontSize: "0.78rem",
    color: textColors.muted,
  },
  sourceLink: {
    fontFamily: fonts.sans,
    fontSize: "0.78rem",
    color: textColors.muted,
    textDecoration: "underline",
    textDecorationColor: textColors.muted,
    textUnderlineOffset: "2px",
  },
};
