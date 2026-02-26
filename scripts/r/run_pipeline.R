# scripts/r/run_pipeline.R
# Master script: runs the full R data pipeline in dependency order
#
# TODO: Source each script in order:
#   source("scripts/r/00_config.R")
#   source("scripts/r/01_generate_zip_to_district.R")
#   source("scripts/r/02_generate_votecast_salience.R")
#   source("scripts/r/03_generate_ces_summary.R")
#   source("scripts/r/04_generate_ces_positions.R")
#   source("scripts/r/05_generate_overview.R")
#   source("scripts/r/06_generate_princeton.R")
#   source("scripts/r/07_generate_representative.R")
#   source("scripts/r/08_generate_senators.R")        # depends on 02, 03, 07
#   source("scripts/r/09_generate_alignment.R")        # depends on 02, 04, 07
#
# TODO: Add timing/logging for each step
# TODO: Run validation after pipeline completes
#   source("scripts/validate/validate_json.R")
