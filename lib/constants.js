// lib/constants.js
// Shared constants used across frontend components

// TODO: Alignment score thresholds and labels
// { "0.0_to_0.3": "Low Alignment", "0.3_to_0.6": "Partial Alignment",
//   "0.6_to_0.8": "Moderate Alignment", "0.8_to_1.0": "High Alignment" }

// ------------------------------------- Alignment Colors -------------------------------------
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
  { key: "high", label: "High (80%–100%)", color: alignmentColors.high },
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

// ------------------------------------- Fonts -------------------------------------
export const fonts = {
  sans: "var(--font-sans)",   // DM Sans — nav, UI, body
  serif: "var(--font-serif)", // Source Serif 4 — headings
};

