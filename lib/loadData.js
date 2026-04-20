// lib/loadData.js
// Helper functions for reading JSON files from public/data/ at build time
// Used by Server Components in page orchestrators (app/state/[stateCode]/page.js, etc.)
// Returns parsed JSON object or null if file doesn't exist

import matter from "gray-matter";
// TODO: import fs from 'fs' and path from 'path'

// TODO: loadGlobalData(filename)
//   Reads public/data/{filename} (e.g., "states.json", "issues.json")
//   Returns parsed object or null

// TODO: loadDistrictData(districtId, filename)
//   Reads public/data/districts/{districtId}/{filename}
//   e.g., loadDistrictData("CA-11", "alignment") reads .../CA-11/alignment.json
//   Returns parsed object or null

// NOTE: All reads use fs.readFileSync — this only runs at build time, never in browser
// NOTE: Return null (not throw) on missing files so panels render DataUnavailable gracefully
import fs from "fs";
import path from "path";

// ------------------------------------- Generic Content (Markdown) ------------------------------------
// Reads public/content/{...segments} — pass path segments as arguments
// e.g. loadContent("legal", "legal.md")
export function loadContent(...segments) {
  const filePath = path.join(process.cwd(), "public", "content", ...segments);
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return raw.replace(/^---[\s\S]*?---\s*/m, "").trim() || null;
  } catch {
    return null;
  }
}

// Returns { body: string|null, meta: object } — meta includes frontmatter fields
// e.g. loadContentWithMeta("methodology", "methodology.md")
export function loadContentWithMeta(...segments) {
  const filePath = path.join(process.cwd(), "public", "content", ...segments);
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    return { body: content.trim() || null, meta: data };
  } catch {
    return { body: null, meta: {} };
  }
}

// ------------------------------------- Key Facts (Markdown) ----------------------------------------
// Reads public/content/keyFacts/{stateCode.toLowerCase()}-facts.md
// Returns { body: string|null, sources: Array<{name,url}>|null }
export function loadKeyFacts(stateCode) {
  const filename = `${stateCode.toLowerCase()}-facts.md`;
  const filePath = path.join(process.cwd(), "public", "content", "keyFacts", filename);
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    return {
      body: content.trim() || null,
      sources: data.sources?.length ? data.sources : null,
    };
  } catch {
    return { body: null, sources: null };
  }
}

// ------------------------------------- State Content (Markdown) -------------------------------------
// Reads public/content/state/{stateCode}/{filename}
// Strips YAML frontmatter (--- ... ---) and returns raw markdown body, or null if missing
export function loadStateContent(stateCode, filename) {
  const filePath = path.join(
    process.cwd(), "public", "content", "state", stateCode, filename
  );
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    // Strip frontmatter block if present
    const body = raw.replace(/^---[\s\S]*?---\s*/m, "").trim();
    return body || null;
  } catch {
    return null;
  }
}

// ------------------------------------- Politician Bios (Markdown) -------------------
// Reads public/content/senator-info/{stateCode.lower}-{slug(name)}.md
// or     public/content/rep-info/{stateCode.lower}-{distNum}-{slug(name)}.md
// Returns stripped markdown body, or null if missing

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function loadSenatorBio(stateCode, name) {
  const filename = `${stateCode.toLowerCase()}-${slugify(name)}.md`;
  return loadContent("senator-info", filename);
}

// Returns { body: string|null, sources: Array<{name,url}>|null }
export function loadSenatorBioWithSources(stateCode, name) {
  const filename = `${stateCode.toLowerCase()}-${slugify(name)}.md`;
  const filePath = path.join(process.cwd(), "public", "content", "senator-info", filename);
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    return {
      body: content.trim() || null,
      sources: data.sources?.length ? data.sources : null,
    };
  } catch {
    return { body: null, sources: null };
  }
}

export function loadRepBio(stateCode, districtNum, name) {
  const filename = `${stateCode.toLowerCase()}-${districtNum}-${slugify(name)}.md`;
  return loadContent("rep-info", filename);
}

// Returns { body: string|null, sources: Array<{name,url}>|null }
export function loadRepBioWithSources(stateCode, districtNum, name) {
  const filename = `${stateCode.toLowerCase()}-${districtNum}-${slugify(name)}.md`;
  const filePath = path.join(process.cwd(), "public", "content", "rep-info", filename);
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    return {
      body: content.trim() || null,
      sources: data.sources?.length ? data.sources : null,
    };
  } catch {
    return { body: null, sources: null };
  }
}

// ------------------------------------- All-State Alignment Scores -------------------------------------
// Reads overview.json for every state directory and returns { stateCode: house_alignment }.
// house_alignment is null when not yet computed. Used to colour the home page choropleth.
export function loadAllStateAlignments() {
  const statesDir = path.join(process.cwd(), "public", "data", "states");
  const scores = {};
  try {
    const dirs = fs.readdirSync(statesDir, { withFileTypes: true });
    for (const entry of dirs) {
      if (!entry.isDirectory()) continue;
      const stateCode = entry.name;
      const filePath = path.join(statesDir, stateCode, "overview.json");
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        scores[stateCode] = data.house_alignment ?? null;
      } catch {
        scores[stateCode] = null;
      }
    }
  } catch {
    // statesDir missing — return empty
  }
  return scores;
}

// ------------------------------------- District Data -------------------------------------
export function loadDistrictData(districtId, filename) {
  const filePath = path.join(
    process.cwd(), "public", "data", "districts", districtId, filename
  );
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ------------------------------------- State Data -------------------------------------
export function loadStateData(stateCode, filename) {
  const filePath = path.join(
    process.cwd(), "public", "data", "states", stateCode, filename
  );
  console.log("Trying to read:", filePath);
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    console.log("Success, got", raw.length, "chars");
    return JSON.parse(raw);
  } catch (err) {
    console.log("Failed:", err.message);
    return null;
  }
}