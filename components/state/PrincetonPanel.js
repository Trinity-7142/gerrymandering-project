// components/state/PrincetonPanel.js
// Server Component — renders Princeton Gerrymandering Project grades
// Receives: princeton.json data as props
// Layout: centered grade-card (label → overall badge → 3 sub-grades → note)

import { princetonColors, princetonMetricLabels, cardStyle, textColors, fonts } from "@/lib/constants";

// Parse "F (racial)" → { letter: "F", qualifier: "racial" }
// Plain grades like "B" → { letter: "B", qualifier: null }
function parseGrade(grade) {
  if (!grade) return { letter: "?", qualifier: null };
  const match = grade.match(/^([A-F])\s*\(([^)]+)\)$/i);
  if (match) return { letter: match[1].toUpperCase(), qualifier: match[2] };
  return { letter: grade.trim(), qualifier: null };
}

function gradeTextColor(letter) {
  return letter === "A" || letter === "B" || letter === "C" ? "#FFFFFF" : "#1A1A1A";
}

function GradeBadge({ grade, size = "sm" }) {
  const { letter, qualifier } = parseGrade(grade);
  const bg = princetonColors[letter] ?? "#CCCCCC";
  const color = gradeTextColor(letter);
  const isLarge = size === "lg";
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: isLarge ? "72px" : "36px",
        minHeight: isLarge ? "72px" : "36px",
        padding: qualifier ? (isLarge ? "10px 12px" : "5px 8px") : "0",
        borderRadius: isLarge ? "14px" : "8px",
        background: bg,
        color,
        fontFamily: fonts.serif,
        fontWeight: 700,
        flexShrink: 0,
        gap: isLarge ? "4px" : "2px",
        boxShadow: isLarge ? "0 4px 12px rgba(0,0,0,0.12)" : "none",
      }}
    >
      <span style={{ fontSize: isLarge ? "2.2rem" : "0.9rem", lineHeight: 1 }}>
        {letter}
      </span>
      {qualifier && (
        <span
          style={{
            fontSize: isLarge ? "0.6rem" : "0.5rem",
            fontFamily: fonts.sans,
            fontWeight: 600,
            textTransform: "lowercase",
            lineHeight: 1,
            opacity: 0.85,
            textAlign: "center",
          }}
        >
          {qualifier}
        </span>
      )}
    </span>
  );
}

export default function PrincetonPanel({ data, planscoreUrl }) {
  if (!data) {
    return (
      <div style={styles.card}>
        <p style={styles.cardLabel}>Gerrymandering Grade</p>
        <p style={styles.unavailable}>
          Princeton Gerrymandering Project data is not yet available for this state.
        </p>
      </div>
    );
  }

  const { source, source_url, overall_grade, metrics, methodology_note } = data;

  return (
    <div style={styles.card}>
      {/* ── Label ─────────────────────────────────────────── */}
      <p style={styles.cardLabel}>Gerrymandering Grade</p>

      {/* ── Overall grade badge ───────────────────────────── */}
      <div style={{ marginBottom: "12px" }}>
        <GradeBadge grade={overall_grade} size="lg" />
      </div>

      {/* ── Sub-grades row ────────────────────────────────── */}
      <div style={styles.subGradeRow}>
        {Object.entries(metrics).map(([key, { grade }]) => (
          <div key={key} style={styles.subGrade}>
            <GradeBadge grade={grade} size="sm" />
            <p style={styles.subGradeLabel}>{princetonMetricLabels[key] ?? key}</p>
          </div>
        ))}
      </div>

      {/* ── Note ──────────────────────────────────────────── */}
      <p style={styles.note}>
        {methodology_note && <>{methodology_note} </>}
        {source_url && (
          <a href={source_url} target="_blank" rel="noopener noreferrer" style={styles.noteLink}>
            {source}
          </a>
        )}
        {planscoreUrl && (
          <>{" · "}<a href={planscoreUrl} target="_blank" rel="noopener noreferrer" style={styles.noteLink}>
            PlanScore&rsquo;s data
          </a></>
        )}
      </p>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = {
  card: {
    ...cardStyle,
    padding: "28px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  cardLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: textColors.muted,
    marginBottom: "16px",
    fontFamily: fonts.sans,
  },
  subGradeRow: {
    display: "flex",
    gap: "16px",
    margin: "16px 0",
  },
  subGrade: {
    textAlign: "center",
  },
  subGradeLabel: {
    fontSize: "0.65rem",
    color: textColors.muted,
    lineHeight: 1.3,
    maxWidth: "64px",
    marginTop: "4px",
    fontFamily: fonts.sans,
  },
  note: {
    fontSize: "0.75rem",
    color: textColors.muted,
    lineHeight: 1.5,
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #EEECE9",
    fontFamily: fonts.sans,
  },
  noteLink: {
    color: "#2563EB",
    textDecoration: "underline",
    textDecorationColor: "rgba(37,99,235,0.3)",
  },
  unavailable: {
    fontSize: "0.9rem",
    color: textColors.muted,
    fontStyle: "italic",
    padding: "24px 0",
    fontFamily: fonts.sans,
  },
};
