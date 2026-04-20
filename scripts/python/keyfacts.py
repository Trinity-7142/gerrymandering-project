"""
keyfacts.py

Generates {stateCode}-facts.md from API calls.

Single-phase approach:
  Claude Sonnet 4.6 uses its built-in web_search tool to gather current
  information about a state's redistricting process and write a short,
  structured markdown explainer in one API call.

Outputs:
  - Facts: public/content/keyFacts/{stateCode}-facts.md
  - Debug cache: data-raw/web-search/{STATE_CODE}/{stateCode}-facts.txt
                 (search queries Claude ran + source URLs cited, for traceability)

Usage:
  python3 keyfacts.py --state CA      # single state
  python3 keyfacts.py --all           # all states found in public/data/states

Environment variables (set in .env or export before running):
  ANTHROPIC_API_KEY
"""

import os
import re
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

# By default this file lives in scripts/python/ so we go up two levels.
PROJECT_ROOT    = Path(__file__).resolve().parent.parent.parent
DATA_STATES     = PROJECT_ROOT / "public" / "data" / "states"
DEBUG_CACHE_DIR = PROJECT_ROOT / "data-raw" / "web-search"
KEYFACTS_OUT    = PROJECT_ROOT / "public" / "content" / "keyFacts"

CLAUDE_MODEL = "claude-sonnet-4-6"
WEB_SEARCH_MAX_USES = 5

# Client-level retries — SDK handles 429/408/409/5xx with backoff + retry-after.
SDK_MAX_RETRIES = 5

# Outer safety-net retries on top of the SDK's own retries.
MAX_OUTER_RETRIES = 3

# Proactive pacing between states.
CLAUDE_DELAY = 3.0

# Backoff bounds for the outer retry loop.
BACKOFF_BASE = 2.0
BACKOFF_MAX  = 60.0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
}

T = TypeVar("T")

_NON_RETRYABLE = (
    anthropic.BadRequestError,
    anthropic.AuthenticationError,
    anthropic.PermissionDeniedError,
    anthropic.NotFoundError,
)


def _wait_from_rate_limit(err: anthropic.RateLimitError) -> float:
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
        wait = 30.0

    wait += random.uniform(0, 0.5)
    return min(wait, BACKOFF_MAX)


def _exponential_backoff(attempt: int) -> float:
    ceiling = min(BACKOFF_BASE * (2 ** (attempt - 1)), BACKOFF_MAX)
    return random.uniform(0, ceiling)


def _call_with_retry(fn: Callable[[], T], label: str) -> T:
    for attempt in range(1, MAX_OUTER_RETRIES + 1):
        try:
            return fn()

        except _NON_RETRYABLE as e:
            print(f"    [{label}] non-retryable error: {type(e).__name__}: {e}")
            raise

        except anthropic.RateLimitError as e:
            wait = _wait_from_rate_limit(e)
            print(
                f"    [{label}] rate limited (attempt {attempt}/{MAX_OUTER_RETRIES}); "
                f"waiting {wait:.1f}s before retry"
            )
            if attempt < MAX_OUTER_RETRIES:
                time.sleep(wait)
            else:
                raise

        except (anthropic.APIConnectionError, anthropic.APIStatusError) as e:
            wait = _exponential_backoff(attempt)
            print(
                f"    [{label}] transient error (attempt {attempt}/{MAX_OUTER_RETRIES}): "
                f"{type(e).__name__}: {e}; waiting {wait:.1f}s"
            )
            if attempt < MAX_OUTER_RETRIES:
                time.sleep(wait)
            else:
                raise

    raise RuntimeError("unreachable")


# ---------------------------------------------------------------------------
# Claude generation (with built-in web search)
# ---------------------------------------------------------------------------

KEYFACTS_SYSTEM_PROMPT = textwrap.dedent("""\
    You are a neutral, factual political analyst writing a brief explainer of
    the key facts of a U.S. state for a public-facing educational website.
    Be balanced, informative, and concise. Do not editorialize or take
    political sides.

    You have access to a web_search tool. Use it to gather current, accurate
    information about the state before writing.

    Output format — follow exactly:

    1. Frontmatter block:
       ---
       state: <two-letter state code>
       ---

    2. One body paragraph of 100 words maximum. The paragraph must:
       - discuss how the congressional districts are drawn in the state
       - discuss when the current maps were drawn and how they were decided on
       - include something notable, controversial, or otherwise relevant about
         the state's map-drawing process or legislation affecting representation

    Output ONLY the frontmatter and the body paragraph. No preamble, no commentary
    about your search process, no source list, no headings.
""")


def _build_user_prompt(state_code: str) -> str:
    state_name = STATE_NAMES.get(state_code.upper(), state_code.upper())
    return f"Write the key facts explainer for {state_name} ({state_code.upper()})."


def _extract_text(msg) -> str:
    chunks = [block.text for block in msg.content if block.type == "text"]
    if not chunks:
        raise RuntimeError(
            f"No text blocks in response; got types: {[b.type for b in msg.content]}"
        )
    raw = "".join(chunks).strip()
    return _normalize_body_whitespace(raw)


def _normalize_body_whitespace(md: str) -> str:
    pattern = re.compile(
        r"\A(---\s*\n(?:(?!^---\s*$).*\n)*?---\s*\n)",
        re.MULTILINE,
    )
    match = pattern.match(md)
    if not match:
        return md

    frontmatter = match.group(1)
    body = md[match.end():]
    body_normalized = re.sub(r"\s+", " ", body).strip()
    return f"{frontmatter}\n{body_normalized}\n"


def _extract_debug_info(msg) -> str:
    lines = ["=== Claude web_search trace ===", f"model: {CLAUDE_MODEL}", ""]

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


def _write_debug_cache(state: str, debug_text: str, facts_md: str):
    cache_dir = DEBUG_CACHE_DIR / state
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_file = cache_dir / f"{state.lower()}-facts.txt"
    body = f"{debug_text}\n\n=== Generated facts ===\n{facts_md}\n"
    cache_file.write_text(body, encoding="utf-8")
    print(f"  [debug] {cache_file.relative_to(PROJECT_ROOT)}")


# ---------------------------------------------------------------------------
# Source attribution — domain labels + frontmatter injection
# ---------------------------------------------------------------------------

_DOMAIN_LABELS: dict[str, str] = {
    "en.wikipedia.org":        "Wikipedia",
    "ballotpedia.org":         "Ballotpedia",
    "ncsl.org":                "NCSL",
    "justice.gov":             "DOJ",
    "supremecourt.gov":        "Supreme Court",
    "redistricting.lls.edu":   "All About Redistricting",
    "census.gov":              "U.S. Census Bureau",
    "congress.gov":            "Congress.gov",
    "senate.gov":              "Senate.gov",
    "house.gov":               "House.gov",
    "reuters.com":             "Reuters",
    "apnews.com":              "Associated Press",
    "nytimes.com":             "The New York Times",
    "washingtonpost.com":      "The Washington Post",
    "politico.com":            "Politico",
    "thehill.com":             "The Hill",
    "brennancenter.org":       "Brennan Center",
    "campaignlegal.org":       "Campaign Legal Center",
}


def _domain_label(url: str) -> str:
    try:
        host = urlparse(url).netloc.lower()
    except Exception:
        return url
    if not host:
        return url
    if host.startswith("www."):
        host = host[4:]
    for domain_key in sorted(_DOMAIN_LABELS.keys(), key=len, reverse=True):
        if host == domain_key or host.endswith("." + domain_key):
            return _DOMAIN_LABELS[domain_key]
    return host


def _extract_cited_urls(msg) -> list[str]:
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
    needs_quote = bool(re.search(r'[:#\[\]{}\'\",&*!|>%@`\n\t]', s)) or s.strip() != s or not s
    if needs_quote:
        escaped = s.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    return s


def _build_sources_yaml(urls: list[str], indent: str = "  ") -> str:
    if not urls:
        return ""

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


def _inject_sources_into_frontmatter(facts_md: str, sources_yaml: str) -> str:
    if not sources_yaml:
        return facts_md

    pattern = re.compile(
        r"\A(---\s*\n)(?P<body>(?:(?!^---\s*$).*\n)*?)(---\s*\n)",
        re.MULTILINE,
    )
    match = pattern.match(facts_md)
    if not match:
        print("  [warn] no frontmatter found in facts; sources not injected")
        return facts_md

    open_line, body, close_line = match.group(1), match.group("body"), match.group(3)
    if not body.endswith("\n"):
        body += "\n"

    new_frontmatter = f"{open_line}{body}sources:\n{sources_yaml}\n{close_line}"
    return new_frontmatter + facts_md[match.end():]


def generate_keyfacts(state: str) -> tuple[str, str]:
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY, max_retries=SDK_MAX_RETRIES)
    user_prompt = _build_user_prompt(state)

    def call():
        return client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1500,
            system=KEYFACTS_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
            tools=[{
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": WEB_SEARCH_MAX_USES,
            }],
        )

    msg = _call_with_retry(call, f"Claude key facts: {state}")
    time.sleep(CLAUDE_DELAY)

    facts_md = _extract_text(msg)
    cited_urls = _extract_cited_urls(msg)
    sources_yaml = _build_sources_yaml(cited_urls)
    facts_md = _inject_sources_into_frontmatter(facts_md, sources_yaml)

    debug_text = _extract_debug_info(msg)
    return facts_md, debug_text


# ---------------------------------------------------------------------------
# File writers
# ---------------------------------------------------------------------------

def write_keyfacts(state: str, facts_md: str):
    KEYFACTS_OUT.mkdir(parents=True, exist_ok=True)
    out_path = KEYFACTS_OUT / f"{state.lower()}-facts.md"
    out_path.write_text(facts_md, encoding="utf-8")
    print(f"  → wrote {out_path.relative_to(PROJECT_ROOT)}")


def output_path_exists(state: str) -> bool:
    return (KEYFACTS_OUT / f"{state.lower()}-facts.md").exists()


# ---------------------------------------------------------------------------
# Per-state orchestration
# ---------------------------------------------------------------------------

def process_state(state: str):
    state = state.upper()
    if state not in STATE_NAMES:
        print(f"  [warn] unknown state code {state}; continuing anyway")

    print(f"\n{'='*60}")
    print(f"Processing state facts: {state}")
    print(f"{'='*60}")

    if output_path_exists(state):
        print(f"  [skip] {state} — already exists")
        return

    print(f"  [generating] {STATE_NAMES.get(state, state)}")
    facts_md, debug = generate_keyfacts(state)
    write_keyfacts(state, facts_md)
    _write_debug_cache(state, debug, facts_md)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate state key facts markdown files via Claude + web_search."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--state", metavar="XX", help="Two-letter state code (e.g. CA)")
    group.add_argument("--all", action="store_true", help="Process all states")
    return parser.parse_args()


def all_state_codes() -> list[str]:
    if DATA_STATES.exists():
        return sorted(d.name for d in DATA_STATES.iterdir() if d.is_dir())
    return sorted(STATE_NAMES.keys())


def main():
    args = parse_args()

    if not ANTHROPIC_API_KEY:
        raise EnvironmentError("ANTHROPIC_API_KEY is not set. Add it to .env or export it.")

    states = all_state_codes() if args.all else [args.state.upper()]

    for state in states:
        process_state(state)

    print("\nDone.")


if __name__ == "__main__":
    main()