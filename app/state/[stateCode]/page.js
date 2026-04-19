// app/state/[stateCode]/page.js
// State page orchestrator — Server Component
// Reads ALL state-level JSON files at build time, passes each to its panel component
//
// JSON files consumed:
//   - public/data/states/{stateCode}/overview.json      → StateHeader
//   - public/data/states/{stateCode}/princeton.json     → PrincetonPanel
//   - public/data/states/{stateCode}/votecast_salience.json → VoteCastPanel
//   - public/data/states/{stateCode}/senators.json      → SenatorPanel
//   + ZipLookup (Client Component, fetches zip_to_district.json itself at runtime)
//
// NOTE: Need to ensure that the zip to district json follows/uses Janet's zipToCD.py

import StateHeader    from "@/components/state/StateHeader";
import PrincetonPanel  from "@/components/state/PrincetonPanel";
import VoteCastPanel   from "@/components/state/VoteCastPanel";
import SenatorPanel    from "@/components/state/SenatorPanel";
import StateKeyFacts   from "@/components/state/StateKeyFacts";
import StateTabs       from "@/components/state/StateTabs";
import ZipLookup       from "@/components/state/ZipLookup";
import CESStatePanel   from "@/components/state/CESStatePanel";
import { loadStateData, loadStateContent } from "@/lib/loadData";
import { cardStyle, textColors, fonts, pageWidths } from "@/lib/constants";

// States that have district pages live
const AVAILABLE_STATES = ["CA", "TX"];

export async function generateStaticParams() {
  return [];
}

export default async function StatePage({ params }) {
  const { stateCode } = await params;

  const overview   = loadStateData(stateCode, "overview.json");
  const princeton  = loadStateData(stateCode, "princeton.json");
  const votecast   = loadStateData(stateCode, "votecast_salience.json");
  const senators   = loadStateData(stateCode, "senators.json");
  const ces        = loadStateData(stateCode, "ces_summary.json");
  const keyFacts   = loadStateContent(stateCode, "key_facts.md");

  // Compute statewide average alignment (0–100) from district scores
  const avgAlignment = overview?.districts?.length
    ? Math.round(
        overview.districts.reduce((sum, d) => sum + (d.alignment_score ?? 0), 0) /
        overview.districts.length * 100
      )
    : null;

  // ── Tab content ──────────────────────────────────────────────────────────

  const overviewContent = (
    <>
      {/* Top Voter Concerns — full width */}
      <VoteCastPanel data={votecast} />

      {/* Key Facts (left) + Gerrymandering Grade (right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" }}>
        <StateKeyFacts content={keyFacts} />
        <PrincetonPanel
          data={princeton}
          planscoreUrl={overview?.external_links?.planscore}
        />
      </div>

      {/* Senators */}
      <SenatorPanel data={senators} />
    </>
  );

  const districtsContent = (
    <div style={{ ...cardStyle, padding: "40px", marginBottom: "28px" }}>
      {/* Zip lookup */}
      <div style={{ maxWidth: "480px", marginBottom: "32px" }}>
        <p style={{ fontFamily: fonts.sans, fontSize: "0.88rem", fontWeight: 600, color: textColors.secondary, marginBottom: "10px" }}>
          Find your district by ZIP code
        </p>
        <ZipLookup availableStates={AVAILABLE_STATES} />
      </div>

      {/* Placeholder for district table */}
      <div style={{ textAlign: "center", paddingTop: "24px", borderTop: "1px solid #E8E6E3" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 12px" }}>
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        <p style={{ color: textColors.muted, fontSize: "0.9rem", fontFamily: fonts.sans }}>
          All {overview?.total_districts ?? ""} {overview?.state_name ?? stateCode} districts with alignment scores, representative info, and top issues.
          <br />
          <span style={{ fontSize: "0.8rem", color: textColors.faint }}>(Sortable table — coming soon)</span>
        </p>
      </div>
    </div>
  );

  const methodologyContent = <CESStatePanel data={ces} />;

  return (
    <main style={{ background: "#F4F3F1", minHeight: "100vh" }}>
      <div style={{ maxWidth: pageWidths.state, margin: "0 auto", padding: "0 24px 48px" }}>
        <StateHeader data={overview} alignmentScore={avgAlignment} />
        <StateTabs
          overviewContent={overviewContent}
          districtsContent={districtsContent}
          methodologyContent={methodologyContent}
        />
      </div>
    </main>
  );
}

