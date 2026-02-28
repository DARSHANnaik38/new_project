import React from "react";

/* ─── Inline styles (CSS-only, NO Framer Motion) ────────
   Font: IBM Plex Mono exclusively.
   Animation: slideUpFade defined in index.css.
   Hover: box-shadow glow + arrow translateX.
──────────────────────────────────────────────────────── */

const pillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  background: "rgba(10, 14, 26, 0.88)",
  border: "1px solid rgba(240, 64, 6, 0.30)",
  borderRadius: "12px",
  padding: "10px 18px",
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  fontSize: "13px",
  letterSpacing: "0.02em",
  color: "#a1a1aa",
  cursor: "default",
  userSelect: "none",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow:
    "0 0 0 1px rgba(240, 64, 6, 0.10), 0 4px 20px rgba(0, 0, 0, 0.5)",
  transition:
    "box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease",
};

const pillHoverStyle = {
  boxShadow:
    "0 0 0 1px rgba(240, 64, 6, 0.45), 0 0 22px rgba(240, 64, 6, 0.25), 0 4px 20px rgba(0, 0, 0, 0.5)",
  borderColor: "rgba(240, 64, 6, 0.55)",
};

const promptStyle = {
  color: "#4ade80",
  fontWeight: 600,
  flexShrink: 0,
};

const cmdStyle = {
  color: "#F04006",
  fontWeight: 600,
};

const arrowStyle = {
  color: "#F04006",
  fontWeight: 600,
  marginLeft: 2,
  display: "inline-block",
  transition: "transform 0.3s ease",
};

const arrowHoverStyle = {
  transform: "translateX(5px)",
};

const CliPill = () => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      className="cli-pill-enter"
      style={{ display: "inline-block" }}
      role="presentation"
      aria-label="Terminal command: npm install bus-pass"
    >
      <div
        style={{
          ...pillStyle,
          ...(hovered ? pillHoverStyle : {}),
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Prompt symbol */}
        <span style={promptStyle}>›</span>

        {/* Package manager prefix */}
        <span style={{ color: "#71717a" }}>npm install</span>

        {/* Highlighted command keyword */}
        <span style={cmdStyle}>bus-pass</span>

        {/* Animated arrow */}
        <span
          style={{
            ...arrowStyle,
            ...(hovered ? arrowHoverStyle : {}),
          }}
        >
          →
        </span>
      </div>
    </div>
  );
};

export default CliPill;
