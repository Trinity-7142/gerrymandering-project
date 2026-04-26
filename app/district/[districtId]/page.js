// app/district/[districtId]/page.js
// District page orchestrator — Server Component
// Reads ALL district-level JSON files at build time, passes each to its panel component
//
// JSON files consumed:
//   - public/data/districts/{districtId}/overview.json       → DistrictHeader
//   - public/data/districts/{districtId}/alignment.json      → DistrictHeader (gauge) + RepresentativePanel
//   - public/data/districts/{districtId}/ces_positions.json  → CESStatePanel
//   - public/data/districts/{districtId}/representative.json → RepresentativePanel

import DistrictHeader      from "@/components/district/DistrictHeader";
import RepresentativePanel from "@/components/district/RepresentativePanel";
import CESStatePanel       from "@/components/shared/CESStatePanel";
import { loadDistrictData } from "@/lib/loadData";
import { pageWidths } from "@/lib/constants";

export async function generateStaticParams() {
  // TODO: enumerate CA and TX district IDs once data pipeline is complete
  return [];
}

export default async function DistrictPage({ params }) {
  const { districtId } = await params;

  const overview   = loadDistrictData(districtId, "overview.json");
  const alignment  = loadDistrictData(districtId, "alignment.json");
  const ces        = loadDistrictData(districtId, "ces_positions.json");
  const repData    = loadDistrictData(districtId, "representative.json");

  const alignmentScore = typeof alignment?.overall_score === "number"
    ? Math.round(alignment.overall_score * 100)
    : null;

  const stateCode = districtId.split("-")[0];

  return (
    <main style={{ background: "#F4F3F1", minHeight: "100vh" }}>
      <div style={{ maxWidth: pageWidths.district, margin: "0 auto", padding: "0 clamp(14px, 4vw, 24px) 48px" }}>

        {/* 1. District heading + alignment gauge */}
        <DistrictHeader data={overview} alignmentScore={alignmentScore} stateCode={stateCode} />

        {/* 2. Where Voters Stand by Issue + Survey Questions */}
        <CESStatePanel data={ces} />

        {/* 3. Representative profile, stats, and voting record */}
        <RepresentativePanel
          overview={overview}
          repData={repData}
          alignmentData={alignment}
          dirDistrictId={districtId}
        />

      </div>
    </main>
  );
}
