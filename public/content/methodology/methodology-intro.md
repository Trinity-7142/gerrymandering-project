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

# Introduction

Gerrymandering is usually discussed as abstract ideas, as a problem of unfair maps, distorted partisan outcomes, or skewed seat counts. These are all very important results of gerrymandering; however, it can be difficult for everyday people to connect those results to what they are experiencing in their day-to-day lives. **The goal of this project is to raise awareness of the more tangible impacts of gerrymandering** by showing how it shapes whether your representative is actually working towards implementing policy changes that represent what you and your neighbors generally agree with.

This project reframes gerrymandering as a question of *dyadic representation,* the relationship between an individual elected official and the constituents in their district. When district lines are drawn to favor one party, representatives become accountable to a smaller share of their constituents than the full district they are constitutionally obligated to serve. Over time, this can lead to a representative's voting record drifting further away from where their constituents actually stand.

To do this, we built an **alignment score** for every U.S. senator and every member of the U.S. House of Representatives. The score is a single number between 0 and 1 that captures how closely a representative's voting record matches the policy preferences of the people they represent. A score close to 1 means a representative tends to vote the way their constituents want; a score close to 0 means they tend to vote the opposite way. The score is *direction-agnostic;* it does not give favor to liberal or conservative voting in itself. It only measures the distance between what constituents say they want and how their representative actually votes.

The methodology behind the score combines three publicly available data sources: the Cooperative Election Study (CES), which contains constituent policy preferences at the state and district level; AP VoteCast, which asks voters what their top concerns are; and roll-call vote records from the 118th and 119th Congresses, pulled from the unitedstates/congress repository. We integrate these sources using a formula that weights each issue by how much voters care about it and discounts votes where the underlying political signal is ambiguous. The full procedure is described in the sections that follow.

A note on scope and intent: this project does not attempt to reinvent the measurement of gerrymandering itself. Excellent work on that already exists, notably from scholars such as Nicholas Stephanopoulos and Eric McGhee, organizations like the Princeton Gerrymandering Project and the Brennan Center, and many more. This project does not ask "*how fair are the maps?"*, we ask "*how well are the elected representatives from those maps representing those who voted for them?"* The two questions are related, but they are not the same, and we think both belong in the public conversation.

---