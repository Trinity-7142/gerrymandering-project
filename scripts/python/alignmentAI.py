#The following code was produced by Gemini as a refactoring of human-written code.
import os
import csv
import json
from datetime import date

base_path = os.path.dirname(os.path.abspath(__file__))
home_path = os.path.join(base_path, "..", "..")

senator_rollcall_votes_path = os.path.join(home_path, "data-raw", "congress", "senator_rollcall_votes.csv")
bill_to_roll_path = os.path.join(home_path, "data-raw", "congress", "bill_to_roll.csv")
legislators_historical_path = os.path.join(home_path, "data-raw", "congress-legislators", "legislators-historical.json")
legislators_current_path = os.path.join(home_path, "data-raw", "congress-legislators", "legislators-current.json")

# --- Global Cache ---
JSON_CACHE = {}

def get_cached_json(filepath):
    if filepath not in JSON_CACHE:
        with open(filepath, "r", encoding="utf-8") as f:
            JSON_CACHE[filepath] = json.load(f)
    return JSON_CACHE[filepath]

class Politician:
    politicians = {}

    legislators_historical = get_cached_json(legislators_historical_path)
    legislators_current = get_cached_json(legislators_current_path)

    current_bioguide_ids = {leg["id"]["bioguide"] for leg in legislators_current if leg["id"].get("bioguide")}
    
    lis_to_bioguide_dict = {}
    LEGISLATOR_TERM_LOOKUP = {}
    
    for legislator in legislators_historical + legislators_current:
        lis = legislator["id"].get("lis")
        bioguide = legislator["id"].get("bioguide")

        if bioguide and lis:
            lis_to_bioguide_dict[lis] = bioguide
            
        terms = legislator.get("terms")
        if terms:
            last_term = terms[-1]
            LEGISLATOR_TERM_LOOKUP[bioguide] = last_term
            if lis:
                LEGISLATOR_TERM_LOOKUP[lis] = last_term

    CONFIDENCE_TO_NUM = {"High": 1.0, "Moderate": 0.6, "Low": 0.3}
    DIRECTION_TO_NUM = {"Liberal Direction": 1, "Conservative Direction": 0}

    def __init__(self, bioguide_id, name, state, party):
        self.bioguide_id = bioguide_id
        self.name = name
        self.state = state
        self.is_current = self.bioguide_id in Politician.current_bioguide_ids
        self.term_end = ""
        self.district = None
        self.role = None
        self.party = party
        
        self._populate_district_and_role()

        self.cpd_dict_by_issue = {}
        self.votes = []
        self.seen_vote_ids = set()
        self.issues_voted_for = set()
        self._weight_denominator_cache = None 
        
        Politician.politicians[bioguide_id] = self

    @staticmethod
    def create_politician(bioguide_or_lis, name, state, party):
        id_to_use = Politician.lis_to_bioguide_dict.get(bioguide_or_lis) if len(bioguide_or_lis) == 4 else bioguide_or_lis
        
        if id_to_use not in Politician.politicians:
            return Politician(id_to_use, name, state, party)
        return Politician.politicians[id_to_use]

    def _populate_district_and_role(self):
        term_data = self.LEGISLATOR_TERM_LOOKUP.get(self.bioguide_id)
        if term_data:
            self.term_end = term_data.get("end", "")
            term_type = term_data.get("type")
            
            if term_type == "rep":
                district_entry = term_data.get("district", 0)
                self.district = f"{self.state}-{district_entry + (1 if district_entry == 0 else 0):02d}"
                self.role = "rep"
            elif term_type == "sen":
                self.role = 'sen'
        
    def add_vote(self, vote_id, issue, bill_dir, conf):
        if vote_id not in self.seen_vote_ids:
            self.seen_vote_ids.add(vote_id)
            issue_lower = issue.lower()
            self.issues_voted_for.add(issue_lower)
            
            conf_val = self.CONFIDENCE_TO_NUM.get(conf if conf else "Moderate", 0.6)
            is_bip = (not bill_dir) or (bill_dir == "Bipartisan")
            dir_val = 0 if is_bip else self.DIRECTION_TO_NUM.get(bill_dir, 0)
            
            self.votes.append((issue_lower, conf_val, dir_val, is_bip))
    
    def compute_rvd_wdir_wbip(self, issue):
        numerator_total, denominator_total, w_dir, w_bip = 0, 0, 0, 0
        issue_lower = issue.lower()

        for v_issue, conf_val, dir_val, is_bip in self.votes:
            if v_issue == issue_lower: 
                if not is_bip:
                    w_dir += conf_val
                    numerator_total += conf_val * dir_val
                    denominator_total += conf_val
                else:
                    w_bip += conf_val

        rvd_avg = numerator_total / denominator_total if denominator_total > 0 else 0
        return (rvd_avg, w_dir, w_bip)
    
    def compute_per_issue_score(self, issue):
        rvd_avg, w_dir, w_bip = self.compute_rvd_wdir_wbip(issue)
        if w_dir + w_bip == 0:
            return 0
        cpd_avg = self.get_cpd(issue)
        return (w_dir * (1 - abs(cpd_avg - rvd_avg)) + w_bip) / (w_dir + w_bip)

    def get_cpd(self, issue):
        return self.cpd_dict_by_issue[issue]
    
    def populate_cpd_dict(self):
        if not self.cpd_dict_by_issue:
            if self.role == "rep":
                path = os.path.join(home_path, "public", "data", "districts", self.district, "ces_positions.json")
            elif self.role == "sen":
                path = os.path.join(home_path, "public", "data", "states", self.state, "ces_summary.json")
            else:
                return
            
            for issue in get_cached_json(path).get("issues", []):
                total_pct, valid_questions = 0, 0
                for question in issue.get("questions", []):
                    liberal_pct = question.get("binary_direction", {}).get("liberal_pct")
                    if liberal_pct is not None:
                        valid_questions += 1
                        total_pct += liberal_pct
                
                self.cpd_dict_by_issue[issue["issue_id"]] = (total_pct / valid_questions) if valid_questions > 0 else 0
            
    def renormalized_weight(self, issue):
        if self._weight_denominator_cache is None:
            self._weight_denominator_cache = sum(
                self.non_normalized_weight(e_issue) * self.penalty(e_issue)
                for e_issue in self.cpd_dict_by_issue.keys()
            )
            
        if self._weight_denominator_cache == 0: return 0
        return (self.non_normalized_weight(issue) * self.penalty(issue)) / self._weight_denominator_cache
    
    def non_normalized_weight(self, issue):
        data = get_cached_json(os.path.join(home_path, "public", "data", "states", self.state, "votecast_salience.json"))
        for item in data.get("salience", []):
            if item.get("issue_id") == issue:
                return item.get("pct", 0)
        return 0
    
    def penalty(self, issue):
        issue_lower = issue.lower()
        votes_for_issue = sum(1 for v in self.votes if v[0] == issue_lower)
        return 1 if votes_for_issue >= 3 else votes_for_issue * 0.25

    def overall_score(self):
        self.populate_cpd_dict()
        return sum(self.renormalized_weight(i) * self.compute_per_issue_score(i) for i in self.cpd_dict_by_issue.keys())


# --- Populate Data ---

bill_to_roll_dict = {}
with open(bill_to_roll_path, "r", encoding="utf-8") as f:
    for line in csv.DictReader(f):
        key = (line["Congress"][:3], line["Chamber"], line["Roll Call Num"], line["Date"])
        bill_to_roll_dict[key] = (line["Bill Direction"], line["Confidence"], line["Issue ID"])

with open(senator_rollcall_votes_path, "r", encoding="utf-8") as f:
    for line in csv.DictReader(f):
        if line["state"] == "XX": continue
            
        vote_id = line["vote_id"]
        chamber = vote_id[0].lower()
        parts = vote_id[1:].split("-")
        roll_call_num = parts[0].lower()
        congress = parts[1].split(".")[0].lower() if len(parts) > 1 else ""

        vote_data = bill_to_roll_dict.get((congress, chamber, roll_call_num, line["vote_date"]))
        if vote_data:
            bill_dir, conf, issue = vote_data
            p = Politician.create_politician(line["bioguide_id"], line["name"], line["state"], line["party"])
            p.add_vote(vote_id, issue, bill_dir, conf)


# --- Generation & File Writing ---

today_date = str(date.today())
INTERPRETATION_DICT = {
    "0.0_to_0.3": "Low Alignment",
    "0.3_to_0.6": "Partial Alignment",
    "0.6_to_0.8": "Moderate Alignment",
    "0.8_to_1.0": "Strong Alignment"
}

class AlignmentFiles:
    visited_states = set()

    @staticmethod
    def score_to_alignment(score):
        if score <= 0.3: return INTERPRETATION_DICT["0.0_to_0.3"]
        if score <= 0.6: return INTERPRETATION_DICT["0.3_to_0.6"]
        if score <= 0.8: return INTERPRETATION_DICT["0.6_to_0.8"]
        return INTERPRETATION_DICT["0.8_to_1.0"]

    @staticmethod
    def get_issue_scores(politician):
        scores = []
        for issue in politician.cpd_dict_by_issue.keys():
            if issue.lower() in politician.issues_voted_for:
                score = politician.compute_per_issue_score(issue)
                weight = politician.renormalized_weight(issue)
                scores.append({
                    "issue_id": issue,
                    "score": score,
                    "salience_weight": weight,
                    "weighted_contribution": score * weight,
                    "direction": AlignmentFiles.score_to_alignment(score)
                })
        return scores

    @staticmethod
    def generate_senator_dict(senator: Politician):
        score = senator.overall_score()
        return {
            "name": AlignmentFiles.get_senator_name(senator) or senator.name,
            "overall_score": score,
            "overall_label": AlignmentFiles.score_to_alignment(score),
            "issue_scores": AlignmentFiles.get_issue_scores(senator)
        }
    
    @staticmethod
    def generate_state_dict(state: str):
        senators_data = [
            AlignmentFiles.generate_senator_dict(p) for p in Politician.politicians.values()
            if p.role == "sen" and p.state == state and p.is_current and p.term_end >= today_date
        ]
        
        return {
            "state_code": state,
            "last_updated": today_date,
            "senators": senators_data,
            "interpretation": INTERPRETATION_DICT,
            "methodology_note": "Senator alignment scores computed as salience-weighted average of issue-level congruence between CES statewide positions and senator roll-call votes. VoteCast salience weights renormalized to exclude foreign_policy (no CES position data). See methodology page for full details."
        }

    @staticmethod
    def generate_district_dict(representative: Politician):
        score = representative.overall_score()
        return {
            "district_id": representative.district,
            "last_updated": today_date,
            "overall_score": score,
            "overall_label": AlignmentFiles.score_to_alignment(score),
            "score_range": { "min": 0, "max": 1 },
            "interpretation": INTERPRETATION_DICT,
            "issue_scores": AlignmentFiles.get_issue_scores(representative),
            "methodology_note": "Score computed as salience-weighted average of issue-level congruence between CES district positions and representative roll-call votes. VoteCast salience weights renormalized to exclude foreign_policy (no CES position data). See methodology page for full details."
        }
    
    @staticmethod
    def get_alignment_path(politician: Politician):
        data_path = os.path.join(home_path, "public", "data")
        if politician.role == "rep":
            return os.path.join(data_path, "districts", politician.district, "alignment.json")
        elif politician.role == "sen":
            return os.path.join(data_path, "states", politician.state, "alignment.json")
        return ""

    @staticmethod
    def populate_alignment_json():
        reps_by_district = {}

        for p in Politician.politicians.values():
            if p.role == "sen":
                if p.state not in AlignmentFiles.visited_states:
                    path = AlignmentFiles.get_alignment_path(p)
                    os.makedirs(os.path.dirname(path), exist_ok=True)
                    with open(path, "w", encoding="utf-8") as f:
                        json.dump(AlignmentFiles.generate_state_dict(p.state), f, indent=2)
                    AlignmentFiles.visited_states.add(p.state)
            elif p.role == "rep":
                reps_by_district.setdefault(p.district, []).append(p)
                    
        for reps in reps_by_district.values():
            most_recent_rep = reps[0]
            for rep in reps[1:]:
                if rep.is_current:
                    most_recent_rep = rep
            
            path = AlignmentFiles.get_alignment_path(most_recent_rep)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(AlignmentFiles.generate_district_dict(most_recent_rep), f, indent=2)
    
    @staticmethod
    def get_senator_name(senator):
        try:
            data = get_cached_json(os.path.join(home_path, "public", "data", "states", senator.state, "senators.json"))
            this_senator_name = senator.name.split(" ")[0]
            for s in data.get("senators", []):
                if this_senator_name in s.get("name", ""):
                    return s.get("name")
        except FileNotFoundError:
            pass
        return None

AlignmentFiles.populate_alignment_json()


with open(os.path.join(base_path, "alignment_scores.csv"), "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["ID", "Name", "Score", "Vote #", "State", "Term End", "Role", "Party"])
    for politician in Politician.politicians.values():
        writer.writerow([politician.bioguide_id, politician.name, politician.overall_score(), len(politician.votes), politician.state, politician.term_end, politician.role, politician.party])