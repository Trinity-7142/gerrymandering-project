// components/shared/ComingSoonModal.js
// Client Component — modal shown when user enters zip for unsupported state

"use client";

import { useEffect, useRef } from "react";
import { cardStyle, textColors, fonts, colors } from "@/lib/constants";

export default function ComingSoonModal({ stateName, isOpen, onClose }) {
  const modalRef = useRef(null);

  // Focus trap + Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const firstFocusable = modalRef.current?.querySelector("button");
    firstFocusable?.focus();

    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Coming soon">
      <div ref={modalRef} style={styles.modal}>
        <h2 style={styles.heading}>Coming Soon</h2>
        <p style={styles.body}>
          {stateName
            ? <><strong>{stateName}</strong> data is not yet available.</>
            : "Data for this state is not yet available."
          }
        </p>
        <p style={styles.sub}>
          We&rsquo;re expanding coverage to all 50 states. Check back soon!
        </p>
        <button onClick={onClose} style={styles.closeBtn}>
          Close
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  modal: {
    ...cardStyle,
    padding: "40px",
    maxWidth: "380px",
    width: "100%",
    textAlign: "center",
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: "1.4rem",
    fontWeight: 700,
    color: textColors.primary,
    marginBottom: "12px",
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: "0.9rem",
    color: textColors.secondary,
    lineHeight: 1.6,
    marginBottom: "8px",
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: "0.82rem",
    color: textColors.muted,
    marginBottom: "24px",
  },
  closeBtn: {
    padding: "10px 28px",
    background: colors.primarySoftRed,
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontFamily: fonts.sans,
    fontSize: "0.88rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};
