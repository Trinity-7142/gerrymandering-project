// components/state/StateKeyFacts.js
// Server Component — renders editorial key facts for a state
// Content sourced from public/content/state/[stateCode]/key_facts.md
// Rendered via the shared Markdown component

import Markdown from "@/components/shared/Markdown";
import { cardStyle, textColors, fonts } from "@/lib/constants";

export default function StateKeyFacts({ content }) {
  if (!content) return null;

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Key Facts</h2>
      <Markdown>{content}</Markdown>
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
};
