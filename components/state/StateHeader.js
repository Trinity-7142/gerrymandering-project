// components/state/StateHeader.js
// Server Component — state name, delegation meta, and alignment gauge
// Receives: overview.json data + computed alignmentScore (0–100)

import AlignmentGaugeCard from "@/components/state/AlignmentGaugeCard";
import { textColors, fonts } from "@/lib/constants";

export default function StateHeader({ data, alignmentScore }) {
  if (!data) return null;

  const { state_name, total_districts, delegation_composition } = data;
  const { democrat = 0, republican = 0 } = delegation_composition ?? {};
  const total = democrat + republican;
  const demPct = total > 0 ? ((democrat / total) * 100).toFixed(1) : "—";
  const repPct = total > 0 ? ((republican / total) * 100).toFixed(1) : "—";

  return (
    <div style={styles.section}>
      {/* ── Left: state info ────────────────────────────────── */}
      <div>
        <p style={styles.stateLabel}>State Profile</p>
        <h1 style={styles.stateName}>{state_name}</h1>
        <p style={styles.stateMeta}>
          {total_districts} congressional districts
          <span style={styles.dot}> · </span>
          {demPct}% Dem / {repPct}% Rep
        </p>
      </div>

      {/* ── Right: alignment gauge ──────────────────────────── */}
      <AlignmentGaugeCard score={alignmentScore} />
    </div>
  );
}

const styles = {
  section: {
    paddingTop: "48px",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "32px",
    alignItems: "start",
  },
  stateLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: textColors.muted,
    marginBottom: "4px",
    fontFamily: fonts.sans,
  },
  stateName: {
    fontFamily: fonts.serif,
    fontSize: "3.2rem",
    fontWeight: 700,
    lineHeight: 1.1,
    color: textColors.primary,
    marginBottom: "8px",
  },
  stateMeta: {
    fontSize: "0.85rem",
    color: textColors.secondary,
    fontFamily: fonts.sans,
    lineHeight: 1.5,
  },
  dot: {
    color: textColors.muted,
  },
};
