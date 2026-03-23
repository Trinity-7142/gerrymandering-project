// lib/constants.js
// Shared constants used across frontend components

// TODO: Alignment score thresholds and labels
// { "0.0_to_0.3": "Low Alignment", "0.3_to_0.6": "Partial Alignment",
//   "0.6_to_0.8": "Moderate Alignment", "0.8_to_1.0": "High Alignment" }

// Alignment Colors
export const alignmentColors = {
    low: "#C8D6E0",  // 0.0–0.3
    partial: "#5E8EAB",  // 0.3–0.6
    moderate: "#194973",  // 0.6–0.8
    high: "#011826",  // 0.8–1.0
};

export const alignmentLegend = [
  { key: "low", label: "Low (0%–30%)", color: alignmentColors.low },
  { key: "partial", label: "Partial (30%–60%)", color: alignmentColors.partial },
  { key: "moderate", label: "Moderate (60%–80%)", color: alignmentColors.moderate },
  { key: "high", label: "High (80%–100%)", color: alignmentColors.hight },
];
// TODO: Party colors { D: "#2563eb", R: "#dc2626" }

// TODO: Grade colors for Princeton panel { }
export const princetonColors = {
    A: "#011826",
    B: "#194973",
    C: "#5E8EAB",
    D: "#9BBDD0",
    F: "#C8D6E0",
}

// TODO: Issue display name map (issue_id → human readable)
// This should eventually be derived from issues.json, but having a static fallback is useful

// Colors
export const colors = {
    primarySoftRed: "#BF4545",
    primaryHarshRed: "#D92534",
    primaryWhite: "#fafafa",
    accentGold: "#f2ae2e",
    body: "#011826",
    primaryBlue: "#194973",
    bg: "#F4F3F1",
    ink: "#011826",
}

// Fonts
export const fonts = {
  sans: "var(--font-sans)",   // DM Sans — nav, UI, body
  serif: "var(--font-serif)", // Source Serif 4 — headings
};

