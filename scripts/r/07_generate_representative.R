# scripts/r/07_generate_representative.R
# Task D4: Compile representative.json for each district
# Difficulty: Medium — requires manual judgment for vote-to-issue tagging
# Status: Not started
#
# Input:  Roll call votes from congress.gov or VoteView (data-raw/congress/)
# Output: public/data/districts/{district_id}/representative.json (one per district)
#
# TODO: Source 00_config.R
# TODO: Read roll call vote data (VoteView / congress.gov)
# TODO: Tag each vote to an issue bucket using issue taxonomy
#   - IMPORTANT: Document tagging criteria in docs/vote-tagging-criteria.md
#   - D6 (senators) will reuse this methodology
# TODO: For each district:
#   - Filter votes for that representative
#   - Group by issue_id
#   - For each vote: bill number, title, date, yea/nay, bill_direction, source_url
#   - Calculate per-issue summary (total, pro, anti, absent)
#   - Calculate overall stats (total tracked, attendance rate)
# TODO: Output JSON matching contract Section 5.4 schema
# TODO: Validate: no duplicate bill entries per issue
