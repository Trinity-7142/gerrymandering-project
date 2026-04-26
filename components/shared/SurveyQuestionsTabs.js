// components/shared/SurveyQuestionsTabs.js
"use client";

import { useState, useRef, useLayoutEffect, useMemo } from "react";
import { issueLabels, colors, fonts, textColors, cardStyle } from "@/lib/constants";
import {
  DivergingBar,
  BarLegend,
  getSupportOppose,
  BOX2,
  questionTextStyle,
  footerTextStyle,
} from "./CESStatePanel";

const DEFAULT_FONT_REM = 0.95;
const MIN_FONT_REM = 0.8;
const DEFAULT_PAD_PX = 8;
const TAB_GAP_PX = 12;

export default function SurveyQuestionsTabs({
  issues,
  source,
  totalRespondents,
  methodologyNote,
}) {
  const tabs = useMemo(
    () => issues.filter((issue) => issue.questions?.length > 0),
    [issues]
  );

  const [activeTab, setActiveTab] = useState("");
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [tabFontRem, setTabFontRem] = useState(DEFAULT_FONT_REM);

  const tabRefs = useRef([]);
  const tabListRef = useRef(null);
  const touchStartX = useRef(0);

  // Keep active tab valid when tabs change
  useLayoutEffect(() => {
    if (!tabs.length) return;

    setActiveTab((prev) => {
      if (prev && tabs.some((t) => t.issue_id === prev)) return prev;
      return tabs[0].issue_id;
    });
  }, [tabs]);

  // Fit labels by shrinking font size only
  useLayoutEffect(() => {
    const container = tabListRef.current;
    if (!container || !tabs.length) return;

    const fitTabs = () => {
      const tabEls = Array.from(container.querySelectorAll('[role="tab"]'));
      if (!tabEls.length) return;

      let size = DEFAULT_FONT_REM;

      const applySize = (fontRem) => {
        tabEls.forEach((el) => {
          el.style.fontSize = `${fontRem}rem`;
          el.style.paddingLeft = `${DEFAULT_PAD_PX}px`;
          el.style.paddingRight = `${DEFAULT_PAD_PX}px`;
        });
      };

      const overflows = () =>
        tabEls.some((el) => el.scrollWidth > el.clientWidth + 1);

      applySize(size);

      while (overflows() && size > MIN_FONT_REM) {
        size = Math.max(MIN_FONT_REM, +(size - 0.025).toFixed(3));
        applySize(size);
      }

      setTabFontRem((prev) => (prev !== size ? size : prev));
    };

    fitTabs();

    const ro = new ResizeObserver(() => {
      fitTabs();
    });

    ro.observe(container);

    return () => ro.disconnect();
  }, [tabs.length]);

  // Recalculate indicator after fit / resize / tab change
  useLayoutEffect(() => {
    const idx = tabs.findIndex((t) => t.issue_id === activeTab);
    const el = tabRefs.current[idx];
    if (!el) return;

    const next = {
      left: el.offsetLeft,
      width: el.offsetWidth,
    };

    setIndicator((prev) => {
      if (prev.left === next.left && prev.width === next.width) return prev;
      return next;
    });
  }, [activeTab, tabs, tabFontRem]);

  function handleKeyDown(e, idx) {
    let next = idx;

    if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;

    e.preventDefault();
    setActiveTab(tabs[next].issue_id);
    tabRefs.current[next]?.focus();
  }

  if (tabs.length === 0) return null;

  return (
    <div style={{ ...cardStyle, padding: "32px" }}>
      <style>{`
        .sqt-tablist {
          display: flex;
          flex-wrap: nowrap;
          align-items: stretch;
          column-gap: ${TAB_GAP_PX}px;
          border-bottom: 2px solid #E8E6E3;
          margin-bottom: 20px;
          position: relative;
        }
        .sqt-tab {
          background: none;
          border: none;
          font-family: ${fonts.sans};
          padding-top: 10px;
          padding-bottom: 10px;
          flex: 1 1 0;
          text-align: center;
          min-width: 0;
          cursor: pointer;
          transition: color 0.25s;
          white-space: nowrap;
          touch-action: manipulation;
        }
        @media (max-width: 640px) {
          .sqt-tablist {
            flex-direction: column;
            border-bottom: none;
            column-gap: 0;
            margin-bottom: 12px;
          }
          .sqt-tab {
            flex: none !important;
            text-align: left !important;
            padding: 10px 0 !important;
            border-bottom: 1px solid #F0EFED;
            white-space: normal !important;
          }
          .sqt-indicator {
            display: none;
          }
        }
      `}</style>

      <h2 style={headingStyle}>Survey Questions</h2>

      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Filter survey questions by issue"
        className="sqt-tablist"
      >
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.issue_id;

          return (
            <button
              key={tab.issue_id}
              ref={(el) => (tabRefs.current[idx] = el)}
              role="tab"
              id={`survey-tab-${tab.issue_id}`}
              aria-selected={isActive}
              aria-controls={`survey-panel-${tab.issue_id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.issue_id)}
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (Math.abs(e.changedTouches[0].clientX - touchStartX.current) < 10) {
                  e.preventDefault();
                  setActiveTab(tab.issue_id);
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="sqt-tab"
              style={{
                fontSize: `${tabFontRem}rem`,
                paddingLeft: DEFAULT_PAD_PX,
                paddingRight: DEFAULT_PAD_PX,
                color: isActive ? colors.primarySoftRed : textColors.muted,
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {issueLabels[tab.issue_id] || tab.issue_id}
            </button>
          );
        })}

        <div
          aria-hidden="true"
          className="sqt-indicator"
          style={{
            ...styles.indicator,
            left: indicator.left,
            width: indicator.width,
          }}
        />
      </div>

      <BarLegend
        leftLabel="Support"
        rightLabel="Oppose"
        leftColor={BOX2.leftColor}
        rightColor={BOX2.rightColor}
        leftStyle={{ right: "auto", left: -40, paddingRight: 0 }}
        rightStyle={{ left: "auto", right: "auto", marginLeft: "35px", paddingLeft: 0 }}
      />

      {tabs.map((tab) => (
        <div
          key={tab.issue_id}
          role="tabpanel"
          id={`survey-panel-${tab.issue_id}`}
          aria-labelledby={`survey-tab-${tab.issue_id}`}
          hidden={activeTab !== tab.issue_id}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {tab.questions.map((q) => {
              const vals = getSupportOppose(q);

              return (
                <div key={q.variable}>
                  <p style={questionTextStyle}>
                    {q.text}
                    <span style={{ color: textColors.faint, fontWeight: 400 }}>
                      {" "}(n&nbsp;=&nbsp;{q.n?.toLocaleString()})
                    </span>
                  </p>
                  {vals && (
                    <DivergingBar leftPct={vals.leftPct} rightPct={vals.rightPct} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {methodologyNote && (
        <p style={{ ...footerTextStyle, marginTop: "24px", lineHeight: 1.5 }}>
          {methodologyNote}
        </p>
      )}
    </div>
  );
}

const headingStyle = {
  fontFamily: fonts.serif,
  fontSize: "1.4rem",
  fontWeight: 700,
  color: textColors.primary,
  marginBottom: "16px",
};

const styles = {
  indicator: {
    position: "absolute",
    bottom: -2,
    height: 2,
    background: colors.primarySoftRed,
    borderRadius: 1,
    transition:
      "left 0.35s cubic-bezier(0.22, 1, 0.36, 1), width 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
    pointerEvents: "none",
  },
};
