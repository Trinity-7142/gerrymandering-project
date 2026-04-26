---
section: methodology
date_created: 2026-04-24
last_edited: 2026-04-24
author(s): Trinity Jones
author_link: "https://www.linkedin.com/in/trinity-jones-347056341/"
table_of_contents: True
sources:
  - name: Cooperative Election Study (CES)
    url: "https://cces.gov.harvard.edu/"
  - name: AP VoteCast
    url: "https://apnorc.org/projects/ap-votecast/"
  - name: unitedstates/congress
    url: "https://github.com/unitedstates/congress"
  - name: unitedstates/congress-legislators
    url: "https://github.com/unitedstates/congress-legislators"
  - name: Princeton Gerrymandering Project
    url: "https://gerrymander.princeton.edu/"
  - name: Brennan Center for Justice
    url: "https://www.brennancenter.org/"
  - name: Stephanopoulos & McGhee, "Partisan Gerrymandering and the Efficiency Gap"
    url: "https://chicagounbound.uchicago.edu/cgi/viewcontent.cgi?article=1946&context=public_law_and_legal_theory"
---
# Executive Summary

The methodology behind this project is detailed in the sections that follow. This summary covers the essentials for readers who want the high-level picture abstracted of technical details

## What the score measures

Every U.S. senator and every House member receives an **alignment score** between 0 and 1 representing how closely their voting record matches the policy preferences of the people they represent. A score close to 1 means the representative tends to vote the way their constituents want; a score close to 0 means they tend to vote the opposite way. The score is **direction-agnostic**: it does not favor liberal or conservative voting in itself, only the distance between what constituents say they want and how their representative actually votes.

## How the score is built

The score combines three publicly available data sources:

- **Cooperative Election Study (CES)** provides constituent policy preferences at the state and district level, telling us what people in a given geography want on each issue.
- **AP VoteCast** provides issue salience at the state level, telling us how much voters in a given state prioritize each issue.
- **Roll-call vote records** from the 118th and 119th Congresses, pulled from the open-source `unitedstates/congress` project, tell us how representatives actually voted.

Each substantive vote is hand-tagged with the issue it falls under, the direction it represents (liberal, conservative, or bipartisan), and a confidence level reflecting how clearly the vote signals an ideological position.

## How the formulas work

For each issue, we compute two numbers on the same 0-to-1 scale: the **Constituent Preferred Direction (CPD)**, the weighted average of constituent preferences from CES, and the **Representative Vote Direction (RVD)**, the confidence-weighted average direction of the representative's votes. The per-issue alignment score is built from the gap between these two numbers, $1 − |CPD − RVD|$, blended with credit for bipartisan votes and bounded between 0 and 1.

The overall alignment score is the sum of each per-issue score weighted by how much voters in that state prioritize that issue (from VoteCast salience). Issues with very few scoreable votes are discounted by a sparse-data penalty, and the salience weights are renormalized so the result always falls between 0 and 1. Foreign policy is excluded from the scored issues because CES does not consistently ask comparable foreign policy questions; the remaining eight issues carry the full weight. The full details of the methodology is in the Alignment section of this methodology page.

## How to read the results

The state pages display the **House alignment** as the primary statewide aggregate, calculated as the unweighted mean of every House member's alignment score in the state. Senator scores are shown separately within the senator panel rather than rolled into the statewide number. House alignment was chosen as the headline aggregate both because districts are the unit where gerrymandering happens and because chamber-mixed aggregates introduce systematic biases against larger, more demographically diverse states.

## What the score cannot capture

The score is one measurement of one dimension of representation. It does not capture constituent service, the substance of legislation a representative authors, committee work, or the many other ways elected officials represent their districts. The underlying data has known limitations: CES respondents skew more politically engaged than the general public, VoteCast salience is measured at the state level rather than the district level, and constituent preferences are treated as static even though they shift over time. The methodology itself reflects design choices (confidence weights, penalty thresholds, the bipartisan-vote treatment) that reasonable people could have made differently.

A representative's score should be read as one piece of evidence about how well they represent their constituents, not the final word. The full **Limitations** section discusses these caveats in detail, and we welcome others building on, critiquing, and improving the methodology.

---