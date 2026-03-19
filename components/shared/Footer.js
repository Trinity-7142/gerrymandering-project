// components/shared/Footer.js
// Server Component — shared footer across all pages
//
// ┌─────────────────────────────────────────────────────────────┐
// │  WHAT THIS COMPONENT DOES                                   │
// │  Renders the bottom of every page with:                     │
// │    • A "Data Sources & Methodology" title                   │
// │    • Data source credits (4 blocks in a 2-column grid)      │
// │    • A link to the methodology page                         │
// │    • A "last updated" date                                  │
// │                                                             │
// │  This is a Server Component (same as Navbar) — no hooks,    │
// │  no "use client", just a function that returns JSX.         │
// └─────────────────────────────────────────────────────────────┘
//
// REFERENCE: Look at state-page-mockup.html in the project repo.
// The footer section starts at <!-- ═══ FOOTER ═══ -->
// Match its structure and CSS class names exactly.

// We use <Link> for internal links (like the methodology page)
// and regular <a> tags for external links (like Princeton's site).
// UNCOMMENT THIS LINE when you're ready:
import Link from "next/link";

export default function Footer() {
  // ─── STEP 1: Write the outer footer structure ──────────
  // Replace the "return null" at the bottom with a return(...)
  // block. Start with just the skeleton:
  //
  //   return (
  //     <footer className="site-footer">
  //       <h4 className="footer-title">Data Sources & Methodology</h4>
  //       {/* Steps 2–4 will go here */}
  //     </footer>
  //   );
  //
  // CSS CLASSES FROM THE MOCKUP (copy exactly):
  //   <footer>  →  className="site-footer"
  //   <h4>      →  className="footer-title"
  //
  // KEY CONCEPT — className vs class:
  //   In HTML you write class="...". In JSX (React) you write
  //   className="..." instead, because "class" is a reserved
  //   word in JavaScript. Same effect, different spelling.
  //
  // KEY CONCEPT — {/* comments */}:
  //   Inside JSX, you can't use // comments. Instead use
  //   {/* this syntax */} for comments within your markup.

  // ─── STEP 2: Add the 2-column grid ────────────────────
  // Inside <footer>, after the <h4>, add a grid container with
  // two child <div>s — one for each column.
  //
  // STRUCTURE:
    // <div className="footer-grid">
    //   <div>
    //     {/* LEFT column: blocks 1 and 2 go here */}
    //   </div>
    //   <div>
    //     {/* RIGHT column: blocks 3 and 4 go here */}
    //   </div>
    // </div>
  //
  // The "footer-grid" class uses CSS Grid to make two columns.
  // You don't need to write any CSS — it's already in our
  // stylesheet. Just use the right className.

  // ─── STEP 3: Fill in the four data source blocks ───────
  // Each block is a <p> tag with a bold heading via <strong>.
  // Put 2 blocks in the left column, 2 in the right.
  //
  // PATTERN for each block:
  //   <p className="footer-block">
  //     <strong>Heading:</strong> Description text here. 
  //   </p>
  // KEY CONCEPT — <strong>:
  //   Makes text bold. The heading of each source is bold,
  //   while the description text stays normal weight.
  //
  // LEFT COLUMN:
  //
  //   Block 1:
  //     Heading: "Constituent Preferences:"
  //     Text: Cooperative Election Study 2024 (Harvard/YouGov,
  //           n≈60,000). District-level estimates use weighted
  //           samples with shrinkage toward state means for
  //           small samples.
  //
  //   Block 2:
  //     Heading: "Issue Salience:"
  //     Text: AP VoteCast 2024 General Election (n=140,000+).
  //           State-level weighting for issue importance.
  //
  // RIGHT COLUMN:
  //
  //   Block 3:
  //     Heading: "Representative Voting:"
  //     Text: Congressional roll call data via VoteView (UCLA)
  //           and congress.gov. Key vote selection documented
  //           in methodology.
  //
  //   Block 4:
  //     Heading: "Gerrymandering Metrics:"
  //     Text: Princeton Gerrymandering Project (Electoral
  //           Innovation Lab) and PlanScore (Campaign Legal
  //           Center / Harvard Election Law Clinic). See
  //           individual source pages for methodology details.

  // ─── STEP 4: Add the "last updated" line ───────────────
  // After the closing </div> of "footer-grid", add:
  //
  //   <p className="footer-updated">
  //     Last updated: February 2026 · Questions about methodology?{" "}
  //     <Link href="/methodology">Read our full documentation</Link>
  //   </p>
  //
  // KEY CONCEPT — {" "}:
  //   JSX collapses whitespace. If you want a space between
  //   "methodology?" and the link text, you need to explicitly
  //   insert one using {" "} (a JavaScript string with one space).
  //
  // KEY CONCEPT — <Link> vs <a>:
  //   Use <Link href="..."> for internal pages (on our site).
  //   Use <a href="..." target="_blank"> for external websites.
  //   The methodology page is ours, so we use <Link>.

  // ─── STEP 5 (STRETCH GOAL): Make the date dynamic ─────
  // Right now "February 2026" is hardcoded. Eventually this
  // could come from a prop or config file. Don't worry about
  // this yet — just hardcode the date for now.

  // ─── YOUR FINAL RESULT SHOULD LOOK ROUGHLY LIKE: ───────
  //
  //   return (
  //     <footer className="site-footer">
  //       <h4 className="footer-title">Data Sources & Methodology</h4>
  //       <div className="footer-grid">
  //         <div>
  //           <p className="footer-block">
  //             <strong>Constituent Preferences:</strong> ...
  //           </p>
  //           <p className="footer-block">
  //             <strong>Issue Salience:</strong> ...
  //           </p>
  //         </div>
  //         <div>
  //           <p className="footer-block">
  //             <strong>Representative Voting:</strong> ...
  //           </p>
  //           <p className="footer-block">
  //             <strong>Gerrymandering Metrics:</strong> ...
  //           </p>
  //         </div>
  //       </div>
  //       <p className="footer-updated">
  //         Last updated: February 2026 · ...
  //       </p>
  //     </footer>
  //   );

  //return null; // ← DELETE this line once you start building

  return (
  <footer className="site-footer">
         <h4 className="footer-title">Data Sources & Methodology</h4>
          <div className="footer-grid">
            <div>
              <p className="footer-block">
                <strong>Constituent Preferences:</strong> Cooperative Election Study 2024 (Harvard/YouGov, n≈60,000). District-level estimates use weighted samples with shrinkage toward state means for small samples.
              </p>

              <p className="footer-block">
                <strong>Issue Salience:</strong> AP VoteCast 2024 General Election (n=140,000+). State-level weighting for issue importance.
              </p>
            </div>
            <div>
              <p className="footer-block">
                <strong>Representative Voting:</strong> Cooperative Election Study 2024 (Harvard/YouGov, n≈60,000). District-level estimates use weighted samples with shrinkage toward state means for small samples.
              </p>

              <p className="footer-block">
                <strong>Gerrymandering Metrics:</strong> Princeton Gerrymandering Project (Electoral Innovation Lab) and PlanScore (Campaign Legal Center / Harvard Election Law Clinic). See individual source pages for methodology details.
              </p>
            </div>
          </div>
          <p className="footer-updated">
            Last updated: February 2026 · Questions about methodology?{" "}
          <Link href="/methodology">Read our full documentation</Link>
        </p>
  </footer>
)
}
