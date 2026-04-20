---
section: methodology
date_created: 2026-04-20
last_edited: 2026-04-20
author(s): Full Team
table_of_contents: True
---

## TL;DR: Alignment Score Methodology

The alignment score measures how closely a member of Congress's voting record matches their constituents' policy preferences on a 0–1 scale. For each of nine issue areas, the script computes two directional averages:

**Representative Vote Direction** — the confidence-weighted average of a member's votes on bills tagged to that issue:

$$
RVD_{avg, i} = \frac{\sum_v c_v \cdot d_v}{\sum_v c_v}
$$

Where $c_v$ is the confidence weight (High = 1.0, Moderate = 0.6, Low = 0.3) and $d_v$ is the vote direction (1 = liberal, 0 = conservative).

**Constituent Preferred Direction** — the weighted average of CES 2024 survey responses for the relevant geography:

$$
CPD_{avg, i} = \frac{\sum_q\sum_r w_r \cdot d_{r,q}}{\sum_q\sum_r w_r}
$$

Where $w_r$ is the CES `vvweight_post` survey weight and $d_{r,q}$ is whether respondent $r$ on question $q$ took the liberal position (1) or conservative position (0).

These are combined into a **Per-Issue Score** that blends directional alignment with bipartisan credit:

$$
\text{Per Issue Score}_i = \frac{W_{dir,i} \cdot (1 - |CPD_{avg,i} - RVD_{avg,i}|) + W_{bip,i} \cdot 1.0}{W_{dir,i} + W_{bip,i}}
$$

A **confidence penalty** downweights issues with few votes:

$$
p_i = \begin{cases} 1.0 & \text{if } n_i \geq 3 \\ 0.5 & \text{if } n_i = 2 \\ 0.25 & \text{if } n_i = 1 \\ 0 & \text{if } n_i = 0 \end{cases}
$$

Issue weights are **renormalized** after applying the penalty so they still sum to 1:

$$
w_i' = \frac{w_i \cdot p_i}{\sum_{j} w_j \cdot p_j}
$$

Finally, the **Overall Alignment Score** is the weighted sum of per-issue scores using VoteCast salience weights (foreign policy excluded):

$$
\text{Overall Score} = \sum_{i} w_i' \cdot \text{Per Issue Score}_i
$$

In the alignment script, key placeholders include: `{CES_DATA_PATH}` for the preprocessed constituent positions file (output of `04_generate_ces_positions.R`), `{VOTECAST_WEIGHTS_PATH}` for the state-level issue salience weights, `{ROLL_CALL_DATA_PATH}` for the tagged roll-call vote records, `{BILL_TAGS_PATH}` for the policy team's issue/direction/confidence tagging CSV, and `{OUTPUT_PATH}` for the final per-member and per-state alignment score outputs.

---

## Limitations

The methodology carries several important caveats. **CES sample sizes vary** across districts, producing noisier constituent estimates in smaller or demographically underrepresented areas. **Collapsing preferences and votes to a binary liberal/conservative axis** loses significant nuance — a constituent may hold mixed views within a single issue, and procedural versus substantive votes on the same bill are treated identically. **CES question coverage is uneven** (e.g., more healthcare questions than criminal justice), making some issue estimates more stable than others without the score reflecting that asymmetry. **Bill direction tagging is inherently subjective**, and while confidence weighting mitigates ambiguous cases, reasonable reviewers could disagree. **VoteCast salience is state-level only**, flattening intra-state variation in what voters actually prioritize at the district level. The **confidence and penalty values** (1.0/0.6/0.3 and 1.0/0.5/0.25/0) are calibrated choices, not statistically derived — different values would shift scores modestly. Finally, there is a **timeline mismatch**: CES and VoteCast capture a 2024 snapshot of opinion, while votes span both the 118th and ongoing 119th Congress, meaning the score treats preferences as static even as public opinion shifts over time.