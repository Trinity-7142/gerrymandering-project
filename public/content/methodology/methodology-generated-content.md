---
section: methodology
date_created: 2026-04-20
last_edited: 2026-04-20
author(s): Trinity Jones
author_link: "https://www.linkedin.com/in/trinity-jones-347056341/"
table_of_contents: True
---

# Generated Explainer Content

The site features two categories of AI-generated short-form text: state "key facts" blurbs (describing each state's redistricting process and notable features) and legislator profiles (brief bios covering background, platform, and notable accomplishments or controversies). Both are written as 100-word paragraphs using Anthropic's Claude Sonnet model with web search enabled. Each generation request follows the same pipeline — a system prompt instructs the model to write as a neutral political analyst, and the user prompt specifies the subject (a state or legislator). The model performs up to five web searches per request, and every cited source URL is extracted, mapped to a clean display name, and embedded in the output's frontmatter so readers can trace the underlying facts. A separate debug trace (search queries, returned URLs, cited snippets) is logged for internal review.

No generated content reaches the public site without human review. Before launch, the policy team manually read, fact-checked, and where necessary corrected or rewrote every blurb and profile, cross-referencing claims against primary sources (state government sites, court records, official legislator pages) and independent secondary sources. The same standard applies to any future regenerations. Key limitations include: content reflects a snapshot in time and will lag behind real-world changes until the next regeneration cycle; 100-word compression necessarily omits nuance; web search sources vary in editorial quality; framing choices around what to foreground or call "notable" mean neutrality is a goal, not a guarantee; and results are model-version-dependent — regenerating the same prompt at a different time would produce different text.