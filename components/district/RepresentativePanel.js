// components/district/RepresentativePanel.js
// Server Component — renders representative profile card for a district
// Receives: overview.json data, representative.json data, alignment.json data

import PoliticianPanel from "@/components/shared/PoliticianPanel";
import { loadRepBioWithSources } from "@/lib/loadData";
import { fonts, textColors } from "@/lib/constants";

export default function RepresentativePanel({ overview, repData, alignmentData }) {
  const rep = overview?.representative;

  if (!rep?.name) {
    return (
      <p style={{ fontFamily: fonts.sans, color: textColors.muted, fontStyle: "italic", marginBottom: "24px" }}>
        Representative data is not yet available for this district.
      </p>
    );
  }

  const districtId = overview.district_id;
  const districtNum = districtId?.split("-")[1] ?? "0";
  const stateCode = overview.state_code ?? districtId?.split("-")[0];

  const { body: bio, sources } = loadRepBioWithSources(stateCode, districtNum, rep.name);

  const politician = {
    name: rep.name,
    party: rep.party ?? repData?.party,
    photo_url: rep.photo_url ?? null,
    assumed_office: rep.assumed_office ?? null,
    alignment: alignmentData
      ? {
          overall_score: alignmentData.overall_score,
          overall_label: alignmentData.overall_label,
          issue_scores:  alignmentData.issue_scores ?? [],
        }
      : null,
    votes_by_issue: repData?.votes_by_issue ?? [],
    overall_voting_stats: repData?.overall_voting_stats ?? null,
  };

  return (
    <div style={{ marginBottom: "4px" }}>
      <PoliticianPanel
        politician={politician}
        bio={bio}
        sources={sources}
        chamber="representative"
      />
    </div>
  );
}
