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

import fs from "fs";
import path from "path";
import Image from "next/image";
import Markdown from "@/components/shared/Markdown";
import { colors } from "@/lib/constants";

function resolveInfographic(filename) {
  // Try the exact filename first, then common alternate extensions
  const exts = ["", ".png", ".jpg", ".jpeg", ".webp", ".svg"];
  const base = filename.replace(/\.[^.]+$/, "");
  const dir = path.join(process.cwd(), "public", "content", "infographics");
  for (const ext of exts) {
    const name = ext ? `${base}${ext}` : filename;
    if (fs.existsSync(path.join(dir, name))) return `/content/infographics/${name}`;
  }
  return null;
}

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

// ── Wired infographic: real image if found, placeholder otherwise ────────
function Infographic({ filename, label, alt }) {
  const src = resolveInfographic(filename);
  if (src) {
    return (
      <div style={{ position: "relative", width: "100%", borderRadius: "16px", overflow: "hidden" }}>
        <Image
          src={src}
          alt={alt || label}
          width={960}
          height={540}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>
    );
  }
  return <InfographicPlaceholder filename={filename} label={label} />;
}

// ── Main component ──────────────────────────────────────────────────────
export default function ExplainerSections({ explainerBody, supportBody }) {
  return (
    <>
      {/* ════════════════════════════════════════════════════════
          SECTION 1 — Explainer text
          ════════════════════════════════════════════════════════ */}
      <section style={{ marginTop: "44px" }}>
        <Markdown>{explainerBody}</Markdown>
      </section>

      {/* ════════════════════════════════════════════════════════
          INFOGRAPHIC 1 — Between explainer and support
          ════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: "36px" }}>
        <Infographic filename="explainer-graphic.png" label="Infographic 1" />
      </div>

      {/* ════════════════════════════════════════════════════════
          SECTION 2 — Support text
          ════════════════════════════════════════════════════════ */}
      <section style={{ marginTop: "36px" }}>
        <Markdown>{supportBody}</Markdown>
      </section>

      {/* ════════════════════════════════════════════════════════
          INFOGRAPHIC 2 — Below support
          ════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: "36px" }}>
        <Infographic filename="support-graphic.png" label="Infographic 2" />
      </div>
    </>
  );
}