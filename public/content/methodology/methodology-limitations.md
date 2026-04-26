---
section: methodology
date_created: 2026-04-20
last_edited: 2026-04-20
author(s): Trinity Jones
author_link: "https://www.linkedin.com/in/trinity-jones-347056341/"
table_of_contents: True
---

# Limitations

The alignment score is useful, but it is not definitive. It is one measurement of one dimension of political representation, built on data sources that have their own limitations, computed using a formula that required intentional design choices with their own set of tradeoffs. Described in this section is an explanation of what the score cannot illustrate, where its underlying data is lacking or biased, and where different design choices could be made.

A representative's score should be read as one piece of evidence about how well they represent their constituents, alongside other forms of evidence: their constituent service, their public statements, their committee work, the substance of the bills they sponsor, and the lived experience of the people in their district. The score is a starting point for asking better questions, not the final word on whether a representative is doing a good job. There is also significant room for further research and refinement of this approach, and we welcome others building on, critiquing, and improving the methodology.

## Limitations of the Underlying Data

### **CES question coverage is uneven across issues**

The CES asks more questions about some issues than others. There may be four detailed questions about healthcare and only two about criminal justice. Issues with many questions contribute to more reliable estimates, while the opposite is also true. The per-issue score handles every issue with no regard to the number of questions. The cases of sparse CES questions per issue are measured with more uncertainty than the methodology explicitly acknowledges.

### **CES has a known sophistication bias**

CES respondents tend to be more educated and more politically engaged than the general population, a known bias of opt-in online surveys. The vvweight_post survey weight adjusts for some demographic skew, but it cannot fully correct for the underlying difference in who chooses to participate. Constituent preferences derived from CES, therefore, lean toward the preferences of more politically engaged constituents, who may differ in important ways from the median voter in their district.

### **CES sample sizes vary widely across geographies**

Larger states with higher population counts also have highly populous districts with larger CES sample sizes, which means their constituent preference estimates are more reliable than those from smaller districts. Single-district states (like Wyoming, Vermont, and Alaska) have consistent geographic alignment between constituent surveys and the representative being scored. Per-district sample sizes are surfaced in the underlying data so readers can see which estimates rest on more or fewer respondents.

### **VoteCast salience is state-level, not district-level**

Issue importance weights come from state-level AP VoteCast data because district-level salience data of comparable quality is not publicly available. A district within California might have very different issue priorities than California as a whole; a coastal district might weigh environment higher, an agricultural district might weigh economy and immigration differently. The alignment score uses statewide weights evenly for every district in a state, which flattens the intra-state variation in what voters actually prioritize.

### **Timeline mismatch between inputs**

CES 2024 and AP VoteCast 2024 represent respondent preferences and concerns from a single point in time in late 2024. Roll-call votes come from the 118th Congress (2023–2024) and the currently active 119th Congress (2025–2026). The methodology treats constituent preferences as static and applies them to votes cast both before and after the surveys were conducted. Public opinion shifts in response to events, sometimes substantially, so a representative whose votes appear misaligned with 2024 preferences may be aligned with how their constituents actually feel in 2026, or vice versa.

## Limitations of Methodology Design

### **Binary direction loses nuance**

Both constituent preferences and member votes are collapsed to a one-dimensional liberal-to-conservative axis per issue. Actual policy preferences and legislative behavior are more complex than a single direction. A representative might vote with their constituents on the substance of a healthcare bill but against them on a procedural amendment to the same bill, and this methodology cannot distinguish those cases. Similarly, a constituent might hold a liberal position on the economy in general but a conservative position on a specific tax provision; the score averages over these distinctions rather than preserving them.

### **Foreign policy is excluded entirely**

Because CES does not consistently ask foreign policy questions, foreign policy is excluded from the alignment score. We display foreign policy salience from VoteCast on state pages because it is genuinely important to many voters, but a representative whose record on foreign policy is sharply at odds with that of their constituents would not be penalized for that misalignment by this score. This is a real gap, and we hope future iterations of the project (or other research building on it) can find a way to incorporate constituent foreign policy preferences from a comparable data source.

### **Confidence and penalty values are chosen, not derived.**

The high, moderate, and low confidence weights (1.0, 0.6, 0.3) and the sparse-data penalty thresholds (1.0, 0.5, 0.25, 0) are reasonable choices, but they are choices. No deeper statistical procedure produces these exact numbers. Shifting them would shift individual scores modestly. These values were settled on as calibrations that behaved sensibly on test data and produced sensible rankings, but a different team making defensible different choices could produce somewhat different scores.

### **Bipartisan votes are treated as perfect alignment**

We assign bipartisan votes a score of 1.0, treating bipartisan engagement as a form of representation. This is an intentional choice, but not the only defensible one. A reasonable critic could argue that a representative whose voting record is predominantly bipartisan votes is not being meaningfully measured against their constituents' preferences at all, and that their score therefore overstates how well-aligned they are. We chose the current approach because excluding bipartisan votes entirely would discard real information about engagement, but the alternative argument has merit.

### **Aggregating chambers introduces bias against larger states**

The state-page headline number is the House alignment for exactly this reason. A chamber-weighted overall score (giving the House and Senate equal weight) systematically advantages smaller states, where two senators carry the same weight as a small handful of House members, and disadvantages larger, more demographically diverse states, where the gap between the two senators and the dozens of district-level representatives can be substantial. Member-weighted aggregates have the opposite problem: they essentially erase the Senate's contribution in large states. Because there is no aggregation choice that is unbiased across states, we surface only the House alignment publicly. The other aggregates are available in the underlying data for readers who want to make different choices.

## Limitations of Interpretation

### **Senate scores are not directly comparable across states**

The Senate's equal-representation design means Wyoming's two senators represent roughly 580,000 people while California's two represent nearly 40 million. When we compute a senator's alignment score, that score is benchmarked against their own state's constituent preferences, so the score is valid within its own context. But comparing Senate alignment scores across states is comparing representation of very differently sized publics, which is a property of the Senate as an institution rather than something our methodology can resolve. Senator alignment scores are most meaningfully interpreted within their state, not ranked against senators from other states.

### **Smaller states tend to score higher**

Smaller and less populous states tend to produce higher average alignment scores, likely because they are also less ideologically diverse. When a state's population is more uniform in what it wants, it is mathematically easier for a representative to vote in line with the average constituent. This is not necessarily evidence that smaller-state representatives are better at their jobs, but rather that they have a more cohesive constituency to represent. Cross-state comparisons of average alignment should be read with this in mind.

### **Recently elected representatives have thin records**

A representative who took office at the start of the 119th Congress has cast fewer scoreable votes than one serving across both Congresses we cover. The sparse-data penalty addresses this at the per-issue level, but a member with only a few months of tenure will have an overall score computed from a smaller evidence base than a multi-term incumbent. Their score is not necessarily wrong, but it is measured with more uncertainty than the single number conveys. As more votes accumulate during the 119th Congress, scores for newer members will stabilize.

### **Recent congressional unproductivity reduces the vote pool for everyone**

Congress in recent years has passed less substantive legislation than in earlier decades. This reduces the pool of substantive roll-call votes available to score every representative against, not just newly elected ones. We pull from both the 118th and 119th Congresses partly to compensate for this; relying on the 119th alone would leave too few scoreable votes per representative on most issues to produce stable scores. Even with two Congresses combined, certain issues have fewer votes available than would be ideal.

### **Vacant seats affect statewide aggregates**

The statewide House alignment is computed across whatever House members have valid scores at the time the page is built. If a seat is vacant due to resignation, death, or a delayed special election, that district contributes nothing to the statewide average. The `delegation_sample` field in the underlying data reports both the number of scored members and the number of vacant seats, so readers checking the data directly can see the denominator we used. On the public-facing page, brief vacancies during the term will marginally affect the displayed statewide number until the seat is filled.

### **The score does not capture everything that matters about representation**

The alignment score measures the gap between constituent policy preferences and roll-call voting behavior. It does not measure constituent service, responsiveness to individual constituents, the quality or substance of legislation a representative authors, behind-the-scenes negotiation, committee work, oversight, or the many other ways elected officials represent the people who sent them to Congress. A representative with a low alignment score may still be serving their district well in ways the score cannot see, and a representative with a high alignment score may be passive on dimensions that matter to their constituents. The score is one lens, not the whole picture.

---