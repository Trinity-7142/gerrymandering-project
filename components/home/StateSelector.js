// components/home/StateSelector.js
// Server Component — renders the state selection UI on the home page
// Displays clickable cards for all states
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { alignmentColors, colors, alignmentLegend } from "@/lib/constants";

// ── FIPS → state code + name lookup ─────────────────────────────────────
const FIPS_TO_STATE = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT",
  "10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL",
  "18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD",
  "25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE",
  "32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND",
  "39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD",
  "47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV",
  "55":"WI","56":"WY",
};
 
const STATE_NAMES = {
  "01":"Alabama","02":"Alaska","04":"Arizona","05":"Arkansas","06":"California",
  "08":"Colorado","09":"Connecticut","10":"Delaware","11":"District of Columbia",
  "12":"Florida","13":"Georgia","15":"Hawaii","16":"Idaho","17":"Illinois",
  "18":"Indiana","19":"Iowa","20":"Kansas","21":"Kentucky","22":"Louisiana",
  "23":"Maine","24":"Maryland","25":"Massachusetts","26":"Michigan",
  "27":"Minnesota","28":"Mississippi","29":"Missouri","30":"Montana",
  "31":"Nebraska","32":"Nevada","33":"New Hampshire","34":"New Jersey",
  "35":"New Mexico","36":"New York","37":"North Carolina","38":"North Dakota",
  "39":"Ohio","40":"Oklahoma","41":"Oregon","42":"Pennsylvania",
  "44":"Rhode Island","45":"South Carolina","46":"South Dakota",
  "47":"Tennessee","48":"Texas","49":"Utah","50":"Vermont","51":"Virginia",
  "53":"Washington","54":"West Virginia","55":"Wisconsin","56":"Wyoming",
};
// level widths could change
function alignmentLevel(score) {
  if (score < 0.25) return "Very Low";
  if (score < 0.40) return "Low";
  if (score < 0.55) return "Moderate";
  if (score < 0.70) return "Good";
  if (score < 0.85) return "Strong";
  return "Very Strong";
}

function getFill(score) {
  if (score == null) return "#D9D7D4";
  if (score < 0.25) return alignmentColors.veryLow;
  if (score < 0.40) return alignmentColors.low;
  if (score < 0.55) return alignmentColors.moderate;
  if (score < 0.70) return alignmentColors.good;
  if (score < 0.85) return alignmentColors.strong;
  return alignmentColors.veryStrong;
}

export default function StateSelector({ alignmentScores = {} }) {
  const svgRef = useRef(null);
  const feedbackRef = useRef(null);
  const scoresRef = useRef(alignmentScores);
  const router = useRouter();
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(false);

  // getScore returns a 0–1 float or null for a D3 feature id (FIPS integer)
  function getScore(fipsId) {
    const fips = String(fipsId).padStart(2, "0");
    const code = FIPS_TO_STATE[fips];
    return code != null ? (scoresRef.current[code] ?? null) : null;
  }

  useEffect(() => {
    let cancelled = false;
 
    async function renderMap() {
      // Dynamic imports — keeps D3 + topoJSON out of the initial bundle
      const d3 = await import("d3");
      const topojson = await import("topojson-client");
 
      if (cancelled) return;
 
      try {
        const us = await d3.json(
          "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"
        );
 
        if (cancelled) return;
 
        const svg = d3.select(svgRef.current);
        const states   = topojson.feature(us, us.objects.states);
        const nation   = topojson.feature(us, us.objects.nation);
        const borders  = topojson.mesh(us, us.objects.states, (a, b) => a !== b);
 
        const projection = d3.geoAlbersUsa().fitSize([960, 600], states);
        const path = d3.geoPath(projection);
 
        // Clear any previous render (React strict-mode double-mounts)
        svg.selectAll("*").remove();
 
        // Nation outline (subtle silhouette behind states)
        svg
          .append("path")
          .datum(nation)
          .attr("class", "nation-outline")
          .attr("d", path);
 
        // Individual state paths
        svg
          .append("g")
          .attr("aria-label", "States")
          .selectAll("path")
          .data(states.features)
          .join("path")
          .attr("class", "state-shape")
          .attr("d", path)
          .attr("tabindex", 0)
          .attr("fill", (d) => getFill(getScore(d.id)))
          .attr("data-state-name", (d) =>
            STATE_NAMES[String(d.id).padStart(2, "0")] || `State ${d.id}`
          )
          .attr("aria-label", (d) => {
            const name  = STATE_NAMES[String(d.id).padStart(2, "0")] || `State ${d.id}`;
            const score = getScore(d.id);
            return score != null
              ? `${name}, alignment score ${Math.round(score * 100)}%`
              : `${name}, alignment score not yet available`;
          })
          // ── Hover / focus → update feedback text ──
          .on("mouseenter", function (event, d) {
            const fips  = String(d.id).padStart(2, "0");
            const name  = STATE_NAMES[fips] || `State ${d.id}`;
            const score = getScore(d.id);
            if (feedbackRef.current) {
              feedbackRef.current.innerHTML = score != null
                ? `<strong>${name}</strong> · ${Math.round(score * 100)}% · ${alignmentLevel(score)} alignment`
                : `<strong>${name}</strong> · Alignment score not yet available`;
            }
          })
          .on("focus", function (event, d) {
            const fips  = String(d.id).padStart(2, "0");
            const name  = STATE_NAMES[fips] || `State ${d.id}`;
            const score = getScore(d.id);
            if (feedbackRef.current) {
              feedbackRef.current.innerHTML = score != null
                ? `<strong>${name}</strong> · ${Math.round(score * 100)}% · ${alignmentLevel(score)} alignment`
                : `<strong>${name}</strong> · Alignment score not yet available`;
            }
          })
          .on("mouseleave", function () {
            if (feedbackRef.current) {
              feedbackRef.current.innerHTML =
                `<strong>Hover</strong> a state to preview. <strong>Click</strong> to explore.`;
            }
          })
          .on("blur", function () {
            if (feedbackRef.current) {
              feedbackRef.current.innerHTML =
                `<strong>Hover</strong> a state to preview. <strong>Click</strong> to explore.`;
            }
          })
          // ── Click → route to state page ──
          .on("click", function (event, d) {
            const fips = String(d.id).padStart(2, "0");
            const code = FIPS_TO_STATE[fips];
            if (code && code !== "DC") {
              router.push(`/state/${code}`);
            }
          })
          .on("keydown", function (event, d) {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              const fips = String(d.id).padStart(2, "0");
              const code = FIPS_TO_STATE[fips];
              if (code && code !== "DC") {
                router.push(`/state/${code}`);
              }
            }
          });
 
        // Internal state borders (drawn last for crispness)
        svg
          .append("path")
          .datum(borders)
          .attr("class", "state-borders")
          .attr("d", path);
 
        setMapReady(true);
      } catch (err) {
        console.error("Failed to render US map:", err);
        if (!cancelled) setError(true);
      }
    }
 
    renderMap();
    return () => { cancelled = true; };
  }, [router]);
 
  // ── Inline styles matching the mockup exactly ─────────────────────────
  return (
    <section
      className="map-wrap"
      aria-label="United States alignment map"
      style={{ padding: "8px 6px 0", marginTop: "44px" }}
    >
      <div
        className="map-card"
        style={{
          position: "relative",
          borderRadius: "44px",
          overflow: "hidden",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0.12))",
          border: "1px solid rgba(1, 24, 38, 0.06)",
          padding: "20px 20px 14px",
        }}
      >
        {/* ── Header row: title + legend ── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "14px 18px",
            marginBottom: "14px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-sans)",
                fontSize: "0.96rem",
                fontWeight: 700,
                color: "rgba(1, 24, 38, 0.85)",
              }}
            >
              State Alignment Overview
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontFamily: "var(--font-sans)",
                fontSize: "0.9rem",
                color: "rgba(1, 24, 38, 0.62)",
              }}
            >
              Click a state to view representational alignment details
            </p>
          </div>
 
          {/* Legend */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px 14px",
              alignItems: "center",
            }}
            aria-label="Map legend"
          >
            {alignmentLegend.map((l) => (
              <span
                key={l.key}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.84rem",
                  fontFamily: "var(--font-sans)",
                  color: "rgba(1, 24, 38, 0.78)",
                }}
              >
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "999px",
                    background: l.color,
                    border: "1px solid rgba(1, 24, 38, 0.12)",
                    flexShrink: 0,
                  }}
                />
                {l.label}
              </span>
            ))}
          </div>
        </div>
 
        {/* ── Map SVG container ── */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "860px",
            margin: "0 auto",
          }}
        >
          {/* Loading state */}
          {!mapReady && !error && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-sans)",
                fontSize: "0.9rem",
                color: "rgba(1, 24, 38, 0.5)",
              }}
            >
              Loading map…
            </div>
          )}
 
          <svg
            ref={svgRef}
            viewBox="0 0 960 600"
            role="img"
            aria-label="Interactive United States map with color-coded alignment scores"
            style={{
              width: "100%",
              height: "auto",
              overflow: "visible",
              opacity: mapReady ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}
          />
        </div>
 
        {/* ── Feedback text ── */}
        <p
          ref={feedbackRef}
          style={{
            margin: "16px 0 2px",
            textAlign: "center",
            fontFamily: "var(--font-sans)",
            fontSize: "0.94rem",
            color: "rgba(1, 24, 38, 0.72)",
          }}
        >
          {error ? (
            <strong style={{ color: colors.primarySoftRed }}>
              Map failed to load. Please check your connection and refresh.
            </strong>
          ) : (
            <>
              <strong style={{ color: colors.ink }}>Hover</strong> a state to
              preview. <strong style={{ color: colors.ink }}>Click</strong> to
              explore.
            </>
          )}
        </p>
      </div>
 
      {/* ── Scoped CSS for D3-generated elements ── */}
      <style jsx global>{`
        /* State shapes */
        .state-shape {
          cursor: pointer;
          stroke: rgba(255, 255, 255, 0.88);
          stroke-width: 1.2;
          vector-effect: non-scaling-stroke;
          transform-box: fill-box;
          transform-origin: center;
          transition:
            transform 0.18s ease,
            filter   0.18s ease,
            stroke   0.18s ease,
            stroke-width 0.18s ease;
        }
        .state-shape:hover,
        .state-shape:focus-visible {
          transform: translateY(-6px) scale(1.02);
          filter: drop-shadow(0 14px 18px rgba(1, 24, 38, 0.35));
          stroke: rgba(255, 255, 255, 0.98);
          stroke-width: 1.8;
          outline: none;
        }
 
        /* Internal borders */
        .state-borders {
          fill: none;
          stroke: rgba(255, 255, 255, 0.58);
          stroke-width: 1;
          vector-effect: non-scaling-stroke;
          pointer-events: none;
        }
 
        /* Nation outline */
        .nation-outline {
          fill: none;
          stroke: rgba(1, 24, 38, 0.14);
          stroke-width: 1.25;
          vector-effect: non-scaling-stroke;
          pointer-events: none;
        }
      `}</style>
    </section>
  );
  
}
