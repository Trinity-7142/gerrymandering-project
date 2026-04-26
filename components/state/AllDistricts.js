// components/state/AllDistricts.js
// Server Component — table of all congressional districts for a state
// Receives: data (overview.json), availableStates (string[]) for district page links

import Link from "next/link";
import { textColors, fonts, alignmentColors, partyColors } from "@/lib/constants";

function districtSortKey(districtId) {
  const suffix = districtId.split("-")[1];
  return suffix === "AL" ? 0 : parseInt(suffix, 10);
}

function alignmentBadge(score) {
  if (score == null) return { bg: "#F0EFED", color: textColors.faint, label: "—" };
  const pct = Math.round(score * 100);
  if (score < 0.25) return { bg: alignmentColors.veryLow,    color: "#1A1A1A", label: `${pct}%` };
  if (score < 0.40) return { bg: alignmentColors.low,        color: "#1A1A1A", label: `${pct}%` };
  if (score < 0.55) return { bg: alignmentColors.moderate,   color: "#fff",    label: `${pct}%` };
  if (score < 0.70) return { bg: alignmentColors.good,       color: "#fff",    label: `${pct}%` };
  if (score < 0.85) return { bg: alignmentColors.strong,     color: "#fff",    label: `${pct}%` };
  return                   { bg: alignmentColors.veryStrong, color: "#fff",    label: `${pct}%` };
}

export default function AllDistricts({ data }) {
  if (!data?.districts?.length) {
    return (
      <p style={{ fontFamily: fonts.sans, color: textColors.muted, fontStyle: "italic" }}>
        District data is not yet available.
      </p>
    );
  }

  const sorted = [...data.districts].sort(
    (a, b) => districtSortKey(a.district_id) - districtSortKey(b.district_id)
  );

  return (
    <div>
      <style>{`
        /* ── Mobile card list ── */
        .districts-table-wrap {
          overflow-x: auto;
          border-radius: 10px;
          border: 1px solid #E8E6E3;
        }
        .districts-cards {
          display: none;
        }

        @media (max-width: 640px) {
          .districts-table-wrap {
            display: none;
          }
          .districts-cards {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .district-card {
            background: #fff;
            border: 1px solid #E8E6E3;
            border-radius: 10px;
            padding: 14px 16px;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 6px 12px;
            align-items: center;
            text-decoration: none;
            color: inherit;
            transition: background 0.15s ease;
          }
          .district-card:active {
            background: #F7F6F4;
          }
          .district-card__id {
            font-family: ${fonts.sans};
            font-size: 0.85rem;
            font-weight: 700;
            color: #194973;
          }
          .district-card__rep {
            font-family: ${fonts.sans};
            font-size: 0.92rem;
            font-weight: 600;
            color: ${textColors.primary};
          }
          .district-card__meta {
            font-family: ${fonts.sans};
            font-size: 0.78rem;
            color: ${textColors.muted};
            grid-column: 1;
          }
          .district-card__badge-col {
            grid-row: 1 / 3;
            grid-column: 2;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
          }
        }
      `}</style>

      <p style={styles.sectionLabel}>All Districts</p>

      {/* ── Desktop / tablet: table ── */}
      <div className="districts-table-wrap">
        <table style={styles.table}>
          <thead>
            <tr>
              {["District", "Representative", "Party", "Alignment", "CES Sample"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, i) => {
              const badge   = alignmentBadge(d.alignment_score);
              const pColors = partyColors[d.party] ?? partyColors.I;
              const href    = `/district/${d.district_id}`;

              return (
                <tr
                  key={d.district_id}
                  style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF9", cursor: "pointer" }}
                >
                  <td style={{ ...styles.td, fontWeight: 600 }}>
                    <Link href={href} style={styles.link}>{d.district_id}</Link>
                  </td>
                  <td style={{ ...styles.td, color: textColors.primary }}>
                    <Link href={href} style={styles.rowLink}>{d.representative ?? "Vacant"}</Link>
                  </td>
                  <td style={styles.td}>
                    {d.party ? (
                      <span style={{ ...styles.partyBadge, color: pColors.text, background: pColors.bg }}>
                        {d.party}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.alignBadge, background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: textColors.secondary }}>
                    {d.ces_sample_size != null ? d.ces_sample_size.toLocaleString() : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: cards ── */}
      <div className="districts-cards">
        {sorted.map((d) => {
          const badge   = alignmentBadge(d.alignment_score);
          const pColors = partyColors[d.party] ?? partyColors.I;
          const href    = `/district/${d.district_id}`;

          return (
            <Link key={d.district_id} href={href} className="district-card">
              <div>
                <div className="district-card__id">{d.district_id}</div>
                <div className="district-card__rep">{d.representative ?? "Vacant"}</div>
              </div>
              <div className="district-card__meta">
                {d.ces_sample_size != null ? `n = ${d.ces_sample_size.toLocaleString()}` : ""}
              </div>
              <div className="district-card__badge-col">
                {d.party && (
                  <span style={{ ...styles.partyBadge, color: pColors.text, background: pColors.bg, fontSize: "0.7rem" }}>
                    {d.party}
                  </span>
                )}
                <span style={{ ...styles.alignBadge, background: badge.bg, color: badge.color }}>
                  {badge.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  sectionLabel: {
    fontFamily: fonts.sans,
    fontSize: "0.78rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: textColors.muted,
    marginBottom: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: fonts.sans,
    fontSize: "0.875rem",
  },
  th: {
    padding: "10px 16px",
    textAlign: "left",
    fontWeight: 600,
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: textColors.secondary,
    background: "#F7F6F4",
    borderBottom: "1px solid #E8E6E3",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 16px",
    borderBottom: "1px solid #F0EFED",
    verticalAlign: "middle",
  },
  partyBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  alignBadge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "0.78rem",
    fontWeight: 600,
    minWidth: "48px",
    textAlign: "center",
  },
  link: {
    color: "#194973",
    textDecoration: "none",
    fontWeight: 600,
  },
  rowLink: {
    color: textColors.primary,
    textDecoration: "none",
  },
};
