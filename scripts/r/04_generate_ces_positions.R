#!/usr/bin/env Rscript
# scripts/ces_positions.R
#
# Produces:
#   public/data/districts/{DISTRICT}/ces_positions.json  (one per district)
#   public/data/states/{STATE}/ces_summary.json           (one per state)
#
# Schema: matches API contract v1.1 (Feb 2026) with corrected variable names
#
# USAGE: Open in VSCode, edit the config below, hit Run.
#
# REMINDER: CC24_325 (gestational limit) is deferred — revisit later.

suppressPackageStartupMessages({
  library(dplyr)
  library(haven)
  library(jsonlite)
  library(tidyr)
})

# ===================================================
# CONFIG — edit these lines then hit Run in VSCode
# ===================================================
source(here::here("config.R"))
INPUT_FILE    <- CES_PATH
OUT_ROOT      <- OUTPUT_DIR
STATES        <- c('ALL')   # Use state names as they appear in CES 'inputstate'
WEIGHT_VAR    <- "vvweight_post"            # registered-voter post-election weight
DISTRICT_VAR  <- "cdid119"                  # district number within state (1, 2, 3...)
STATE_VAR     <- "inputstate"               # state FIPS code (6 = CA, 48 = TX, etc.)
MIN_N         <- 5                          # suppress questions with fewer than this many respondents
# ===================================================

# ----------------------------------------------------------
# ISSUE TAXONOMY — CES variable -> issue_id
#
# This is the single source of truth for which CES columns
# belong to which issue bucket. Each entry defines:
#   variable     = actual column name in the .dta file
#   text         = human-readable question text (from labels)
#   issue_id     = our contract taxonomy bucket
#   scale        = response scale type
#   category     = "core" or "supplementary"
#   direction    = which response (1 or 2) is the "liberal" direction
#                  for binary collapse. For 5-pt spending, 1-2 = increase
#                  = liberal, 4-5 = decrease = conservative, 3 = neutral.
#                  For agree/disagree, depends on question.
#                  NULL means skip binary collapse for this item.
# ----------------------------------------------------------

QUESTION_MAP <- list(

  # ── GUNS ──────────────────────────────────────────────
  list(variable = "CC24_321a", issue_id = "guns",
       text = "Ban assault rifles",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),  # Support = liberal direction

  list(variable = "CC24_321b", issue_id = "guns",
       text = "Make it easier to obtain concealed-carry permit",
       scale = "support_oppose", category = "core",
       binary_support_is = 2),  # Support = conservative direction (oppose = liberal)

  list(variable = "CC24_321c", issue_id = "guns",
       text = "Require background checks on all gun sales",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_321f", issue_id = "guns",
       text = "Gun safety package: mental health spending, confiscate from dangerous, domestic violence ban, minor background checks",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  # ── IMMIGRATION ───────────────────────────────────────
  list(variable = "CC24_323a", issue_id = "immigration",
       text = "Grant legal status to immigrants with 3+ years jobs/taxes, no felonies",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_323b", issue_id = "immigration",
       text = "Increase border patrols on US-Mexico border",
       scale = "support_oppose", category = "core",
       binary_support_is = 2),  # Support = conservative direction

  list(variable = "CC24_323c", issue_id = "immigration",
       text = "Build a wall between the U.S. and Mexico",
       scale = "support_oppose", category = "core",
       binary_support_is = 2),

  list(variable = "CC24_323d", issue_id = "immigration",
       text = "Permanent resident status for Dreamers with pathway to citizenship",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_340f", issue_id = "immigration",
       text = "Deny asylum access for immigrants who cross border illegally",
       scale = "support_oppose", category = "core",
       binary_support_is = 2),

  # ── ABORTION ──────────────────────────────────────────
  list(variable = "CC24_324a", issue_id = "abortion",
       text = "Always allow abortion as a matter of choice",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_324b", issue_id = "abortion",
       text = "Permit abortion only in cases of rape, incest, or life danger",
       scale = "support_oppose", category = "core",
       binary_support_is = 2),  # Support = restrictive position

  list(variable = "CC24_324c", issue_id = "abortion",
       text = "Make abortions illegal in all circumstances",
       scale = "support_oppose", category = "core",
       binary_support_is = 2),

  list(variable = "CC24_324d", issue_id = "abortion",
       text = "Expand abortion access, affordability, provider types, clinic protections",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_340a", issue_id = "abortion",
       text = "Prohibit government restrictions on contraceptives",
       scale = "support_oppose", category = "supplementary",
       binary_support_is = 1),

  list(variable = "CC24_340b", issue_id = "abortion",
       text = "Prohibit government restrictions on abortion services",
       scale = "support_oppose", category = "supplementary",
       binary_support_is = 1),

  list(variable = "CC24_444c", issue_id = "abortion",
       text = "Prohibit receiving abortion-inducing drugs through the mail",
       scale = "support_oppose", category = "supplementary",
       binary_support_is = 2),

  list(variable = "CC24_444d", issue_id = "abortion",
       text = "Prohibit women from traveling to another state for an abortion",
       scale = "support_oppose", category = "supplementary",
       binary_support_is = 2),

  list(variable = "CC24_445b", issue_id = "abortion",
       text = "Roe v. Wade is overruled; states can outlaw abortion",
       scale = "agree_disagree", category = "supplementary",
       binary_support_is = 2),  # Agree (1) = conservative; Disagree (2) = liberal

  # ── ENVIRONMENT ───────────────────────────────────────
  list(variable = "CC24_326a", issue_id = "environment",
       text = "Give EPA power to regulate carbon dioxide emissions",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_326b", issue_id = "environment",
       text = "Require 20% of electricity from renewable sources",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_326c", issue_id = "environment",
       text = "Strengthen EPA enforcement of Clean Air/Water Acts even if it costs jobs",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_326d", issue_id = "environment",
       text = "Increase fossil fuel production in the U.S.",
       scale = "support_oppose", category = "core",
       binary_support_is = 2),  # Support = conservative direction

  list(variable = "CC24_326e", issue_id = "environment",
       text = "Halt new oil and gas leases on federal lands",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_326f", issue_id = "environment",
       text = "Prevent the government from banning gas stoves",
       scale = "support_oppose", category = "core",
       binary_support_is = 2),

  # ── ECONOMY ───────────────────────────────────────────
  list(variable = "CC24_341a", issue_id = "economy",
       text = "Extend 2017 tax cuts (individual/corporate rate reductions, limited deductions)",
       scale = "support_oppose", category = "core",
       binary_support_is = 2),  # Support = conservative direction

  list(variable = "CC24_341b", issue_id = "economy",
       text = "Raise corporate income tax from 21% to 28%",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_341c", issue_id = "economy",
       text = "Allow tax rates on $400k+ earners to rise to 35%",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_341d", issue_id = "economy",
       text = "Spend $150B/year for 8 years on infrastructure",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_328a", issue_id = "economy",
       text = "Relax zoning laws to allow more apartments and condos",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_328b", issue_id = "economy",
       text = "Expand federal tax incentives for affordable housing",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_323f", issue_id = "economy",
       text = "Forgive up to $20,000 of student loan debt per person",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_443_1", issue_id = "economy",
       text = "State legislature spending on Welfare",
       scale = "spending_5pt", category = "core",
       binary_support_is = NULL),  # handled by spending logic

  list(variable = "CC24_443_3", issue_id = "economy",
       text = "State legislature spending on Education",
       scale = "spending_5pt", category = "core",
       binary_support_is = NULL),

  list(variable = "CC24_443_5", issue_id = "economy",
       text = "State legislature spending on Transportation/Infrastructure",
       scale = "spending_5pt", category = "core",
       binary_support_is = NULL),

  # ── HEALTHCARE ────────────────────────────────────────
  list(variable = "CC24_328c", issue_id = "healthcare",
       text = "Require able-bodied adults without dependents to have a job to receive Medicaid",
       scale = "support_oppose", category = "core",
       binary_support_is = 2),  # Support = conservative (restrict Medicaid)

  list(variable = "CC24_328d", issue_id = "healthcare",
       text = "Repeal the Affordable Care Act",
       scale = "support_oppose", category = "core",
       binary_support_is = 2),

  list(variable = "CC24_328e", issue_id = "healthcare",
       text = "Expand Medicaid to cover individuals <$25k and families <$40k",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_443_2", issue_id = "healthcare",
       text = "State legislature spending on Health Care",
       scale = "spending_5pt", category = "core",
       binary_support_is = NULL),

  # ── CRIMINAL JUSTICE ──────────────────────────────────
  list(variable = "CC24_321d", issue_id = "criminal_justice",
       text = "Increase police on the street by 10%, even if fewer funds for other services",
       scale = "support_oppose", category = "core",
       binary_support_is = 2),  # Support = conservative direction

  list(variable = "CC24_321e", issue_id = "criminal_justice",
       text = "Decrease police on the street by 10%, increase funding for other services",
       scale = "support_oppose", category = "core",
       binary_support_is = 1),

  list(variable = "CC24_443_4", issue_id = "criminal_justice",
       text = "State legislature spending on Law Enforcement",
       scale = "spending_5pt", category = "core",
       binary_support_is = NULL),

  # ── ELECTION INTEGRITY ────────────────────────────────
  list(variable = "CC24_421_1", issue_id = "election_integrity",
       text = "Elections in the U.S. are fair",
       scale = "agree_disagree_5pt", category = "core",
       binary_support_is = NULL),  # perceptual, not directional

  list(variable = "CC24_421_2", issue_id = "election_integrity",
       text = "Your state or local government conducted a fair and accurate election in 2024",
       scale = "agree_disagree_5pt", category = "core",
       binary_support_is = NULL)
)

# ----------------------------------------------------------
# Derived constants
# ----------------------------------------------------------
ALL_VARS     <- sapply(QUESTION_MAP, `[[`, "variable")
ALL_ISSUES   <- unique(sapply(QUESTION_MAP, `[[`, "issue_id"))

# ----------------------------------------------------------
# Helper: compute weighted response distribution for one question
# ----------------------------------------------------------
compute_question_results <- function(responses, weights, q_info) {
  # Remove missing: skipped (8/98), not asked (9/99), NA
  valid_codes <- switch(q_info$scale,
    "support_oppose"    = c(1, 2),
    "agree_disagree"    = c(1, 2),
    "spending_5pt"      = c(1, 2, 3, 4, 5),
    "agree_disagree_5pt"= c(1, 2, 3, 4, 5),
    stop("Unknown scale: ", q_info$scale)
  )

  keep <- !is.na(responses) & !is.na(weights) &
          (responses %in% valid_codes) & (weights > 0)
  r <- responses[keep]
  w <- weights[keep]
  n <- length(r)

  if (n == 0) return(NULL)

  # Weighted proportions for each valid code
  total_w <- sum(w)
  results <- list()

  if (q_info$scale == "support_oppose") {
    results$support <- round(sum(w[r == 1]) / total_w, 3)
    results$oppose  <- round(sum(w[r == 2]) / total_w, 3)
  } else if (q_info$scale == "agree_disagree") {
    results$agree    <- round(sum(w[r == 1]) / total_w, 3)
    results$disagree <- round(sum(w[r == 2]) / total_w, 3)
  } else if (q_info$scale == "spending_5pt") {
    results$greatly_increase  <- round(sum(w[r == 1]) / total_w, 3)
    results$slightly_increase <- round(sum(w[r == 2]) / total_w, 3)
    results$maintain          <- round(sum(w[r == 3]) / total_w, 3)
    results$slightly_decrease <- round(sum(w[r == 4]) / total_w, 3)
    results$greatly_decrease  <- round(sum(w[r == 5]) / total_w, 3)
  } else if (q_info$scale == "agree_disagree_5pt") {
    results$strongly_agree          <- round(sum(w[r == 1]) / total_w, 3)
    results$somewhat_agree          <- round(sum(w[r == 2]) / total_w, 3)
    results$neither_agree_disagree  <- round(sum(w[r == 3]) / total_w, 3)
    results$somewhat_disagree       <- round(sum(w[r == 4]) / total_w, 3)
    results$strongly_disagree       <- round(sum(w[r == 5]) / total_w, 3)
  }

  # Binary collapse for alignment metric
  binary <- NULL
  if (q_info$scale == "support_oppose" && !is.null(q_info$binary_support_is)) {
    liberal_code <- q_info$binary_support_is
    conservative_code <- ifelse(liberal_code == 1, 2, 1)
    binary <- list(
      liberal_pct       = round(sum(w[r == liberal_code]) / total_w, 3),
      conservative_pct  = round(sum(w[r == conservative_code]) / total_w, 3)
    )
  } else if (q_info$scale == "agree_disagree" && !is.null(q_info$binary_support_is)) {
    # For agree/disagree binary (CC24_445b): binary_support_is indicates the liberal response
    liberal_code <- q_info$binary_support_is
    conservative_code <- ifelse(liberal_code == 1, 2, 1)
    binary <- list(
      liberal_pct       = round(sum(w[r == liberal_code]) / total_w, 3),
      conservative_pct  = round(sum(w[r == conservative_code]) / total_w, 3)
    )
  } else if (q_info$scale == "spending_5pt") {
    # Increase (1,2) = liberal; Decrease (4,5) = conservative; Maintain (3) = excluded
    lib_w  <- sum(w[r %in% c(1, 2)])
    con_w  <- sum(w[r %in% c(4, 5)])
    denom  <- lib_w + con_w
    if (denom > 0) {
      binary <- list(
        liberal_pct      = round(lib_w / denom, 3),
        conservative_pct = round(con_w / denom, 3),
        neutral_excluded_pct = round(sum(w[r == 3]) / total_w, 3)
      )
    }
  } else if (q_info$scale == "agree_disagree_5pt") {
    # Election integrity: perceptual, not ideological — no binary collapse
    binary <- NULL
  }

  list(
    variable  = q_info$variable,
    text      = q_info$text,
    scale     = q_info$scale,
    category  = q_info$category,
    n         = n,
    results   = results,
    binary_direction = binary
  )
}

# ----------------------------------------------------------
# Core: compute positions for a filtered subset of respondents
# ----------------------------------------------------------
compute_positions <- function(ces_subset, weight_col, min_n = 5) {
  issue_list <- list()

  for (issue in ALL_ISSUES) {
    q_infos <- Filter(function(q) q$issue_id == issue, QUESTION_MAP)
    questions <- list()

    for (q_info in q_infos) {
      col <- q_info$variable
      if (!(col %in% names(ces_subset))) {
        message("  WARNING: Column '", col, "' not found in data, skipping.")
        next
      }

      responses <- as.integer(ces_subset[[col]])
      weights   <- as.numeric(ces_subset[[weight_col]])
      result    <- compute_question_results(responses, weights, q_info)

      if (is.null(result) || result$n < min_n) {
        message("  Suppressed: ", col, " (n=", ifelse(is.null(result), 0, result$n), ")")
        next
      }

      questions <- c(questions, list(result))
    }

    if (length(questions) > 0) {
      issue_list <- c(issue_list, list(list(
        issue_id  = issue,
        questions = questions
      )))
    }
  }

  issue_list
}

# ----------------------------------------------------------
# Build district_id from separate state FIPS + district number
# inputstate = FIPS code (6, 48, etc.)
# cdid119    = district number within state (1, 2, 11, etc.)
# Result: "CA-11", "TX-32", "MT-01", etc.
# ----------------------------------------------------------
build_district_id <- function(state_fips, district_num) {
  fips_str <- sprintf("%02d", as.integer(state_fips))
  abbrev   <- STATE_FIPS[[fips_str]]
  if (is.null(abbrev) || is.na(abbrev)) return(NA_character_)
  dist_str <- sprintf("%02d", as.integer(district_num))
  if (is.na(dist_str) || dist_str == "NA") return(NA_character_)
  paste0(abbrev, "-", dist_str)
}

# Standard FIPS to state abbreviation (only states we care about, but include all)
STATE_FIPS <- list(
  "01" = "AL", "02" = "AK", "04" = "AZ", "05" = "AR", "06" = "CA",
  "08" = "CO", "09" = "CT", "10" = "DE", "11" = "DC", "12" = "FL",
  "13" = "GA", "15" = "HI", "16" = "ID", "17" = "IL", "18" = "IN",
  "19" = "IA", "20" = "KS", "21" = "KY", "22" = "LA", "23" = "ME",
  "24" = "MD", "25" = "MA", "26" = "MI", "27" = "MN", "28" = "MS",
  "29" = "MO", "30" = "MT", "31" = "NE", "32" = "NV", "33" = "NH",
  "34" = "NJ", "35" = "NM", "36" = "NY", "37" = "NC", "38" = "ND",
  "39" = "OH", "40" = "OK", "41" = "OR", "42" = "PA", "44" = "RI",
  "45" = "SC", "46" = "SD", "47" = "TN", "48" = "TX", "49" = "UT",
  "50" = "VT", "51" = "VA", "53" = "WA", "54" = "WV", "55" = "WI",
  "56" = "WY"
)

# ----------------------------------------------------------
# Write district-level ces_positions.json
# ----------------------------------------------------------
write_district_json <- function(district_id, issues, n_respondents, out_root) {
  state_code <- sub("-.*", "", district_id)
  out_dir <- file.path(out_root, "districts", district_id)
  dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

  out_obj <- list(
    district_id    = district_id,
    source         = "Cooperative Election Study 2024",
    n_respondents  = n_respondents,
    weight_variable = WEIGHT_VAR,
    issues         = issues,
    methodology_note = paste0(
      "District estimates based on ", n_respondents, " weighted CES respondents. ",
      "Weight: ", WEIGHT_VAR, ". ",
      "Response distributions are weighted proportions. ",
      "Binary direction fields collapse responses for alignment metric: ",
      "liberal_pct vs conservative_pct. ",
      "For 5-point spending scales, 'increase' = liberal, 'decrease' = conservative, ",
      "'maintain' excluded from binary and shown as neutral_excluded_pct. ",
      "Questions with fewer than ", MIN_N, " valid responses are suppressed."
    )
  )

  out_path <- file.path(out_dir, "ces_positions.json")
  write_json(out_obj, out_path, pretty = TRUE, auto_unbox = TRUE)
  out_path
}

# ----------------------------------------------------------
# Write state-level ces_summary.json
# ----------------------------------------------------------
write_state_json <- function(state_code, issues, n_respondents, out_root) {
  out_dir <- file.path(out_root, "states", state_code)
  dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

  out_obj <- list(
    state_code       = state_code,
    source           = "Cooperative Election Study 2024",
    total_respondents = n_respondents,
    weight_variable  = WEIGHT_VAR,
    issues           = issues,
    methodology_note = paste0(
      "State-level estimates based on ", n_respondents, " weighted CES respondents in ", state_code, ". ",
      "Weight: ", WEIGHT_VAR, ". ",
      "Response distributions are weighted proportions. ",
      "Binary direction fields collapse responses for alignment metric."
    )
  )

  out_path <- file.path(out_dir, "ces_summary.json")
  write_json(out_obj, out_path, pretty = TRUE, auto_unbox = TRUE)
  out_path
}

# ================ Main ================
message("Reading CES data: ", INPUT_FILE)
ces <- haven::read_dta(INPUT_FILE)

# Validate required columns exist
required_cols <- c(DISTRICT_VAR, STATE_VAR, WEIGHT_VAR, ALL_VARS)
missing <- setdiff(required_cols, names(ces))
if (length(missing) > 0) {
  # Separate truly missing vs just question columns (which might have different names)
  missing_infra <- intersect(missing, c(DISTRICT_VAR, STATE_VAR, WEIGHT_VAR))
  missing_qs    <- setdiff(missing, missing_infra)

  if (length(missing_infra) > 0) {
    stop("Missing required infrastructure columns: ", paste(missing_infra, collapse = ", "),
         "\nCheck DISTRICT_VAR, STATE_VAR, WEIGHT_VAR in config.",
         "\nAvailable district-like columns: ",
         paste(names(ces)[grep("cdid|cd|dist", names(ces), ignore.case = TRUE)], collapse = ", "))
  }
  if (length(missing_qs) > 0) {
    message("WARNING: Missing question columns (will be skipped): ", paste(missing_qs, collapse = ", "))
  }
}

# Parse district IDs from state FIPS + district number
message("Building district identifiers from '", STATE_VAR, "' + '", DISTRICT_VAR, "'...")
ces <- ces %>%
  mutate(
    district_id = mapply(build_district_id,
                         .data[[STATE_VAR]],
                         .data[[DISTRICT_VAR]]),
    state_code  = sub("-.*", "", district_id)
  )

# Quick sanity check
n_parsed <- sum(!is.na(ces$district_id))
message("  Parsed ", n_parsed, " / ", nrow(ces), " district IDs successfully.")
message("  Sample district IDs: ", paste(head(unique(na.omit(ces$district_id)), 10), collapse = ", "))

if (n_parsed == 0) {
  stop("No district IDs parsed. Check DISTRICT_VAR and parse_district_id() logic.\n",
       "  Sample raw values: ", paste(head(unique(ces[[DISTRICT_VAR]]), 10), collapse = ", "))
}

# Filter to post-election respondents with valid weights
ces_valid <- ces %>%
  filter(!is.na(.data[[WEIGHT_VAR]]), .data[[WEIGHT_VAR]] > 0,
         !is.na(district_id))

message("Valid respondents (post-election + weight + district): ", nrow(ces_valid))

# Resolve target states
if (length(STATES) == 1 && toupper(STATES) == "ALL") {
  target_states <- sort(unique(na.omit(ces_valid$state_code)))
} else {
  # STATES config can be abbreviations ("CA", "TX") or full names ("California", "Texas")
  # Build a name-to-code lookup from the FIPS table
  fips_name_lookup <- ces %>%
    mutate(state_label = as.character(as_factor(.data[[STATE_VAR]]))) %>%
    distinct(state_code, state_label) %>%
    filter(!is.na(state_code))

  target_codes <- c()
  for (s in STATES) {
    if (nchar(s) == 2) {
      # Already an abbreviation
      target_codes <- c(target_codes, toupper(s))
    } else {
      # Look up by name
      match <- fips_name_lookup %>% filter(state_label == s) %>% pull(state_code)
      if (length(match) > 0) {
        target_codes <- c(target_codes, match[1])
      } else {
        message("WARNING: State '", s, "' not found in data, skipping.")
      }
    }
  }

  target_states <- sort(unique(target_codes))
}

message("Target states: ", paste(target_states, collapse = ", "))

# ── Process each state ──
for (st in target_states) {
  state_data <- ces_valid %>% filter(state_code == st)

  if (nrow(state_data) == 0) {
    message("  SKIP: No data for state ", st)
    next
  }

  # ── State-level summary ──
  message("Processing state: ", st, " (n=", nrow(state_data), ")")
  state_issues <- compute_positions(state_data, WEIGHT_VAR, MIN_N)
  state_path   <- write_state_json(st, state_issues, nrow(state_data), OUT_ROOT)
  message("  Wrote: ", state_path)

  # ── District-level positions ──
  districts <- sort(unique(state_data$district_id))
  message("  Districts found: ", length(districts))

  for (dist in districts) {
    dist_data <- state_data %>% filter(district_id == dist)
    n_dist    <- nrow(dist_data)

    if (n_dist < MIN_N) {
      message("  SKIP: ", dist, " (n=", n_dist, " < MIN_N=", MIN_N, ")")
      next
    }

    dist_issues <- compute_positions(dist_data, WEIGHT_VAR, MIN_N)
    dist_path   <- write_district_json(dist, dist_issues, n_dist, OUT_ROOT)
    message("  Wrote: ", dist_path, " (n=", n_dist, ")")
  }
}

message("\nDone.")
message("REMINDER: CC24_325 (gestational limit) is deferred — revisit later.")