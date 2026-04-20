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
import AllDistricts    from "@/components/state/AllDistricts";
import CESStatePanel   from "@/components/shared/CESStatePanel";
import { loadStateData, loadKeyFacts } from "@/lib/loadData";
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
  const { body: keyFactsBody, sources: keyFactsSources } = loadKeyFacts(stateCode);

  // House alignment — mean across House delegation, pre-computed by overview.py
  const avgAlignment = typeof overview?.house_alignment === "number"
    ? Math.round(overview.house_alignment * 100)
    : null;

  // ── Tab content ──────────────────────────────────────────────────────────

  const overviewContent = (
    <>
      {/* Top Voter Concerns — full width */}
      <VoteCastPanel data={votecast} />

      {/* Key Facts (left) + Gerrymandering Grade (right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" }}>
        <StateKeyFacts content={keyFactsBody} stateName={overview?.state_name ?? stateCode} sources={keyFactsSources} />
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

      <AllDistricts data={overview} />
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

