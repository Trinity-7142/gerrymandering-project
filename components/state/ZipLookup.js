// components/state/ZipLookup.js
// CLIENT Component — interactive zip code lookup
// Task F5 — this is the ONLY component that fetches data at runtime
//
// Lazy loads zip_to_district.json when component mounts on state page
// Caches in React state so it's only fetched once across navigation
// Maps zip → district_id, then either navigates to /district/{id} or shows ComingSoonModal
//
// See contract Section 3.3 for lazy loading implementation details

"use client";

// TODO: Import useState, useEffect from react
// TODO: Import useRouter from next/navigation
// TODO: Import ComingSoonModal from components/shared
// TODO: Import states.json available_states list (or accept as prop)

// TODO: Accept props: { availableStates } — list of state codes with data
// TODO: State: zipMap (null until loaded), zipInput, error, showComingSoon
// TODO: useEffect to fetch /data/zip_to_district.json on mount
// TODO: Disable input while loading, show placeholder text
// TODO: On submit: look up zip → district_id
//   - If district's state is in availableStates → navigate to /district/{district_id}
//   - If district's state is NOT in availableStates → show ComingSoonModal
//   - If zip not found → show error message
// TODO: Handle edge cases: partial zip, non-numeric input, zip with multiple districts

export default function ZipLookup({ availableStates }) {
  // TODO: implement
}
