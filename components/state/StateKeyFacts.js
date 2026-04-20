// components/state/StateKeyFacts.js
// Server Component — renders editorial key facts for a state
// Content sourced from public/content/state/[stateCode]/key_facts.md
// Rendered via the shared Markdown component

import Markdown from "@/components/shared/Markdown";
import { cardStyle, textColors, fonts } from "@/lib/constants";

export default function StateKeyFacts({ content, stateName, sources }) {
  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Key Facts</h2>
      {content
        ? <Markdown>{content}</Markdown>
        : <p style={styles.placeholder}>Key facts about {stateName} are coming soon.</p>
      }
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
  );
}

const styles = {
  card: {
    ...cardStyle,
    padding: "28px 32px",
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: "1.3rem",
    fontWeight: 700,
    color: textColors.primary,
    marginBottom: "16px",
  },
  placeholder: {
    fontFamily: fonts.sans,
    fontSize: "0.9rem",
    color: textColors.secondary,
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
