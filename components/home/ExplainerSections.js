// components/home/ExplainerSections.js
// Two-column explainer sections from the landing page mockup.
// Left/right text comes from markdown files via props.
// Infographic slots load images from public/content/infographics/ when available.
//
// Expected images (policy team drops these in):
//   public/content/infographics/explainer-graphic.png
//   public/content/infographics/support-graphic.png
//
// Server Component — no client-side JS needed.

"use client";

import Markdown from "@/components/shared/Markdown";
import { colors } from "@/lib/constants";

// ── Placeholder box shown when infographic image isn't ready yet ────────
function InfographicPlaceholder({ filename, label }) {
  const imagePath = `/content/infographics/${filename}`;

  return (
    <div
      style={{
        position: "relative",
        minHeight: "280px",
        borderRadius: "24px",
        border: "2px dashed rgba(1, 24, 38, 0.15)",
        background: "linear-gradient(135deg, rgba(94,142,171,0.08), rgba(25,73,115,0.06))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "24px",
      }}
      aria-hidden="true"
    >
      {/* Decorative icon */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        style={{ opacity: 0.35 }}
      >
        <rect
          x="4"
          y="4"
          width="40"
          height="40"
          rx="8"
          stroke={colors.primaryBlue}
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <path
          d="M16 32L22 24L28 28L34 18"
          stroke={colors.primaryBlue}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="18" r="3" fill={colors.primaryBlue} opacity="0.4" />
      </svg>

      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "0.82rem",
          fontWeight: 600,
          color: "rgba(1, 24, 38, 0.45)",
          textAlign: "center",
          margin: 0,
        }}
      >
        {label}
      </p>
      <code
        style={{
          fontFamily: "monospace",
          fontSize: "0.72rem",
          color: "rgba(1, 24, 38, 0.35)",
          background: "rgba(1, 24, 38, 0.04)",
          padding: "4px 10px",
          borderRadius: "6px",
        }}
      >
        public{imagePath}
      </code>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────
export default function ExplainerSections({ explainerBody, supportBody }) {
  return (
    <>
      {/* ════════════════════════════════════════════════════════
          SECTION 1 — Explainer Grid
          Left: policy text  |  Right: infographic
          ════════════════════════════════════════════════════════ */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          gap: "30px",
          alignItems: "center",
          marginTop: "44px",
        }}
        className="explainer-grid"
      >
        <Markdown>{explainerBody}</Markdown>

        <InfographicPlaceholder
          filename="explainer-graphic.png"
          label="Infographic 1"
        />
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 2 — Feature Row
          Left: infographic  |  Right: policy text
          ════════════════════════════════════════════════════════ */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "0.9fr 1.15fr",
          gap: "26px",
          alignItems: "start",
          marginTop: "6px",
        }}
        className="feature-row"
      >
        <InfographicPlaceholder
          filename="support-graphic.png"
          label="Infographic 2"
        />

        <Markdown style={{ marginTop: "-2px" }}>{supportBody}</Markdown>
      </section>

      {/* ── Responsive: collapse to single column on small screens ── */}
      <style jsx global>{`
        @media (max-width: 900px) {
          .explainer-grid,
          .feature-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}