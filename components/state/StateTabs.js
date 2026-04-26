// components/state/StateTabs.js
// Client Component — WCAG-compliant tab bar with sliding indicator
// Accepts server-rendered panel content as props

"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { colors, fonts, textColors } from "@/lib/constants";

const TABS = [
  { id: "overview",    label: "Overview",           controls: "panel-overview" },
  { id: "districts",  label: "All Districts",       controls: "panel-districts" },
  { id: "methodology",label: "Policy Preferences",  controls: "panel-methodology" },
];

export default function StateTabs({ overviewContent, districtsContent, methodologyContent }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const tabRefs = useRef([]);
  const touchStartX = useRef(0);

  useLayoutEffect(() => {
    const idx = TABS.findIndex((t) => t.id === activeTab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  function handleKeyDown(e, idx) {
    let next = idx;
    if      (e.key === "ArrowRight") next = (idx + 1) % TABS.length;
    else if (e.key === "ArrowLeft")  next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home")       next = 0;
    else if (e.key === "End")        next = TABS.length - 1;
    else return;
    e.preventDefault();
    setActiveTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  const panelMap = {
    overview:    overviewContent,
    districts:   districtsContent,
    methodology: methodologyContent,
  };

  return (
    <div>
      <style>{`
        .state-tablist {
          display: flex;
          border-bottom: 2px solid #E8E6E3;
          margin: 32px 0 28px;
          position: relative;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .state-tablist::-webkit-scrollbar { display: none; }
        .state-tab {
          background: none;
          border: none;
          font-family: ${fonts.sans};
          font-size: 0.9rem;
          padding: 12px 20px;
          cursor: pointer;
          transition: color 0.25s;
          white-space: nowrap;
          flex-shrink: 0;
          touch-action: manipulation;
        }
        @media (max-width: 640px) {
          .state-tablist {
            margin: 20px 0 20px;
          }
          .state-tab {
            padding: 10px 16px;
            font-size: 0.85rem;
          }
        }
      `}</style>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div role="tablist" aria-label="State profile sections" className="state-tablist">
        {TABS.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[idx] = el)}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={tab.controls}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (Math.abs(e.changedTouches[0].clientX - touchStartX.current) < 10) {
                  e.preventDefault();
                  setActiveTab(tab.id);
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="state-tab"
              style={{
                color:      isActive ? colors.primarySoftRed : textColors.muted,
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {tab.label}
            </button>
          );
        })}

        {/* Sliding indicator */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            height: 2,
            background: colors.primarySoftRed,
            borderRadius: 1,
            left: indicator.left,
            width: indicator.width,
            transition: "left 0.35s cubic-bezier(0.22, 1, 0.36, 1), width 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Tab panels ───────────────────────────────────────── */}
      {TABS.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={tab.controls}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
        >
          {panelMap[tab.id]}
        </div>
      ))}
    </div>
  );
}
