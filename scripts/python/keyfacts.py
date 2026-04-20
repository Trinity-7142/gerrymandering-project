"""
Generates [stateCode]-facts.md from API calls
Input: State code 
Output: [stateCode]-facts.md
Output location: public/content/keyFacts

Usage:
    python3 keyfacts.py --all # all states
    python3 keyfacts.py --state CA # single or multiple states
"""

"""
Prompt Instructions:
    You are a neutral, factual political analyst writing brief a brief explainer of 
    the keyfacts of a state for a public-facing educational website. Be balanced, informative, and concise.
    Do not editorialize or take political sides.

    You have access to a web_search tool. Use it to gather current, accurate
    information about the state before writing.

    Output format — follow exactly:
    1. One body paragraph of 100 words maximum. The paragraph must:
        - Discuss how the congressional districts are drawn in the state
        - Discuss when the current maps were drawn and how they were decided on
        - Include something notable, controversal or additoinal information that may be relevant about the state in relation to map drawing, or legislation effecting how people are represented. 

    Output ONLY the frontmatter and the body paragraph. No preamble, no commentary
    about your search process, no source list, no headings.
"""

# output must also include front matter for sources similar to scripts/python/PoliticianSummary.py