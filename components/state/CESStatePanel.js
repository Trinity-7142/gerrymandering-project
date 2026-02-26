// components/state/CESStatePanel.js
// Server Component — renders CES statewide policy positions
// Receives: ces_summary.json data as props
// Shows aggregated view: what does the average CA/TX voter think on each issue?
//
// Displays response distributions for each question, grouped by issue
// For binary questions: horizontal bar (e.g., 62% support / 38% oppose)
// For 5-point scales: stacked bar or segmented bar

// TODO: Accept props: { data }
// TODO: Group questions by issue_id
// TODO: Render response distributions per question
// TODO: Handle different scale types (support_oppose, spending_5pt, agree_disagree_5pt)
// TODO: Show n respondents per question
// TODO: Render methodology note and weight_variable info
// TODO: If data is null, render DataUnavailable fallback

export default function CESStatePanel({ data }) {
  // TODO: implement
}
