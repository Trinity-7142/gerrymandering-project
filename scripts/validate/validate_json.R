# scripts/validate/validate_json.R
# Validation script implementing all rules from contract Section 8
# Run after pipeline to catch errors before committing
#
# TODO: Source 00_config.R for paths and taxonomy
#
# TODO: For ALL JSON files:
#   - Check valid JSON (parseable)
#   - Check all issue_id values exist in issues.json
#
# TODO: issues.json:
#   - Each issue has issue_id, display_name, ces_questions array
#   - Issues with empty ces_questions have data_availability_note
#
# TODO: ces_*.json files:
#   - All percentages sum to ~1.0 (within 0.02 tolerance)
#   - n_respondents >= 30 for any reported stat
#
# TODO: alignment.json files:
#   - overall_score between 0 and 1
#   - salience_weights sum to ~1.0
#   - issue_scores excludes issues with no CES data (e.g., foreign_policy)
#
# TODO: zip_to_district.json:
#   - All district_ids match pattern XX-NN (regex: ^[A-Z]{2}-\\d{2,}$)
#
# TODO: representative.json files:
#   - No duplicate bill entries per issue
#
# TODO: votecast_salience.json files:
#   - All 9 issue_ids present in salience array
#
# TODO: senators.json files:
#   - Exactly 2 entries in senators array
#   - Each senator overall_score between 0 and 1
#   - Each senator issue salience_weights sum to ~1.0
#   - No duplicate bill entries per issue per senator
#   - All issue_id values exist in issues.json
#
# TODO: Print summary report: PASS/FAIL per file with error details
