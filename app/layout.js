// app/layout.js
// Root layout: wraps every page with shared Navbar, Footer, fonts, and global styles
// This is a Server Component (default)
// TODO: Import fonts (Source Serif 4, DM Sans) via next/font or Google Fonts link
// TODO: Import Navbar and Footer from components/shared
// TODO: Set metadata (title, description, og tags)
import "./globals.css";

import Footer from '../components/shared/Footer';
import Navbar from '../components/shared/Navbar';

export const metadata = {
  title: "Gerrymandering Project",
  description: "Measuring representational alignment across U.S. congressional districts",
};

export default function RootLayout({ children }) {
  return (
    <>
    <Navbar />
    <html lang="en">
      
      <body>{children}</body>
      
    </html>
    <Footer />  
    </>
  );
}
