"""
The goal of this script is to create a mapping from each zip code to their possible congressional districts. 
This is so the user can input their zip code and be told their district

However, one particular ZIP code may be split between multiple districts! 

Example:
ZIP, DISTRICT
60002,1701
60002,1710

So, the data structure this file will generate from parsing the raw data will be a map from a zip code to an *array* of districts.
This is so that, down the line, we can present the user with their possible districts for further narrowing down.

We will output this data structure as a json which looks like this. 

{
    zip_with_more_than_one_district: [[max_cd, max_ratio], [[cd_1, ratio_1], [cd_2, ratio_2], ... , [cd_n, ratio_n]]]
    zip_with_one_district: [cd_1, ratio_1]
}

This dictionary and positional array format lets us save lots of precious space when the user is required to load it all on their end.

But do take care to note that the format fundamentally differs between the two cases. 
 - When there is >1 district, the value for the key is a list of two lists, which contain the relevant info.
 - When there is only 1 district, the value for the key is a single list, which contains the relevant info.

"""

import json
import os
import csv

base_path = os.path.dirname(os.path.abspath(__file__))
hud_usps_path = os.path.join(base_path,"..","..","data-raw", "hud-usps")
zip_csv_path = os.path.join(hud_usps_path,"zip_cd.csv") #The data file

output_file_name = "zip_cd_map.json" #Output in data-raw/hud-usps

zip_cd_dict = {}

with open(zip_csv_path, mode="r", encoding="utf-8") as zip_csv_file:
    reader = csv.DictReader(zip_csv_file)

    for line in reader:
        zip = line['ZIP']
        cd = line['CD']
        ratio = round(float(line['TOT_RATIO']), 4)

        if zip not in zip_cd_dict:
            zip_cd_dict[zip] = [[cd, ratio], [[cd, ratio]]] #[[max], [[d_1], ..., [d_n]]]
        else:
            zip_cd_dict[zip][1].append([cd, ratio])
        
        if ratio > zip_cd_dict[zip][0][1]:
            zip_cd_dict[zip][0][0] = cd
            zip_cd_dict[zip][0][1] = ratio

#Delete redundant data for zips with one CD
for zip in zip_cd_dict.keys():
    if len(zip_cd_dict[zip][1]) == 1:
        zip_cd_dict[zip] = [zip_cd_dict[zip][0][0], zip_cd_dict[zip][0][1]]
        
#Write to the file in data-raw/hud-usps
with open(os.path.join(hud_usps_path, output_file_name), mode="w", encoding="utf-8") as destination:
    json.dump(zip_cd_dict, destination, separators=(',', ':'))
