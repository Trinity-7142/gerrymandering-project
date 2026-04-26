"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { colors, fonts, textColors } from "@/lib/constants";

export default function PoliticianIssueTabs({ tabs }) {
  const [active, setActive] = useState(tabs[0]?.id ?? null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const tabRefs = useRef([]);
  const listRef = useRef(null);
  const prevActive = useRef(null);
  const touchStartX = useRef(0);

  useLayoutEffect(() => {
    const idx = tabs.findIndex((t) => t.id === active);
    const el = tabRefs.current[idx];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
      // Only scroll into view when the user actually changes tabs
      if (prevActive.current !== null && prevActive.current !== active) {
        el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      }
      prevActive.current = active;
    }
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
    <>
      <style>{`
        .issue-tablist {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          scrollbar-width: none;
          border-bottom: 1px solid #E8E6E3;
          margin: 20px 0 0;
          position: relative;
        }
        .issue-tablist::-webkit-scrollbar { display: none; }
        .issue-tab {
          background: none;
          border: none;
          font-family: ${fonts.sans};
          font-size: 0.88rem;
          padding: 10px 16px;
          cursor: pointer;
          transition: color 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
          touch-action: manipulation;
        }
      `}</style>

      <div>
        {/* Tab bar */}
        <div ref={listRef} role="tablist" aria-label="Issue breakdown" className="issue-tablist">
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
                onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  if (Math.abs(e.changedTouches[0].clientX - touchStartX.current) < 10) {
                    e.preventDefault();
                    setActive(tab.id);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className="issue-tab"
                style={{
                  color:      isActive ? colors.primarySoftRed : textColors.secondary,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {tab.label}
              </button>
            );
          })}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: -1,
              height: 2,
              background: colors.primarySoftRed,
              borderRadius: 1,
              left: indicator.left,
              width: indicator.width,
              transition: "left 0.3s cubic-bezier(0.22,1,0.36,1), width 0.3s cubic-bezier(0.22,1,0.36,1)",
              pointerEvents: "none",
            }}
          />
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
    </>
  );
}
