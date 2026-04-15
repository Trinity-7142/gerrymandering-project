"""
PoliticianSummary.py

Generates biography/summary markdown files for senators and House representatives.

Two-phase approach:
  Phase 1: Perplexity Sonar Pro does web searches to gather raw background info
           → writes to data-raw/web-search/{STATE_CODE}/raw-information.txt
  Phase 2: Claude Sonnet reads that raw text and writes a structured markdown summary
           → senators: public/content/senator-info/{stateCode}-{firstName}-{lastName}.md
           → reps:     public/content/rep-info/{stateCode}-{district}-{firstName}-{lastName}.md

Usage:
  python PoliticianSummary.py --state CA            # all senators + CA/TX reps
  python PoliticianSummary.py --state CA --senators-only
  python PoliticianSummary.py --state CA --reps-only
  python PoliticianSummary.py --all                 # all 51 state directories

Environment variables (set in .env or export before running):
  PERPLEXITY_API_KEY
  ANTHROPIC_API_KEY

# TODO: create a .env file (gitignored) with the two keys above before running
"""

import os
import re
import json
import time
import argparse
import textwrap
from pathlib import Path

import requests
import anthropic
from dotenv import load_dotenv  # pip install python-dotenv

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

load_dotenv()

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
ANTHROPIC_API_KEY  = os.getenv("ANTHROPIC_API_KEY")

# TODO: confirm these paths are right relative to where you run the script.
#       By default this file lives in scripts/python/ so we go up two levels.
PROJECT_ROOT   = Path(__file__).resolve().parent.parent.parent
DATA_STATES    = PROJECT_ROOT / "public" / "data" / "states"
DATA_DISTRICTS = PROJECT_ROOT / "public" / "data" / "districts"
RAW_SEARCH_DIR = PROJECT_ROOT / "data-raw" / "web-search"
SENATOR_OUT    = PROJECT_ROOT / "public" / "content" / "senator-info"
REP_OUT        = PROJECT_ROOT / "public" / "content" / "rep-info"

PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"
PERPLEXITY_MODEL = "sonar-pro"    # TODO: verify current model name in Perplexity docs
CLAUDE_MODEL     = "claude-sonnet-4-6"

# Rate-limit pauses (seconds)
PERPLEXITY_DELAY = 1.5
CLAUDE_DELAY     = 0.5
RETRY_WAIT       = 5
MAX_RETRIES      = 3


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slug(name: str) -> str:
    """'Adam Schiff' → 'adam-schiff'"""
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _call_with_retry(fn, label: str):
    """Call fn() up to MAX_RETRIES times with RETRY_WAIT back-off."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return fn()
        except Exception as e:
            print(f"    [attempt {attempt}/{MAX_RETRIES}] {label} failed: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_WAIT)
            else:
                raise


# ---------------------------------------------------------------------------
# Phase 1 — Perplexity web search
# ---------------------------------------------------------------------------

def _perplexity_search(query: str) -> str:
    """Send one query to Perplexity Sonar Pro and return the text response."""
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": PERPLEXITY_MODEL,
        "messages": [{"role": "user", "content": query}],
    }
    def call():
        resp = requests.post(PERPLEXITY_URL, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    result = _call_with_retry(call, f"Perplexity: {query[:60]}")
    time.sleep(PERPLEXITY_DELAY)
    return result


def gather_raw_info(name: str, title: str, state: str, district: str | None) -> str:
    """
    Run 2–3 Perplexity searches and return concatenated raw text.
    title is 'Senator' or 'Representative'.
    district is e.g. 'CA-11' or None for senators.
    """
    location = f"{state}'s {district} congressional district" if district else state

    queries = [
        # Background, ideology, biography
        f"Who is {title} {name} from {location}? Include their hometown, educational background, "
        f"career history, political ideology, and stated policy beliefs.",

        # Campaign platform
        f"What did {title} {name} ({state}) campaign on? Describe their key policy promises "
        f"and campaign platform in detail.",

        # Notable facts
        f"What are notable accomplishments, controversies, or distinguishing facts about "
        f"{title} {name} ({state})?",
    ]

    # TODO: if Perplexity rate limits are tight, reduce to 2 queries by
    #       merging the first two into one prompt.

    chunks = []
    for i, q in enumerate(queries, 1):
        print(f"    Perplexity search {i}/{len(queries)}: {q[:70]}…")
        chunks.append(f"=== Search {i} ===\n{_perplexity_search(q)}")

    return "\n\n".join(chunks)


def get_or_create_raw_info(name: str, title: str, state: str, district: str | None) -> str:
    """
    Return cached raw info if it exists, otherwise fetch and cache it.
    Caches to data-raw/web-search/{state}/{slug(name)}.txt
    """
    cache_dir = RAW_SEARCH_DIR / state
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_file = cache_dir / f"{slug(name)}.txt"

    if cache_file.exists():
        print(f"  [cache hit] {cache_file.relative_to(PROJECT_ROOT)}")
        return cache_file.read_text(encoding="utf-8")

    print(f"  [fetching] {title} {name} ({state})")
    raw = gather_raw_info(name, title, state, district)
    cache_file.write_text(raw, encoding="utf-8")
    return raw


# ---------------------------------------------------------------------------
# Phase 2 — Claude summary
# ---------------------------------------------------------------------------

SUMMARY_SYSTEM_PROMPT = textwrap.dedent("""\
    You are a neutral, factual political analyst writing brief legislator profiles
    for a public-facing civic engagement website. Be balanced, informative, and concise.
    Do not editorialize or take political sides.
""")

def _build_user_prompt(name: str, title: str, state: str, district: str | None, raw: str) -> str:
    district_line = f"district: {district}" if district else ""
    return textwrap.dedent(f"""\
        Write a summary for this legislator. Word count is 250 maximum.
        Use **bold** for key terms or important points.

        Use this exact frontmatter structure at the top (no extra fields):
        ---
        name: {name}
        state: {state}
        {district_line}
        ---

        Structure the body in three paragraphs:
        1. Introduce the legislator ("{title_abbr(title)}. [lastName] represents [state & district if applicable]").
           Explain their ideology, hometown, socioeconomic background, and stated beliefs.
        2. Explain their campaign platform: what they campaigned on and key policy promises.
        3. Explain anything notable: accomplishments, controversies, distinguishing facts.

        Source material (web search results):
        {raw}
    """)


def title_abbr(title: str) -> str:
    return "Sen" if title == "Senator" else "Rep"


def generate_summary(name: str, title: str, state: str, district: str | None, raw: str) -> str:
    """Call Claude Sonnet to produce the markdown summary."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    prompt = _build_user_prompt(name, title, state, district, raw)

    def call():
        msg = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=600,
            system=SUMMARY_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text

    result = _call_with_retry(call, f"Claude summary: {name}")
    time.sleep(CLAUDE_DELAY)
    return result


# ---------------------------------------------------------------------------
# File writers
# ---------------------------------------------------------------------------

def write_senator_summary(state: str, name: str, summary_md: str):
    SENATOR_OUT.mkdir(parents=True, exist_ok=True)
    out_path = SENATOR_OUT / f"{state.lower()}-{slug(name)}.md"
    out_path.write_text(summary_md, encoding="utf-8")
    print(f"  → wrote {out_path.relative_to(PROJECT_ROOT)}")


def write_rep_summary(district: str, name: str, summary_md: str):
    """district is e.g. 'CA-11'"""
    REP_OUT.mkdir(parents=True, exist_ok=True)
    state = district.split("-")[0].lower()
    out_path = REP_OUT / f"{state}-{district.split('-')[1]}-{slug(name)}.md"
    out_path.write_text(summary_md, encoding="utf-8")
    print(f"  → wrote {out_path.relative_to(PROJECT_ROOT)}")


def output_path_exists(out_dir: Path, filename: str) -> bool:
    return (out_dir / filename).exists()


# ---------------------------------------------------------------------------
# Per-politician orchestration
# ---------------------------------------------------------------------------

def process_senator(state: str, senator: dict):
    name = senator["name"]
    out_file = f"{state.lower()}-{slug(name)}.md"

    if output_path_exists(SENATOR_OUT, out_file):
        print(f"  [skip] {name} — already exists")
        return

    raw = get_or_create_raw_info(name, "Senator", state, district=None)
    print(f"  [summarizing] Senator {name}")
    summary = generate_summary(name, "Senator", state, district=None, raw=raw)
    write_senator_summary(state, name, summary)


def process_representative(district_id: str, rep_json: dict):
    """district_id is e.g. 'CA-11'"""
    name = rep_json.get("representative")
    if not name:
        # TODO: once real representative.json files are in place (currently only
        #       a placeholder exists under CA-11/placeholders/), this path will
        #       be hit if the key is missing. Update the key name if needed.
        print(f"  [skip] {district_id} — no representative name in JSON")
        return

    state = district_id.split("-")[0]
    dist_num = district_id.split("-")[1]
    out_file = f"{state.lower()}-{dist_num}-{slug(name)}.md"

    if output_path_exists(REP_OUT, out_file):
        print(f"  [skip] {name} — already exists")
        return

    raw = get_or_create_raw_info(name, "Representative", state, district=district_id)
    print(f"  [summarizing] Rep {name} ({district_id})")
    summary = generate_summary(name, "Representative", state, district=district_id, raw=raw)
    write_rep_summary(district_id, name, summary)


# ---------------------------------------------------------------------------
# Loaders
# ---------------------------------------------------------------------------

def load_senators(state: str) -> list[dict]:
    path = DATA_STATES / state / "senators.json"
    if not path.exists():
        print(f"  [warn] no senators.json for {state}")
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data.get("senators", [])


def load_representative(district_id: str) -> dict | None:
    """
    Looks for representative.json directly under the district folder first,
    then falls back to the placeholders/ subfolder.
    # TODO: once real representative.json files are generated (T1.4 / T1.6),
    #       remove the placeholders fallback path.
    """
    base = DATA_DISTRICTS / district_id
    for candidate in [
        base / "representative.json",
        base / "placeholders" / "representative.json",
    ]:
        if candidate.exists():
            return json.loads(candidate.read_text(encoding="utf-8"))
    print(f"  [warn] no representative.json for {district_id}")
    return None


def get_district_ids_for_state(state: str) -> list[str]:
    """Return all district folder names that start with '{STATE}-'."""
    return sorted(
        d.name
        for d in DATA_DISTRICTS.iterdir()
        if d.is_dir() and d.name.startswith(f"{state}-")
    )


# ---------------------------------------------------------------------------
# State-level runner
# ---------------------------------------------------------------------------

def process_state(state: str, senators_only: bool = False, reps_only: bool = False):
    print(f"\n{'='*60}")
    print(f"Processing state: {state}")
    print(f"{'='*60}")

    if not reps_only:
        senators = load_senators(state)
        for senator in senators:
            process_senator(state, senator)

    if not senators_only:
        district_ids = get_district_ids_for_state(state)
        if not district_ids:
            print(f"  No district data for {state} (Layer 1 state — reps skipped)")
        for district_id in district_ids:
            rep_json = load_representative(district_id)
            if rep_json:
                process_representative(district_id, rep_json)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate politician summary markdown files via Perplexity + Claude."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--state", metavar="XX", help="Two-letter state code (e.g. CA)")
    group.add_argument("--all", action="store_true", help="Process all states")

    parser.add_argument("--senators-only", action="store_true")
    parser.add_argument("--reps-only", action="store_true")
    return parser.parse_args()


def all_state_codes() -> list[str]:
    return sorted(d.name for d in DATA_STATES.iterdir() if d.is_dir())


def main():
    args = parse_args()

    if not PERPLEXITY_API_KEY:
        raise EnvironmentError("PERPLEXITY_API_KEY is not set. Add it to .env or export it.")
    if not ANTHROPIC_API_KEY:
        raise EnvironmentError("ANTHROPIC_API_KEY is not set. Add it to .env or export it.")

    states = all_state_codes() if args.all else [args.state.upper()]

    for state in states:
        process_state(
            state,
            senators_only=args.senators_only,
            reps_only=args.reps_only,
        )

    print("\nDone.")


if __name__ == "__main__":
    main()
