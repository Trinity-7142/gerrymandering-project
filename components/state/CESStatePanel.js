// components/state/CESStatePanel.js
// Server Component — renders CES statewide policy preferences
// Box 1: issue-level summary (liberal/conservative avg from binary_direction)
// Box 2: per-question detail using raw results (support/oppose from results field)

import { issueLabels, cardStyle, textColors, fonts } from "@/lib/constants";

// ── Box 1 colors (liberal / conservative) ────────────────────────────────────
const BOX1 = {
  leftColor:     "#194973",
  rightColor:    "#BF4545",
  leftGradient:  "linear-gradient(to left,  #194973, #102E48)",
  rightGradient: "linear-gradient(to right, #BF4545, #732929)",
};

// ── Box 2 colors (support / oppose) ─────────────────────────────────────────
const BOX2 = {
  leftColor:     "#194973",
  rightColor:    "#BF4545",
  leftGradient:  "linear-gradient(to left,  #194973, #102E48)",
  rightGradient: "linear-gradient(to right, #BF4545, #732929)",
};

// ── Helper: average liberal_pct per issue from binary_direction ───────────────
function avgIssueLean(questions) {
  const scored = questions.filter(
    (q) => q.binary_direction?.liberal_pct != null && q.binary_direction?.conservative_pct != null
  );
  if (scored.length === 0) return null;
  return scored.reduce((acc, q) => acc + q.binary_direction.liberal_pct, 0) / scored.length;
}

// ── Helper: derive support/oppose pcts from results based on scale ─────────────
// Returns { leftPct, rightPct } — values are raw proportions (may not sum to 1
// for 5pt scales where a neutral option exists).
function getSupportOppose(q) {
  const r = q.results;
  switch (q.scale) {
    case "support_oppose":
      return { leftPct: r.support, rightPct: r.oppose };
    case "agree_disagree":
      return { leftPct: r.agree, rightPct: r.disagree };
    case "agree_disagree_5pt": {
      const agree    = (r.strongly_agree    || 0) + (r.somewhat_agree    || 0);
      const disagree = (r.strongly_disagree || 0) + (r.somewhat_disagree || 0);
      return { leftPct: agree, rightPct: disagree };
    }
    case "spending_5pt": {
      const increase = (r.greatly_increase || 0) + (r.slightly_increase || 0);
      const decrease = (r.greatly_decrease || 0) + (r.slightly_decrease || 0);
      return { leftPct: increase, rightPct: decrease };
    }
    default:
      return null;
  }
}

// ── Diverging bar ─────────────────────────────────────────────────────────────
// leftPct / rightPct are raw proportions (0–1); bar fills from center outward.
// For binary scales (support_oppose / agree_disagree) they sum to 1, filling
// the full track. For 5pt scales they may not sum to 1, leaving a neutral gap.
function DivergingBar({ leftPct, rightPct, leftColor, rightColor, leftGradient, rightGradient }) {
  const lc = leftColor    || BOX2.leftColor;
  const rc = rightColor   || BOX2.rightColor;
  const lg = leftGradient  || BOX2.leftGradient;
  const rg = rightGradient || BOX2.rightGradient;

  return (
    <div style={barStyles.wrapper}>
      <span style={{ ...barStyles.pctLabel, textAlign: "right", color: lc }}>
        {(leftPct * 100).toFixed(0)}%
      </span>

      <div style={barStyles.track}>
        <div style={{ ...barStyles.fill, right: "50%", width: `${(leftPct  * 50).toFixed(1)}%`, background: lg, borderRadius: "6px 0 0 6px" }} />
        <div style={{ ...barStyles.fill, left:  "50%", width: `${(rightPct * 50).toFixed(1)}%`, background: rg, borderRadius: "0 6px 6px 0" }} />
        <div style={barStyles.centerTick} />
      </div>

      <span style={{ ...barStyles.pctLabel, textAlign: "left", color: rc }}>
        {(rightPct * 100).toFixed(0)}%
      </span>
    </div>
  );
}

const barStyles = {
  wrapper: { display: "flex", alignItems: "center", gap: "8px" },
  track: {
    flex: 1,
    height: "12px",
    background: "#EDEBE8",
    borderRadius: "6px",
    position: "relative",
    overflow: "hidden",
  },
  fill: { position: "absolute", top: 0, height: "100%" },
  centerTick: {
    position: "absolute",
    left: "50%",
    top: 0,
    width: "2px",
    height: "100%",
    background: "#FFFFFF",
    transform: "translateX(-50%)",
    zIndex: 1,
  },
  pctLabel: {
    fontSize: "0.72rem",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    fontFamily: "var(--font-sans, 'DM Sans', system-ui, sans-serif)",
    width: "30px",
    flexShrink: 0,
  },
};

// ── Legend ────────────────────────────────────────────────────────────────────
// Mirrors the bar row structure so labels land exactly at the center tick.
// prefixWidth + prefixGap match the issue-label column in Box 1.
// leftStyle / rightStyle let each box override individual label positioning.
// Defaults anchor both labels at the center tick (right: 50% / left: 50%).
function BarLegend({ leftLabel, rightLabel, leftColor, rightColor, prefixWidth, prefixGap, leftStyle, rightStyle }) {
  const baseLabelStyle = {
    fontSize: "0.72rem",
    fontWeight: 600,
    fontFamily: fonts.sans,
    whiteSpace: "nowrap",
    position: "absolute",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: prefixGap || 0, marginBottom: "12px" }}>
      {/* Spacer matching the issue-label column (Box 1 only) */}
      {prefixWidth && <span style={{ width: prefixWidth, flexShrink: 0 }} />}

      {/* Mirrors barStyles.wrapper layout */}
      <div style={{ ...barStyles.wrapper, flex: prefixWidth ? 1 : undefined }}>
        {/* Spacer matching left pct label */}
        <span style={{ width: "30px", flexShrink: 0 }} />

        {/* Center-anchored labels inside the track area */}
        <div style={{ flex: 1, position: "relative", height: "18px" }}>
          <span style={{ ...baseLabelStyle, right: "50%", paddingRight: "6px", color: leftColor, ...leftStyle }}>
            ◀ {leftLabel}
          </span>
          <span style={{ ...baseLabelStyle, left: "50%", paddingLeft: "6px", color: rightColor, ...rightStyle }}>
            {rightLabel} ▶
          </span>
        </div>

        {/* Spacer matching right pct label */}
        <span style={{ width: "30px", flexShrink: 0 }} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CESStatePanel({ data }) {
  if (!data) {
    return (
      <div style={{ ...cardStyle, padding: "40px", marginBottom: "28px" }}>
        <p style={{ fontFamily: fonts.sans, fontSize: "0.9rem", color: textColors.muted, fontStyle: "italic" }}>
          Policy preference data not yet available for this state.
        </p>
      </div>
    );
  }

  const scorableIssues = data.issues.filter((issue) => avgIssueLean(issue.questions) !== null);

  return (
    <div style={{ marginBottom: "28px" }}>

      {/* ── Box 1: Issue Summary (liberal / conservative lean) ─────────────── */}
      <div style={{ ...cardStyle, padding: "32px", marginBottom: "24px" }}>
        <h2 style={headingStyle}>Where Voters Stand by Issue</h2>
        <BarLegend leftLabel="Liberal" rightLabel="Conservative" leftColor={BOX1.leftColor} rightColor={BOX1.rightColor} prefixWidth="160px" prefixGap="12px" />

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {scorableIssues.map((issue) => {
            const libPct = avgIssueLean(issue.questions);
            return (
              <div key={issue.issue_id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={issueLabelStyle}>
                  {issueLabels[issue.issue_id] || issue.issue_id}
                </span>
                <div style={{ flex: 1 }}>
                  <DivergingBar
                    leftPct={libPct}
                    rightPct={1 - libPct}
                    leftColor={BOX1.leftColor}
                    rightColor={BOX1.rightColor}
                    leftGradient={BOX1.leftGradient}
                    rightGradient={BOX1.rightGradient}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p style={footerTextStyle}>
          Source: {data.source} · n&nbsp;=&nbsp;{data.total_respondents?.toLocaleString()}
        </p>
      </div>

      {/* ── Box 2: Question Detail (support / oppose from results) ─────────── */}
      <div style={{ ...cardStyle, padding: "32px" }}>
        <h2 style={headingStyle}>Survey Questions</h2>
        <BarLegend 
          leftLabel="Support" 
          rightLabel="Oppose" 
          leftColor={BOX2.leftColor} 
          rightColor={BOX2.rightColor}   
          leftStyle={{ right: "auto", left: -40, paddingRight: 0 }} 
          rightStyle={{ left: "auto", right: "auto", marginLeft: "35px", paddingLeft: 0 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {data.issues.map((issue) => (
            <div key={issue.issue_id}>
              <p style={sectionHeaderStyle}>
                {issueLabels[issue.issue_id] || issue.issue_id}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {issue.questions.map((q) => {
                  const vals = getSupportOppose(q);
                  return (
                    <div key={q.variable}>
                      <p style={questionTextStyle}>
                        {q.text}
                        <span style={{ color: textColors.faint, fontWeight: 400 }}>
                          {" "}(n&nbsp;=&nbsp;{q.n?.toLocaleString()})
                        </span>
                      </p>
                      {vals && (
                        <DivergingBar leftPct={vals.leftPct} rightPct={vals.rightPct} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {data.methodology_note && (
          <p style={{ ...footerTextStyle, marginTop: "24px", lineHeight: 1.5 }}>
            {data.methodology_note}
          </p>
        )}
      </div>

    </div>
  );
}

// ── Shared text styles ────────────────────────────────────────────────────────
const headingStyle = {
  fontFamily: fonts.serif,
  fontSize: "1.4rem",
  fontWeight: 700,
  color: textColors.primary,
  marginBottom: "16px",
};

const issueLabelStyle = {
  fontSize: "0.85rem",
  fontWeight: 500,
  color: textColors.secondary,
  width: "160px",
  flexShrink: 0,
  fontFamily: fonts.sans,
};

const sectionHeaderStyle = {
  fontSize: "0.9rem",
  fontWeight: 700,
  color: textColors.secondary,
  letterSpacing: "0.01em",
  marginBottom: "10px",
  fontFamily: fonts.sans,
};

const questionTextStyle = {
  fontSize: "0.85rem",
  fontWeight: 500,
  color: textColors.secondary,
  fontFamily: fonts.sans,
  marginBottom: "6px",
  lineHeight: 1.4,
};

const footerTextStyle = {
  fontSize: "0.72rem",
  color: textColors.faint,
  fontFamily: fonts.sans,
  marginTop: "20px",
};
