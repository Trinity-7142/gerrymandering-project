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
import re

base_path = os.path.dirname(os.path.abspath(__file__))
home_path = os.path.join(base_path, "..", "..")
votes_path = os.path.join(home_path, "votes")

senator_rollcall_votes_path = os.path.join(home_path, "data-raw", "congress", "senator_rollcall_votes.csv")
bill_to_roll_path = os.path.join(home_path, "data-raw", "bill_to_roll.csv")

"""
1. Load in bill_to_roll.csv 
2. For each line in senator_rollcall_votes.csv, check to see if it is in bill_to_roll.csv
    a. If it is, then add the relevant voting information to that politicians data.
3. When all politicians have their voting information, compute alignment metric info.


"""

class Politician:
    # A mapping by bioguide ID to their corresponding politician object
    politicians = {}

    @staticmethod
    def create_politician(bioguide_id):
        #If the required politician does not exist, create it.
        #Otherwise, return the existing one

        supposed_politician = Politician.politicians.get(bioguide_id)
        if supposed_politician is None:
            Politician.politicians[bioguide_id] = Politician(bioguide_id)
            return Politician.politicians[bioguide_id]
        return supposed_politician

    def __init__(self, bioguide_id):
        self.bioguide_id = bioguide_id
        self.votes = []
        Politician.politicians[bioguide_id] = self

    def add_vote(self, vote):#chamber, roll_call_num, bill_direction):
        if vote not in self.votes:
            self.votes.append(vote)
        #self.votes.append(Vote.findVote(chamber, roll_call_num, bill_direction))


class Vote:
    votes = {}

    @staticmethod
    def find_vote(chamber, roll_call_num, bill_direction, direction_confidence):
        #If the required vote does not exist, create and return a new one.
        #If it does exist, return that one
        key_str = str(chamber) + str(roll_call_num)
        val_vote = Vote.votes.get(key_str)
        if val_vote is None:
            return Vote(chamber, roll_call_num, bill_direction, direction_confidence)
        return val_vote
    
    @staticmethod
    def is_relevant_vote(vote_id, bill_to_roll_dict):
        #Returns False if the bill is not in bill_to_roll.csv
        #Returns the vote object if the bill IS in bill_to_roll.csv
        
        chamber = vote_id[:1]
        roll_call_num = re.split("h|s|-", vote_id)[1]
        
        #print(bill_to_roll_reader.fieldnames)
        key = (chamber, roll_call_num)
        #print(key)
        if key in bill_to_roll_dict:
            bill_direction = bill_to_roll_dict[key][0]
            direction_confidence = bill_to_roll_dict[key][1]
            return Vote.find_vote(chamber, roll_call_num, bill_direction, direction_confidence)
        return False

    def __init__(self, chamber, roll_call_num, bill_direction, direction_confidence):
        self.chamber = chamber
        self.roll_call_num = roll_call_num
        self.bill_direction = bill_direction
        self.direction_confidence = direction_confidence

        #Add self to static votes list
        Vote.votes[str(self)] = self

    def __str__(self):
        return str(self.chamber) + str(self.roll_call_num)
    
    def __eq__(self, value):
        return str(self) == str(value)

# This big chunk of code goes through senator_rollcall_votes.csv and bill_to_roll.csv
# In order to populate Politician.politicians with all of its necessary politicians, as well as their 

bill_to_roll_dict = {}
with open(bill_to_roll_path, "r", encoding="utf-8") as bill_to_roll_file:
    bill_to_roll_reader = csv.DictReader(bill_to_roll_file)
    for line in bill_to_roll_reader:
        key = (line["Chamber"], line["Roll Call Num"])
        bill_to_roll_dict[key] = (line["Bill Direction"], line["Confidence"])

with open(senator_rollcall_votes_path, "r", encoding="utf-8") as rollcall_votes_file:
    rollcall_reader = csv.DictReader(rollcall_votes_file)

    for line in rollcall_reader:
        #If the vote is in bill_to_roll.csv
        line_vote = Vote.is_relevant_vote(line["vote_id"], bill_to_roll_dict) #Returns false OR a Vote object
        if line_vote != False:
            Politician.create_politician(line["bioguide_id"]).add_vote(line_vote)

for p in Politician.politicians.values():
    #print(p.bioguide_id, end=", ")
    print(len(p.votes))
    if len(p.votes) > 240:
        #print(p.votes)
        print(p.bioguide_id, end=", ")
        for v in p.votes:
            print(v, end=" ")
        print(end="\n\n\n")
    #for v in p.votes:
    #    print(v, end=" ")
    #print(end="\n\n\n")

print(len(Politician.politicians))
                



























































































"""
class BillManager:
    #This is a dictionary that maps from a bill's ID to an array containing its direction (liberal, conservative) and the relevant issue it is categorized in (economy, immigration, etc...)
    bill_num_to_details = {}

    def __init__():
        BillManager.load_bill_details()

    def load_bill_details(this):
        #Populate the dictionary from relevant information in the votes tagging database
        with open(os.path.join(votes_path, "congressional_vote_tagging_database_all.csv"), "r", encoding="utf-8") as vote_db_csv:
            csvReader = csv.DictReader(vote_db_csv)
            for line in csvReader:
                bill_num_to_details[line["Bill ID"]] = [line["Bill Direction"], line["Issue ID"]]
    
    ### Creating functions to avoid pure array indexing
    def get_bill_direction(this, bill_num):
        return bill_num_to_details[bill_num][0]
    def get_bill_issue(this, bill_num):
        return bill_num_to_details[bill_num][1]

myManager = BillManager()

#A big list containing
relevant_votes = []


class Politician:
    politicians = []

    def __init__(self):
        Politician.politicians.append(self)
        votes = []"""