import os
import json
import shutil
import unicodedata
from datetime import date
from alignmentAI import Politician

"""
Fetch images from data-raw/images, and transfer them to public/images/senators and public/images/reps

STRATEGY:
    For each politician in alignmentAI.Politician.politicians.values(), find the file they are located in (senators.json, representative.json)
    From that file, fetch their photo_url.
    Then, using their bioguide_id (from their Poltiician object), find their image, and clone it into the photo_url

"""

base_path = os.path.dirname(os.path.abspath(__file__))
home_path = os.path.join(base_path, "..", "..")
data_path = os.path.join(home_path, "public", "data")
images_path = os.path.join(home_path, "data-raw", "images", "congress", "450x550")

#Filled with the bioguide_id's of the politicians who do not have corresponding photos.
imageless_politicians = []

#AI Generated function to normalize politician's names for easy comparison
def remove_accents(text):
    # Normalize to NFD (Decomposition)
    normalized = unicodedata.normalize('NFD', text)
    # Encode to ASCII and ignore non-ASCII characters, then decode back to string
    return normalized.encode('ascii', 'ignore').decode('utf-8')

for p in Politician.politicians.values():

    #Firstly, if the politician has retired, then skip them entirely, since we don't need to display their image.

    if p.term_end < str(date.today()):
        continue



    bioguide = p.bioguide_id

    politician_path = None
    if p.role == "rep":
        politician_path = os.path.join(data_path, "districts", p.district, "representative.json")
        #Open the file and find their photo_url
    elif p.role == "sen":
        politician_path = os.path.join(data_path, "states", p.state, "senators.json")
        #Open the file, find the correct senator, and find their photo_url
    else:
        raise ValueError(f"Could not find politician's file for {bioguide}")

    photo_url = ""

    if not os.path.exists(politician_path):
        imageless_politicians.append(bioguide + " could not find representative/senators.json")
        continue

    with open(politician_path, "r", encoding="utf-8") as file:
        
        politician_file = json.load(file)

        if p.role == "rep":
            photo_url = politician_file["photo_url"]
        elif p.role == "sen":
            for senator in politician_file["senators"]:
                
                
                name_in_object = p.name.strip()

                #To account for politicians with the name "Kim (NJ)" for example
                if "(" in name_in_object:
                    cutoff_index = name_in_object.find("(")
                    name_in_object = p.name[:cutoff_index-1]

                #Not a universally valid check!! Be cautious. 
                #There really should be a much better way to do this.
                if remove_accents(name_in_object.lower()) in remove_accents(senator["name"].lower()):
                    photo_url = senator["photo_url"]
                    continue
    
    if photo_url == "":
        raise ValueError(f"Unable to find \"{p.name}\"'s photo_url for {bioguide} at file \n{politician_path}")
    
    #os.path.join behaves strangely when it encounters an absolute path, one which begins with a slash. 
    #So, to circumvent this error, we need to remove the first character (which is a slash)

    if photo_url[0] == "/":
        photo_url = photo_url[1:]

    source_path = os.path.join(images_path, bioguide + ".jpg")
    destination_path = os.path.join(home_path, "public", photo_url)
    print(source_path)
    print(destination_path)

    if os.path.exists(source_path):
        shutil.copyfile(source_path, destination_path)
    else:
        imageless_politicians.append(bioguide +" "+ p.role+ " " + p.state + " " + p.name + " could not find existing image for politician")


print(imageless_politicians)
print(len(imageless_politicians))