"""
The goal of this script is to create a mapping from each zip code to their possible congressional districts. 
This is so the user can input their zip code and be told their district

However, one particular ZIP code is split between multiple districts! 

Example:
ZIP, DISTRICT
60002,1701
60002,1710

So, the data structure this file will generate from parsing the raw data will be a map from a zip code to an *array* of districts.
This is so that, down the line, we can present the user with their possible districts for further narrowing down.

We will output this data structure as a json.
"""

import json
import os
import csv

base_path = os.path.dirname(os.path.abspath(__file__))
hud_usps_path = os.path.join(base_path,"..","..","data-raw", "hud-usps")
zip_csv_path = os.path.join(hud_usps_path,"zip_cd.csv") #The data file

output_file_name = "zip_cd_map.json"

zip_cd_dict = {}

with open(zip_csv_path, mode="r", encoding="utf-8") as zip_csv_file:
    reader = csv.DictReader(zip_csv_file)

    for line in reader:
        zip = line['ZIP']
        cd = line['CD']
        ratio = float(line['TOT_RATIO'])

        if zip not in zip_cd_dict:
            zip_cd_dict[zip] = {
                "all_districts":[{cd : ratio}], 
                "max_cd":cd, 
                "max_ratio":ratio
                }
        else:
            zip_cd_dict[zip]["all_districts"].append({cd : ratio})
        
        if ratio > zip_cd_dict[zip]["max_ratio"]:
            zip_cd_dict[zip]["max_cd"] = cd
            zip_cd_dict[zip]["max_ratio"] = ratio
        
#Write to the file in data-raw/hud-usps
with open(os.path.join(hud_usps_path, output_file_name), mode="w", encoding="utf-8") as destination:
    json.dump(zip_cd_dict, destination, indent=4)
