// app/about/page.js

import Markdown from "@/components/shared/Markdown";
import TeamGrid from "@/components/about/TeamGrid";
import { loadContentWithMeta } from "@/lib/loadData";
import { fonts, textColors, pageWidths } from "@/lib/constants";

export const metadata = { title: "About — Gerrymandering Project" };

export default function AboutPage() {
  const { body, meta } = loadContentWithMeta("about", "about.md");

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>About</h1>
      <div style={styles.body}>
        {body && <Markdown>{body}</Markdown>}
        <TeamGrid members={meta.team} />
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 24px",
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: "3rem",
    fontWeight: 700,
    color: textColors.primary,
    textAlign: "center",
    marginBottom: "32px",
  },
  body: {
    maxWidth: pageWidths.about,
    width: "100%",
  },
};
