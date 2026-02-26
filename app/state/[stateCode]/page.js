// app/state/[stateCode]/page.js
// State page orchestrator — Server Component
// Reads ALL state-level JSON files at build time, passes each to its panel component
//
// JSON files consumed:
//   - public/data/states/{stateCode}/overview.json      → StateHeader
//   - public/data/states/{stateCode}/princeton.json     → PrincetonPanel
//   - public/data/states/{stateCode}/votecast_salience.json → VoteCastPanel
//   - public/data/states/{stateCode}/ces_summary.json   → CESStatePanel
//   - public/data/states/{stateCode}/senators.json      → SenatorPanel
//   + ZipLookup (Client Component, fetches zip_to_district.json itself at runtime)

// TODO: Import loadData helper from lib/loadData
// TODO: Import all state panel components
// TODO: Import ZipLookup (Client Component)
// TODO: Implement generateStaticParams() to pre-render CA, TX pages
// TODO: Read each JSON file, pass to corresponding component as props
// TODO: If a JSON file is missing, pass null → component renders DataUnavailable fallback

export async function generateStaticParams() {
  // TODO: Return [{ stateCode: 'CA' }, { stateCode: 'TX' }]
  // Later: read from states.json dynamically
}

export default async function StatePage({ params }) {
  // TODO: implement
}
