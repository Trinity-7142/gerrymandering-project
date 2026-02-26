# scripts/r/05_generate_overview.R
# Generate overview.json for each state and district
# Status: State-level files created with placeholder alignment scores ("0.69")
#         District-level files NOT created
#
# Input:  Multiple sources (delegation data, demographics, CES sample sizes)
# Output: public/data/states/{state}/overview.json (one per state)
#         public/data/districts/{district_id}/overview.json (one per district)
#
# TODO: Source 00_config.R
# TODO: For each state:
#   - Set state metadata (name, total districts, delegation composition)
#   - Build district list with rep names, party, alignment score, CES sample size
#   - Add external_links (PlanScore URL pattern: planscore.org/{state_name_lowercase}/)
#   - Output JSON matching contract Section 4.1 schema
# TODO: For each district:
#   - Set representative info (name, party, assumed_office, photo_url)
#   - Set demographics (population, median_income, urban_pct, cook_pvi)
#   - Set CES sample info (n_respondents, weight_variable, confidence_note)
#   - Output JSON matching contract Section 5.1 schema
