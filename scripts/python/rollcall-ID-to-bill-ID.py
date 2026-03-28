# Maps tagged Bill IDs from the Notion CSV to their roll call vote IDs
# in the unitedstates/congress downloaded vote data.
#
# Vote data lives at: data-raw/congress/data/{congress}/votes/{year}/{chamber}{num}/data.json
# Each vote JSON has a "bill" field with {congress, type, number} identifying the bill.

import csv
import json
import os
import re
from collections import Counter
from pathlib import Path

# ── CONFIG ────────────────────────────────────────────────────────
CONGRESS_DATA = "data-raw/congress/data"
CONGRESSES = [118, 119]
NOTION_CSV = "data-raw/congress/Notion Tagging DB.csv"
OUTPUT_CSV = "data-raw/congress/bill_to_roll.csv"

INCLUDE_CATEGORIES = {"passage", "passage-suspension", "veto-override", "cloture"}

# ── BILL ID PARSING ──────────────────────────────────────────────
# Bidirectional map: Notion prefix <-> vote JSON type code
# Ordered longest-first so "S.J.Res." matches before "S."
NOTION_TO_CODE = [
    ("H.Con.Res.", "hconres"),
    ("S.Con.Res.", "sconres"),
    ("H.J.Res.",   "hjres"),
    ("S.J.Res.",   "sjres"),
    ("H.Res.",     "hres"),
    ("S.Res.",     "sres"),
    ("H.R.",       "hr"),
    ("S.",         "s"),
]


def normalize_bill_id(raw_id):
    """Parse a Notion bill ID like 'H.J.Res. 45' into ('hjres', 45)."""
    cleaned = raw_id.strip()
    for prefix, code in NOTION_TO_CODE:
        if cleaned.startswith(prefix):
            num_str = cleaned[len(prefix):].strip()
            if num_str.isdigit():
                return (code, int(num_str))
            break
    raise ValueError(f"Could not parse bill ID: {raw_id}")


def parse_congress(raw):
    """'118th Congress' -> 118"""
    m = re.search(r"(\d+)", raw)
    if not m:
        raise ValueError(f"Could not parse congress: {raw}")
    return int(m.group(1))


# ── STEP 1: BUILD VOTE INDEX ────────────────────────────────────
# Scan all vote data.json files and index by (congress, bill_type, bill_number)
# so we can look up which roll call votes correspond to each tagged bill.

print("Scanning vote data files...")
# Key: (congress, type_code, bill_number) -> list of vote records
vote_index = {}

for congress in CONGRESSES:
    votes_dir = Path(CONGRESS_DATA) / str(congress) / "votes"
    if not votes_dir.exists():
        print(f"  Warning: {votes_dir} does not exist, skipping")
        continue

    json_files = list(votes_dir.glob("*/*/data.json"))
    print(f"  {congress}th Congress: {len(json_files)} vote files")

    for json_path in json_files:
        with open(json_path) as f:
            vote_data = json.load(f)

        bill = vote_data.get("bill")
        if not bill:
            continue

        key = (bill["congress"], bill["type"], bill["number"])

        record = {
            "roll_number": vote_data["number"],
            "chamber":     vote_data["chamber"],
            "category":    vote_data.get("category", ""),
            "vote_type":   vote_data.get("type", ""),
            "result":      vote_data.get("result", ""),
            "date":        vote_data.get("date", ""),
            "question":    vote_data.get("question", ""),
        }

        vote_index.setdefault(key, []).append(record)

total_indexed = sum(len(v) for v in vote_index.values())
print(f"  Indexed {total_indexed} bill-linked votes across {len(vote_index)} unique bills\n")

# ── STEP 2: READ NOTION CSV ─────────────────────────────────────
with open(NOTION_CSV, encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    tagged_bills = [row for row in reader if row["Bill ID"].strip()]

print(f"Tagged bills in Notion CSV: {len(tagged_bills)}\n")

# ── STEP 3: LOOK UP EACH BILL'S ROLL CALLS ──────────────────────
output_rows = []
not_found   = []
no_rollcall = []

for row in tagged_bills:
    bill_id_raw = row["Bill ID"].strip()
    congress_raw = row["Congress"].strip()

    try:
        type_code, bill_number = normalize_bill_id(bill_id_raw)
    except ValueError as e:
        print(f"  ⚠ {e}")
        not_found.append(bill_id_raw)
        continue

    try:
        congress = parse_congress(congress_raw)
    except ValueError as e:
        print(f"  ⚠ {e}")
        not_found.append(bill_id_raw)
        continue

    base_row = {
        "Bill ID":        bill_id_raw,
        "Congress":       congress_raw,
        "Issue ID":       row["Issue ID"],
        "Bill Direction": row["Bill Direction"],
        "Confidence":     row["Bill Direction Confidence Level"],
    }

    key = (congress, type_code, bill_number)
    votes = vote_index.get(key, [])

    # Filter to included vote categories
    relevant = [v for v in votes if v["category"] in INCLUDE_CATEGORIES]

    if not votes:
        not_found.append(bill_id_raw)
        output_rows.append({
            **base_row,
            "Roll Call Num": "NOT IN VOTE DATA",
            "Chamber": "", "Category": "", "Vote Type": "",
            "Result": "", "Date": "", "Question": "",
        })
    elif not relevant:
        no_rollcall.append(bill_id_raw)
        output_rows.append({
            **base_row,
            "Roll Call Num": f"NO PASSAGE VOTE ({len(votes)} other votes)",
            "Chamber": "", "Category": "", "Vote Type": "",
            "Result": "", "Date": "", "Question": "",
        })
    else:
        for rc in relevant:
            output_rows.append({
                **base_row,
                "Roll Call Num": rc["roll_number"],
                "Chamber":       rc["chamber"],
                "Category":      rc["category"],
                "Vote Type":     rc["vote_type"],
                "Result":        rc["result"],
                "Date":          rc["date"],
                "Question":      rc["question"],
            })

# ── STEP 4: WRITE OUTPUT CSV ────────────────────────────────────
fieldnames = [
    "Bill ID", "Congress", "Issue ID", "Bill Direction", "Confidence",
    "Roll Call Num", "Chamber", "Category", "Vote Type", "Result", "Date", "Question",
]

with open(OUTPUT_CSV, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(output_rows)

print(f"Output written to {OUTPUT_CSV}")

# ── Debugging ─────────────────────────────────────────
matched = len(tagged_bills) - len(not_found) - len(no_rollcall)

print(f"\nTotal tagged bills:          {len(tagged_bills)}")
print(f"Matched with passage votes:  {matched}")
print(f"Total roll call records:     {sum(1 for r in output_rows if isinstance(r['Roll Call Num'], int))}")

# Vote category breakdown
cat_counts = Counter(r["Category"] for r in output_rows if r["Category"])
if cat_counts:
    print("\nVote category breakdown:")
    for cat, count in cat_counts.most_common():
        print(f"  {cat}: {count}")

# Chamber breakdown
chamber_counts = Counter(r["Chamber"] for r in output_rows if r["Chamber"])
if chamber_counts:
    print("\nChamber breakdown:")
    for ch, count in chamber_counts.most_common():
        label = "Senate" if ch == "s" else "House"
        print(f"  {label}: {count}")

if not_found:
    print(f"\n⚠  Bills not found in vote data ({len(not_found)}):")
    print(f"   (May need: usc-run votes --congress=X)")
    for b in not_found:
        print(f"   - {b}")

if no_rollcall:
    print(f"\n⚠  Bills with no passage/veto-override votes ({len(no_rollcall)}):")
    print(f"   (May be voice votes, amendments only, or not yet voted)")
    for b in no_rollcall:
        print(f"   - {b}")
