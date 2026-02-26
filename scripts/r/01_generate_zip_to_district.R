# ═══════════════════════════════════════════════════════════════════
# generate_zip_to_district.R
# ═══════════════════════════════════════════════════════════════════
# Generates zip_to_district.json for the Gerrymandering project.
# Uses the Census Bureau's 119th CD-to-ZCTA relationship file
# or the pre-processed GitHub crosswalk.
#
# Run:
#   Rscript generate_zip_to_district.R
#
# Requires: tidyverse, jsonlite
# ═══════════════════════════════════════════════════════════════════

library(tidyverse)
library(jsonlite)
source(here::here("config.R"))

# ─── Configuration ────────────────────────────────────────────────
# Choose your data source by uncommenting ONE option:

# OPTION A: Download from GitHub (pre-processed, recommended)
DATA_SOURCE <- "github"

# OPTION B: Use a local Census relationship file
# DATA_SOURCE <- "census"
# CENSUS_FILE <- "tab20_cd11920_zcta520_natl.txt"

# Output path (change this to your project's data directory)
OUTPUT_FILE <- OUTPUT_DIR

# ─── FIPS to State Abbreviation Lookup ────────────────────────────
fips_lookup <- tribble(
  ~state_fips, ~state_abbr,
  "01", "AL", "02", "AK", "04", "AZ", "05", "AR", "06", "CA",
  "08", "CO", "09", "CT", "10", "DE", "11", "DC", "12", "FL",
  "13", "GA", "15", "HI", "16", "ID", "17", "IL", "18", "IN",
  "19", "IA", "20", "KS", "21", "KY", "22", "LA", "23", "ME",
  "24", "MD", "25", "MA", "26", "MI", "27", "MN", "28", "MS",
  "29", "MO", "30", "MT", "31", "NE", "32", "NV", "33", "NH",
  "34", "NJ", "35", "NM", "36", "NY", "37", "NC", "38", "ND",
  "39", "OH", "40", "OK", "41", "OR", "42", "PA", "44", "RI",
  "45", "SC", "46", "SD", "47", "TN", "48", "TX", "49", "UT",
  "50", "VT", "51", "VA", "53", "WA", "54", "WV", "55", "WI",
  "56", "WY",
  # Territories
  "60", "AS", "66", "GU", "69", "MP", "72", "PR", "78", "VI"
)

# ─── Helper: Format district ID (vectorized) ─────────────────────
format_district_id <- function(state_abbr, district_num) {
  dist <- suppressWarnings(as.integer(district_num))
  
  case_when(
    is.na(dist)       ~ paste0(state_abbr, "-AL"),
    dist == 0         ~ paste0(state_abbr, "-AL"),
    dist == 98        ~ paste0(state_abbr, "-AL"),
    TRUE              ~ paste0(state_abbr, "-", sprintf("%02d", dist))
  )
}

# ═══════════════════════════════════════════════════════════════════
# OPTION A: Process GitHub CSV
# ═══════════════════════════════════════════════════════════════════
process_github <- function() {
  cat("Downloading crosswalk from GitHub...\n")
  
  url <- "https://raw.githubusercontent.com/OpenSourceActivismTech/us-zipcodes-congress/master/zccd.csv"
  
  # Download and read CSV (no header in this file)
  crosswalk_raw <- read_csv(
    url,
    col_types = cols(.default = col_character()),
    show_col_types = FALSE
  )
  
  cat("  Downloaded", nrow(crosswalk_raw), "rows\n")
  
  # Process
  result <- crosswalk_raw %>%
    rename(zcta = zcta, state_abbr = state_abbr, district = cd) %>%
    # Zero-pad ZCTA to 5 digits
    mutate(zcta = str_pad(zcta, 5, pad = "0")) %>%
    # Skip NA or "ZZ" districts
    filter(!is.na(district), district != "ZZ") %>%
    # Create district ID (vectorized)
    mutate(district_id = format_district_id(state_abbr, district)) %>%
    # De-duplicate: keep first occurrence for each ZCTA
    distinct(zcta, .keep_all = TRUE) %>%
    select(zcta, district_id)
  
  return(result)
    # Zero-pad FIPS codes
    mutate(
      state_fips = str_pad(state_fips, 2, pad = "0"),
      zcta = str_pad(zcta, 5, pad = "0")
    ) %>%
    # Join state abbreviations
    left_join(fips_lookup, by = "state_fips") %>%
    # Remove rows with no state match
    filter(!is.na(state_abbr)) %>%
    # Skip NA or "ZZ" districts (unassigned water areas)
    filter(!is.na(district), district != "ZZ") %>%
    # Create district ID (vectorized, no rowwise needed)
    mutate(district_id = format_district_id(state_abbr, district)) %>%
    # De-duplicate: keep first occurrence for each ZCTA
    # (source data lists primary district first)
    distinct(zcta, .keep_all = TRUE) %>%
    select(zcta, district_id)
  
  return(result)
}

# ═══════════════════════════════════════════════════════════════════
# OPTION B: Process Census Relationship File
# ═══════════════════════════════════════════════════════════════════
process_census <- function(file_path) {
  cat("Processing Census relationship file:", file_path, "\n")
  
  # Read pipe-delimited file
  crosswalk_raw <- read_delim(
    file_path,
    delim = "|",
    col_types = cols(.default = col_character()),
    show_col_types = FALSE
  )
  
  cat("  Read", nrow(crosswalk_raw), "rows\n")
  
  # The file has columns like:
  # GEOID_CD | NAMELSAD_CD | GEOID_ZCTA5 | NAMELSAD_ZCTA5 | AREALAND_PART | ...
  # We need the first, third, and fifth columns
  
  col_names <- names(crosswalk_raw)
  cat("  Columns:", paste(col_names[1:6], collapse = ", "), "...\n")
  
  # Rename for clarity (column positions may vary slightly)
  cd_col <- col_names[1]     # CD GEOID (e.g., "0611" = state 06, district 11)
  zcta_col <- col_names[3]   # ZCTA GEOID (e.g., "94110")
  area_col <- col_names[5]   # Land area of intersection
  
  result <- crosswalk_raw %>%
    rename(
      cd_geoid = !!cd_col,
      zcta = !!zcta_col,
      land_area = !!area_col
    ) %>%
    mutate(
      land_area = as.numeric(land_area),
      state_fips = str_sub(cd_geoid, 1, 2),
      district_num = str_sub(cd_geoid, 3, 4)
    ) %>%
    # Join state abbreviations
    left_join(fips_lookup, by = "state_fips") %>%
    filter(!is.na(state_abbr)) %>%
    filter(!is.na(district_num), district_num != "ZZ") %>%
    # Create district ID (vectorized)
    mutate(district_id = format_district_id(state_abbr, district_num)) %>%
    # For multi-district ZCTAs, pick the one with largest land area overlap
    group_by(zcta) %>%
    arrange(desc(land_area)) %>%
    slice(1) %>%
    ungroup() %>%
    select(zcta, district_id)
  
  return(result)
}

# ═══════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════
cat("═══════════════════════════════════════════════\n")
cat("  ZIP → Congressional District JSON Generator\n")
cat("  119th Congress (2025-2027)\n")
cat("═══════════════════════════════════════════════\n\n")

# Process based on chosen data source
if (DATA_SOURCE == "github") {
  zip_data <- process_github()
} else if (DATA_SOURCE == "census") {
  zip_data <- process_census(CENSUS_FILE)
} else {
  stop("Invalid DATA_SOURCE. Use 'github' or 'census'.")
}

cat("\n── Results ──\n")
cat("Total zip codes mapped:", nrow(zip_data), "\n")

# Count by state
state_counts <- zip_data %>%
  mutate(state = str_extract(district_id, "^[A-Z]{2}")) %>%
  count(state, sort = TRUE)

cat("States covered:", nrow(state_counts), "\n")
cat("\nTop 10 states by zip count:\n")
print(head(state_counts, 10))

# ─── Convert to named list (JSON object format) ──────────────────
zip_map <- setNames(zip_data$district_id, zip_data$zcta)

# Sort by zip code
zip_map <- zip_map[sort(names(zip_map))]

# ─── Write JSON ──────────────────────────────────────────────────
# Write compact JSON (no pretty-printing for smaller file size)
json_text <- toJSON(as.list(zip_map), auto_unbox = TRUE)

writeLines(json_text, OUTPUT_FILE)

file_size <- file.info(OUTPUT_FILE)$size
cat("\n✓ Written to:", OUTPUT_FILE, "\n")
cat("  File size:", round(file_size / 1024), "KB",
    paste0("(", round(file_size / 1024 / 1024, 2), " MB)\n"))
cat("  Estimated gzipped: ~", round(file_size / 1024 * 0.25), "KB\n")

# ─── Spot checks ─────────────────────────────────────────────────
cat("\n── Spot Checks ──\n")
spot_checks <- c(
  "94110" = "CA-11",    # San Francisco
  "90210" = "CA-36",    # Beverly Hills
  "77001" = "TX-18",    # Houston
  "20001" = "DC-AL",    # Washington DC
  "99501" = "AK-AL"     # Anchorage (at-large)
)

for (zip in names(spot_checks)) {
  expected <- spot_checks[zip]
  actual <- if (zip %in% names(zip_map)) zip_map[zip] else "NOT FOUND"
  status <- if (actual == expected) "✓" else "✗ (may differ)"
  cat(sprintf("  %s: expected %s → got %s  %s\n", zip, expected, actual, status))
}

cat("\nNext step: Copy to your Next.js project:\n")
cat(paste0("  cp ", OUTPUT_FILE, " <project>/public/data/zip_to_district.json\n"))