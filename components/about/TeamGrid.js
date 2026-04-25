// components/about/TeamGrid.js
// Renders team members in a responsive CSS grid.
// Data comes from the `team:` YAML frontmatter array in about.md.
//
// Each member supports:
//   link  — single URL, links the name (legacy, still supported)
//   links — array of { label, url }; first entry links the name,
//           additional entries render as labeled links below the bio

import { fonts, textColors, cardStyle } from "@/lib/constants";

function TeamCard({ name, role, bio, link, links }) {
  // Normalize to a unified links array
  const allLinks = links?.length
    ? links
    : link
    ? [{ label: name, url: link }]
    : [];

  const primaryUrl = allLinks[0]?.url ?? null;
  const extraLinks = allLinks.slice(1);

  return (
    <div style={styles.card}>
      <div style={styles.nameRow}>
        {primaryUrl ? (
          <a href={primaryUrl} target="_blank" rel="noopener noreferrer" style={styles.nameLink}>
            {name}
          </a>
        ) : (
          <span style={styles.name}>{name}</span>
        )}
      </div>
      <p style={styles.role}>{role}</p>
      {bio && <p style={styles.bio}>{bio}</p>}
      {extraLinks.length > 0 && (
        <div style={styles.extraLinks}>
          {extraLinks.map((l, i) => (
            <a key={l.url ?? i} href={l.url} target="_blank" rel="noopener noreferrer" style={styles.extraLink}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeamGrid({ members }) {
  if (!members?.length) return null;

  return (
    <div style={styles.section}>
      <style>{`@media (max-width: 560px) { .team-grid { grid-template-columns: 1fr !important; } }`}</style>
      <h2 style={styles.heading}>The Team</h2>
      <div className="team-grid" style={styles.grid}>
        {members.map((m) => (
          <TeamCard key={m.name} {...m} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  section: {
    marginTop: "40px",
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: "1.6rem",
    fontWeight: 700,
    color: textColors.primary,
    marginBottom: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  },
  card: {
    ...cardStyle,
    padding: "20px 22px",
  },
  nameRow: {
    marginBottom: "4px",
  },
  name: {
    fontFamily: fonts.sans,
    fontSize: "0.95rem",
    fontWeight: 700,
    color: textColors.primary,
  },
  nameLink: {
    fontFamily: fonts.sans,
    fontSize: "0.95rem",
    fontWeight: 700,
    color: textColors.primary,
    textDecoration: "underline",
    textDecorationColor: "rgba(26,26,26,0.3)",
    textUnderlineOffset: "3px",
  },
  role: {
    fontFamily: fonts.sans,
    fontSize: "0.78rem",
    fontWeight: 600,
    color: textColors.muted,
    margin: "0 0 10px 0",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  bio: {
    fontFamily: fonts.sans,
    fontSize: "0.85rem",
    lineHeight: 1.55,
    color: textColors.secondary,
    margin: "0 0 10px 0",
  },
  extraLinks: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  extraLink: {
    fontFamily: fonts.sans,
    fontSize: "0.78rem",
    color: textColors.muted,
    textDecoration: "underline",
    textDecorationColor: textColors.muted,
    textUnderlineOffset: "2px",
  },
};
