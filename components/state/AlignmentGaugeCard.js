// components/state/AlignmentGaugeCard.js
// Server Component — animated SVG semicircular gauge showing statewide alignment score
// Accepts: score (0–100 integer)

import { cardStyle, textColors, fonts } from "@/lib/constants";

export default function AlignmentGaugeCard({ score }) {
  if (score == null) return null;

  return (
    <div style={styles.card}>
      <style>{`
        @keyframes needleSweep {
          from { transform: rotate(-90deg); }
          to   { transform: rotate(calc(var(--gauge-score) * 1.8deg - 90deg)); }
        }
        .gauge-needle-animated {
          transform-origin: 90px 90px;
          animation: needleSweep 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both;
        }
      `}</style>

      <p style={styles.label}>Alignment Score</p>

      {/* ── Gauge SVG ──────────────────────────────────────── */}
      <div
        style={{ "--gauge-score": score, width: 180, height: 105, margin: "0 auto 8px", position: "relative" }}
      >
        <svg viewBox="0 0 180 110" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", overflow: "visible" }}>
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#C93545" />
              <stop offset="50%"  stopColor="#D4952A" />
              <stop offset="100%" stopColor="#2D8F5E" />
            </linearGradient>
          </defs>

          {/* Track */}
          <path d="M 15 90 A 75 75 0 0 1 165 90" fill="none" stroke="#EDEBE8" strokeWidth="4" strokeLinecap="round" />
          {/* Colored arc */}
          <path d="M 15 90 A 75 75 0 0 1 165 90" fill="none" stroke="url(#gaugeGrad)" strokeWidth="4" strokeLinecap="round" />

          {/* Tick marks */}
          <g stroke="#D5D3D0" strokeWidth="0.8">
            <line x1="15"    y1="90"   x2="21"    y2="90" />
            <line x1="21.5"  y1="58.5" x2="27"    y2="61" />
            <line x1="42"    y1="32"   x2="46"    y2="36" />
            <line x1="90"    y1="15"   x2="90"    y2="21" />
            <line x1="138"   y1="32"   x2="134"   y2="36" />
            <line x1="158.5" y1="58.5" x2="153"   y2="61" />
            <line x1="165"   y1="90"   x2="159"   y2="90" />
          </g>

          {/* Needle */}
          <g className="gauge-needle-animated">
            <line x1="90" y1="90" x2="90" y2="24" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Pivot dot */}
          <circle cx="90" cy="90" r="4.5" fill="#1A1A1A" />
          <circle cx="90" cy="90" r="2"   fill="#fff" />

          {/* Labels */}
          <text x="8"   y="104" fontSize="8" fill="#AAA" textAnchor="middle" fontFamily="DM Sans, sans-serif">0</text>
          <text x="90"  y="9"   fontSize="7" fill="#CCC" textAnchor="middle" fontFamily="DM Sans, sans-serif">50</text>
          <text x="172" y="104" fontSize="8" fill="#AAA" textAnchor="middle" fontFamily="DM Sans, sans-serif">100</text>
        </svg>
      </div>

      {/* ── Score display ─────────────────────────────────── */}
      <div>
        <span style={styles.score}>{score}</span>
        <span style={styles.outOf}> / 100</span>
      </div>
      <p style={styles.caption}>Statewide average alignment</p>
    </div>
  );
}

const styles = {
  card: {
    ...cardStyle,
    padding: "28px 36px",
    textAlign: "center",
    minWidth: "280px",
  },
  label: {
    fontSize: "0.78rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: textColors.muted,
    marginBottom: "16px",
    fontFamily: fonts.sans,
  },
  score: {
    fontFamily: fonts.serif,
    fontSize: "2rem",
    fontWeight: 700,
    color: textColors.primary,
  },
  outOf: {
    fontSize: "0.85rem",
    color: textColors.muted,
    fontFamily: fonts.sans,
  },
  caption: {
    fontSize: "0.78rem",
    color: textColors.secondary,
    marginTop: "4px",
    fontFamily: fonts.sans,
  },
};
