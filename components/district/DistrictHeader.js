// components/district/DistrictHeader.js
// Server Component — district name, rep meta, and alignment gauge
// Receives: overview.json data + computed alignmentScore (0–100)

import Link from "next/link";
import AlignmentGaugeCard from "@/components/shared/AlignmentGaugeCard";
import { textColors, fonts } from "@/lib/constants";

export default function DistrictHeader({ data, alignmentScore, stateCode }) {
  if (!data) return null;

  const { district_id, representative, demographics, ces_sample } = data;
  const rep = representative ?? {};

  return (
    <>
      <style>{`
        .district-header {
          padding-top: 48px;
          margin-bottom: 24px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 32px;
          align-items: start;
        }
        @media (max-width: 640px) {
          .district-header {
            grid-template-columns: 1fr;
            gap: 24px;
            padding-top: 28px;
          }
          .district-header__gauge {
            justify-self: center;
          }
        }
      `}</style>
      <div className="district-header">
        {/* ── Left: back link + district info ─────────────────── */}
        <div>
          {stateCode && (
            <Link href={`/state/${stateCode}`} style={styles.backLink}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", flexShrink: 0 }} aria-hidden="true">
                <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to {stateCode}
            </Link>
          )}
          <p style={styles.districtLabel}>Congressional District</p>
          <h1 style={styles.districtId}>{district_id}</h1>
          <div style={styles.metaRow}>
            {rep.name && (
              <span style={styles.repName}>{rep.name}</span>
            )}
            {demographics?.cook_pvi && (
              <>
                <span style={styles.dot}> · </span>
                <span style={styles.meta}>{demographics.cook_pvi}</span>
              </>
            )}
            {ces_sample?.n_respondents && (
              <>
                <span style={styles.dot}> · </span>
                <span style={styles.meta}>n = {ces_sample.n_respondents.toLocaleString()} survey respondents</span>
              </>
            )}
          </div>
        </div>

        {/* ── Right: alignment gauge ──────────────────────────── */}
        <div className="district-header__gauge">
          <AlignmentGaugeCard score={alignmentScore} caption="District alignment score" />
        </div>
      </div>
    </>
  );
}

const styles = {
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontFamily: fonts.sans,
    fontSize: "0.82rem",
    fontWeight: 500,
    color: textColors.muted,
    textDecoration: "none",
    marginBottom: "16px",
  },
  districtLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: textColors.muted,
    marginBottom: "4px",
    fontFamily: fonts.sans,
  },
  districtId: {
    fontFamily: fonts.serif,
    fontSize: "clamp(2rem, 7vw, 3.2rem)",
    fontWeight: 700,
    lineHeight: 1.1,
    color: textColors.primary,
    marginBottom: "12px",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "4px",
  },
  repName: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: textColors.secondary,
    fontFamily: fonts.sans,
  },
  meta: {
    fontSize: "0.85rem",
    color: textColors.secondary,
    fontFamily: fonts.sans,
  },
  dot: {
    color: textColors.muted,
    fontFamily: fonts.sans,
    fontSize: "0.85rem",
  },
};
