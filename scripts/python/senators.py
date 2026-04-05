"""
GOAL: Create a separate file for each state containing information about that state
        and a biographical list of senators, formatted as follows:
        
    The only necessary file is in data-raw/congress/senator_rollcall_votes.csv, which contains ALL votes

    Strategy:

    Create one big dictionary containing information for all states

    Use os.walk() to iterate through the data.json files.

    Scan each file, adding all relevant voting information to the states dictionary.

    When everything is done being scanned, split the states dictionary into separate parts.

    Put these completed parts into each state's senator.json file.
"""
import os
import json
import csv
from datetime import date

base_path = os.path.dirname(os.path.abspath(__file__))
home_path = os.path.join(base_path, "..", "..")

congress_path = os.path.join(home_path, "data-raw", "congress")

states_dictionary = {}
states_path = os.path.join(home_path, "public", "data", "states")
state_codes = os.listdir(states_path)

current_date = date.today()

#Initializing each state
for name in state_codes:
    states_dictionary[name] = {
        "state_code": name,
         "source": None,
        "congress": [],
        "last_updated": current_date,
        "ces_state_sample": {
            "n_respondents": None,
            "weight_variable": None,
            "confidence_note": None
        },
        "senators": []
    }

with open(os.path.join(congress_path, "senator_rollcall_votes.csv"), "r", encoding="utf-8") as file:
    reader = csv.DictReader()
    for line in reader:
        #Populate data
        this_state = line[state]


