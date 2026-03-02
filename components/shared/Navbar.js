// components/shared/Navbar.js
// Server Component — shared navigation bar across all pages
//
// ┌─────────────────────────────────────────────────────────────┐
// │  WHAT IS A "SERVER COMPONENT"?                              │
// │  This file runs on the server at build time, not in the     │
// │  user's browser. That means:                                │
// │    • You CAN'T use useState, useEffect, or onClick here     │
// │    • You DON'T need "use client" at the top                 │
// │    • You just return JSX (the HTML-like syntax below)       │
// │  Think of it like a template that generates HTML.           │
// └─────────────────────────────────────────────────────────────┘
//
// REFERENCE: Look at state-page-mockup.html in the project repo
// for the exact HTML structure and CSS classes to match.
// The nav section starts at <!-- ═══ NAVIGATION ═══ -->

// Next.js Navigation — we use <Link> instead of <a> for internal
// pages. It makes page transitions faster (no full browser reload).
// UNCOMMENT THIS LINE when you're ready to use it:
// import Link from "next/link";

export default function Navbar() {
  // ─── STEP 1: Define the nav links ──────────────────────
  // Create an array (a list) of objects, where each object has:
  //   - label: the text shown to the user (e.g., "Home")
  //   - href:  the URL path it links to (e.g., "/")
  //
  // Our site has these pages (from the mockup):
  //   Home        → "/"
  //   About       → "/about"
  //   Methodology → "/methodology"
  //
  // EXAMPLE of an array of objects:
  //   const navLinks = [
  //     { label: "Home", href: "/" },
  //     ...add the other two here...
  //   ];

  // ─── STEP 2: Return the JSX structure ──────────────────
  // A React component must return JSX (HTML-like syntax).
  // Replace the "return null" at the bottom with a return(...)
  // block containing the navbar markup.
  //
  // STRUCTURE TO MATCH (from the mockup):
  //
  //   <nav>                          ← outer navigation wrapper
  //     <div>                        ← inner container for centering
  //       <Link href="/">Home</Link> ← one link per page
  //       <Link href="...">...</Link>
  //     </div>
  //   </nav>
  //
  // CSS CLASSES FROM THE MOCKUP (copy these exactly):
  //   • Outer <nav>:   className="nav"
  //   • Inner <div>:   className="nav__inner"
  //   • Each <Link>:   className="nav__link"
  //
  // KEY CONCEPT — className vs class:
  //   In HTML you write class="...". In JSX (React) you write
  //   className="..." instead, because "class" is a reserved
  //   word in JavaScript. Same effect, different spelling.
  //
  // Also add these accessibility attributes to <nav>:
  //   role="navigation"  aria-label="Main navigation"
  //   (These help screen readers understand the page structure.)

  // ─── STEP 3: Render links from your array ──────────────
  // Instead of writing each <Link> by hand, use .map() to loop
  // over your navLinks array. This is how React renders lists.
  //
  // PATTERN (put this inside the <div className="nav__inner">):
  //   {navLinks.map((link) => (
  //     <Link key={link.href} href={link.href} className="nav__link">
  //       {link.label}
  //     </Link>
  //   ))}
  //
  // KEY CONCEPT — "key" prop:
  //   When you render a list in React, each item needs a unique
  //   "key". This helps React track which items changed. The href
  //   works great here since each page URL is unique.
  //
  // KEY CONCEPT — curly braces {}:
  //   Inside JSX, curly braces let you "escape" into JavaScript.
  //   {link.label} means "insert the value of link.label here."

  // ─── STEP 4 (STRETCH GOAL): Highlight the active page ──
  // This requires converting to a Client Component ("use client")
  // and using Next.js's usePathname() hook. Skip this for now —
  // Trinity will pair with you on this later.

  // ─── YOUR FINAL RESULT SHOULD LOOK ROUGHLY LIKE: ───────
  //
  //   const navLinks = [ ... ];
  //   return (
  //     <nav className="nav" role="navigation" aria-label="Main navigation">
  //       <div className="nav__inner">
  //         {navLinks.map(...)}
  //       </div>
  //     </nav>
  //   );

  return null; // ← DELETE this line once you start building
}