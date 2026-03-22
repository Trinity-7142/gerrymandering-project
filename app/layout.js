// app/layout.js
// Root layout: wraps every page with shared Navbar, Footer, fonts, and global styles
// This is a Server Component (default)

// Import fonts (Source Serif 4, DM Sans) via next/font or Google Fonts link
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
});


// Import Navbar and Footer from components/shared
import Footer from '../components/shared/Footer';
import Navbar from '../components/shared/Navbar';

export const metadata = {
  // Set metadata (title, description, og tags)
  title: "Gerrymandering Project",
  description: "Measuring representational alignment across U.S. congressional districts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${sourceSerif.variable}`}>
      
      <body>
          <Navbar />
          {children}
          <Footer />
      </body>
      
    </html>
  );
}
