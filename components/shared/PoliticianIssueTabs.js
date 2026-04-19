"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { colors, fonts, textColors } from "@/lib/constants";

export default function PoliticianIssueTabs({ tabs }) {
  const [active, setActive] = useState(tabs[0]?.id ?? null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const tabRefs = useRef([]);

  useLayoutEffect(() => {
    const idx = tabs.findIndex((t) => t.id === active);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active, tabs]);

  function handleKeyDown(e, idx) {
    let next = idx;
    if      (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
    else if (e.key === "ArrowLeft")  next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home")       next = 0;
    else if (e.key === "End")        next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActive(tabs[next].id);
    tabRefs.current[next]?.focus();
  }

  if (!tabs.length) return null;

  return (
    <div>
      {/* Tab bar */}
      <div role="tablist" aria-label="Issue breakdown" style={styles.tabList}>
        {tabs.map((tab, idx) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[idx] = el)}
              role="tab"
              id={`pol-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`pol-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              style={{
                ...styles.tab,
                color: isActive ? colors.primarySoftRed : textColors.secondary,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {tab.label}
            </button>
          );
        })}
        <div aria-hidden="true" style={{ ...styles.indicator, left: indicator.left, width: indicator.width }} />
      </div>

      {/* Tab panels */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`pol-panel-${tab.id}`}
          aria-labelledby={`pol-tab-${tab.id}`}
          hidden={active !== tab.id}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

const styles = {
  tabList: {
    display: "flex",
    flexWrap: "wrap",
    borderBottom: "1px solid #E8E6E3",
    margin: "20px 0 0",
    position: "relative",
  },
  tab: {
    background: "none",
    border: "none",
    fontFamily: fonts.sans,
    fontSize: "0.88rem",
    padding: "10px 16px",
    cursor: "pointer",
    transition: "color 0.2s",
    whiteSpace: "nowrap",
  },
  indicator: {
    position: "absolute",
    bottom: -1,
    height: 2,
    background: colors.primarySoftRed,
    borderRadius: 1,
    transition: "left 0.3s cubic-bezier(0.22,1,0.36,1), width 0.3s cubic-bezier(0.22,1,0.36,1)",
    pointerEvents: "none",
  },
};
