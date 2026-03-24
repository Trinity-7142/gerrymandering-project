// components/state/ZipLookup.js
// Client Component — zip code → district lookup
// Lazy-loads /data/zip_to_district.json on mount, navigates or shows ComingSoonModal

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComingSoonModal from "@/components/shared/ComingSoonModal";
import { fonts, textColors, stateNames } from "@/lib/constants";

export default function ZipLookup({ availableStates = [] }) {
  const router = useRouter();
  const [zipMap, setZipMap]         = useState(null);
  const [zipInput, setZipInput]     = useState("");
  const [error, setError]           = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [modalState, setModalState] = useState(null);

  // Lazy-load the zip → district map once on mount
  useEffect(() => {
    fetch("/data/zip_to_district.json")
      .then((r) => r.json())
      .then(setZipMap)
      .catch(() => setZipMap({})); // fail gracefully
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const zip = zipInput.trim();
    if (!zipMap || !/^\d{5}$/.test(zip)) {
      setError("Please enter a valid 5-digit ZIP code.");
      return;
    }

    const districtId = zipMap[zip];
    if (!districtId) {
      setError("ZIP code not found. Please try another.");
      return;
    }

    const stateCode = districtId.split("-")[0];
    if (availableStates.includes(stateCode)) {
      router.push(`/district/${districtId}`);
    } else {
      setModalState(stateCode);
      setShowModal(true);
    }
  }

  const isLoading = zipMap === null;

  return (
    <>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder={isLoading ? "Loading…" : "Enter your ZIP code"}
          aria-label="ZIP code lookup"
          value={zipInput}
          disabled={isLoading}
          onChange={(e) => { setZipInput(e.target.value); setError(null); }}
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
};
