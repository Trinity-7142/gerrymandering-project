// lib/loadData.js
// Helper functions for reading JSON files from public/data/ at build time
// Used by Server Components in page orchestrators (app/state/[stateCode]/page.js, etc.)
// Returns parsed JSON object or null if file doesn't exist

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