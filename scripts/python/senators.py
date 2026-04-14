"""
senators.py — generates data/states/{STATE}/senators.json for one or all states.

Reads three source files:
  - data-raw/congress-legislators/legislators-current.json  — senator biographical data
  - data-raw/congress/senator_rollcall_votes.csv            — every roll call vote cast (all chambers)
  - data-raw/congress/bill_to_roll.csv                      — tagged bills mapping roll calls to issues

Pipeline (run via generate_senator_json):
  1. create_senators   — loads current senators for the target state from legislators-current.json
  2. create_votes      — joins bill_to_roll with senator_rollcall_votes on roll call number + congress,
                         producing one Vote object per senator per tagged bill
  3. create_issue_votes — groups each senator's votes by issue_id into IssueVotes objects
  4. compute_attendance_rates — computes attendance across ALL senate votes, not just tagged ones
  5. build_output      — serializes the object graph into the senators.json structure
  6. write_output      — writes to data/states/{STATE}/senators.json, creating the directory if needed

To run for a single state, set STATE_CODE at the top of this file and execute the script.
To regenerate all states, call generate_senator_json() with no arguments.
"""
import json
import os
import re
from datetime import date
import pandas as pd

# ── Script parameters ──
STATE_CODE = "CA"  # change to target state before running

CES_STATE_SAMPLE = {
    "n_respondents": 4900,
    "weight_variable": "vvweight_post",
    "confidence_note": f"State-level estimates based on 4900 weighted CES respondents",
}

# ── Module-level data loads (run once) ──
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.abspath(os.path.join(_SCRIPT_DIR, "..", ".."))

_legislators = json.load(
    open(os.path.join(_PROJECT_ROOT, "data-raw", "congress-legislators", "legislators-current.json"))
)
_rollcall_df = pd.read_csv(
    os.path.join(_PROJECT_ROOT, "data-raw", "congress", "senator_rollcall_votes.csv")
)
_bill_to_roll_df = pd.read_csv(
    os.path.join(_PROJECT_ROOT, "data-raw", "congress", "bill_to_roll.csv")
)

# ── Lookup indexes ──
_lis_to_senator = {}   # populated during Senator creation
_seen_votes = set()    # (lisID, bill_id, congress) for dedup

'''
========================================================================================================================
Senator Class
========================================================================================================================
'''
class Senator:
    senators = []
    def __init__(self, bioID, lisID, firstName, lastName, birthday, dateStarted, party,
                seat_class, photo_url, missedVotes=0, attendanceRate=0):
        self.firstName = firstName

        self.lastName = lastName

        self.birthday = birthday

        # assumed_office in the json
        self.dateStarted = dateStarted

        # "D" or "R"
        self.party = party

        # Senate seat class: 1, 2, or 3
        self.seat_class = seat_class

        # relative path, e.g. /images/senators/CA-padilla.jpg
        self.photo_url = photo_url

        self.missedVotes = missedVotes

        # should be a percentage
        self.attendanceRate = attendanceRate

        self.bioID = bioID

        self.lisID = lisID

        # list of IssueVoteGroup objects, one per issue_id
        self.votes_by_issue = []

        self.senators.append(self)

    @property
    def name(self):
        return f"{self.firstName} {self.lastName}"

    @property
    def overall_voting_stats(self):
        total = sum(len(g.votes) for g in self.votes_by_issue)
        return {
            "total_tracked_votes": total,
            "attendance_rate": self.attendanceRate,
        }
    
    def validatePolitican(self):
        VALID_PARTIES = {"D", "R"}
        VALID_CLASSES = {1, 2, 3}
        DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
        VALID_ISSUE_IDS = {
            "guns", "immigration", "healthcare", "economy",
            "environment", "criminal_justice", "election_integrity",
            "abortion", "foreign_policy",
        }

        errors = []

        if not isinstance(self.bioID, str) or not self.bioID:
            errors.append(f"bioID must be a non-empty string, got {self.bioID!r}")

        if not isinstance(self.lisID, str) or not re.match(r"^[A-Z]\d{3,4}$", self.lisID):
            errors.append(f"lisID must match LIS format (e.g. 'S275'), got {self.lisID!r}")

        if not isinstance(self.firstName, str) or not self.firstName:
            errors.append(f"firstName must be a non-empty string, got {self.firstName!r}")

        if not isinstance(self.lastName, str) or not self.lastName:
            errors.append(f"lastName must be a non-empty string, got {self.lastName!r}")

        if not isinstance(self.birthday, str) or not DATE_PATTERN.match(self.birthday):
            errors.append(f"birthday must be an ISO date string (YYYY-MM-DD), got {self.birthday!r}")

        if not isinstance(self.dateStarted, str) or not DATE_PATTERN.match(self.dateStarted):
            errors.append(f"dateStarted must be an ISO date string (YYYY-MM-DD), got {self.dateStarted!r}")

        if self.party not in VALID_PARTIES:
            errors.append(f"party must be one of {VALID_PARTIES}, got {self.party!r}")

        if self.seat_class not in VALID_CLASSES:
            errors.append(f"seat_class must be one of {VALID_CLASSES}, got {self.seat_class!r}")

        if not isinstance(self.photo_url, str) or not self.photo_url.startswith("/images/senators/"):
            errors.append(f"photo_url must be a relative path under /images/senators/, got {self.photo_url!r}")

        if not isinstance(self.missedVotes, int) or self.missedVotes < 0:
            errors.append(f"missedVotes must be a non-negative int, got {self.missedVotes!r}")

        if not isinstance(self.attendanceRate, (int, float)) or not (0.0 <= self.attendanceRate <= 1.0):
            errors.append(f"attendanceRate must be a float in [0.0, 1.0], got {self.attendanceRate!r}")

        for iv in self.votes_by_issue:
            if not isinstance(iv, IssueVotes):
                errors.append(f"votes_by_issue entries must be IssueVotes instances, got {type(iv)}")
            elif iv.issue_id not in VALID_ISSUE_IDS:
                errors.append(f"IssueVotes has unrecognized issue_id {iv.issue_id!r}")

        if errors:
            raise ValueError(f"Senator '{self.name}' failed validation:\n" + "\n".join(f"  - {e}" for e in errors))
'''
========================================================================================================================
IssueVotes Class
========================================================================================================================
'''
class IssueVotes:
    """Groups all Vote objects for one senator under one issue_id."""

    def __init__(self, issue_id):
        # one of the 9 issue_ids from the taxonomy
        self.issue_id = issue_id

        # list of Vote objects
        self.votes = []

    def add_vote(self, vote):
        self.votes.append(vote)

    def summary(self):
        """Build the per-issue summary dict.  Direction keys are issue-specific
        and are inferred from the bill_direction values present in the votes."""
        direction_counts = {}
        absent = 0
        for v in self.votes:
            if v.vote in ("not voting",):
                absent += 1
            else:
                direction_counts[v.bill_direction] = (
                    direction_counts.get(v.bill_direction, 0) + 1
                )
        result = {"total_votes": len(self.votes)}
        result.update(direction_counts)
        result["absent"] = absent
        return result

'''
========================================================================================================================
Vote Class
========================================================================================================================
'''
class Vote:
    allVotes = []

    def __init__(self, bill, title, date, vote, bill_direction, source_url, issue_id):
        # bill identifier, e.g. "S. 2938"
        self.bill = bill

        # human-readable bill title
        self.title = title

        # ISO date string "YYYY-MM-DD"
        self.date = date

        # "yea", "nay", or "not voting"
        self.vote = vote

        # direction tag from the taxonomy, e.g. "conservative/liberal"
        self.bill_direction = bill_direction

        # senate.gov roll-call URL
        self.source_url = source_url

        # one of the 9 taxonomy issue_ids, e.g. "guns", "criminal_justice"
        self.issue_id = issue_id

        self.allVotes.append(self)


'''
========================================================================================================================
Populating
========================================================================================================================
'''
# key = Senator; value = [Vote, ...]
senatorVotes = {}

PARTY_ABBREV = {"Democrat": "D", "Republican": "R", "Independent": "I"}

VALID_CATEGORIES = {"passage", "cloture", "amendment", "veto-override"}

BILL_DIRECTION_MAP = {
    "Conservative Direction": "conservative",
    "Liberal Direction":      "liberal",
    "Bipartisan":             "bipartisan",
}


def _normalize_bill_direction(value):
    if pd.isna(value):
        return None
    return BILL_DIRECTION_MAP.get(value, str(value).lower())

"""
--------------------------
Creating Senator Objects
--------------------------
"""
def create_senators(state_code):
    for entry in _legislators:
        terms = entry.get("terms", [])
        if not terms:
            continue

        most_recent = terms[-1]
        if most_recent.get("type") != "sen" or most_recent.get("state") != state_code:
            continue

        lis_id = entry["id"].get("lis")
        if not lis_id:
            continue

        if lis_id in _lis_to_senator:
            continue

        first_sen_term = next(t for t in terms if t["type"] == "sen")

        s = Senator(
            bioID       = entry["id"]["bioguide"],
            lisID       = lis_id,
            firstName   = entry["name"]["first"],
            lastName    = entry["name"]["last"],
            birthday    = entry["bio"]["birthday"],
            dateStarted = first_sen_term["start"],
            party       = PARTY_ABBREV.get(most_recent["party"], most_recent["party"]),
            seat_class  = most_recent["class"],
            photo_url   = f"/images/senators/{state_code}-{entry['name']['last'].lower()}.jpg",
        )
        _lis_to_senator[lis_id] = s

"""
--------------------------
Creating Vote Objects
--------------------------
"""
def create_votes():
    # Filter and prepare bill_to_roll: Senate rows with tracked categories only
    senate_bills = _bill_to_roll_df[
        (_bill_to_roll_df["Chamber"] == "s") &
        (_bill_to_roll_df["Category"].isin(VALID_CATEGORIES))
    ].copy()
    senate_bills["congress"] = senate_bills["Congress"].str.extract(r"(\d+)")[0].astype(int)
    senate_bills["Roll Call Num"] = senate_bills["Roll Call Num"].astype(int)

    # Filter rollcall to Senate rows and extract congress from vote_id ("s135-118.2023" -> 118)
    # NOTE: senator_rollcall_votes["bioguide_id"] holds LIS IDs for Senate rows (e.g. "S317"), not bioguide IDs
    senate_rollcall = _rollcall_df[_rollcall_df["vote_id"].str.startswith("s")].copy()
    senate_rollcall["congress"] = senate_rollcall["vote_id"].str.extract(r"s\d+-(\d+)\.")[0].astype(int)
    senate_rollcall["bill_number"] = senate_rollcall["bill_number"].astype(int)

    merged = senate_rollcall.merge(
        senate_bills,
        left_on=["bill_number", "congress"],
        right_on=["Roll Call Num", "congress"],
        how="inner"
    )

    for _, row in merged.iterrows():
        lis_id  = row["bioguide_id"]
        bill_id = row["Bill ID"]
        congress = int(row["congress"])
        bill_direction = _normalize_bill_direction(row["Bill Direction"])

        senator = _lis_to_senator.get(lis_id)
        if senator is None or bill_direction is None:
            continue

        dedup_key = (lis_id, bill_id, congress)
        if dedup_key in _seen_votes:
            continue
        _seen_votes.add(dedup_key)

        match = re.match(r"s(\d+)-(\d+)\.(\d+)", row["vote_id"])
        if not match:
            continue
        roll_num, congress_num, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
        session = 1 if year % 2 == 1 else 2
        source_url = (
            "https://www.senate.gov/legislative/LIS/roll_call_lists/"
            f"roll_call_vote_cfm.cfm?congress={congress_num}&session={session}&vote={roll_num:05d}"
        )

        v = Vote(
            bill           = bill_id,
            title          = row["Question"],
            date           = row["Date"][:10],
            vote           = row["position"].lower(),
            bill_direction = bill_direction,
            source_url     = source_url,
            issue_id       = row["Issue ID"].lower().replace(" ", "_"),
        )
        senatorVotes.setdefault(senator, []).append(v)

"""
--------------------------
Creating IssueVotes Objects
--------------------------
"""
def create_issue_votes():
    for senator in Senator.senators:
        votes = senatorVotes.get(senator, [])

        by_issue = {}
        for v in votes:
            by_issue.setdefault(v.issue_id, []).append(v)

        existing_issue_ids = {iv.issue_id for iv in senator.votes_by_issue}

        for issue_id, issue_votes in by_issue.items():
            if issue_id in existing_issue_ids:
                continue

            iv = IssueVotes(issue_id)
            for v in issue_votes:
                iv.add_vote(v)
            senator.votes_by_issue.append(iv)

'''
========================================================================================================================
Building senator.json
========================================================================================================================
'''
def compute_attendance_rates():
    senate_all = _rollcall_df[_rollcall_df["vote_id"].str.startswith("s")]
    for senator in Senator.senators:
        senator_rows = senate_all[senate_all["bioguide_id"] == senator.lisID]
        total_votes = len(senator_rows)
        if total_votes > 0:
            absent_votes = (senator_rows["position"] == "Not Voting").sum()
            senator.attendanceRate = round((total_votes - absent_votes) / total_votes, 2)


def build_output(state_code, ces_state_sample):
    senate_all = _rollcall_df[_rollcall_df["vote_id"].str.startswith("s")]
    all_vote_ids = senate_all["vote_id"].dropna()
    congress_nums = sorted(
        {int(m.group(1)) for vid in all_vote_ids if (m := re.search(r"-(\d+)\.", vid))}
    )

    senators_list = []
    for senator in Senator.senators:
        senators_list.append({
            "name":           senator.name,
            "party":          senator.party,
            "seat_class":     senator.seat_class,
            "assumed_office": int(senator.dateStarted[:4]),
            "photo_url":      senator.photo_url,
            "votes_by_issue": [
                {
                    "issue_id": iv.issue_id,
                    "votes": [
                        {
                            "bill":           v.bill,
                            "title":          v.title,
                            "date":           v.date,
                            "vote":           v.vote,
                            "bill_direction": v.bill_direction,
                            "source_url":     v.source_url,
                        }
                        for v in iv.votes
                    ],
                    "summary": iv.summary(),
                }
                for iv in senator.votes_by_issue
            ],
            "overall_voting_stats": senator.overall_voting_stats,
        })

    return {
        "state_code":       state_code,
        "source":           "unitedstates/congress",
        "congress":         congress_nums,
        "last_updated":     date.today().isoformat(),
        "ces_state_sample": ces_state_sample,
        "senators":         senators_list,
    }


def write_output(output, state_code):
    output_path = f"data/states/{state_code}/senators.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)


def _reset_state():
    Senator.senators.clear()
    Vote.allVotes.clear()
    _lis_to_senator.clear()
    _seen_votes.clear()
    senatorVotes.clear()


def _all_senator_states():
    """Return sorted list of state codes that currently have at least one senator."""
    return sorted({
        entry["terms"][-1]["state"]
        for entry in _legislators
        if entry.get("terms") and entry["terms"][-1].get("type") == "sen"
    })


def generate_senator_json(state_code=None):
    """
    Generate senators.json for one state or every state.

    Args:
        state_code: 2-letter state code (e.g. "CA"). Pass None to run all states.
    """
    states = [state_code] if state_code else _all_senator_states()

    for state in states:
        _reset_state()
        create_senators(state)
        create_votes()
        create_issue_votes()
        compute_attendance_rates()
        write_output(build_output(state, CES_STATE_SAMPLE), state)
        print(f"wrote senators.json for {state}")

if __name__ == "__main__":
    generate_senator_json(STATE_CODE)
