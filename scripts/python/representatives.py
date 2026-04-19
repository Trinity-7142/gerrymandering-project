"""
representatives.py — generates public/data/districts/{DISTRICT}/representative.json
for one district, one or more states, or all current House districts.

Reads three source files:
  - data-raw/congress-legislators/legislators-current.json  — representative biographical data
  - data-raw/congress/house_roll_call_votes.csv             — House roll call votes
  - data-raw/congress/bill_to_roll.csv                      — tagged bills mapping roll calls to issues

Pipeline (run via generate_representative_json):
  1. create_representatives  — loads the current House member for the target district(s)
  2. create_votes            — joins bill_to_roll with House roll calls on roll call number + congress,
                               producing one Vote object per representative per tagged bill
  3. create_issue_votes      — groups each representative's votes by issue_id into IssueVotes objects
  4. compute_attendance_rates — computes attendance across ALL House votes, not just tagged ones
  5. build_output            — serializes each representative into representative.json
  6. write_output            — writes to public/data/districts/{DISTRICT}/representative.json

To run for a single district, set DISTRICT_ID at the top of this file and execute the script.
To run for one or more states, set STATE_CODES at the top of this file.
To regenerate all districts, call generate_representative_json() with no arguments.
"""

import csv
import json
import os
import re
from datetime import date


# ── Script parameters ──
DISTRICT_ID = None  # change to target district before running, e.g. "CA-11"
STATE_CODES = None  # change to "CA" or ["CA", "TX"] before running


# ── Module-level data loads (run once) ──
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.abspath(os.path.join(_SCRIPT_DIR, "..", ".."))

with open(
    os.path.join(_PROJECT_ROOT, "data-raw", "congress-legislators", "legislators-current.json"),
    encoding="utf-8",
) as _legislators_file:
    _legislators = json.load(_legislators_file)

with open(
    os.path.join(_PROJECT_ROOT, "data-raw", "congress", "house_roll_call_votes.csv"),
    encoding="utf-8",
) as _house_votes_file:
    _house_rollcall_rows = list(csv.DictReader(_house_votes_file))

with open(
    os.path.join(_PROJECT_ROOT, "data-raw", "congress", "bill_to_roll.csv"),
    encoding="utf-8",
) as _bill_to_roll_file:
    _bill_to_roll_rows = list(csv.DictReader(_bill_to_roll_file))


# ── Lookup indexes ──
_bioguide_to_representative = {}  # populated during Representative creation
_seen_votes = set()  # (bioguide_id, bill_id, congress) for dedup


PARTY_ABBREV = {"Democrat": "D", "Republican": "R", "Independent": "I"}
VALID_CATEGORIES = {"passage", "cloture", "amendment", "veto-override"}
BILL_DIRECTION_MAP = {
    "Conservative Direction": "conservative",
    "Liberal Direction": "liberal",
    "Bipartisan": "bipartisan",
}


def _normalize_bill_direction(value):
    if value is None:
        return None
    stripped = str(value).strip()
    if not stripped:
        return None
    return BILL_DIRECTION_MAP.get(stripped, stripped.lower())


def _district_id_from_term(state_code, district_number):
    """Format a congressional district as XX-NN, treating at-large seats as 01."""
    if district_number in (None, ""):
        return None

    district_num = int(district_number)
    if district_num == 0:
        district_num = 1

    return f"{state_code}-{district_num:02d}"


def _extract_congress(vote_id):
    match = re.search(r"-(\d+)\.", vote_id or "")
    return int(match.group(1)) if match else None


def _build_house_source_url(row):
    vote_id = row.get("vote_id", "")
    match = re.match(r"h(\d+)-(\d+)\.(\d+)", vote_id)
    if not match:
        return None

    roll_num = int(match.group(1))
    year = int(match.group(3))
    return f"https://clerk.house.gov/Votes/{year}{roll_num:03d}"


_HOUSE_CONGRESS_NUMS = sorted(
    {
        congress
        for congress in (_extract_congress(row.get("vote_id", "")) for row in _house_rollcall_rows)
        if congress is not None
    }
)


"""
========================================================================================================================
Representative Class
========================================================================================================================
"""


class Representative:
    representatives = []

    def __init__(
        self,
        bioID,
        district_id,
        firstName,
        lastName,
        birthday,
        dateStarted,
        party,
        photo_url,
        missedVotes=0,
        attendanceRate=0,
    ):
        self.firstName = firstName
        self.lastName = lastName
        self.birthday = birthday

        birth_date = date.fromisoformat(birthday)
        today = date.today()
        self.age = today.year - birth_date.year - (
            (today.month, today.day) < (birth_date.month, birth_date.day)
        )

        self.dateStarted = dateStarted
        self.party = party
        self.photo_url = photo_url
        self.missedVotes = missedVotes
        self.attendanceRate = attendanceRate
        self.bioID = bioID
        self.district_id = district_id
        self.votes_by_issue = []

        self.representatives.append(self)

    @property
    def name(self):
        return f"{self.firstName} {self.lastName}"

    @property
    def overall_voting_stats(self):
        total = sum(len(group.votes) for group in self.votes_by_issue)
        return {
            "total_tracked_votes": total,
            "attendance_rate": self.attendanceRate,
        }


"""
========================================================================================================================
IssueVotes Class
========================================================================================================================
"""


class IssueVotes:
    """Groups all Vote objects for one representative under one issue_id."""

    def __init__(self, issue_id):
        self.issue_id = issue_id
        self.votes = []

    def add_vote(self, vote):
        self.votes.append(vote)

    def summary(self):
        direction_counts = {}
        absent = 0
        for vote in self.votes:
            if vote.vote == "not voting":
                absent += 1
            else:
                direction_counts[vote.bill_direction] = (
                    direction_counts.get(vote.bill_direction, 0) + 1
                )

        result = {"total_votes": len(self.votes)}
        result.update(direction_counts)
        result["absent"] = absent
        return result


"""
========================================================================================================================
Vote Class
========================================================================================================================
"""


class Vote:
    allVotes = []

    def __init__(self, bill, title, date, vote, bill_direction, source_url, issue_id):
        self.bill = bill
        self.title = title
        self.date = date
        self.vote = vote
        self.bill_direction = bill_direction
        self.source_url = source_url
        self.issue_id = issue_id

        self.allVotes.append(self)


"""
========================================================================================================================
Populating
========================================================================================================================
"""


# key = Representative; value = [Vote, ...]
representativeVotes = {}


def create_representatives(target_district_ids=None):
    selected_districts = set(target_district_ids) if target_district_ids is not None else None

    for entry in _legislators:
        terms = entry.get("terms", [])
        if not terms:
            continue

        most_recent = terms[-1]
        if most_recent.get("type") != "rep":
            continue

        bioguide_id = entry["id"].get("bioguide")
        if not bioguide_id:
            continue

        district_id = _district_id_from_term(
            most_recent.get("state"),
            most_recent.get("district"),
        )
        if district_id is None:
            continue
        if selected_districts is not None and district_id not in selected_districts:
            continue
        if bioguide_id in _bioguide_to_representative:
            continue

        first_rep_term = next(term for term in terms if term["type"] == "rep")

        representative = Representative(
            bioID=bioguide_id,
            district_id=district_id,
            firstName=entry["name"]["first"],
            lastName=entry["name"]["last"],
            birthday=entry["bio"]["birthday"],
            dateStarted=first_rep_term["start"],
            party=PARTY_ABBREV.get(most_recent["party"], most_recent["party"]),
            photo_url=f"/images/reps/{district_id}.jpg",
        )
        _bioguide_to_representative[bioguide_id] = representative


def create_votes():
    tracked_house_votes = {}
    for row in _bill_to_roll_rows:
        if row.get("Chamber") != "h":
            continue
        if row.get("Category") not in VALID_CATEGORIES:
            continue

        congress_match = re.search(r"(\d+)", row.get("Congress", ""))
        roll_num = row.get("Roll Call Num")
        if not congress_match or roll_num in (None, ""):
            continue

        key = (int(congress_match.group(1)), int(roll_num))
        tracked_house_votes.setdefault(key, []).append(row)

    for row in _house_rollcall_rows:
        vote_id = row.get("vote_id", "")
        if not vote_id.startswith("h"):
            continue

        congress = _extract_congress(vote_id)
        bill_number = row.get("bill_number")
        bioguide_id = row.get("bioguide_id")
        if congress is None or bill_number in (None, "") or not bioguide_id:
            continue

        representative = _bioguide_to_representative.get(bioguide_id)
        if representative is None:
            continue

        for tracked_vote in tracked_house_votes.get((congress, int(bill_number)), []):
            bill_id = tracked_vote["Bill ID"]
            bill_direction = _normalize_bill_direction(tracked_vote.get("Bill Direction"))
            if bill_direction is None:
                continue

            dedup_key = (bioguide_id, bill_id, congress)
            if dedup_key in _seen_votes:
                continue
            _seen_votes.add(dedup_key)

            vote = Vote(
                bill=bill_id,
                title=row.get("question") or tracked_vote.get("Question"),
                date=(row.get("vote_date") or "")[:10],
                vote=(row.get("position") or "").lower(),
                bill_direction=bill_direction,
                source_url=_build_house_source_url(row),
                issue_id=tracked_vote["Issue ID"].lower().replace(" ", "_"),
            )
            representativeVotes.setdefault(representative, []).append(vote)


def create_issue_votes():
    for representative in Representative.representatives:
        votes = representativeVotes.get(representative, [])

        by_issue = {}
        for vote in votes:
            by_issue.setdefault(vote.issue_id, []).append(vote)

        for issue_id in sorted(by_issue):
            issue_votes = sorted(by_issue[issue_id], key=lambda vote: (vote.date, vote.bill))
            issue_group = IssueVotes(issue_id)
            for vote in issue_votes:
                issue_group.add_vote(vote)
            representative.votes_by_issue.append(issue_group)


def compute_attendance_rates():
    attendance_by_bioguide = {}
    for row in _house_rollcall_rows:
        bioguide_id = row.get("bioguide_id")
        if bioguide_id not in _bioguide_to_representative:
            continue

        stats = attendance_by_bioguide.setdefault(bioguide_id, {"total": 0, "absent": 0})
        stats["total"] += 1
        if row.get("position") == "Not Voting":
            stats["absent"] += 1

    for representative in Representative.representatives:
        stats = attendance_by_bioguide.get(representative.bioID, {"total": 0, "absent": 0})
        total_votes = stats["total"]
        if total_votes > 0:
            absent_votes = stats["absent"]
            representative.attendanceRate = round((total_votes - absent_votes) / total_votes, 2)


def build_output(district_id):
    representative = next(
        rep for rep in Representative.representatives if rep.district_id == district_id
    )

    return {
        "district_id": representative.district_id,
        "representative": representative.name,
        "age": representative.age,
        "party": representative.party,
        "assumed_office": int(representative.dateStarted[:4]),
        "photo_url": representative.photo_url,
        "congress": _HOUSE_CONGRESS_NUMS,
        "last_updated": date.today().isoformat(),
        "votes_by_issue": [
            {
                "issue_id": issue_votes.issue_id,
                "votes": [
                    {
                        "bill": vote.bill,
                        "title": vote.title,
                        "date": vote.date,
                        "vote": vote.vote,
                        "bill_direction": vote.bill_direction,
                        "source_url": vote.source_url,
                    }
                    for vote in issue_votes.votes
                ],
                "summary": issue_votes.summary(),
            }
            for issue_votes in representative.votes_by_issue
        ],
        "overall_voting_stats": representative.overall_voting_stats,
    }


def write_output(output, district_id):
    output_path = os.path.join(
        _PROJECT_ROOT, "public", "data", "districts", district_id, "representative.json"
    )
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as output_file:
        json.dump(output, output_file, indent=2)


def _reset_state():
    Representative.representatives.clear()
    Vote.allVotes.clear()
    _bioguide_to_representative.clear()
    _seen_votes.clear()
    representativeVotes.clear()


def _all_district_ids():
    district_ids = set()
    for entry in _legislators:
        terms = entry.get("terms", [])
        if not terms or terms[-1].get("type") != "rep":
            continue

        district_id = _district_id_from_term(
            terms[-1].get("state"),
            terms[-1].get("district"),
        )
        if district_id:
            district_ids.add(district_id)

    return sorted(district_ids)


def _coerce_state_codes(state_codes):
    if state_codes is None:
        return None
    if isinstance(state_codes, str):
        return {state_codes.upper()}
    return {state_code.upper() for state_code in state_codes}


def _district_ids_for_states(state_codes):
    state_code_set = _coerce_state_codes(state_codes)
    if state_code_set is None:
        return _all_district_ids()
    return [
        district_id
        for district_id in _all_district_ids()
        if district_id.split("-", 1)[0] in state_code_set
    ]


def _resolve_target_districts(district_id=None, state_codes=None):
    if district_id is not None and state_codes is not None:
        raise ValueError("Pass either district_id or state_codes, not both.")
    if district_id is not None:
        return [district_id]
    if state_codes is not None:
        return _district_ids_for_states(state_codes)
    return _all_district_ids()


def generate_representative_json(district_id=None, state_codes=None):
    """
    Generate representative.json for one district, one or more states, or every
    current House district.

    Args:
        district_id: District code like "CA-11". Pass None to run all districts.
        state_codes: State code like "CA" or iterable like ["CA", "TX"].
    """
    districts = _resolve_target_districts(district_id=district_id, state_codes=state_codes)
    if not districts:
        return

    _reset_state()
    create_representatives(districts)
    create_votes()
    create_issue_votes()
    compute_attendance_rates()

    for district in districts:
        write_output(build_output(district), district)
        print(f"wrote representative.json for {district}")


if __name__ == "__main__":
    generate_representative_json(district_id=DISTRICT_ID, state_codes=STATE_CODES)
