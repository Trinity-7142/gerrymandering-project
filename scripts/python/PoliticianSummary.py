class Politician:
    allPoliticans = []
    def __init__(self, bioID, firstName, lastName, age, dateStarted, type, district = None, missedVotes=0, attendanceRate=0, previousPositions={}, summary = ""):
        self.firstName = firstName
        
        self.lastName = lastName
        
        self.age = age
        
        self.dateStarted = dateStarted
        
        # key = Position Title; value = dateStart, dateEnd
        self.previousPositions = previousPositions
        
        self.missedVotes = missedVotes

        # should be a percentage
        self.attendanceRate = attendanceRate

        self.bioID = bioID

        self.summary = summary

        # Senator or Representative
        self.type = type

        self.allPoliticans.append(self)

        self.district = district


    
    '''
    Takes in a Politican object and populates the previousPositions attribute
    Arguments: self, positionTitle, startDate, endDate
    Return Value: None
    '''
    def addPreviousPosition(self, positionTitle, startDate, endDate):

        if not isinstance(positionTitle, str):
            raise TypeError("Position Title must be a string")
        elif not isinstance(startDate, int) and len(str(abs(startDate))) != 8:
            raise TypeError("startDate must be an int of form MMDDYYYY with length 8")
        elif not isinstance(endDate, int) and len(str(abs(endDate))) != 8:
            raise TypeError("endDate must be an int of form MMDDYYYY with length 8")

        positionMap = {}
        dateCollection = [startDate, endDate]
        positionMap[positionTitle] = dateCollection

        self.previousPositions = positionMap
    
    def addMissedVotes(self, count):
        self.missedVotes = count
    
    def addSummary(self, summary):
        self.summary = summary

    def validatePolitican(self):
        # TODO
        # if firstName, lastName are not Strings -> raise an error
        # if age, dateStarted, missedVotes, attendanceRate are not ints -> raise an error
        # if dateStarted is not length 8 -> raise an error
        # if previousPositions is empty -> raise an error
        # if summary is empty -> raise an error
        # if politican type is Representative & district != None -> raise an error
        pass

        
'''
========================================================================================================================
Access Politican Data & Build Basic Politican 
========================================================================================================================
'''
# TODO access politican bioID, first name, last name, age, dateStarted, type, and district (if applicable)
# TODO create new Politican object

'''
========================================================================================================================
Populate Politican Stats
========================================================================================================================
'''
# TODO update politican populate missedVotes, attendance rate, and previousPositions
'''
========================================================================================================================
Request Perplexity API for Raw Data
========================================================================================================================
'''
# TODO rate limits & error handling: ~1 second delay between calls; try/excapt for each API call; rety with backoff (if rate limited or server error wait 5 seconds and try up to 3 times)
'''
========================================================================================================================
Request Claude Sonnet for Summary
========================================================================================================================
'''
# TODO check if the file already exists/"resume" mechanism - if it already exists easily restart the script without re-processing

# instructions:
#   write a summary for this legislator. Word count is 250 maximum. Use **bold** for key terms or improtant points. Use this exact structure:
#   ---
#   name: [Full Name]
#   state: [stateCode]
#   district: [districtCode] // only if applicable
#   party: [Party]
#   ---
#   Introduce the legislator ("Sen. (or Rep.) lastName represents (state & district (if applicable))"). Explain their ideology, hometown, socioeconomic background, and stated beliefs.
#   Explain their campaign platform including what they campaigned on and key policy promises
#   Explain anything notable about them: accomplishments, controversies, distinguishing facts

# TODO return a markdown file. Either located in "public/content/senator-info/[stateCode]-firstName-lastName" for senators
# or in "public/content/rep-info/[stateCode]-[district]-firstName-lastName" for representatives
# TODO add the summary to the politican object

'''
========================================================================================================================
Check
========================================================================================================================
'''



# TODO call validatePolitican, if an error is raised, stop