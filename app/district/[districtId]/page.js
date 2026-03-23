// app/district/[districtId]/page.js
// District page orchestrator — Server Component
// Reads ALL district-level JSON files at build time, passes each to its panel component
//
// JSON files consumed:
//   - public/data/districts/{districtId}/overview.json       → DistrictHeader
//   - public/data/districts/{districtId}/alignment.json      → AlignmentScore
//   - public/data/districts/{districtId}/ces_positions.json  → ConstituentPositions
//   - public/data/districts/{districtId}/representative.json → VotingRecord

// TODO: Import loadData helper from lib/loadData
// TODO: Import all district panel components
// TODO: Implement generateStaticParams() to pre-render all CA + TX district pages
// TODO: Read each JSON file, pass to corresponding component as props
// TODO: If a JSON file is missing, pass null → component renders DataUnavailable fallback

export async function generateStaticParams() {
  return [];
}

export default async function DistrictPage({ params }) {
  return (
    <div>
      <h1>District Page</h1>
      <p>Coming soon</p>
    </div>
  );
}