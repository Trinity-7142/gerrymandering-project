// components/district/ConstituentPositions.js
// Server Component — renders CES district-level policy positions
// Receives: ces_positions.json data as props
// Task F3 — detailed view of "what do people in this district actually want?"
//
// Groups questions by issue, renders response distributions
// For binary questions: horizontal bar (72% support / 28% oppose)
// For 5-point scales: segmented/stacked bar
// Shows question text, variable name, n respondents per question

// TODO: Accept props: { data }
// TODO: Group questions by issue_id
// TODO: Render each question with its response distribution bar
// TODO: Handle different scale types (support_oppose, spending_5pt, agree_disagree_5pt)
// TODO: Show binary_direction info where available
// TODO: Handle questions where binary_direction is null (perceptual questions)
// TODO: Show n per question
// TODO: If data is null, render DataUnavailable fallback

export default function ConstituentPositions({ data }) {
  // TODO: implement
}
