// components/shared/Markdown.js
// Renders markdown content with project-specific styling.
// Policy team writes plain .md files → this component handles the visual treatment.
//
// Markdown conventions for the policy team:
//   **bold text**    → blue (#194973), extra bold
//   *italic text*    → red (#BF4545), accent sentences
//   `code text`      → blue monospace with subtle background chip
//   [link](url)      → blue underlined link
//   # / ## / ###     → serif headings, h1 > h2 > h3 in size
//   $$ ... $$        → block LaTeX equation (KaTeX rendered)
//   $ ... $          → inline LaTeX (KaTeX rendered)
//   Paragraphs       → Georgia serif, proper spacing, ink color

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { colors, fonts, markdownTypography, textColors } from "@/lib/constants";
import { slugify } from "@/lib/slugify";

// ── Custom renderers mapping markdown → styled React elements ───────────
const components = {
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

  h1: ({ children }) => {
    const text = typeof children === "string" ? children : String(children ?? "");
    return (
      <h1 id={slugify(text)} style={{ fontFamily: fonts.serif, color: textColors.primary, ...markdownTypography.h1 }}>
        {children}
      </h1>
    );
  },

  h2: ({ children }) => {
    const text = typeof children === "string" ? children : String(children ?? "");
    return (
      <h2 id={slugify(text)} style={{ fontFamily: fonts.serif, color: textColors.primary, ...markdownTypography.h2 }}>
        {children}
      </h2>
    );
  },

  h3: ({ children }) => {
    const text = typeof children === "string" ? children : String(children ?? "");
    return (
      <h3 id={slugify(text)} style={{ fontFamily: fonts.serif, color: textColors.primary, ...markdownTypography.h3 }}>
        {children}
      </h3>
    );
  },

  strong: ({ children }) => (
    <strong style={{ fontWeight: 800, color: colors.primaryBlue }}>
      {children}
    </strong>
  ),

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

  // Inline code (`code`): blue monospace chip
  code: ({ inline, children }) => {
    if (inline === false) {
      // fenced code block — plain preformatted
      return (
        <pre
          style={{
            fontFamily: fonts.mono,
            fontSize: "0.875rem",
            background: "rgba(25, 73, 115, 0.06)",
            border: "1px solid rgba(25, 73, 115, 0.14)",
            borderRadius: "8px",
            padding: "12px 16px",
            overflowX: "auto",
            margin: "0 0 16px 0",
          }}
        >
          <code style={{ color: colors.primaryBlue }}>{children}</code>
        </pre>
      );
    }
    return (
      <code style={markdownTypography.inlineCode}>{children}</code>
    );
  },

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

  hr: () => (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid #E8E6E3",
        margin: "32px 0",
      }}
    />
  ),
};

// ── Main component ──────────────────────────────────────────────────────
export default function Markdown({ children, className, style }) {
  return (
    <div className={className} style={style}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
