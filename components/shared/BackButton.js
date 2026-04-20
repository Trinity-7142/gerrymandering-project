// components/shared/BackButton.js
// Server Component — chevron-left link styled as a subtle back button

import Link from "next/link";
import { textColors, fonts } from "@/lib/constants";

export default function BackButton({ href, label }) {
  return (
    <div style={styles.wrapper}>
      <Link href={href} style={styles.link}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block", flexShrink: 0 }}
          aria-hidden="true"
        >
          <path
            d="M9 11L5 7L9 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {label}
      </Link>
    </div>
  );
}

const styles = {
  wrapper: {
    paddingTop: "28px",
  },
  link: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontFamily: fonts.sans,
    fontSize: "0.82rem",
    fontWeight: 500,
    color: textColors.muted,
    textDecoration: "none",
    transition: "color 0.2s",
  },
};
