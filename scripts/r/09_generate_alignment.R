# scripts/r/09_generate_alignment.R
# Task D5: Compute alignment.json for each district
# Difficulty: Hard — requires methodological decisions. Trinity-led.
# Status: Not started
# Dependency: D2 (votecast_salience), D3/D4 (ces_positions), D4 (representative voting)
#
# Input:  ces_positions.json + votecast_salience.json + representative.json per district
# Output: public/data/districts/{district_id}/alignment.json (one per district)
#
# TODO: Source 00_config.R
# TODO: For each district:
#   - Load CES constituent positions (binary_direction: liberal_pct / conservative_pct)
#   - Load VoteCast salience weights for the district's state
#   - Load representative voting record (bill_direction summaries)
#   - Calculate per-issue congruence score
#   - Exclude issues with no CES data (e.g., foreign_policy) — renormalize weights
#   - Calculate salience-weighted average = overall alignment score
#   - Assign label based on thresholds (0-.3 Low, .3-.6 Partial, .6-.8 Moderate, .8-1 Strong)
#   - Generate direction text per issue
# TODO: Output JSON matching contract Section 5.2 schema
# TODO: Validate: overall_score 0-1, salience_weights sum to ~1.0, no foreign_policy in issues
