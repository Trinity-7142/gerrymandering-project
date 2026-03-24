// components/state/SenatorPanel.js
// Server Component — renders side-by-side senator cards
// Receives: senators.json data as props

import { cardStyle, textColors, fonts, partyColors, alignmentColors } from "@/lib/constants";

function interpretScore(score, interpretation) {
  if (typeof score !== "number") return null;
  if (score < 0.3) return interpretation?.["0.0_to_0.3"] ?? "Low Alignment";
  if (score < 0.6) return interpretation?.["0.3_to_0.6"] ?? "Partial Alignment";
  if (score < 0.8) return interpretation?.["0.6_to_0.8"] ?? "Moderate Alignment";
  return interpretation?.["0.8_to_1.0"] ?? "Strong Alignment";
}

function alignmentColor(score) {
  if (typeof score !== "number") return textColors.muted;
  if (score < 0.3) return alignmentColors.low;
  if (score < 0.6) return alignmentColors.partial;
  if (score < 0.8) return alignmentColors.moderate;
  return alignmentColors.high;
}

function SenatorCard({ senator, interpretation }) {
  const { name, party, photo_url, alignment } = senator;
  const pc = partyColors[party] ?? partyColors.D;
  const partyLabel = party === "D" ? "Democrat" : party === "R" ? "Republican" : party === "I" ? "Independent" : party;
  const score = alignment?.overall_score;
  const isPending = !score || typeof score !== "number" || alignment?.overall_label?.startsWith("Placeholder");
  const scoreLabel = interpretScore(score, interpretation);

  return (
    <div style={styles.senatorCard}>
      {/* Avatar */}
      <div style={styles.avatar}>
        {photo_url
          ? <img src={photo_url} alt={name} style={styles.avatarImg} />
          : <span style={{ fontSize: "1.8rem", color: textColors.faint }}>👤</span>
        }
      </div>

      {/* Name */}
      <h3 style={styles.name}>{name}</h3>

      {/* Party badge */}
      <span style={{ ...styles.partyBadge, background: pc.bg, color: pc.text }}>
        {partyLabel}
      </span>

      {/* Alignment score or placeholder */}
      {isPending ? (
        <p style={styles.placeholder}>
          Senator alignment information pending data pipeline completion.
        </p>
      ) : (
        <div style={styles.scoreWrap}>
          <span style={{ ...styles.scoreValue, color: alignmentColor(score) }}>
            {(score * 100).toFixed(0)}
          </span>
          <span style={styles.scoreOf}> / 100</span>
          <p style={styles.scoreLabel}>{scoreLabel}</p>
        </div>
      )}
    </div>
  );
}

export default function SenatorPanel({ data }) {
  if (!data) {
    return (
      <div style={styles.wrapper}>
        <p style={styles.unavailable}>Senator data is not yet available for this state.</p>
      </div>
    );
  }

  const { senators, interpretation, ces_state_sample, methodology_note } = data;

  return (
    <div style={{ marginBottom: "28px" }}>
      <div style={styles.grid}>
        {senators.map((senator) => (
          <SenatorCard key={senator.name} senator={senator} interpretation={interpretation} />
        ))}
      </div>

      {/* Footer note */}
      {(ces_state_sample?.confidence_note || methodology_note) && (
        <p style={styles.footnote}>
          {ces_state_sample?.confidence_note}
          {ces_state_sample?.confidence_note && methodology_note && " · "}
          {methodology_note}
        </p>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  senatorCard: {
    ...cardStyle,
    padding: "32px",
    textAlign: "center",
    transition: "box-shadow 0.3s ease, transform 0.3s ease",
  },
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #E8E6E3, #D5D3D0)",
    margin: "0 auto 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  name: {
    fontFamily: fonts.serif,
    fontSize: "1.3rem",
    fontWeight: 700,
    marginBottom: "4px",
    color: textColors.primary,
  },
  partyBadge: {
    display: "inline-block",
    fontSize: "0.8rem",
    fontWeight: 600,
    padding: "2px 10px",
    borderRadius: "20px",
    marginBottom: "12px",
    fontFamily: fonts.sans,
  },
  placeholder: {
    fontSize: "0.82rem",
    color: textColors.muted,
    lineHeight: 1.6,
    paddingTop: "8px",
    borderTop: "1px solid #EEECE9",
    fontFamily: fonts.sans,
    fontStyle: "italic",
  },
  scoreWrap: {
    paddingTop: "12px",
    borderTop: "1px solid #EEECE9",
  },
  scoreValue: {
    fontFamily: fonts.serif,
    fontSize: "1.8rem",
    fontWeight: 700,
  },
  scoreOf: {
    fontSize: "0.85rem",
    color: textColors.muted,
    fontFamily: fonts.sans,
  },
  scoreLabel: {
    fontSize: "0.78rem",
    color: textColors.muted,
    marginTop: "2px",
    fontFamily: fonts.sans,
  },
  footnote: {
    fontSize: "0.72rem",
    color: textColors.faint,
    lineHeight: 1.5,
    marginTop: "12px",
    fontFamily: fonts.sans,
  },
  wrapper: {
    ...cardStyle,
    padding: "32px",
    marginBottom: "28px",
  },
  unavailable: {
    fontSize: "0.9rem",
    color: textColors.muted,
    fontStyle: "italic",
    fontFamily: fonts.sans,
  },
};
