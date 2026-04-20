// lib/constants.js
// Shared constants used across frontend components

// TODO: Alignment score thresholds and labels
// { "0.0_to_0.3": "Low Alignment", "0.3_to_0.6": "Partial Alignment",
//   "0.6_to_0.8": "Moderate Alignment", "0.8_to_1.0": "High Alignment" }

// ------------------------------------- Alignment Colors -------------------------------------
export const alignmentColors = {
    veryLow:     "#C8D6E0",  // 0.0–0.25
    low:         "#9BBDD0",  // 0.25–0.40
    moderate:    "#5E8EAB",  // 0.40–0.55
    good:        "#3B6B8F",  // 0.55–0.70
    strong:      "#194973",  // 0.70–0.85
    veryStrong:  "#011826",  // 0.85–1.0
};

export const alignmentLegend = [
  { key: "veryLow",    label: "Very Low (0%–25%)",      color: alignmentColors.veryLow },
  { key: "low",        label: "Low (25%–40%)",           color: alignmentColors.low },
  { key: "moderate",   label: "Moderate (40%–55%)",      color: alignmentColors.moderate },
  { key: "good",       label: "Good (55%–70%)",          color: alignmentColors.good },
  { key: "strong",     label: "Strong (70%–85%)",        color: alignmentColors.strong },
  { key: "veryStrong", label: "Very Strong (85%–100%)",  color: alignmentColors.veryStrong },
];
// ------------------------------------- Party Colors -------------------------------------
export const partyColors = {
  D: { text: "#2563EB", bg: "rgba(37,99,235,0.1)" },
  R: { text: "#DC2626", bg: "rgba(220,38,38,0.1)" },
  I: { text: "#6B7280", bg: "rgba(107,114,128,0.1)" },
};


// ------------------------------------- Princeton panel -------------------------------------
export const princetonColors = {
    A: "#011826",
    B: "#194973",
    C: "#5E8EAB",
    D: "#9BBDD0",
    F: "#C8D6E0",
}

export const princetonMetricLabels = {
  partisan_fairness: "Partisan Fairness",
  geographic_features: "Geographic Features",
  competitiveness: "Competitiveness",
};

export const princetonMetricIcons = {
  partisan_fairness: "⚖️",
  geographic_features: "🗺️",
  competitiveness: "🏁",
};

// ------------------------------------- Issue Labels -------------------------------------
export const issueLabels = {
  economy: "Economy",
  healthcare: "Healthcare",
  immigration: "Immigration",
  environment: "Environment",
  abortion: "Abortion",
  guns: "Gun Policy",
  criminal_justice: "Criminal Justice",
  foreign_policy: "Foreign Policy",
  election_integrity: "Election Integrity",
};

// ------------------------------------- Issue Icons -------------------------------------
export const issueIcons = {
  economy: "💼",
  healthcare: "🏥",
  immigration: "🌎",
  environment: "🌿",
  abortion: "⚖️",
  guns: "🔫",
  criminal_justice: "⚖️",
  foreign_policy: "🌐",
  election_integrity: "🗳️",
};

// ------------------------------------- FIPS Code -> State Code Lookup -------------------------------------
export const fipsToState = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY", "72": "PR",
};

// ------------------------------------- State Code -> State Name Lookup -------------------------------------
export const stateNames = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
  CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

// ------------------------------------- Colors -------------------------------------
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

// ------------------------------------- Text Colors -------------------------------------
export const textColors = {
  primary:   "#1A1A1A",
  secondary: "#555555",
  muted:     "#888888",
  faint:     "#AAAAAA",
}

// ------------------------------------- Shared Card Styles -------------------------------------
export const cardStyle = {
  background:   "#FFFFFF",
  borderRadius: "16px",
  border:       "1px solid #E8E6E3",
  boxShadow:    "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
}

// ------------------------------------- Page Widths -------------------------------------
export const pageWidths = {
  home:        "1152px",
  state:       "1152px",
  district:    "1152px",
  methodology: "1152px",
};

// ------------------------------------- Fonts -------------------------------------
export const fonts = {
  sans: "var(--font-sans)",   // DM Sans — nav, UI, body
  serif: "var(--font-serif)", // Source Serif 4 — headings
  mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
};

// ------------------------------------- Markdown Typography -------------------------------------
export const markdownTypography = {
  h1: { fontSize: "2rem",   fontWeight: 700, lineHeight: 1.25, marginBottom: "20px", marginTop: "40px" },
  h2: { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.3,  marginBottom: "14px", marginTop: "36px" },
  h3: { fontSize: "1.15rem",fontWeight: 700, lineHeight: 1.35, marginBottom: "10px", marginTop: "28px" },
  inlineCode: {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
    fontSize: "0.83em",
    color: "#194973",
    background: "rgba(25, 73, 115, 0.08)",
    border: "1px solid rgba(25, 73, 115, 0.18)",
    borderRadius: "5px",
    padding: "1px 5px",
  },
};

