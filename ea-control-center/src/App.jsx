import React from "react";
import ExecutiveAssistantControlCenter from "./ExecutiveAssistantControlCenter.jsx";

// Heritage Silver — neutral mount. The component carries its own Portfolio
// Piece header, so this wrapper just provides page chrome: body color, max
// width, footer byline. No competing hero, no duplicate title.
const PAGE_BG = "#E4EAF0";   // Platinum mist — matches component background
const TEXT = "#2A3547";      // Navy Ink
const TEXT_DIM = "#5E6B80";  // Mid slate
const BORDER = "rgba(42, 53, 71, 0.14)";

const FONT_STACK =
  "'Inter', 'Geist', ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: PAGE_BG,
        color: TEXT,
        fontFamily: FONT_STACK,
        padding: "40px 20px 80px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <ExecutiveAssistantControlCenter />

        <footer
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: `1px solid ${BORDER}`,
            color: TEXT_DIM,
            fontSize: 12,
            textAlign: "center",
          }}
        >
          Built with React + Vite · deployed on Vercel · source on GitHub
        </footer>
      </div>
    </div>
  );
}
