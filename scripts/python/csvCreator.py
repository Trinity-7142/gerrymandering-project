import json
import os
import csv

#NOTE: This code will not work unless you have a very particular file structure (this script must be in the same folder as congress), 
# and is here so that the methodology of the production of senator_rollcall_votes.csv is made clear.

#Gets the paths for the folders containing the data.json files we are interested in
#Uses os.path.join as opposed to string concatenation for better compatibility and more legible code.
base_path = os.path.dirname(__file__)
votes_path = os.path.join(base_path, "congress", "data", "118", "votes")
subfolders = [
     os.path.join(votes_path, entry) 
     for entry in os.listdir(votes_path)
]
file_dirs = [
    os.path.join(folder_dir, file) 
    for folder_dir in subfolders 
    for file in os.listdir(folder_dir)
    ]

column_names = ["bioguide_id", "name", "state", "party", "vote_id", "bill_number", "vote_date", "position", "category", "question"]

#Whenever a representative is found whose JSON data representation is not a dictionary, they are put in this list.
#The only values that end up filling this list are 'VP' because, if my analysis is correct, when a tie-breaking vote is needed,
#They record the VP's vote under 'VP' instead of using a dictionary.
strange_representatives = []


#Open context manager for better memory usage, 
#Create senator_rollcall_votes.csv file and write to it or overwrite it if it already exists.
with open(os.path.join(base_path, "senator_rollcall_votes.csv"), mode="w", encoding = 'utf-8', newline='\n') as file:
    #Setting up the CSV writer, which takes care of the formatting of CSV
    writer = csv.writer(file)
    writer.writerow(column_names)


    for dir in file_dirs:
        #Loads the JSON data from the file, stores it as a mix of dictionaries and lists.
        with open(os.path.join(dir, "data.json"), encoding="utf-8") as f:
            json_data = json.load(f)

        vote_id = json_data["vote_id"]
        bill_number = json_data["number"]
        vote_date = json_data["date"]
        category = json_data["category"]
        question = json_data["question"]


        #Goes through the "Aye", "No", "Present", and "Not Voting" lists to find each representative-vote pair
        #Then it adds the relevant information to the CSV file
        for position_name, position_list in json_data["votes"].items():
                for representative in position_list:
                    if isinstance(representative, dict):
                        bioguide_id = representative["id"]
                        name = representative["display_name"]
                        state = representative["state"]
                        party = representative["party"]
                        position = position_name

                        writer.writerow([bioguide_id, name, state, party, vote_id, bill_number, vote_date, position, category, question])
                    else:
                        strange_representatives.append(representative)