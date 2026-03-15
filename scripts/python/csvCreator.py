#This file must be in gerrymandering-project/scripts/python/, 
#and it outputs the generated csv into gerrymandering-project/data-raw/congress.

import json
import os
import csv

#Gets the paths for the folders containing the data.json files we are interested in
#Uses os.path.join as opposed to string concatenation for better compatibility and more legible code.
base_path = os.path.dirname(os.path.abspath(__file__))
congress_path = os.path.join(base_path, "..", "..", "data-raw", "congress")
data_path = os.path.join(congress_path, "data")
# changed column name bill_number -> vote_number 
column_names = ["bioguide_id", "name", "state", "party", "vote_id", "vote_number", "vote_date", "position", "category", "question"]
wrong_type_representatives = []

### Defining Functions ###
#Takes in an file produced by the iterator returned by os.scandir().
#Adds relevant data from the file to the CSV
# added an aditional argument: chamber; used to differentiate between house and senate votes
def scan_file(input_file, writer, wrong_type_representatives, chamber="s"):
    with open(input_file, mode="r", encoding="utf-8",) as json_file:
        try: 
            json_data = json.load(json_file)
        except json.JSONDecodeError:
            print(f"Skipping Malformed JSON: {input_file}")
            return
    
    if "votes" not in json_data:
        print(f"File {input_file} does not contain vote info!")
        return
    
    try:
        vote_id = json_data["vote_id"]

        # skip if not a senate vote
        if not vote_id.startswith(chamber):
            return
        bill_number = json_data["number"]
        vote_date = json_data["date"]
        category = json_data["category"]
        question = json_data["question"]
    except KeyError:
        print(f"File {input_file} is missing at least one column!")
        return
    #Goes through the "Aye", "No", "Present", and "Not Voting" lists to find each representative-vote pair
    #Then it adds the relevant information to the CSV file
    for position_name, position_list in json_data["votes"].items():
        for representative in position_list:
            if isinstance(representative, dict):
                try:
                    bioguide_id = representative["id"]
                    name = representative["display_name"]
                    state = representative["state"]
                    party = representative["party"]
                    position = position_name
                except KeyError:
                    print(f"A representative in file {input_file} is missing at least one column!")
                    return
                writer.writerow([bioguide_id, name, state, party, vote_id, bill_number, vote_date, position, category, question])
            else:
                wrong_type_representatives.append(representative)

### MAIN ###
#Setting up the CSV file to be written to
with open(os.path.join(congress_path, "senator_rollcall_votes.csv"), mode="w", encoding = 'utf-8', newline='') as file:
    #Setting up the CSV writer, which takes care of the formatting of CSV
    writer = csv.writer(file)
    writer.writerow(column_names)
    #Iterating through subfolders of congress/data, scanning for data.json files.
    for root, dirs, files in os.walk(data_path):
        for filename in files:
            if filename.endswith(".json"):
                scan_file(os.path.join(root, filename), writer, wrong_type_representatives, chamber="s")