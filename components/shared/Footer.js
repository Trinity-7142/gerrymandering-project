// components/shared/Footer.js

export default function Footer() {
  return (
    <footer style={{
      maxWidth: "960px",
      margin: "0 auto",
      padding: "0 24px",
    }}>
      <div style={{
        borderTop: "1px solid rgba(0, 0, 0, 0.08)",
        marginTop: "36px",
        paddingTop: "20px",
        paddingBottom: "40px",
        fontSize: "0.9rem",
        fontStyle: "italic",
        color: "rgba(0, 0, 0, 0.4)",
      }}>
        Last updated: April 2026
      </div>
    </footer>
  );
}