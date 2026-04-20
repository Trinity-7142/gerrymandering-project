"""
overview.py — generates overview.json for states and districts.

Data sources:
  - data-raw/congress-legislators/legislators-current.json  — rep roster (name, party, terms)
  - public/data/districts/{DISTRICT}/ces_positions.json     — CES sample size per district
  - public/data/districts/{DISTRICT}/alignment.json         — district alignment score (overall_score)

Outputs:
  - public/data/states/{STATE}/overview.json                — one per state
  - public/data/districts/{DISTRICT}/overview.json          — one per district

Usage:
  python overview.py                         # all states + all districts
  python overview.py --states                # all 50 states + DC
  python overview.py --states CA TX          # specific state(s)
  python overview.py --districts             # all districts
  python overview.py --districts CA-11 TX-07 # specific district(s)
  python overview.py --state-districts CA    # all districts for one state
"""
import argparse
import json
import os

# ── Script parameters (overridden by CLI args) ──────────────────────────────
STATE_CODES     = None   # list of state codes, or None = all
DISTRICT_IDS    = None   # list of district IDs, or None = all
STATE_DISTRICTS = None   # single state code to generate all its districts

# ── Paths ────────────────────────────────────────────────────────────────────
_SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.abspath(os.path.join(_SCRIPT_DIR, "..", ".."))
_LEGISLATORS_PATH = os.path.join(_PROJECT_ROOT, "data-raw", "congress-legislators", "legislators-current.json")
_DISTRICTS_ROOT   = os.path.join(_PROJECT_ROOT, "public", "data", "districts")
_STATES_ROOT      = os.path.join(_PROJECT_ROOT, "public", "data", "states")

# ── 119th Congress apportionment (2020 Census) ───────────────────────────────
# Sourced from apportionment data — used for total_districts so vacant seats
# don't cause an undercount.
DISTRICT_COUNT = {
    "AL": 7,  "AK": 1,  "AZ": 9,  "AR": 4,  "CA": 52, "CO": 8,  "CT": 5,
    "DC": 1,  "DE": 1,  "FL": 28, "GA": 14, "HI": 2,  "ID": 2,  "IL": 17,
    "IN": 9,  "IA": 4,  "KS": 4,  "KY": 6,  "LA": 6,  "ME": 2,  "MD": 8,
    "MA": 9,  "MI": 13, "MN": 8,  "MS": 4,  "MO": 8,  "MT": 2,  "NE": 3,
    "NV": 4,  "NH": 2,  "NJ": 12, "NM": 3,  "NY": 26, "NC": 14, "ND": 1,
    "OH": 15, "OK": 5,  "OR": 6,  "PA": 17, "RI": 2,  "SC": 7,  "SD": 1,
    "TN": 9,  "TX": 38, "UT": 4,  "VT": 1,  "VA": 11, "WA": 10, "WV": 2,
    "WI": 8,  "WY": 1,
}

# ── State name lookup ─────────────────────────────────────────────────────────
STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DC": "District of Columbia",
    "DE": "Delaware", "FL": "Florida", "GA": "Georgia", "HI": "Hawaii",
    "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine",
    "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
    "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska",
    "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico",
    "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island",
    "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas",
    "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
    "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
}

# ── Module-level data load ────────────────────────────────────────────────────
_legislators = json.load(open(_LEGISLATORS_PATH))


# ── Helpers ───────────────────────────────────────────────────────────────────

def _party_abbrev(party_str):
    """Democrat → D, Republican → R, others → first letter."""
    if party_str == "Democrat":
        return "D"
    if party_str == "Republican":
        return "R"
    return party_str[0] if party_str else "?"


def _format_district_id(state_code, district_num, total_districts):
    """Return district ID string: CA-02, or ND-AL for single-seat states."""
    if total_districts == 1:
        return f"{state_code}-AL"
    return f"{state_code}-{district_num:02d}"


def _district_id_to_folder(district_id):
    """Map display district ID to folder name: ND-AL → ND-01, others unchanged."""
    state, suffix = district_id.split("-", 1)
    if suffix == "AL":
        return f"{state}-01"
    return district_id


def _get_ces_sample(district_id):
    """Read n_respondents from a district's ces_positions.json; returns None if missing."""
    folder = _district_id_to_folder(district_id)
    path = os.path.join(_DISTRICTS_ROOT, folder, "ces_positions.json")
    if not os.path.exists(path):
        return None
    data = json.load(open(path))
    return data.get("n_respondents")


def _get_alignment_score(district_id):
    """Read overall_score from a district's alignment.json; returns None if missing."""
    folder = _district_id_to_folder(district_id)
    path = os.path.join(_DISTRICTS_ROOT, folder, "alignment.json")
    if not os.path.exists(path):
        return None
    data = json.load(open(path))
    return data.get("overall_score")


def _get_senator_scores(state_code):
    """Read senator overall_scores from states/{state}/alignment.json; returns list (may be empty)."""
    path = os.path.join(_STATES_ROOT, state_code, "alignment.json")
    if not os.path.exists(path):
        return []
    data = json.load(open(path))
    return [
        s["overall_score"]
        for s in data.get("senators", [])
        if isinstance(s.get("overall_score"), (int, float))
    ]


def build_legislators_index():
    """
    Returns {state_code: [rep_dict, ...]} for all current House members
    in the 50 states + DC (territories excluded).

    Each rep_dict has: name, party (D/R), district_num (int), assumed_office (int year).
    """
    index = {}
    for legislator in _legislators:
        terms = legislator.get("terms", [])
        if not terms:
            continue
        latest = terms[-1]
        if latest.get("type") != "rep":
            continue
        state = latest.get("state")
        if state not in STATE_NAMES:
            continue   # skip territories (AS, GU, VI, PR, MP, etc.)

        # assumed_office = year of first ever House term
        first_rep_term = next((t for t in terms if t.get("type") == "rep"), latest)
        assumed_office = int(first_rep_term["start"][:4])

        rep = {
            "name":           legislator["name"].get("official_full") or
                              f"{legislator['name']['first']} {legislator['name']['last']}",
            "party":          _party_abbrev(latest.get("party", "")),
            "district_num":   latest.get("district", 0),
            "assumed_office": assumed_office,
        }
        index.setdefault(state, []).append(rep)

    # sort each state's reps by district number
    for state in index:
        index[state].sort(key=lambda r: r["district_num"])
    return index


# ── Generators ────────────────────────────────────────────────────────────────

def generate_state_overview(state_code, reps_index):
    """Write public/data/states/{state_code}/overview.json."""
    reps = reps_index.get(state_code, [])
    total = DISTRICT_COUNT.get(state_code, len(reps))
    party_counts = {"democrat": 0, "republican": 0}
    for r in reps:
        if r["party"] == "D":
            party_counts["democrat"] += 1
        elif r["party"] == "R":
            party_counts["republican"] += 1

    districts = []
    for r in reps:
        district_id = _format_district_id(state_code, r["district_num"], total)
        ces_n = _get_ces_sample(district_id)
        alignment = _get_alignment_score(district_id)
        districts.append({
            "district_id":     district_id,
            "representative":  r["name"],
            "party":           r["party"],
            "alignment_score": alignment,
            "ces_sample_size": ces_n,
        })

    rep_scores = [d["alignment_score"] for d in districts if d["alignment_score"] is not None]
    sen_scores = _get_senator_scores(state_code)

    house_alignment = round(sum(rep_scores) / len(rep_scores), 10) if rep_scores else None
    senate_alignment = round(sum(sen_scores) / len(sen_scores), 10) if sen_scores else None

    if house_alignment is not None and senate_alignment is not None:
        overall_alignment = round((house_alignment + senate_alignment) / 2, 10)
    elif house_alignment is not None:
        overall_alignment = house_alignment
    elif senate_alignment is not None:
        overall_alignment = senate_alignment
    else:
        overall_alignment = None

    delegation_sample = {
        "house_n":      len(rep_scores),
        "senate_n":     len(sen_scores),
        "house_vacant": total - len(rep_scores),
    }

    output = {
        "state_code":                state_code,
        "state_name":                STATE_NAMES[state_code],
        "total_districts":           total,
        "overall_alignment":         overall_alignment,
        "house_alignment":           house_alignment,
        "senate_alignment":          senate_alignment,
        "delegation_sample":         delegation_sample,
        "score_methodology_version": "v1.0",
        "delegation_composition":    party_counts,
        "districts":                 districts,
    }

    out_path = os.path.join(_STATES_ROOT, state_code, "overview.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"  wrote {out_path}")


def generate_district_overview(district_id, reps_index):
    """Write public/data/districts/{district_id}/overview.json."""
    state_code = district_id.split("-")[0]
    reps = reps_index.get(state_code, [])
    total_in_state = len(reps)

    # find the matching rep
    if district_id.endswith("-AL"):
        # at-large: only one rep for the state
        rep = reps[0] if reps else None
    else:
        num = int(district_id.split("-")[1])
        rep = next((r for r in reps if r["district_num"] == num), None)

    if rep is None:
        print(f"  WARNING: no representative found for {district_id}, skipping")
        return

    ces_n = _get_ces_sample(district_id)
    confidence_note = (
        f"District estimates based on {ces_n} weighted CES respondents"
        if ces_n is not None
        else "CES sample data not yet available"
    )

    output = {
        "district_id": district_id,
        "state_code":  state_code,
        "representative": {
            "name":           rep["name"],
            "party":          rep["party"],
            "assumed_office": rep["assumed_office"],
            "photo_url":      f"/images/reps/{district_id}.jpg",
        },
        "demographics": {
            "population":     None,
            "median_income":  None,
            "urban_pct":      None,
            "cook_pvi":       None,
        },
        "ces_sample": {
            "n_respondents":    ces_n,
            "weight_variable":  "vvweight_post",
            "confidence_note":  confidence_note,
        },
    }

    folder = _district_id_to_folder(district_id)
    out_path = os.path.join(_DISTRICTS_ROOT, folder, "overview.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"  wrote {out_path}")


# ── Target resolution ─────────────────────────────────────────────────────────

def resolve_targets(args, reps_index):
    """
    Returns (state_list, district_list) based on CLI args.
    state_list / district_list are None when that category should be skipped entirely.
    """
    no_flags = not args.states and not args.districts and not args.state_districts

    if no_flags:
        # default: everything
        return list(STATE_NAMES.keys()), _all_district_ids(reps_index)

    state_list    = None
    district_list = None

    if args.states is not None:
        # --states with no values = all states; with values = specific states
        state_list = args.states if args.states else list(STATE_NAMES.keys())

    if args.districts is not None:
        district_list = args.districts if args.districts else _all_district_ids(reps_index)

    if args.state_districts:
        sc = args.state_districts.upper()
        district_list = (district_list or []) + _district_ids_for_state(sc, reps_index)

    return state_list, district_list


def _all_district_ids(reps_index):
    ids = []
    for state_code, reps in reps_index.items():
        total = DISTRICT_COUNT.get(state_code, len(reps))
        for r in reps:
            ids.append(_format_district_id(state_code, r["district_num"], total))
    return ids


def _district_ids_for_state(state_code, reps_index):
    reps = reps_index.get(state_code, [])
    total = DISTRICT_COUNT.get(state_code, len(reps))
    return [_format_district_id(state_code, r["district_num"], total) for r in reps]


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate overview.json files for states and/or districts.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--states", nargs="*", metavar="STATE",
        help="Generate state overviews. Omit values for all states, or list codes: CA TX",
    )
    parser.add_argument(
        "--districts", nargs="*", metavar="DISTRICT",
        help="Generate district overviews. Omit values for all districts, or list IDs: CA-11 TX-07",
    )
    parser.add_argument(
        "--state-districts", metavar="STATE",
        help="Generate all district overviews for one state: CA",
    )
    args = parser.parse_args()

    reps_index = build_legislators_index()
    state_list, district_list = resolve_targets(args, reps_index)

    if state_list:
        print(f"Generating {len(state_list)} state overview(s)...")
        for sc in sorted(state_list):
            generate_state_overview(sc, reps_index)

    if district_list:
        print(f"Generating {len(district_list)} district overview(s)...")
        for did in sorted(district_list):
            generate_district_overview(did, reps_index)

    print("Done.")


if __name__ == "__main__":
    main()
