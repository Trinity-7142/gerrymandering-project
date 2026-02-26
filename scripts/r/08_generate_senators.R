# scripts/r/08_generate_senators.R
# Task D6: Compile senators.json for CA and TX
# Difficulty: Medium — structurally identical to D4 + D5 but for Senate votes
# Status: Files created but alignment/issue fields are placeholders
# Dependency: D2 (votecast_salience), D3 (ces_summary), D4 (vote tagging methodology)
#
# Input:  Senate roll call votes (data-raw/congress/), CES state data, VoteCast salience
# Output: public/data/states/{state}/senators.json (one per state)
#
# TODO: Source 00_config.R
# TODO: Read Senate roll call votes from congress.gov or VoteView
# TODO: Tag each vote to issue bucket (reuse criteria from D4 / vote-tagging-criteria.md)
#   - Bill numbers differ (S. vs H.R.)
#   - Where bill passes both chambers, issue_id must match representative.json
# TODO: For each state, for each senator:
#   - Gather votes, group by issue
#   - Calculate per-issue voting summaries
#   - Calculate alignment scores using CES statewide positions + VoteCast salience weights
#   - No Bayesian shrinkage needed (state samples are large)
# TODO: Output JSON matching contract Section 4.5 schema
# TODO: Validate: exactly 2 senators per state, scores 0-1, weights sum to ~1.0
