// components/shared/Navbar.js
// Server Component — shared navigation bar across all pages

import Link from "next/link";
import { colors } from "@/lib/constants";

const navLinks = [
  {label: "Home", href: "/"},
  {label: "About", href: "/about"},
  {label: "Legal", href: "/legal"},
  {label: "Case Studies", href: "/case-studies"},
  {label: "What Now?", href: "/what-now"},
  {label: "Methodology", href: "/methodology"}
];

export default function Navbar() {

  return (
  <>
    <style>{`
    /* This is the full bar itself */
      .nav {
        background: ${colors.primarySoftRed};
        padding: 0 24px;
      }

    /* centered inner container */
      .nav__inner {
        max-width: 960px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 56px;
      }

    /* Each redirect/link */
      .nav__link {
        color: rgba(255, 255, 255, 0.82);
        font-size: 0.98rem;
        font-weight: 375;
        padding: 16px 28px;
        letter-spacing: 0.02em;
        position: relative;
        white-space: nowrap;
        transition: color 0.2s ease, background 0.2s ease;
      }

    /* Underline */
      .nav__link::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 2px;
        background: rgba(255, 255, 255, 0.7);
        transition: width 0.25s ease, left 0.25s ease;
      }

    /* Underline on hover */
      .nav__link:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.08);
      }

      .nav__link:hover::after {
        width: 60%;
        left: 20%;
      }

      @media (max-width: 768px) {
        .nav__link {
          padding: 14px 14px;
          font-size: 0.82rem;
        }
      }

      @media (max-width: 480px) {
        .nav__inner {
          flex-wrap: wrap;
          height: auto;
          padding: 8px 0;
          justify-content: center;
        }
        .nav__link {
          padding: 10px 12px;
          font-size: 0.78rem;
        }
      }
    `}</style>

    <nav className="nav" role="navigation" aria-label="Main navigation">
      <div className="nav__inner">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="nav__link">
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  </>
  );
}