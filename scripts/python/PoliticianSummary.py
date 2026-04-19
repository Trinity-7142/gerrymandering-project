"""
PoliticianSummary.py

Generates biography/summary markdown files for senators and House representatives.

Single-phase approach (refactored from the old Perplexity + Claude two-phase pipeline):
  Claude Sonnet 4.6 uses its built-in web_search tool to gather info AND write
  the structured markdown summary in one API call.

Outputs:
  - Summaries: senators -> public/content/senator-info/{stateCode}-{firstName}-{lastName}.md
               reps     -> public/content/rep-info/{stateCode}-{district}-{firstName}-{lastName}.md
  - Debug cache: data-raw/web-search/{STATE_CODE}/{slug}.txt
                 (search queries Claude ran + source URLs cited, for traceability)

Usage:
  python PoliticianSummary.py --state CA            # all senators + CA/TX reps
  python PoliticianSummary.py --state CA --senators-only
  python PoliticianSummary.py --state CA --reps-only
  python PoliticianSummary.py --all                 # all 51 state directories

Environment variables (set in .env or export before running):
  ANTHROPIC_API_KEY

Note: unlike the Perplexity version, only ONE API key is required now.
"""

import os
import re
import json
import time
import random
import argparse
import textwrap
from pathlib import Path
from typing import Callable, TypeVar
from urllib.parse import urlparse

import anthropic
from dotenv import load_dotenv  # pip install python-dotenv


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# TODO: confirm these paths are right relative to where you run the script.
#       By default this file lives in scripts/python/ so we go up two levels.
PROJECT_ROOT   = Path(__file__).resolve().parent.parent.parent
DATA_STATES    = PROJECT_ROOT / "public" / "data" / "states"
DATA_DISTRICTS = PROJECT_ROOT / "public" / "data" / "districts"
DEBUG_CACHE_DIR = PROJECT_ROOT / "data-raw" / "web-search"
SENATOR_OUT    = PROJECT_ROOT / "public" / "content" / "senator-info"
REP_OUT        = PROJECT_ROOT / "public" / "content" / "rep-info"

CLAUDE_MODEL = "claude-sonnet-4-6"
WEB_SEARCH_MAX_USES = 5   # ~$0.01 per search -> $0.05 cap per politician.
                          # Lower this if Tier 1 ITPM (30K/min) is getting saturated —
                          # each search pulls web content that counts as input tokens.

# Client-level retries — SDK handles 429/408/409/5xx with backoff + retry-after.
SDK_MAX_RETRIES = 5

# Outer safety-net retries on top of SDK retries (for the rare case of sustained
# rate-limit saturation that outlasts SDK's internal attempts).
MAX_OUTER_RETRIES = 3

# Proactive pacing between politicians. Tier 1 = 30K ITPM for Sonnet; web_search
# can easily pull 10K+ input tokens per call, so space requests out to let the
# token bucket refill. Bump higher if you still see rate-limit errors.
CLAUDE_DELAY = 3.0

# Backoff bounds for the outer retry loop.
BACKOFF_BASE = 2.0    # first wait = BACKOFF_BASE seconds
BACKOFF_MAX  = 60.0   # cap any single wait at this


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slug(name: str) -> str:
    """'Adam Schiff' → 'adam-schiff'"""
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


T = TypeVar("T")

# Errors that should NOT be retried — they won't succeed no matter how long we wait.
_NON_RETRYABLE = (
    anthropic.BadRequestError,        # 400 — malformed request
    anthropic.AuthenticationError,    # 401 — bad API key
    anthropic.PermissionDeniedError,  # 403 — permission issue
    anthropic.NotFoundError,          # 404 — bad model name, etc.
)


def _wait_from_rate_limit(err: anthropic.RateLimitError) -> float:
    """
    Read the server-provided retry-after header if present, else fall back to a
    sensible default. Adds jitter to avoid synchronized retries. Capped at BACKOFF_MAX.
    """
    retry_after = None
    try:
        retry_after = err.response.headers.get("retry-after")
    except Exception:
        pass

    if retry_after is not None:
        try:
            wait = float(retry_after)
        except (TypeError, ValueError):
            wait = BACKOFF_BASE
    else:
        # No header — token bucket for ITPM resets continuously, so a 30s wait
        # usually clears things up on Tier 1.
        wait = 30.0

    # Jitter 0-500ms to avoid lockstep retries if ever run concurrently.
    wait += random.uniform(0, 0.5)
    return min(wait, BACKOFF_MAX)


def _exponential_backoff(attempt: int) -> float:
    """Exponential backoff with full jitter. attempt is 1-indexed."""
    ceiling = min(BACKOFF_BASE * (2 ** (attempt - 1)), BACKOFF_MAX)
    return random.uniform(0, ceiling)


def _call_with_retry(fn: Callable[[], T], label: str) -> T:
    """
    Safety-net retry wrapper that sits on top of the SDK's own retries.

    - Rate limits (429): honor the retry-after header if present.
    - Connection errors / 5xx: exponential backoff with jitter.
    - Bad requests / auth errors: raise immediately (not retryable).
    """
    for attempt in range(1, MAX_OUTER_RETRIES + 1):
        try:
            return fn()

        except _NON_RETRYABLE as e:
            # These won't succeed on retry. Surface them immediately.
            print(f"    [{label}] non-retryable error: {type(e).__name__}: {e}")
            raise

        except anthropic.RateLimitError as e:
            wait = _wait_from_rate_limit(e)
            print(f"    [{label}] rate limited (attempt {attempt}/{MAX_OUTER_RETRIES}); "
                  f"waiting {wait:.1f}s before retry")
            if attempt < MAX_OUTER_RETRIES:
                time.sleep(wait)
            else:
                raise

        except (anthropic.APIConnectionError, anthropic.APIStatusError) as e:
            wait = _exponential_backoff(attempt)
            print(f"    [{label}] transient error (attempt {attempt}/{MAX_OUTER_RETRIES}): "
                  f"{type(e).__name__}: {e}; waiting {wait:.1f}s")
            if attempt < MAX_OUTER_RETRIES:
                time.sleep(wait)
            else:
                raise

    # Unreachable — the loop always either returns or raises.
    raise RuntimeError("unreachable")


# ---------------------------------------------------------------------------
# Claude summary (with built-in web search)
# ---------------------------------------------------------------------------

SUMMARY_SYSTEM_PROMPT = textwrap.dedent("""\
    You are a neutral, factual political analyst writing brief legislator profiles
    for a public-facing educational & informative website. Be balanced, informative, and concise.
    Do not editorialize or take political sides.

    You have access to a web_search tool. Use it to gather current, accurate information
    about the legislator before writing. You may run multiple searches to cover their
    background, campaign platform, and notable facts.

    After gathering information, write a summary with the following structure:

    - Total Word count: 150 words maximum.
    - Use **bold** for key terms or important points.
    - Start with frontmatter in this exact format (district line omitted for senators):

        ---
        name: <full name>
        state: <two-letter state code>
        district: <district id like CA-11>   # only for representatives
        ---

    - Body must be exactly one paragraph.
    - Body must include all of the following information:
        1. Introduce the legislator. Use "Sen. [lastName]" for senators or
           "Rep. [lastName]" for representatives. State what they represent
           (state, and district if applicable). Explain their ideology,
           hometown, socioeconomic background, and stated beliefs (2 sentences maximum)
        2. Campaign platform: what they campaigned on and key policy promises (2 sentences maximum).
        3. Notable accomplishments, controversies, or distinguishing facts (2 sentences maximum).
    Final output must be single paragraph. No paragraph breaks, no spacing between paragraph. One continous paragraph.
    Output ONLY the frontmatter and one paragraph — no preamble, no commentary
    about your search process, no source list at the end.
""")



def _build_user_prompt(name: str, title: str, state: str, district: str | None) -> str:
    """The user message just names the target; the system prompt holds the instructions."""
    location = f"{state}'s {district} congressional district" if district else state
    return f"Write the profile for {title} {name} of {location}."


def _extract_text(msg) -> str:
    """
    Concatenate all `text` blocks from the response.
    With web_search enabled, msg.content also contains server_tool_use and
    web_search_tool_result blocks that we ignore here.
    """
    chunks = [block.text for block in msg.content if block.type == "text"]
    if not chunks:
        raise RuntimeError(f"No text blocks in response; got types: "
                           f"{[b.type for b in msg.content]}")
    return "\n".join(chunks).strip()


def _extract_debug_info(msg) -> str:
    """
    Pull three things from the response for the debug cache:
      1. Queries Claude ran (from server_tool_use blocks)
      2. All result URLs each query returned (from web_search_tool_result blocks)
      3. Citations Claude actually used in its final text — URL + title +
         cited_text excerpt, deduplicated by URL.

    Returns a plain-text summary safe to write to disk.
    """
    lines = ["=== Claude web_search trace ===", f"model: {CLAUDE_MODEL}", ""]

    # --- Part 1 & 2: searches run and URLs returned ---
    query_num = 0
    for block in msg.content:
        if block.type == "server_tool_use" and getattr(block, "name", None) == "web_search":
            query_num += 1
            query = (block.input or {}).get("query", "<no query>")
            lines.append(f"--- Search {query_num} ---")
            lines.append(f"query: {query}")

        elif block.type == "web_search_tool_result":
            content = getattr(block, "content", None)
            if content is None:
                continue
            if isinstance(content, list):
                for item in content:
                    if getattr(item, "type", "") == "web_search_result":
                        url = getattr(item, "url", "")
                        title = getattr(item, "title", "")
                        lines.append(f"  - {title} :: {url}")
            else:
                err_code = getattr(content, "error_code", "unknown")
                lines.append(f"  [search error: {err_code}]")
            lines.append("")

    # --- Part 3: citations Claude actually used, grouped by URL ---
    # Each text block can carry a .citations list; each citation has .url,
    # .title, and .cited_text (the exact snippet Claude drew from).
    citations_by_url: dict[str, dict] = {}
    for block in msg.content:
        if block.type != "text":
            continue
        citations = getattr(block, "citations", None) or []
        for cit in citations:
            url = getattr(cit, "url", None)
            if not url:
                continue
            entry = citations_by_url.setdefault(url, {
                "title": getattr(cit, "title", "") or "",
                "quotes": [],
            })
            cited_text = getattr(cit, "cited_text", "") or ""
            if cited_text and cited_text not in entry["quotes"]:
                entry["quotes"].append(cited_text)

    lines.append("=== Citations used in summary ===")
    if not citations_by_url:
        lines.append("(none — Claude wrote without citing specific sources)")
    else:
        for i, (url, info) in enumerate(citations_by_url.items(), 1):
            lines.append(f"[{i}] {info['title']}")
            lines.append(f"    url: {url}")
            for q in info["quotes"]:
                lines.append(f"    quote: {q}")
            lines.append("")

    lines.append("=== End trace ===")
    return "\n".join(lines)


def _write_debug_cache(state: str, name: str, debug_text: str, summary_md: str):
    """Write the search trace and the final summary to data-raw/web-search/ for debugging."""
    cache_dir = DEBUG_CACHE_DIR / state
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_file = cache_dir / f"{slug(name)}.txt"
    body = f"{debug_text}\n\n=== Generated summary ===\n{summary_md}\n"
    cache_file.write_text(body, encoding="utf-8")
    print(f"  [debug] {cache_file.relative_to(PROJECT_ROOT)}")


# ---------------------------------------------------------------------------
# Source attribution — domain labels + frontmatter injection
# ---------------------------------------------------------------------------

# Common political-data domains mapped to clean display names. Anything not
# listed falls back to the bare hostname (e.g. "example.com").
# Keys are matched by endswith() on the hostname, so subdomains work.
_DOMAIN_LABELS: dict[str, str] = {
    "en.wikipedia.org":        "Wikipedia",
    "ballotpedia.org":         "Ballotpedia",
    "senate.gov":              "Senate.gov",
    "house.gov":                "House.gov",
    "congress.gov":            "Congress.gov",
    "gao.gov":                 "GAO",
    "fec.gov":                 "FEC",
    "opensecrets.org":         "OpenSecrets",
    "govtrack.us":             "GovTrack",
    "votesmart.org":           "Vote Smart",
    "propublica.org":          "ProPublica",
    "politifact.com":          "PolitiFact",
    "nytimes.com":             "The New York Times",
    "washingtonpost.com":      "The Washington Post",
    "wsj.com":                 "The Wall Street Journal",
    "latimes.com":             "Los Angeles Times",
    "texastribune.org":        "The Texas Tribune",
    "politico.com":            "Politico",
    "thehill.com":             "The Hill",
    "rollcall.com":            "Roll Call",
    "npr.org":                 "NPR",
    "reuters.com":             "Reuters",
    "apnews.com":              "Associated Press",
    "bbc.com":                 "BBC",
    "cnn.com":                 "CNN",
    "foxnews.com":             "Fox News",
    "cbsnews.com":             "CBS News",
    "nbcnews.com":             "NBC News",
    "abcnews.go.com":          "ABC News",
}


def _domain_label(url: str) -> str:
    """Return a clean display name for a URL based on its hostname."""
    try:
        host = urlparse(url).netloc.lower()
    except Exception:
        return url
    if not host:
        return url
    # Strip leading "www."
    if host.startswith("www."):
        host = host[4:]
    # Match longest-suffix first so subdomains pick up the parent label.
    for domain_key in sorted(_DOMAIN_LABELS.keys(), key=len, reverse=True):
        if host == domain_key or host.endswith("." + domain_key):
            return _DOMAIN_LABELS[domain_key]
    return host


def _extract_cited_urls(msg) -> list[str]:
    """
    Return unique citation URLs in the order Claude first cited them.
    Reads each text block's .citations list.
    """
    seen: set[str] = set()
    ordered: list[str] = []
    for block in msg.content:
        if block.type != "text":
            continue
        for cit in getattr(block, "citations", None) or []:
            url = getattr(cit, "url", None)
            if url and url not in seen:
                seen.add(url)
                ordered.append(url)
    return ordered


def _yaml_escape(s: str) -> str:
    """
    Conservatively quote a string for YAML scalar context if it contains
    characters that would need escaping. Simple strings pass through unquoted.
    """
    # Characters that are safe unquoted in a YAML flow scalar.
    # If the string has any of these, wrap in double quotes and escape backslash + quote.
    needs_quote = bool(re.search(r'[:#\[\]{}\'",&*!|>%@`\n\t]', s)) or s.strip() != s or not s
    if needs_quote:
        escaped = s.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    return s


def _build_sources_yaml(urls: list[str], indent: str = "  ") -> str:
    """
    Build a YAML list of {name, url} entries for the frontmatter.
    Deduplicates by domain label so we don't list "Wikipedia" five times for
    five different Wikipedia pages.

    Returns the lines (no leading 'sources:' key), joined with newlines.
    """
    if not urls:
        return ""

    # Dedup by label — keep the first URL we saw for each label.
    seen_labels: dict[str, str] = {}
    for url in urls:
        label = _domain_label(url)
        if label not in seen_labels:
            seen_labels[label] = url

    lines: list[str] = []
    for label, url in seen_labels.items():
        lines.append(f"{indent}- name: {_yaml_escape(label)}")
        lines.append(f"{indent}  url: {_yaml_escape(url)}")
    return "\n".join(lines)


def _inject_sources_into_frontmatter(summary_md: str, sources_yaml: str) -> str:
    """
    Insert a `sources:` block into the existing frontmatter before its closing '---'.
    If the markdown has no recognizable frontmatter or sources_yaml is empty,
    return the input unchanged.
    """
    if not sources_yaml:
        return summary_md

    # Match an opening '---' at the start, any frontmatter body, and closing '---'.
    # The body must not contain a '---' on its own line.
    pattern = re.compile(
        r"\A(---\s*\n)(?P<body>(?:(?!^---\s*$).*\n)*?)(---\s*\n)",
        re.MULTILINE,
    )
    match = pattern.match(summary_md)
    if not match:
        # No frontmatter to inject into — fail safe, leave as-is.
        print("  [warn] no frontmatter found in summary; sources not injected")
        return summary_md

    open_line, body, close_line = match.group(1), match.group("body"), match.group(3)
    # Ensure body ends with a newline before we append.
    if not body.endswith("\n"):
        body += "\n"

    new_frontmatter = f"{open_line}{body}sources:\n{sources_yaml}\n{close_line}"
    return new_frontmatter + summary_md[match.end():]


def generate_summary(name: str, title: str, state: str, district: str | None) -> tuple[str, str]:
    """
    Call Claude Sonnet with web_search enabled. Returns (summary_markdown, debug_text).
    """
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY, max_retries=SDK_MAX_RETRIES)
    user_prompt = _build_user_prompt(name, title, state, district)

    def call():
        return client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1500,  # higher than before; web_search results count as input
                              # but Claude may emit them inline before the final text
            system=SUMMARY_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
            tools=[{
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": WEB_SEARCH_MAX_USES,
            }],
        )

    msg = _call_with_retry(call, f"Claude summary: {name}")
    time.sleep(CLAUDE_DELAY)

    summary_md = _extract_text(msg)

    # Inject the sources list into Claude's frontmatter. Dedup by domain label
    # so we show one entry per source site (e.g. a single "Wikipedia" entry even
    # if Claude cited multiple Wikipedia pages).
    cited_urls = _extract_cited_urls(msg)
    sources_yaml = _build_sources_yaml(cited_urls)
    summary_md = _inject_sources_into_frontmatter(summary_md, sources_yaml)

    debug_text = _extract_debug_info(msg)
    return summary_md, debug_text


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

    print(f"  [summarizing] Senator {name}")
    summary, debug = generate_summary(name, "Senator", state, district=None)
    write_senator_summary(state, name, summary)
    _write_debug_cache(state, name, debug, summary)


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

    print(f"  [summarizing] Rep {name} ({district_id})")
    summary, debug = generate_summary(name, "Representative", state, district=district_id)
    write_rep_summary(district_id, name, summary)
    _write_debug_cache(state, name, debug, summary)


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
    if not DATA_DISTRICTS.exists():
        return []
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
        description="Generate politician summary markdown files via Claude + web_search."
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