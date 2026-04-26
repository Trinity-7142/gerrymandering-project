---
section: methodology
date_created: 2026-04-24
last_edited: 2026-04-24
author(s): Trinity Jones
author_link: "https://www.linkedin.com/in/trinity-jones-347056341/"
table_of_contents: True
---

# Data Sources

The alignment score uses three publicly available datasets, plus a fourth source displayed alongside the score for context. The constituent side data describes what people care most about (issue salience) and what they want (policy preferences). Roll call votes indicate what the representative is actually doing. Lastly, the Princeton Gerrymandering Project provides external grades on the fairness of state-level redistricting. Before explaining the details about each source, it is important to define and introduce the issue taxonomy. 

## The Issue Taxonomy

Every data source in this project is organized around the same nine issues: immigration, healthcare, guns, economy, environment, criminal justice, election integrity, abortion, and foreign policy. This taxonomy is what makes the alignment score possible. CES policy questions, AP VoteCast salience rankings, and roll-call votes all get mapped to the same nine issues, so a senator's vote on a healthcare bill can be compared directly to what their constituents said about healthcare on a CES survey, weighted by how much VoteCast respondents in that state said healthcare mattered to them.

One important note on foreign policy: it is included in the AP VoteCast salience data we display because it is a real concern for many voters, but it is **excluded from the alignment score itself**. CES does not consistently ask policy-position questions on foreign policy issues, which means we have no comparable measure of constituent preference to score representatives against. When the alignment score is computed, the salience weights for the remaining eight issues are renormalized to sum to 1 so that excluding foreign policy does not artificially shrink anyone's score.

## Constituent-Side Data

### **Cooperative Election Study (CES)**

The Cooperative Election Study is a large academic survey administered annually by a consortium of universities led by Harvard. The 2024 survey sampled 60,000 American adults; this large sample size was intended to enable analysis at both the state and congressional district levels. We use CES to answer the policy preference question: *what policies do constituents in this state or district actually want?*

CES asks respondents many policy questions related to prevalent issues across the political spectrum. Some questions are direct support/oppose framings ("Build a wall between the U.S. and Mexico," "Ban assault rifles"), some are five-point spending preferences ("State legislature spending on Health Care," scaled from greatly increase to greatly decrease), and some are agree/disagree statements on perceptions of election integrity. We mapped each question to one of the nine issues in the taxonomy and used the survey's `vvweight_post` column, which adjusts for sampling and turnout, to produce population-representative estimates.

Because roll-call votes are inherently directional (a representative either votes for or against a bill), constituent preferences need to be represented in the same directional terms before an effective comparison can be made. The Python script used to process CES questions was coded to identify which response represents a **liberal direction** and which represents a **conservative direction**, then collapsed the responses into two percentages: `liberal_pct` and `conservative_pct`. For five-point spending questions, the "maintain" middle response is reported separately rather than forced into one direction. Election-integrity perception questions are not collapsed at all because they don't map to a liberal-to-conservative binary. The full details of this collapse are described in the alignment section.

### **AP VoteCast**

AP VoteCast is a survey of the American electorate conducted by NORC at the University of Chicago in collaboration with the Associated Press. Unlike traditional exit polls, VoteCast uses a large mixed-mode sample (over 100,000 respondents in 2024) drawn from voters and non-voters across all 50 states. We use VoteCast to answer the issue salience question: *which issues do voters in this state care most about?*

If a representative is scores highly on an issue that constituents care less about but, scores lower on an issue that constituents prioritize, then that should be represneted in the alignment metric. VoteCast lets us weight per-issue alignment by per-issue salience. The survey asks respondents to identify their top concerns, and we aggregate those responses to the state level to produce a salience weight for each issue.

## Representative-Side Data

### Roll-Call Votes from `unitedstates/congress`

To measure how representatives actually vote, we use the open-source [`unitedstates/congress`](https://github.com/unitedstates/congress) project, a community-maintained scraper that pulls structured roll-call vote records directly from official government sources. We pulled vote records for the 118th Congress (2023–2024) and the currently-active 119th Congress (2025–2026), giving us every recorded vote cast by every senator and House member across both Congresses.

The raw vote data is much larger than what we actually need. A single Congress includes thousands of recorded votes, the majority of which are procedural (motions to proceed, motions to table, quorum calls) or specific to the chamber's internal operations rather than to substantive policy. We filtered the raw records down to the votes that meaningfully reflect a representative's policy stance: primarily passage votes and cloture votes on legislation that maps to one of our nine issues. Nominations were excluded, since a vote to confirm a specific judge or executive appointee can either be a substantial statement of whose voices are heard in the bureaucratic system or a simple, uncontroversial formality. The research required to determine where each vote landed was beyond the scope of this project, and there is plenty of room for future research in this area. Veto-override votes were retained because they represent a strong signal about a representative's view on a piece of legislation.

After filtering, each remaining vote was hand-tagged with two pieces of information: the issue it falls under (from the nine-issue taxonomy), and the **direction** the vote represents (liberal, conservative, or bipartisan), along with a **confidence level** (high, moderate, or low) reflecting how clearly the vote signals an ideological position. The confidence and direction tagging is what feeds into the alignment formula, which is described in detail in the alignment section.

Two notes on how non-substantive vote categories are handled. *Not Voting* is excluded from per-bill alignment scoring (a representative who didn't vote can't be aligned or misaligned on that bill) but is tracked separately as part of attendance. *Present* votes are kept as active choices, since voting "present" is a deliberate decision that representatives make for substantive reasons.

## External Context: Princeton Gerrymandering Project

Alongside the alignment score, we display state-level grades from the [Princeton Gerrymandering Project](https://gerrymander.princeton.edu/). These grades evaluate state congressional maps on three dimensions: partisan fairness, competitiveness, and geographic features. They are widely cited and represent some of the most rigorous publicly available assessments of map fairness.

Princeton grades are **not** an input to the alignment score. We display them because the two data points describe two related but distinct discussions. Princeton evaluates how fair the maps are, while the alignment score evaluates how well the people elected from those maps represent their constituents. Showing both side by side lets people see whether states with poorly graded maps also result in representatives with low alignment scores, or whether the relationship is more nuanced than a simple cause-and-effect.

The Princeton data was retrieved manually from their public site and stored in our project's data files. It is not updated automatically; if Princeton releases new grades, we will need to refresh the data manually.

---