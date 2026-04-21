// components/shared/PageMeta.js
// Author / Created / Last-edited row for content pages.
// Visibility is controlled by PAGE_FEATURES in lib/pageFeatures.js.
// Server Component — no client-side JS needed.

import { fonts, textColors } from "@/lib/constants";
import { PAGE_FEATURES, formatDate } from "@/lib/contentPageFeatures";

export default function PageMeta({ meta = {} }) {
  const raw = meta["author(s)"] ?? meta.author ?? null;
  const authorList = Array.isArray(raw) ? raw.join(", ") : (raw || null);
  const authorLabel =
    (Array.isArray(raw) && raw.length > 1) || authorList?.includes(",")
      ? "Authors"
      : "Author";

  const authorLink = PAGE_FEATURES.authorLink ? (meta.author_link ?? null) : null;

  const dateCreated = formatDate(meta.date_created);
  const lastEdited  = formatDate(meta.last_edited);

  const show = {
    author:      PAGE_FEATURES.author    && !!authorList,
    created:     PAGE_FEATURES.created   && !!dateCreated,
    lastEdited:  PAGE_FEATURES.lastEdited && !!lastEdited,
  };

  if (!show.author && !show.created && !show.lastEdited) return null;

  const authorNode = authorLink ? (
    <>
      <style>{`.page-meta-author-link:hover .page-meta-author-label { text-decoration: underline; }`}</style>
      <a
        href={authorLink}
        target="_blank"
        rel="noopener noreferrer"
        className="page-meta-author-link"
        style={styles.authorLink}
      >
        <span className="page-meta-author-label">{authorList}</span>
      </a>
    </>
  ) : (
    authorList
  );

  return (
    <div style={styles.row}>
      {show.author     && <span style={styles.item}><span style={styles.label}>{authorLabel}</span> {authorNode}</span>}
      {show.created    && <span style={styles.item}><span style={styles.label}>Created</span> {dateCreated}</span>}
      {show.lastEdited && <span style={styles.item}><span style={styles.label}>Last edited</span> {lastEdited}</span>}
    </div>
  );
}

const styles = {
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0 24px",
    justifyContent: "center",
    marginBottom: "32px",
    fontFamily: fonts.sans,
    fontSize: "0.8rem",
    color: textColors.muted,
  },
  item: {
    whiteSpace: "nowrap",
  },
  label: {
    fontWeight: 600,
    color: textColors.secondary,
  },
  authorLink: {
    color: "inherit",
    textDecoration: "none",
    transition: "text-decoration 0.15s",
  },
};
