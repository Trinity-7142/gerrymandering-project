# ==============================================================================
# princeton_scores.R
# 
# Reads Princeton Gerrymandering Project score data files (one per state)
# and outputs /states/{ST}/princeton.json for each state.
#
# Data Contract: v1.4
# Author: Trinity (UC Berkeley Project)
# Last Updated: February 2026
# ==============================================================================

# ------------------------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------------------------

# File paths - UPDATE THESE TO MATCH YOUR LOCAL SETUP
source(here::here("config.R"))
ROOT_DIR   <- here()
SCORES_DIR <- here("datasets", "princeton", "state-scores")
OUTPUT_DIR <- here("public", "data", "states")

# Princeton report card page base URL
# Plan-specific URLs are not available programmatically from the score files,
# so we link to the main report card page. The frontend can deep-link if
# plan IDs are added manually later.
PGP_BASE_URL <- "https://gerrymander.princeton.edu/redistricting-report-card/"

# At-large states (1 district — Princeton doesn't grade these)
# They won't have score files, so we skip them gracefully.
AT_LARGE_STATES <- c("AK", "DE", "ND", "SD", "VT", "WY")
# DC is also at-large and has no congressional redistricting to grade

# ------------------------------------------------------------------------------
# LOAD DEPENDENCIES
# ------------------------------------------------------------------------------

library(tidyverse)
library(jsonlite)

# ------------------------------------------------------------------------------
# STATE NAME LOOKUP
# ------------------------------------------------------------------------------

STATE_NAMES <- c(
  "AL" = "Alabama", "AK" = "Alaska", "AZ" = "Arizona", "AR" = "Arkansas",
  "CA" = "California", "CO" = "Colorado", "CT" = "Connecticut", "DE" = "Delaware",
  "DC" = "District of Columbia", "FL" = "Florida", "GA" = "Georgia",
  "HI" = "Hawaii", "ID" = "Idaho", "IL" = "Illinois", "IN" = "Indiana",
  "IA" = "Iowa", "KS" = "Kansas", "KY" = "Kentucky", "LA" = "Louisiana",
  "ME" = "Maine", "MD" = "Maryland", "MA" = "Massachusetts", "MI" = "Michigan",
  "MN" = "Minnesota", "MS" = "Mississippi", "MO" = "Missouri", "MT" = "Montana",
  "NE" = "Nebraska", "NV" = "Nevada", "NH" = "New Hampshire", "NJ" = "New Jersey",
  "NM" = "New Mexico", "NY" = "New York", "NC" = "North Carolina",
  "ND" = "North Dakota", "OH" = "Ohio", "OK" = "Oklahoma", "OR" = "Oregon",
  "PA" = "Pennsylvania", "RI" = "Rhode Island", "SC" = "South Carolina",
  "SD" = "South Dakota", "TN" = "Tennessee", "TX" = "Texas", "UT" = "Utah",
  "VT" = "Vermont", "VA" = "Virginia", "WA" = "Washington",
  "WV" = "West Virginia", "WI" = "Wisconsin", "WY" = "Wyoming"
)

# ------------------------------------------------------------------------------
# HELPER: Extract state code from filename
# 
# Expects filenames starting with 2-letter state code, e.g.:
#   CA.json, CA_congress.json, CA-score-data.json, etc.
# ------------------------------------------------------------------------------

extract_state_code <- function(filename) {
  # Grab the first two uppercase letters from the basename
  code <- str_extract(basename(filename), "^[A-Z]{2}")
  return(code)
}

# ------------------------------------------------------------------------------
# HELPER: Safe field extraction
#
# Princeton data can be uneven between states. Some fields may be missing
# or null. This helper returns a default value if the field is absent.
# ------------------------------------------------------------------------------

safe_get <- function(obj, field, default_val = NULL) {
  val <- obj[[field]]
  if (is.null(val) || length(val) == 0) return(default_val)
  return(val)
}

# ------------------------------------------------------------------------------
# HELPER: Build description string from grade
#
# Maps letter grades to human-readable descriptions per Princeton's rubric.
# These are generic descriptions — not state-specific narratives.
# ------------------------------------------------------------------------------

grade_description <- function(grade, metric) {
  if (is.null(grade)) return("Data not available")
  
  descriptions <- list(
    partisan_fairness = list(
      "A" = "Map does not significantly favor either party",
      "B" = "Map is better than average with minor partisan bias",
      "C" = "Map shows average levels of partisan fairness",
      "D" = "Map shows significant partisan bias",
      "F" = "Map strongly favors one party"
    ),
    geographic_features = list(
      "A" = "Districts are compact and respect county/city boundaries",
      "B" = "Districts are better than average on geographic criteria",
      "C" = "Districts show average compactness and boundary preservation",
      "D" = "Districts show poor geographic coherence",
      "F" = "Districts significantly split communities and lack compactness"
    ),
    competitiveness = list(
      "A" = "More competitive districts than expected given state geography",
      "B" = "Better than average number of competitive districts",
      "C" = "Average number of competitive districts",
      "D" = "Fewer competitive districts than expected",
      "F" = "Significantly fewer competitive districts than expected"
    )
  )
  
  desc_map <- descriptions[[metric]]
  if (is.null(desc_map)) return("Grade assigned by Princeton Gerrymandering Project")
  
  result <- desc_map[[toupper(grade)]]
  if (is.null(result)) return(paste0("Grade: ", grade))
  return(result)
}

# ------------------------------------------------------------------------------
# MAIN: Read score files and build princeton.json for each state
# ------------------------------------------------------------------------------

cat("=" |> rep(60) |> paste(collapse = ""), "\n")
cat("Princeton Gerrymandering Project — JSON Generator\n")
cat("=" |> rep(60) |> paste(collapse = ""), "\n\n")

# Find all JSON files in the scores directory
score_files <- list.files(SCORES_DIR, pattern = "\\.json$", full.names = TRUE)

if (length(score_files) == 0) {
  stop("No JSON files found in: ", SCORES_DIR, 
       "\nPlease download Princeton score files first.")
}

cat("Found", length(score_files), "score files in:", SCORES_DIR, "\n\n")

# Track results for validation summary
results <- tibble(
  state_code = character(),
  state_name = character(),
  overall_grade = character(),
  partisan = character(),
  geographic = character(),
  competitive = character(),
  status = character()
)

# Process each score file
for (filepath in score_files) {
  
  # Extract state code from filename
  state_code <- extract_state_code(filepath)
  
  if (is.na(state_code) || !(state_code %in% names(STATE_NAMES))) {
    cat("[SKIP]", basename(filepath), "— could not extract valid state code\n")
    next
  }
  
  cat("Processing", state_code, "(", basename(filepath), ") ...\n")
  
  # Read the raw Princeton score data
  raw <- tryCatch(
    read_json(filepath),
    error = function(e) {
      cat("  [ERROR] Failed to parse JSON:", e$message, "\n")
      return(NULL)
    }
  )
  
  if (is.null(raw)) {
    results <- results %>% add_row(
      state_code = state_code, state_name = STATE_NAMES[state_code],
      overall_grade = NA, partisan = NA, geographic = NA, competitive = NA,
      status = "PARSE_ERROR"
    )
    next
  }
  
  # The report_card field is our primary target
  # Handle two possible structures:
  #   1. Top-level object with $report_card (like the CA example)
  #   2. Nested under $plan with $report_card at top level
  report_card <- safe_get(raw, "report_card")
  plan_info   <- safe_get(raw, "plan")
  
  if (is.null(report_card)) {
    cat("  [WARNING] No report_card field found — skipping\n")
    results <- results %>% add_row(
      state_code = state_code, state_name = STATE_NAMES[state_code],
      overall_grade = NA, partisan = NA, geographic = NA, competitive = NA,
      status = "NO_REPORT_CARD"
    )
    next
  }
  
  # Extract grades from report_card
  overall_grade     <- safe_get(report_card, "finalReportCardGrade",
                        safe_get(report_card, "overallGrade", NULL))
  partisan_grade    <- safe_get(report_card, "partisanScore", NULL)
  geographic_grade  <- safe_get(report_card, "geographicScore", NULL)
  competitive_grade <- safe_get(report_card, "competitivenessScore", NULL)
  
  # Extract plan metadata if available
  plan_name    <- safe_get(plan_info, "planName", NULL)
  num_dists    <- safe_get(plan_info, "numDists", NULL)
  
  # Determine report year from plan name if possible
  # Common patterns: "congress-commission", "2021 Congressional", etc.
  # Default to 2022 (when most 2021-cycle maps took effect)
  report_year <- 2022
  
  # Build the source URL
  # We don't have planId from the score file, so link to the main page.
  # If you want plan-specific URLs, add a manual lookup table below.
  source_url <- PGP_BASE_URL
  
  # --- Build output JSON per data contract schema (Section 4.2) ---
  
  princeton_json <- list(
    state_code = state_code,
    source = "Princeton Gerrymandering Project",
    source_url = source_url,
    report_year = report_year,
    overall_grade = overall_grade,
    metrics = list(
      partisan_fairness = list(
        grade = partisan_grade,
        description = grade_description(partisan_grade, "partisan_fairness")
      ),
      geographic_features = list(
        grade = geographic_grade,
        description = grade_description(geographic_grade, "geographic_features")
      ),
      competitiveness = list(
        grade = competitive_grade,
        description = grade_description(competitive_grade, "competitiveness")
      )
    ),
    methodology_note = paste0(
      "Grades from Princeton Gerrymandering Project redistricting report card. ",
      "Based on ensemble analysis of ~1M simulated maps compared to the enacted plan. ",
      "Methodology at gerrymander.princeton.edu."
    )
  )
  
  # --- Write output ---
  
  state_dir <- file.path(OUTPUT_DIR, state_code)
  if (!dir.exists(state_dir)) {
    dir.create(state_dir, recursive = TRUE)
    cat("  Created directory:", state_dir, "\n")
  }
  
  output_path <- file.path(state_dir, "princeton.json")
  write_json(
    princeton_json,
    output_path,
    pretty = TRUE,
    auto_unbox = TRUE,
    null = "null"
  )
  cat("  Written:", output_path, "\n")
  
  # Track for validation
  results <- results %>% add_row(
    state_code = state_code,
    state_name = STATE_NAMES[state_code],
    overall_grade = overall_grade %||% "NULL",
    partisan = partisan_grade %||% "NULL",
    geographic = geographic_grade %||% "NULL",
    competitive = competitive_grade %||% "NULL",
    status = "OK"
  )
}

# ------------------------------------------------------------------------------
# VALIDATION SUMMARY
# ------------------------------------------------------------------------------

cat("\n")
cat("=" |> rep(60) |> paste(collapse = ""), "\n")
cat("VALIDATION SUMMARY\n")
cat("=" |> rep(60) |> paste(collapse = ""), "\n\n")

cat("Processed:", nrow(results), "states\n")
cat("  OK:            ", sum(results$status == "OK"), "\n")
cat("  Parse errors:  ", sum(results$status == "PARSE_ERROR"), "\n")
cat("  No report card:", sum(results$status == "NO_REPORT_CARD"), "\n\n")

# Show grade distribution
if (sum(results$status == "OK") > 0) {
  cat("Overall grade distribution:\n")
  results %>%
    filter(status == "OK") %>%
    count(overall_grade, sort = TRUE) %>%
    mutate(display = paste0("  ", overall_grade, ": ", n)) %>%
    pull(display) %>%
    cat(sep = "\n")
  
  cat("\n\nFull results table:\n")
  results %>%
    filter(status == "OK") %>%
    select(state_code, overall_grade, partisan, geographic, competitive) %>%
    arrange(state_code) %>%
    print(n = 60)
}

# Flag states that might be missing
all_multi_district <- setdiff(names(STATE_NAMES), c(AT_LARGE_STATES, "DC"))
processed_states <- results %>% filter(status == "OK") %>% pull(state_code)
missing_states <- setdiff(all_multi_district, processed_states)

if (length(missing_states) > 0) {
  cat("\n[NOTE] Multi-district states with no princeton.json generated:\n")
  cat("  ", paste(missing_states, collapse = ", "), "\n")
  cat("  These may need score files downloaded, or may have data issues.\n")
}

cat("\nDone!\n")
cat("\nNext steps:\n")
cat("  1. Verify grades match what you see on gerrymander.princeton.edu\n")
cat("  2. Optionally add plan-specific source_url values per state\n")
cat("  3. For at-large states (", paste(AT_LARGE_STATES, collapse = ", "), 
    "), Princeton does not grade — no file needed\n")
cat("  4. Run planscore.R to generate the companion planscore.json files\n")
cat("   5. Verify the report_year for each state is accurate\n")