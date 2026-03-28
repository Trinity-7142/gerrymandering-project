// components/state/ZipLookup.js
// Client Component — zip code → district lookup
// Lazy-loads /data/zip_to_district.json on mount, navigates or shows ComingSoonModal

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComingSoonModal from "@/components/shared/ComingSoonModal";
import { fonts, textColors, stateNames, fipsToState } from "@/lib/constants";

/** Convert FIPS district code "0611" → "CA-11" */
function fipsToDistrictId(fipsCode) {
  const stateCode = fipsToState[fipsCode.slice(0, 2)];
  if (!stateCode) return null;
  return `${stateCode}-${parseInt(fipsCode.slice(2), 10)}`;
}

/** Extract just the state code from a FIPS district code */
function fipsToStateCode(fipsCode) {
  return fipsToState[fipsCode.slice(0, 2)] ?? null;
}

export default function ZipLookup({ availableStates = [] }) {
  const router = useRouter();
  const [zipMap, setZipMap]         = useState(null);
  const [zipInput, setZipInput]     = useState("");
  const [error, setError]           = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [modalState, setModalState] = useState(null);
  const [multiResult, setMultiResult] = useState(null);

  // Lazy-load the zip → district map once on mount
  useEffect(() => {
    fetch("/data/zip_to_district.json")
      .then((r) => r.json())
      .then(setZipMap)
      .catch(() => setZipMap({}));
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMultiResult(null);

    const zip = zipInput.trim();
    if (!zipMap || !/^\d{5}$/.test(zip)) {
      setError("Please enter a valid 5-digit ZIP code.");
      return;
    }

    const entry = zipMap[zip];
    if (!entry) {
      setError("ZIP code not found. Please try another.");
      return;
    }

    // Single-district: value[0] is a string (FIPS code)
    if (typeof entry[0] === "string") {
      const districtId = fipsToDistrictId(entry[0]);
      const stateCode = fipsToStateCode(entry[0]);
      if (!districtId || !stateCode) {
        setError("Could not determine district. Please try another ZIP.");
        return;
      }
      navigateOrModal(stateCode, districtId);
      return;
    }

    // Multi-district: value[0] is [fips, ratio] (max), value[1] is full list
    if (Array.isArray(entry[0])) {
      const [maxFips, maxRatio] = entry[0];
      const allDistricts = entry[1];
      const stateCode = fipsToStateCode(maxFips);

      if (!stateCode || !availableStates.includes(stateCode)) {
        navigateOrModal(stateCode, null);
        return;
      }

      setMultiResult({
        suggested: { districtId: fipsToDistrictId(maxFips), ratio: maxRatio },
        all: allDistricts.map(([fips, ratio]) => ({
          districtId: fipsToDistrictId(fips),
          ratio,
        })),
      });
      return;
    }

    setError("Unexpected data format. Please try another ZIP.");
  }

  function navigateOrModal(stateCode, districtId) {
    if (stateCode && availableStates.includes(stateCode) && districtId) {
      router.push(`/district/${districtId}`);
    } else {
      setModalState(stateCode);
      setShowModal(true);
    }
  }

  function handleDistrictSelect(districtId) {
    setMultiResult(null);
    router.push(`/district/${districtId}`);
  }

  const isLoading = zipMap === null;

  return (
    <>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder={isLoading ? "Loading\u2026" : "Enter your ZIP code"}
          aria-label="ZIP code lookup"
          value={zipInput}
          disabled={isLoading}
          onChange={(e) => { setZipInput(e.target.value); setError(null); setMultiResult(null); }}
          style={{
            ...styles.input,
            opacity: isLoading ? 0.6 : 1,
          }}
        />
        <button type="submit" disabled={isLoading} style={styles.btn}>
          Find District
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      {multiResult && (
        <div style={styles.multiContainer}>
          <p style={styles.multiHint}>
            Your ZIP code spans multiple districts.
            {multiResult.suggested.ratio >= 0.5 && (
              <> About <strong>{Math.round(multiResult.suggested.ratio * 100)}%</strong> of
              locations in your ZIP are in <strong>{multiResult.suggested.districtId}</strong>.</>
            )}
          </p>
          <div style={styles.multiButtons}>
            {multiResult.all.map(({ districtId, ratio }) => {
              const isSuggested = districtId === multiResult.suggested.districtId;
              return (
                <button
                  key={districtId}
                  onClick={() => handleDistrictSelect(districtId)}
                  style={{
                    ...styles.districtBtn,
                    ...(isSuggested ? styles.districtBtnSuggested : {}),
                  }}
                >
                  {districtId}
                  <span style={styles.ratio}>{Math.round(ratio * 100)}%</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <ComingSoonModal
        stateName={stateNames[modalState] ?? modalState}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

const styles = {
  form: {
    display: "flex",
    gap: "8px",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    border: "1.5px solid #E8E6E3",
    borderRadius: "10px",
    fontFamily: fonts.sans,
    fontSize: "0.85rem",
    color: textColors.primary,
    background: "#FAFAFA",
    outline: "none",
  },
  btn: {
    padding: "10px 18px",
    background: "#A64745",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontFamily: fonts.sans,
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  error: {
    marginTop: "8px",
    fontSize: "0.78rem",
    color: "#C93545",
    fontFamily: fonts.sans,
  },
  multiContainer: {
    marginTop: "12px",
    padding: "12px 16px",
    background: "#FAFAFA",
    border: "1px solid #E8E6E3",
    borderRadius: "10px",
  },
  multiHint: {
    margin: "0 0 10px 0",
    fontSize: "0.82rem",
    fontFamily: fonts.sans,
    color: textColors.secondary,
    lineHeight: 1.4,
  },
  multiButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  districtBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    background: "#fff",
    border: "1.5px solid #E8E6E3",
    borderRadius: "8px",
    fontFamily: fonts.sans,
    fontSize: "0.82rem",
    fontWeight: 500,
    color: textColors.primary,
    cursor: "pointer",
  },
  districtBtnSuggested: {
    borderColor: "#A64745",
    background: "rgba(166,71,69,0.06)",
    fontWeight: 600,
  },
  ratio: {
    fontSize: "0.72rem",
    color: textColors.muted,
    fontWeight: 400,
  },
};
