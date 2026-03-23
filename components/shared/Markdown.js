// components/shared/Markdown.js
// Renders markdown content with project-specific styling.
// Policy team writes plain .md files → this component handles the visual treatment.
//
// Markdown conventions for the policy team:
//   **bold text**  → renders in blue (#194973), extra bold
//   *italic text*  → renders in red (#BF4545), used for lead-in accent sentences
//   [link](url)    → renders as a blue underlined link
//   Paragraphs     → Georgia serif, proper spacing, ink color
//
// Usage:
//   import Markdown from "@/components/shared/Markdown";
//   <Markdown>{body}</Markdown>
//   <Markdown style={{ textAlign: "left" }}>{body}</Markdown>

import ReactMarkdown from "react-markdown";
import { colors } from "@/lib/constants";

// ── Custom renderers mapping markdown → styled React elements ───────────
const components = {
  // Paragraphs: Georgia serif body text with vertical spacing
  p: ({ children }) => (
    <p
      style={{
        fontFamily: "Georgia, serif",
        fontSize: "0.98rem",
        lineHeight: 1.65,
        color: "rgba(1, 24, 38, 0.92)",
        margin: "0 0 14px 0",
      }}
    >
      {children}
    </p>
  ),

  // Bold (**text**): blue emphasis, matching the mockup's "where/how/why" style
  strong: ({ children }) => (
    <strong
      style={{
        fontWeight: 800,
        color: colors.primaryBlue,
      }}
    >
      {children}
    </strong>
  ),

  // Italic (*text*): red accent, used for lead-in sentences
  em: ({ children }) => (
    <em
      style={{
        color: colors.primarySoftRed,
        fontWeight: 700,
        fontStyle: "italic",
      }}
    >
      {children}
    </em>
  ),

  // Links ([text](url)): blue with subtle underline
  a: ({ href, children }) => (
    <a
      href={href}
      style={{
        color: colors.primaryBlue,
        textDecoration: "underline",
        textDecorationColor: "rgba(25, 73, 115, 0.3)",
        textUnderlineOffset: "3px",
        transition: "text-decoration-color 0.2s",
      }}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

// ── Main component ──────────────────────────────────────────────────────
export default function Markdown({ children, className, style }) {
  return (
    <div className={className} style={style}>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}