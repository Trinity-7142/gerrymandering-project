// app/about/page.js

import Markdown from "@/components/shared/Markdown";
import { loadContent } from "@/lib/loadData";
import { fonts, textColors } from "@/lib/constants";

export const metadata = { title: "About — Gerrymandering Project" };

export default function AboutPage() {
  const content = loadContent("about", "about.md");

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>About</h1>
      {content && (
        <div style={styles.body}>
          <Markdown>{content}</Markdown>
        </div>
      )}
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
    maxWidth: "720px",
    width: "100%",
  },
};
