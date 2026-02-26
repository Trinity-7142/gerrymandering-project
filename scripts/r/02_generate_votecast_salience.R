#!/usr/bin/env Rscript
# scripts/votecast_salience.R
#
# Produces: public/data/states/{STATE}/votecast_salience.json
# Schema: matches API contract v1.1 (Feb 2026)
#
# USAGE: Open in VSCode, edit the config below, hit Run.

suppressPackageStartupMessages({
  library(dplyr)
  library(haven)
  library(jsonlite)
  library(stringr)
})

# ===================================================
# CONFIG — edit these lines then hit Run in VSCode
# ===================================================
source(here::here("config.R"))
INPUT_FILE   <- VOTECAST_PATH
OUT_ROOT     <- OUTPUT_DIR
STATES       <- c("ALL")        # Add/remove states here, or use "ALL"
LIKELY_ONLY  <- TRUE                  # FALSE = include all voters
# ===================================================

# -----------------------------
# Contract issue_id taxonomy
# -----------------------------
CONTRACT_ISSUES <- c(
  "economy",
  "healthcare",
  "immigration",
  "environment",
  "abortion",
  "guns",
  "criminal_justice",
  "voting_rights",
  "foreign_policy"
)

# -----------------------------
# VoteCast ISSUES2024 -> contract issue_id
# -----------------------------
# Codebook mapping (AP VoteCast 2024 General):
#   1 = The economy and jobs  -> economy
#   2 = Health care            -> healthcare
#   3 = Immigration            -> immigration
#   4 = Abortion               -> abortion
#   5 = Crime                  -> criminal_justice
#   6 = Climate change         -> environment
#   7 = Foreign policy         -> foreign_policy
#   8 = Gun policy             -> guns
#   9 = Racism                 -> voting_rights (closest contract bucket)
#  99 = DK/Refused             -> excluded
ISSUES2024_TO_CONTRACT_ISSUE_ID <- c(
  `1`  = "economy",
  `2`  = "healthcare",
  `3`  = "immigration",
  `4`  = "abortion",
  `5`  = "criminal_justice",
  `6`  = "environment",
  `7`  = "foreign_policy",
  `8`  = "guns",
  `9`  = "voting_rights",
  `99` = NA
)

normalize_state_code <- function(p_state) {
  # P_STATE in VoteCast is Char 2 (e.g., "CA", "TX").
  # Handles both plain two-letter codes and labelled haven vectors.
  code <- as.character(p_state)
  code <- str_trim(code)
  # Extract two-letter code if embedded in a label like "(CA) California"
  extracted <- str_match(code, "^\\(([A-Z]{2})\\)")[, 2]
  code <- ifelse(!is.na(extracted), extracted, code)
  # Validate: must be exactly two uppercase letters
  code <- ifelse(str_detect(code, "^[A-Z]{2}$"), code, NA_character_)
  code
}

compute_state_salience <- function(votecast_df, state_code, likely_only = TRUE) {
  df <- votecast_df %>%
    mutate(state_code = normalize_state_code(.data$P_STATE)) %>%
    filter(!is.na(state_code), state_code == !!state_code)

  if (likely_only) {
    # VoteCast LIKELYVOTER: 1 = likely voter
    df <- df %>% filter(as.integer(.data$LIKELYVOTER) == 1)
  }

  df <- df %>%
    mutate(
      issues_code = as.character(as.integer(.data$ISSUES2024)),
      issue_id    = unname(ISSUES2024_TO_CONTRACT_ISSUE_ID[issues_code]),
      w           = as.numeric(.data$FINALVOTE_STATE_WEIGHT)
    ) %>%
    filter(!is.na(w), !is.na(issue_id)) %>%
    filter(issue_id %in% CONTRACT_ISSUES)

  if (nrow(df) == 0) {
    stop(
      paste0(
        "No usable rows for state=", state_code,
        ". Check P_STATE parsing, LIKELYVOTER filter, ISSUES2024 codes, and weights."
      )
    )
  }

  # Weighted share by issue_id, then rank
  totals <- df %>%
    group_by(issue_id) %>%
    summarise(weight_sum = sum(w, na.rm = TRUE), .groups = "drop")

  denom <- sum(totals$weight_sum)
  if (!is.finite(denom) || denom <= 0) stop("Sum of weights <= 0 after filtering.")

  salience <- totals %>%
    mutate(pct = round(weight_sum / denom, 3)) %>%
    arrange(desc(pct), issue_id) %>%
    mutate(rank = row_number()) %>%
    select(issue_id, pct, rank)

  # Effective sample size: respondents with valid issue response + weight after filters
  list(
    sample_size = nrow(df),
    salience    = salience
  )
}

write_contract_json <- function(state_code, res, out_root, likely_only) {
  out_dir <- file.path(out_root, state_code)
  dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

  out_obj <- list(
    state_code  = state_code,
    source      = "AP VoteCast 2024",
    sample_size = res$sample_size,
    question    = "Which one of the following would you say is the most important issue facing the country?",
    salience    = lapply(seq_len(nrow(res$salience)), function(i) {
      list(
        issue_id = res$salience$issue_id[i],
        pct      = unname(res$salience$pct[i]),
        rank     = unname(res$salience$rank[i])
      )
    }),
    methodology_note = paste0(
      "Percentages based on weighted responses of registered voters in ", state_code,
      " from AP VoteCast 2024 general election survey. ",
      "Weights: FINALVOTE_STATE_WEIGHT. ",
      if (likely_only) "Filtered to LIKELYVOTER==1 (likely voters). " else "",
      "ISSUES2024 mapped to contract issue taxonomy; excluded DK/Refused (code 99); renormalized to sum to 1."
    )
  )

  out_path <- file.path(out_dir, "votecast_salience.json")
  write_json(out_obj, out_path, pretty = TRUE, auto_unbox = TRUE)
  out_path
}

# ---------------- Main ----------------
message("Reading VoteCast data: ", INPUT_FILE)
votecast <- haven::read_dta(INPUT_FILE)

required <- c("P_STATE", "ISSUES2024", "LIKELYVOTER", "FINALVOTE_STATE_WEIGHT")
missing <- setdiff(required, names(votecast))
if (length(missing) > 0) stop("Missing required columns: ", paste(missing, collapse = ", "))

votecast <- votecast %>% mutate(state_code = normalize_state_code(.data$P_STATE))
all_states <- sort(unique(na.omit(votecast$state_code)))

# Resolve "ALL" or use the list from config
states <- if (length(STATES) == 1 && toupper(STATES) == "ALL") {
  all_states
} else {
  toupper(STATES)
}

for (st in states) {
  message("Processing: ", st)
  res <- compute_state_salience(votecast, st, likely_only = LIKELY_ONLY)
  out_path <- write_contract_json(st, res, OUT_ROOT, LIKELY_ONLY)
  message("  Wrote: ", out_path, " (n=", res$sample_size, ")")
}

message("Done.")