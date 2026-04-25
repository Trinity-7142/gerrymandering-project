---
section: methodology
date_created: 2026-04-20
last_edited: 2026-04-20
author(s): Trinity Jones
author_link: "https://www.linkedin.com/in/trinity-jones-347056341/"
table_of_contents: True
---

# The Alignment Score

This section explains how the alignment score is calculated, starting with the high-level process followed by each sub-component. Readers who only need the conceptual overview can stop after the first section. Readers who want the full mechanics, including the formulas, should continue through to the end.

## The Overall Score

Every senator and every House member receives an **overall alignment score** between 0 and 1. The score is a weighted average of how well that representative's voting record matches their constituents' policy preferences across each of the eight policy issues we score (the nine-issue taxonomy from the data sources section, with foreign policy excluded because we lack comparable constituent-position data).

The overall score is the sum, across all eight issues, of each issue's alignment score weighted by how much voters in that state prioritize that issue:

$$
\text{Overall Score} = \sum_{i} w_i' \cdot \text{Per Issue Score}_i
$$

Where $wᵢ'$ is the renormalized salience weight for issue $i$ (described below in *Salience Weighting*), and $\text{Per-Issue Scoreᵢ}$ is the alignment between the representative's votes and the constituency's preferences on that issue. Both quantities are bounded between 0 and 1, so the overall score is also bounded between 0 and 1.

Put simply, a representative who votes the way their constituents want on the issues their constituents care about will score close to 1. A representative who votes against their constituents on the issues those constituents prioritize will score close to 0. A representative who votes with their constituents on issues their constituents don't particularly care about, but against them on the issues that matter most, will land somewhere in the middle.

## The Per-Issue Score

For each issue, we ask: how closely does this representative's voting record on this issue match what their constituents say they want on this issue?

To answer that, we use two numbers per issue:

- **Constituent Preferred Direction (CPD)**: the average direction of constituent preferences on this issue, computed from CES survey responses
- **Representative Vote Direction (RVD)**: the average direction of the representative's votes on this issue, computed from their roll-call record

Both are expressed on the same 0-to-1 scale, where 1 represents the fully liberal direction, and 0 represents the fully conservative direction. The closer these two numbers are to each other, the better the alignment.

The per-issue score combines a directional alignment component with a bipartisan-vote component:

$$
\text{Per Issue Score}_i = \frac{W_{dir,i} \cdot (1 - |CPD_{avg,i} - RVD_{avg,i}|) + W_{bip,i} \cdot 1.0}{W_{dir,i} + W_{bip,i}}
$$

Where $W_{\text{dir},i}$ is the sum of confidence weights for the representative's directional (liberal/conservative) votes on issue $i$, and $W_{\text{bip},i}$ is the sum of confidence weights for their bipartisan votes for issue $i$. The bipartisan-vote handling is described separately below. The core part is that the formula results in a number between 0 and 1, regardless of how many votes a representative has cast in relation to the given issue.

The directional component, $1 − |CPDᵢ − RVDᵢ|$, is a core aspect of the alignment score. If constituents are 70 percent in the liberal direction (CPD = 0.7) and the representative votes 65 percent in the liberal direction (RVD = 0.65), the gap is 0.05, and the directional alignment is 0.95. If constituents are 70 percent liberal but the representative votes 20 percent liberal (RVD = 0.20), the gap is 0.50, and the directional alignment is 0.50.

## Computing CPD: Constituent Preferred Direction

CPD captures what constituents in a given state or district want on a given issue, expressed as a single number between 0 and 1.

Because CES survey responses come in different formats (support/oppose, five-point spending scales, agree/disagree statements), we first standardize each question into a common format: the percentage of weighted respondents who answered in the **liberal direction** versus the **conservative direction**. The Python script used to process CES questions was coded to identify which response represents which direction. For five-point spending questions, the middle "maintain" response is reported separately rather than forced into one direction. For perceptual questions like election-integrity perceptions, no liberal/conservative axis is assigned, and the question is excluded from the alignment calculation. One worked example: on the question "Build a wall between the U.S. and Mexico," supporting the wall is the conservative position, and opposing it is the liberal position. If 58 percent of weighted respondents in a district oppose, the liberal share for that question is 0.58, and the conservative share is 0.42.

Once each question is standardized, CPD for an issue is the weighted average of the per-question liberal shares across all CES questions tagged to that issue:

$$
CPD_{avg, i} = \frac{\sum_q\sum_rw_r \cdot d_{r,q}}{\sum_q\sum_rw_r}
$$

Where $q$ is each CES question on issue $i$, $r$ is each respondent, $d_{r,q}$ is 1 if respondent $r$ answered question $q$ in the liberal direction and 0 if they answered in the conservative direction, and $w_r$ is the CES survey weight (`vvweight_post`) for that respondent. The respondent geography (state or district) depends on which page the score is being computed for: state-level CPD for senators, district-level CPD for House members.

## Computing RVD: Representative Vote Direction

RVD captures how the representative actually voted on bills tagged to a given issue, expressed on the same 0-to-1 scale as CPD.

For each substantive vote a representative cast on issue $i$, we manually tagged two pieces of information: the **direction** of the vote (liberal, conservative, or bipartisan) and the **confidence level** of that direction tag (high, moderate, or low). Confidence reflects how clearly the underlying bill signals an ideological position. A bill focused on tougher approaches to immigration enforcement is likely a conservative direction with high confidence, while a complex bill that focuses on enforcement mechanisms but includes some liberal-supported parts such as protections of immigrant rights is a conservative direction at moderate or low confidence.

Confidence levels translate to numerical weights:

- High confidence = 1.0
- Moderate confidence = 0.6
- Low confidence = 0.3

RVD is then the confidence-weighted average direction of the representative's votes on the issue, considering only votes tagged as liberal or conservative (bipartisan votes are handled separately):

$$
RVD_{avg, i} = \frac{\sum_v c_v \cdot d_v}{\sum_v c_v}
$$

Where $v$ is each directional vote on issue $i$, $c_v$ is the confidence weight for that vote, and $d_v$ is 1 if the vote was in the liberal direction and 0 if it was in the conservative direction.

The confidence weighting means a representative who casts ten unambiguous votes in one direction will have a much stronger RVD signal than one who casts ten ambiguous votes in the same direction. This prevents a string of marginal calls from carrying the same evidentiary weight as clear positions.

## Bipartisan Votes

Some bills genuinely don't have a liberal or conservative direction. A vote to rename a post office, authorize disaster aid, or pass a routine reauthorization that has overwhelming support across both parties is bipartisan in substance, not just in roll-call outcome. We tag these votes as **bipartisan** during the manual tagging process.

Bipartisan votes don't fit into the CPD-vs-RVD comparison because there's no liberal or conservative side to be on. But they are still meaningful: a representative who shows up and votes on bipartisan legislation is, in a real sense, representing a constituency that broadly supports such legislation. Excluding them entirely would discard a useful signal about whether a representative is engaged with the substantive work of Congress.

Our solution is to treat each bipartisan vote as contributing a perfect 1.0 to the per-issue score. This is the second term in the per-issue formula above, $W_{bip,i} \cdot 1.0$. The bipartisan and directional components are then combined as a confidence-weighted blend, with the denominator $W_{\text{dir,i}} + W_{\text{bip,i}}$ ensuring the result stays bounded between 0 and 1.

The effect of this design is that a representative whose record on an issue is mostly bipartisan votes will have a per-issue score pulled toward 1, while a representative whose record is mostly directional votes will have a per-issue score driven by how well their RVD matches their constituents' CPD. This reflects an intentional choice of treating bipartisanship as a form of representation, not a neutral non-event.

## Salience Weighting and Renormalization

Not every issue matters equally to every state's voters. A coastal state where environmental policy is a top concern should weigh environmental alignment more heavily than a state where it ranks low. We use AP VoteCast salience data to capture these state-level differences in issue prioritization.

For each state, VoteCast provides a salience weight for each of the nine issues, reflecting how often respondents in that state cited each issue as a top concern. We then make two adjustments to these raw weights before they enter the overall score formula.

**First**, we drop the foreign policy weight. As noted in the data sources section, CES does not consistently ask foreign policy questions, so we have no constituent benchmark to score representatives against. The remaining eight weights are renormalized so they sum to 1.

**Second**, we apply a per-issue penalty (described in the next subsection) to discount issues for which the representative has cast few or no scoreable votes, then renormalize again so the adjusted weights still sum to 1.

The full renormalization formula is:

$$
w_i' = \frac{w_i \cdot p_i}{\sum_{j} w_j \cdot p_j}
$$

Where $wᵢ$ is the raw VoteCast salience weight for issue $i$ (after dropping foreign policy), $pᵢ$ is the sparse-data penalty for that issue (defined below), and the denominator is the sum across all remaining issues. This ensures that the final weights always sum to 1, no matter how many issues are penalized.

## The Sparse-Data Penalty

If a representative has cast only one vote on healthcare across both Congresses, the resulting per-issue score for healthcare is not entirely indicative. In part this is a result of filtering to substantive votes specifically, which already decreased the available data points. Additionally, this is because a single data point doesn’t directly correlate to a pattern. If we placed equal weight on that score compared to a score from twenty votes, that would distort the overall calculation.

We address this with a **sparse-data penalty** applied at the per-issue level, based on $nᵢ$, the total number of votes (including bipartisan) the representative has cast on issue $i$:

$$
p_i = \begin{cases} 1.0 & \text{if } n_i \geq 3 \\ 0.5 & \text{if } n_i = 2 \\ 0.25 & \text{if } n_i = 1 \\ 0 & \text{if } n_i = 0 \end{cases}
$$

The penalty multiplies into the salience weight before renormalization (see the formula above), so issues with sparse data contribute less to the overall score, and issues with no data contribute nothing at all. The renormalization step then redistributes the freed-up weight across issues with stronger evidence.

The thresholds (three or more votes for full weight, sliding down to zero) are deliberate choices rather than statistically based. They were determined to be an effective balance between being flexible enough to score most representatives on most issues and strict enough to prevent single-vote data points from heavily influencing any individual score.

## Statewide Average Alignment

The state-level pages display a single **statewide alignment score** as the primary aggregate for the state. That number is the **House alignment**, the simple unweighted mean of every House member's overall alignment score in that state's delegation. Each senator's alignment score is shown separately within the senator panel on the same page, tied directly to the named senator rather than rolled into the statewide number.

We chose House alignment as the primary aggregate for two reasons. First, since House seats are drawn based on district lines, this more closely connects to our aim of framing gerrymandering as a potential cause of the disconnect people feel between their views and what their representatives actually do. Moreover, senators are elected statewide and don't pass through the redistricting process at all, so House alignment more directly answers the question this project is built around. Second, aggregates that mix in Senate scores or weight chambers equally produce systematic biases against larger, more demographically diverse states, where the gap between a representative's two senators and the dozens of district-level representatives can be substantial. The full discussion of this bias is in the **Limitations** section.

The underlying data files include three aggregate variables (house_alignment, senate_alignment, and a chamber-weighted overall_alignment) for any reader or developer working directly with the project's open-source data on GitHub. The choice to surface only the House figure on the public-facing state page is editorial, not a constraint of the data.