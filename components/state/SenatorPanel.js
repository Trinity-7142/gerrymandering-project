// components/state/SenatorPanel.js
// Server Component — renders senator profile cards for a state
// Receives: senators.json data as props
// Loads senator bios from public/content/senator-info/ at build time

import PoliticianPanel from "@/components/shared/PoliticianPanel";
import { loadSenatorBio, loadStateData } from "@/lib/loadData";
import { fonts, textColors } from "@/lib/constants";

export default function SenatorPanel({ data }) {
  if (!data?.senators?.length) {
    return (
      <p style={{ fontFamily: fonts.sans, color: textColors.muted, fontStyle: "italic", marginBottom: "24px" }}>
        Senator data is not yet available for this state.
      </p>
    );
  }

  const { senators, state_code } = data;

  // Load real alignment scores from alignment.json and index by senator name
  const alignmentData = state_code ? loadStateData(state_code, "alignment.json") : null;
  const alignmentByName = Object.fromEntries(
    (alignmentData?.senators ?? []).map((s) => [s.name, s])
  );

  return (
    <div style={{ marginBottom: "4px" }}>
      {senators.map((senator) => {
        const bio = state_code ? loadSenatorBio(state_code, senator.name) : null;

        // Merge real alignment data over the placeholder in senators.json
        const realAlignment = alignmentByName[senator.name];
        const politician = realAlignment
          ? {
              ...senator,
              alignment: {
                overall_score: realAlignment.overall_score,
                overall_label: realAlignment.overall_label,
                issue_scores:  realAlignment.issue_scores ?? [],
              },
            }
          : senator;

        return (
          <PoliticianPanel
            key={senator.name}
            politician={politician}
            bio={bio}
            chamber="senator"
          />
        );
      })}
    </div>
  );
}
