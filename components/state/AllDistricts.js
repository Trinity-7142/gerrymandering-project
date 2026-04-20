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
  if (score < 0.3) return { bg: alignmentColors.low,      color: "#1A1A1A", label: `${pct}%` };
  if (score < 0.6) return { bg: alignmentColors.partial,  color: "#fff",    label: `${pct}%` };
  if (score < 0.8) return { bg: alignmentColors.moderate, color: "#fff",    label: `${pct}%` };
  return               { bg: alignmentColors.high,     color: "#fff",    label: `${pct}%` };
}

export default function AllDistricts({ data }) {
  if (!data?.districts?.length) {
    return (
      <p style={{ fontFamily: fonts.sans, color: textColors.muted, fontStyle: "italic" }}>
        District data is not yet available.
      </p>
    );
  }

  const hasDistrictPages = true;

  const sorted = [...data.districts].sort(
    (a, b) => districtSortKey(a.district_id) - districtSortKey(b.district_id)
  );

  return (
    <div>
      <p style={styles.sectionLabel}>All Districts</p>

      <div style={styles.tableWrapper}>
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
              const href    = hasDistrictPages ? `/district/${d.district_id}` : null;

              return (
                <tr
                  key={d.district_id}
                  style={{ background: i % 2 === 0 ? "#fff" : "#FAFAF9", cursor: href ? "pointer" : "default" }}
                >
                  <td style={{ ...styles.td, fontWeight: 600 }}>
                    {href ? (
                      <Link href={href} style={styles.link}>{d.district_id}</Link>
                    ) : (
                      <span style={{ color: textColors.primary }}>{d.district_id}</span>
                    )}
                  </td>
                  <td style={{ ...styles.td, color: textColors.primary }}>
                    {href ? (
                      <Link href={href} style={styles.rowLink}>{d.representative ?? "Vacant"}</Link>
                    ) : (
                      d.representative ?? "Vacant"
                    )}
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
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "10px",
    border: "1px solid #E8E6E3",
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
