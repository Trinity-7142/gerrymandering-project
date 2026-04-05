"""
This file has two tasks: to generate the alignment.json file on the district and on the state level.

\public
    \data
        \states
            \AK
                ces_summary.json (carries aggregated data for all districts in that state)
                senators.json 
                alignment.json (carries data about the senators in that state)
            ...
            (other states with same data)
        \districts
            \AK-01
                ces_positions.json (carries data for an individual district within the state)
                alignment.json (carries data about the representatives in that state)
            ... 
            (other districts in other states with same data)


We will first generate the district-level alignment.json files, then aggregate those into the state-level alignment.json files
PLAN:
- Iterate through \data-raw\votes\congressional_vote_tagging_database_all.csv
- Make a dictionary between the bill's number and its issue category and direction  


==== {district} \ alignment.json
(Do the next steps simultaneously, if possible, to avoid reiterating over a large list)
- Collect all relevant votes from senator_rollcall_votes.csv. (i.e. those votes which deal with the bills in our vote tagging database)
- Use the dictionary to assign each vote a liberal/conservative direction, as well as a topic (economy, immigration, etc...)
- Make a dictionary from a certain representative to a list of their votes

- Compute the RVD for each representative.
- Combine with CPD data to compute alignment metric for that representative

==== {state} \ alignment.json
- Repeat the process described for {district} \ alignment.json

"""

import os
import csv
import json
import re
import copy
from datetime import date

base_path = os.path.dirname(os.path.abspath(__file__))
home_path = os.path.join(base_path, "..", "..")
votes_path = os.path.join(home_path, "votes")

senator_rollcall_votes_path = os.path.join(home_path, "data-raw", "congress", "senator_rollcall_votes.csv")
bill_to_roll_path = os.path.join(home_path, "data-raw", "bill_to_roll.csv")
legislators_historical_path = os.path.join(home_path, "data-raw", "congress-legislators", "legislators-historical.json")
legislators_current_path = os.path.join(home_path, "data-raw", "congress-legislators", "legislators-current.json")

"""
1. Load in bill_to_roll.csv 
2. For each line in senator_rollcall_votes.csv, check to see if it is in bill_to_roll.csv
    a. If it is, then add the relevant voting information to that politicians data.
3. When all politicians have their voting information, compute alignment metric info.

"""

class Politician:
    # A mapping by bioguide ID to their corresponding politician object
    politicians = {}

    with open(legislators_historical_path, "r", encoding="utf-8") as legislators_historical_file:
        legislators_historical = json.load(legislators_historical_file)
    with open(legislators_current_path, "r", encoding="utf-8") as legislators_current_file:
        legislators_current = json.load(legislators_current_file)
    
    #Investigate truncating this file to the shortest length possible. We don't need the first senators in existence.
    all_legislators_data = legislators_historical+legislators_current 

    def __init__(self, bioguide_id, name, state, party):
        self.bioguide_id = bioguide_id
        self.name = name
        self.state = state
        self.party = party

        self.district = None
        self.role = None
        self.populate_district_and_role()

        self.cpd_dict_by_issue = {}
        self.votes = []
        self.issues_voted_for = []
        Politician.politicians[bioguide_id] = self

    @staticmethod
    def create_politician(bioguide_id, name, state, party):
        #If the required politician does not exist, create it.
        #Otherwise, return the existing one

        supposed_politician = Politician.politicians.get(bioguide_id)
        if supposed_politician is None:
            Politician.politicians[bioguide_id] = Politician(bioguide_id, name, state, party)
            return Politician.politicians[bioguide_id]
        return supposed_politician

    

    def populate_district_and_role(self):
        for person in Politician.all_legislators_data:
            #Apparently, the senator rollcall vote data uses both bioguide IDs and "lis" IDs in the bioguide field.
            if person["id"].get("bioguide") == self.bioguide_id or person["id"].get("lis") == self.bioguide_id:
                if person["terms"][-1]["type"] == "rep": #If their most recent term is as a representative
                    district_entry = person["terms"][-1]["district"]

                    if district_entry == 0: #It is an at large state, and to match our formatting, should be incremented by one
                        district_entry += 1

                    self.district = self.state + "-" + ("0" if len(str(district_entry)) == 1 else "") + str(district_entry)
                    self.role = "rep"
                elif person["terms"][-1]["type"] == "sen": 
                    self.role = 'sen'
                else:
                    print(person["terms"][-1]["type"] + "BLARGHH")
        if self.role == None:
            print("Unknown person:", self.bioguide_id, self.state)
        
    def add_vote(self, vote):#chamber, roll_call_num, bill_direction):
        if vote not in self.votes:
            self.votes.append(vote)
            if vote.issue not in self.issues_voted_for:
                self.issues_voted_for.append(vote.issue.lower())
        #self.votes.append(Vote.findVote(chamber, roll_call_num, bill_direction))
    
    def compute_rvd_wdir_wbip(self, issue):
        #Computes the RVD_avg for a given issue as well as the W_dir and W_bip.
        #Returns a tuple of the 3 values
        #It's easier to compute them all at once than it is to traverse everything again
        numerator_total = 0
        denominator_total = 0

        confidence_to_num = {"High": 1.0,
                             "Moderate": 0.6,
                             "Low": 0.3}
        
        direction_to_num = {"Liberal Direction": 1,
                            "Conservative Direction" : 0}
        
        w_dir = 0
        w_bip = 0

        for vote in self.votes:
            #print(vote, vote.direction_confidence)
            #print(issue)

            if vote.direction_confidence == "": #Make sure to fill all the empty direction confidence fields!!!
                vote.direction_confidence = "Moderate"
            if vote.bill_direction == "":
                vote.bill_direction = "Bipartisan"

            if vote.issue.lower() == issue.lower(): 
                if vote.bill_direction != "Bipartisan":
                    w_dir += confidence_to_num[vote.direction_confidence]
                    numerator_total += confidence_to_num[vote.direction_confidence] * direction_to_num[vote.bill_direction]
                    denominator_total += confidence_to_num[vote.direction_confidence]
                else:
                    w_bip += confidence_to_num[vote.direction_confidence]

        #If the politician has cast no votes on the issue, then we will say that the RVD equals 0
        return (numerator_total/denominator_total if denominator_total > 0 else 0, w_dir, w_bip)
    
    def compute_per_issue_score(self, issue):
        result = self.compute_rvd_wdir_wbip(issue)

        rvd_avg = result[0]
        w_dir = result[1]
        w_bip = result[2]
        cpd_avg = self.get_cpd(issue)

        if w_dir + w_bip == 0:
            #RETURN A DEFAULT SCORE if this politician did not vote on any of these issues, or they were all bipartisan
            return 0

        return (w_dir * (1 - abs(cpd_avg - rvd_avg)) + w_bip) / (w_dir + w_bip)

    def get_cpd(self, issue):
        #If CPD data has already been fetched, don't waste time retrieving it again. Otherwise, retrieve it.
        #Takes and returns the average of the binary_direction liberal_pct field in ces_positions.json

        #Useless, already called elsewhere
        #self.populate_cpd_dict()

        return self.cpd_dict_by_issue[issue]
    
    def populate_cpd_dict(self):
        if self.cpd_dict_by_issue == {}:
            ces_positions_path = ""
            #print(self.role) -> None
            if self.role == "rep":
                ces_positions_path = os.path.join(home_path, "public", "data", "districts", self.district, "ces_positions.json")
            elif self.role == "sen":
                ces_positions_path = os.path.join(home_path, "public", "data", "states", self.state, "ces_summary.json")
            else:
                print(self.role)
            
            with open(ces_positions_path, "r", encoding="utf-8") as ces_positions_file:
                    ces_positions_data = json.load(ces_positions_file)
                    for issue in ces_positions_data["issues"]:
                        self.cpd_dict_by_issue[issue["issue_id"]] = 0 
                        valid_questions = 0

                        for question in issue["questions"]:
                            #print(question["binary_direction"])
                            if question["binary_direction"].get("liberal_pct"): #Not every issue question in ces_positions has a filled out binary_direction dictionary. Take note of this and bring it up
                                valid_questions += 1
                                self.cpd_dict_by_issue[issue["issue_id"]] += question["binary_direction"]["liberal_pct"]
                        
                        #Do we really want to set the CPD to zero if there are no valid questions found?
                        if valid_questions > 0:
                            self.cpd_dict_by_issue[issue["issue_id"]] /= valid_questions
                            valid_questions = 0
                        else:
                            #print("heyoo")
                            #print(issue)
                            self.cpd_dict_by_issue[issue["issue_id"]] = 0
            
    def renormalized_weight(self, issue):
        numerator = self.non_normalized_weight(issue) * self.penalty(issue)
        denominator = 0
        for each_issue in self.cpd_dict_by_issue.keys():
            denominator += self.non_normalized_weight(each_issue) * self.penalty(each_issue)
        
        return numerator / denominator
    
    #It might be a faster approach (but not necessarily necessary)
    #to load the data in only once and save it for later.
    #Maybe create a State class with the info and have a static dictionary of States in Politician
    def non_normalized_weight(self, issue):
        votecast_salience_path = os.path.join(home_path, "public", "data", "states", self.state, "votecast_salience.json")
        with open(votecast_salience_path, "r", encoding="utf-8") as votecast_salience_file:
            data = json.load(votecast_salience_file)
            for issue_description in data.get("salience"):
                if issue_description.get("issue_id") == issue:
                    return issue_description.get("pct")

    
    def penalty(self, issue):
        votes_for_issue = len([v for v in self.votes if v.issue.lower() == issue.lower()])
        if votes_for_issue >= 3:
            return 1
        else:
            return votes_for_issue * 0.25

    def overall_score(self):
        total = 0
        self.populate_cpd_dict()
        for issue in self.cpd_dict_by_issue.keys():
            total += self.renormalized_weight(issue) * self.compute_per_issue_score(issue)
        return total
    
    def has_voted_for_issue(self, issue):
        return issue.lower() in self.issues_voted_for


class Vote:
    votes = {}

    @staticmethod
    def find_vote(chamber, roll_call_num, bill_direction, direction_confidence, issue, vote_date):
        #If the required vote does not exist, create and return a new one.
        #If it does exist, return that one
        key_str = chamber + roll_call_num + vote_date
        val_vote = Vote.votes.get(key_str)
        if val_vote is None:
            return Vote(chamber, roll_call_num, bill_direction, direction_confidence, issue, vote_date)
        return val_vote
    
    @staticmethod
    def is_relevant_vote(vote_id, vote_date, bill_to_roll_dict):
        #Returns False if the bill is not in bill_to_roll.csv
        #Returns the vote object if the bill IS in bill_to_roll.csv
        split_vote_id = re.split("h|s|-|\.", vote_id)
        #print(vote_id, split_vote_id)

        congress = split_vote_id[2].lower()
        chamber = vote_id[:1].lower()
        roll_call_num = split_vote_id[1].lower()
        
        
        
        #print(bill_to_roll_reader.fieldnames)
        key = (congress, chamber, roll_call_num, vote_date)
        #print(key)
        if key in bill_to_roll_dict:
            bill_direction = bill_to_roll_dict[key][0]
            direction_confidence = bill_to_roll_dict[key][1]
            issue = bill_to_roll_dict[key][2]
            return Vote.find_vote(chamber, roll_call_num, bill_direction, direction_confidence, issue, vote_date)
        return False

    def __init__(self, chamber, roll_call_num, bill_direction, direction_confidence, issue, vote_date):
        self.chamber = chamber
        self.roll_call_num = roll_call_num
        self.bill_direction = bill_direction
        self.direction_confidence = direction_confidence
        self.issue = issue
        self.vote_date = vote_date

        #Add self to static votes list
        Vote.votes[str(self)] = self

    def __str__(self):
        return str(self.chamber) + str(self.roll_call_num)
    
    def __eq__(self, value):
        return str(self) == str(value)

# This big chunk of code goes through senator_rollcall_votes.csv and bill_to_roll.csv
# In order to populate Politician.politicians with all of its necessary politicians, as well as their tagged votes.

bill_to_roll_dict = {}
with open(bill_to_roll_path, "r", encoding="utf-8") as bill_to_roll_file:
    bill_to_roll_reader = csv.DictReader(bill_to_roll_file)
    for line in bill_to_roll_reader:
        key = (line["Congress"][:3], line["Chamber"], line["Roll Call Num"], line["Date"])

        if bill_to_roll_dict.get(key) != None:
            # Currently, we are overwriting data in this dictionary because multiple entries in bill_to_roll.csv
            # exist for the same bill, such as cloture and passsage votes. We need to choose one, or change our approach to classifying bills
            print(key)
            print("ALERT! You are overwriting data in this dictionary bucko")

        bill_to_roll_dict[key] = (line["Bill Direction"], line["Confidence"], line["Issue ID"])

with open(senator_rollcall_votes_path, "r", encoding="utf-8") as rollcall_votes_file:
    rollcall_reader = csv.DictReader(rollcall_votes_file)

    for line in rollcall_reader:
        # If the vote is in bill_to_roll.csv
        line_vote = Vote.is_relevant_vote(line["vote_id"], line["vote_date"], bill_to_roll_dict) #Returns false OR a Vote object
        if line_vote != False:
            if line["state"] == "XX":
                continue #Skip to next line
            Politician.create_politician(line["bioguide_id"], line["name"], line["state"], line["party"]).add_vote(line_vote)


#Now we will populate the alignment.json files for each state and district

today_date = str(date.today())

senator_template = {
      "name": "Alex Padilla",
      "overall_score": 0.79,
      "overall_label": "Moderate Alignment",
      "issue_scores": []
    }

state_template = {
  "state_code": None,
  "last_updated": today_date,
  "senators": [],
  "interpretation": {
    "0.0_to_0.3": "Low Alignment",
    "0.3_to_0.6": "Partial Alignment",
    "0.6_to_0.8": "Moderate Alignment",
    "0.8_to_1.0": "Strong Alignment"
  },
  "methodology_note": "Senator alignment scores computed as salience-weighted average of issue-level congruence between CES statewide positions and senator roll-call votes. VoteCast salience weights renormalized to exclude foreign_policy (no CES position data). See methodology page for full details."
}

district_template = {

  "district_id": None,
  "last_updated": today_date,
  "overall_score": 0,
  "overall_label": None,
  "score_range": { "min": 0, "max": 1 },
  "interpretation": {
    "0.0_to_0.3": "Low Alignment",
    "0.3_to_0.6": "Partial Alignment",
    "0.6_to_0.8": "Moderate Alignment",
    "0.8_to_1.0": "Strong Alignment"
  },
  "issue_scores": [],
  "methodology_note": "Score computed as salience-weighted average of issue-level congruence between CES district positions and representative roll-call votes. VoteCast salience weights renormalized to exclude foreign_policy (no CES position data). See methodology page for full details."
}

issue_template = {
          "issue_id": "environment",
          "score": 0.85,
          "salience_weight": 0.145,
          "weighted_contribution": 0.123,
          "direction": "Senator generally matches constituent preferences"
        }

class AlignmentFiles:

    visited_states = []

    @staticmethod
    def populate_issues(politician, destination):
        for issue in politician.cpd_dict_by_issue.keys():
            if politician.has_voted_for_issue(issue):
                new_issue = copy.deepcopy(issue_template)
                new_issue["issue_id"] = issue
                new_issue["score"] = politician.compute_per_issue_score(issue)
                new_issue["salience_weight"] = politician.renormalized_weight(issue) 
                new_issue["weighted_contribution"] = new_issue["score"] * new_issue["salience_weight"]
                new_issue["direction"] = AlignmentFiles.score_to_alignment("district" if politician.district is not None else "state", new_issue["score"])

                destination.append(new_issue)

    @staticmethod
    def generate_senator_template(senator: Politician):
        new_senator = copy.deepcopy(senator_template)

        new_senator["name"] = senator.name
        new_senator["overall_score"] = senator.overall_score()
        new_senator["overall_label"] = AlignmentFiles.score_to_alignment("state", new_senator["overall_score"])

        AlignmentFiles.populate_issues(senator, new_senator["issue_scores"])
        return new_senator
    
    @staticmethod
    def generate_state_template(state: str):
        new_state = copy.deepcopy(state_template)

        new_state["state_code"] = state
        for p in Politician.politicians.values():
            if p.role == "sen" and p.state == state:
                new_state["senators"].append(AlignmentFiles.generate_senator_template(p))
        return new_state

    @staticmethod
    def generate_district_template(representative: Politician):
        new_district = copy.deepcopy(district_template)

        new_district["district_id"] = representative.district
        new_district["overall_score"] = representative.overall_score()
        new_district["overall_label"] = AlignmentFiles.score_to_alignment("district", new_district["overall_score"])

        AlignmentFiles.populate_issues(representative, new_district["issue_scores"])
        return new_district
    
    @staticmethod
    def score_to_alignment(state_or_district, score):
        ruler = None
        if state_or_district == "state":
            ruler = state_template["interpretation"]
        elif state_or_district == "district":
            ruler = district_template["interpretation"]
        
        #print(ruler.keys())
        if score <= 0.3:
            return ruler["0.0_to_0.3"]
        elif score <= 0.6:
            return ruler["0.3_to_0.6"]
        elif score <= 0.8:
            return ruler["0.6_to_0.8"]
        elif score <= 1.0:
            return ruler["0.8_to_1.0"]
    
    @staticmethod
    def get_alignment_path(politician: Politician):
        data_path = os.path.join(home_path, "public", "data")

        return_path = ""
        if politician.role == "rep":
            return_path = os.path.join(data_path, "districts", politician.district, "alignment.json")
        elif politician.role == "sen":
            return_path = os.path.join(data_path, "states", politician.state, "alignment.json")
        
        return return_path

    @staticmethod
    def populate_alignment_json():
        num = 0
        for p in Politician.politicians.values():
            print(num)
            num += 1

            if p.role == "sen" and p.state in AlignmentFiles.visited_states:
                continue


            alignment_path = AlignmentFiles.get_alignment_path(p)
            
            with open(alignment_path, "w", encoding = "utf-8") as alignment_json:
                to_dump = None
                if p.role == "rep":
                    to_dump = AlignmentFiles.generate_district_template(p)
                elif p.role == "sen":
                    to_dump = AlignmentFiles.generate_state_template(p.state)
                    AlignmentFiles.visited_states.append(p.state)
                json.dump(to_dump, alignment_json)
              

AlignmentFiles.populate_alignment_json()


# # ==========================================
# # EDGE CASE TESTING
# # ==========================================

# # 1. CREATE THE PERFECT ALIGNMENT POLITICIAN (Score: 1.0)
# perfect_match = Politician("TEST-01", "Perfect Match", "XX", "Democrat")
# perfect_match.role = "sen"
# perfect_match.district = "XX-01"

# # Mock the dictionaries to avoid File I/O
# perfect_match.cpd_dict_by_issue = {"environment": 1.0}
# perfect_match.salience_dict_by_issue = {"environment": 1.0}
# perfect_match.salience_populated = True

# # Disable the file-reading methods for this specific test object
# perfect_match.populate_cpd_dict = lambda: None
# perfect_match.populate_salience_dict = lambda: None
# perfect_match.non_normalized_weight = lambda issue: 1.0

# # Create and add 3 completely liberal votes on the environment
# vote1 = Vote("s", "101", "Liberal Direction", "High", "environment", "2026-01-01")
# vote2 = Vote("s", "102", "Liberal Direction", "High", "environment", "2026-01-02")
# vote3 = Vote("s", "103", "Liberal Direction", "High", "environment", "2026-01-03")

# perfect_match.add_vote(vote1)
# perfect_match.add_vote(vote2)
# perfect_match.add_vote(vote3)


# # 2. CREATE THE PERFECT DEFIANCE POLITICIAN (Score: 0.0)
# total_defiance = Politician("TEST-02", "Total Defiance", "XX", "Republican")
# total_defiance.role = "sen"
# total_defiance.district = "XX-02"

# # Mock the exact same constituent preferences (District wants liberal policies)
# total_defiance.cpd_dict_by_issue = {"environment": 1.0}
# total_defiance.salience_dict_by_issue = {"environment": 1.0}
# total_defiance.salience_populated = True

# # Disable the file-reading methods for this specific test object
# total_defiance.populate_cpd_dict = lambda: None
# total_defiance.populate_salience_dict = lambda: None
# total_defiance.non_normalized_weight = lambda issue: 1.0

# # Create and add 3 completely conservative votes on the environment (opposite of CPD)
# vote4 = Vote("s", "201", "Conservative Direction", "High", "environment", "2026-01-04")
# vote5 = Vote("s", "202", "Conservative Direction", "High", "environment", "2026-01-05")
# vote6 = Vote("s", "203", "Conservative Direction", "High", "environment", "2026-01-06")

# total_defiance.add_vote(vote4)
# total_defiance.add_vote(vote5)
# total_defiance.add_vote(vote6)


# # ==========================================
# # PRINT RESULTS
# # ==========================================
# print(f"--- Perfect Match Overall Score: {perfect_match.overall_score()} ---")
# for issue in perfect_match.cpd_dict_by_issue:
#     print(f"Issue: {issue}")
#     print(f"Score: {perfect_match.compute_per_issue_score(issue)}")

# print(f"\n--- Total Defiance Overall Score: {total_defiance.overall_score()} ---")
# for issue in total_defiance.cpd_dict_by_issue:
#     print(f"Issue: {issue}")
#     print(f"Score: {total_defiance.compute_per_issue_score(issue)}")




"""num = 1
senator_num = 0
representative_num = 0


overall_average = 0
senator_average = 0
representative_average = 0

for p in Politician.politicians.values():
    score = p.overall_score()
    print(num, p.bioguide_id, p.name, p.district, len(p.votes), p.role, p.party, score)
    overall_average += score
    if p.role == "sen":
        senator_average += score
        senator_num += 1
    elif p.role == "rep":
        representative_average += score * int(p.role == "rep")
        representative_num += 1
    num += 1

overall_average /= num
senator_average /= senator_num
representative_average /= representative_num

print("Overall:", overall_average)
print("Senate:", senator_average)
print("House:", representative_average)"""
                
