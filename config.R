# scripts/r/00_config.R
# Shared configuration for all R pipeline scripts
# Every script sources this file first
install.packages(c("here", "tidyverse", "haven", "survey", "jsonlite", "dplyr", "stringr", "tidyr"))
library(here)
CES_PATH <- here("data-raw", "ces", "CCES24_Common_OUTPUT_vv_topost_final.dta")
VOTECAST_PATH <- here("data-raw", "votecast", "AP_VOTECAST_2024_GENERAL.dta")
OUTPUT_DIR <- here("public", "data")
PROJ_ROOT <- here

# TODO: Define output directory path (points to public/data/)
# TODO: Define list of target states (c("CA", "TX"))
# TODO: Define issue taxonomy (matching issues.json)
# TODO: Define CES variable mappings per issue bucket
# TODO: Define VoteCast category-to-issue_id mapping
# TODO: Define file paths for raw data (data-raw/ces/, data-raw/votecast/, etc.)
# TODO: Define survey weight variable names (vvweight_post, commonweight, etc.)
# TODO: Define minimum sample size threshold (n >= 30)
