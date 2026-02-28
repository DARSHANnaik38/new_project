import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Bus, MapPin, Clock, ChevronRight, Wifi, Zap, Navigation } from "lucide-react";

/* ─── Mock data ─────────────────────────────────────────── */
const MOCK_BUSES = [
  {
    id: "KA-15-1234",
    route: "Kumta → Gokarna",
    status: "live",
    speed: "42 km/h",
    eta: "8 min",
    nextStop: "Gokarna Beach",
    accentFrom: "#0ea5e9",
    accentTo: "#6366f1",
  },
  {
    id: "KA-15-5678",
    route: "Kumta → Karwar",
    status: "live",
    speed: "31 km/h",
    eta: "15 min",
    nextStop: "Karwar Stand",
    accentFrom: "#8b5cf6",
    accentTo: "#ec4899",
  },
  {
    id: "KA-15-9012",
    route: "Gokarna → Kumta",
    status: "waiting",
    speed: "0 km/h",
    eta: "—",
    nextStop: "Kumta Stand",
    accentFrom: "#475569",
    accentTo: "#334155",
  },
];

const FEATURES = [
  {
    icon: MapPin,
    label: "Live GPS",
    desc: "Real-time bus positions updated every second.",
    color: "#0ea5e9",
  },
  {
    icon: Clock,
    label: "ETA Estimates",
    desc: "Know your arrival time before you leave home.",
    color: "#a78bfa",
  },
  {
    icon: Navigation,
    label: "All Routes",
    desc: "Full Kumta–Gokarna coastal coverage.",
    color: "#34d399",
  },
];

/* ─── Framer Motion Variants ────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.12 + 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ─── Ultra-Realistic Modern Coach SVG ──────────────────── */
const Bus3D = () => (
  <svg
    viewBox="0 0 360 150"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ width: "100%", maxWidth: 380, filter: "drop-shadow(0 20px 50px rgba(14,165,233,0.4))" }}
  >
    <defs>
      <linearGradient id="coachBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e40af" />
        <stop offset="60%" stopColor="#0d2a72" />
        <stop offset="100%" stopColor="#091a4a" />
      </linearGradient>
      <linearGradient id="coachRoof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#1e40af" />
      </linearGradient>
      <linearGradient id="windshield" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.25" />
      </linearGradient>
      <linearGradient id="window" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.15" />
      </linearGradient>
      <linearGradient id="frontFace" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="doorGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#1e40af" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="headlight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="100%" stopColor="#fde047" />
      </linearGradient>
      <linearGradient id="rimGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <filter id="headGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    {/* Ground shadow */}
    <ellipse cx="178" cy="143" rx="148" ry="8" fill="rgba(0,0,0,0.3)" />

    {/* ── Main body ── */}
    <path d="M30,38 Q28,38 26,42 L20,58 L20,112 Q20,118 26,118 L332,118 Q342,118 344,108 L344,55 Q344,44 334,40 L200,38 Q120,34 30,38 Z"
      fill="url(#coachBody)" />

    {/* Roof with aerodynamic slope */}
    <path d="M30,38 Q120,32 200,36 L334,40 Q342,38 342,34 L330,30 Q220,24 120,26 L34,30 Q28,30 30,38 Z"
      fill="url(#coachRoof)" />

    {/* ── Roof-mounted AC unit ── */}
    <rect x="90" y="22" width="140" height="8" rx="3" fill="#1e3a8a" />
    <rect x="95" y="20" width="130" height="4" rx="2" fill="#334155" />
    {[100,120,140,160,180,200].map(x => (
      <line key={x} x1={x} y1="20" x2={x} y2="24" stroke="#38bdf8" strokeWidth="1" opacity="0.5" />
    ))}

    {/* ── Aerodynamic front face ── */}
    <path d="M334,40 Q348,44 350,58 L350,105 Q350,118 338,118 L330,118 L330,40 Z"
      fill="url(#frontFace)" />

    {/* Curved windshield */}
    <path d="M306,42 Q340,44 344,56 L344,82 L306,82 Q300,82 298,76 L298,48 Q298,42 306,42 Z"
      fill="url(#windshield)" />
    {/* Windshield reflection */}
    <path d="M308,44 L336,46 L334,54 L308,52 Z" fill="white" opacity="0.12" />

    {/* ── Rear-view mirrors ── */}
    <rect x="348" y="52" width="10" height="5" rx="2" fill="#1e3a8a" stroke="#38bdf8" strokeWidth="0.5" />
    <rect x="352" y="48" width="2" height="6" rx="1" fill="#475569" />
    <rect x="348" y="66" width="10" height="4" rx="2" fill="#1e3a8a" stroke="#38bdf8" strokeWidth="0.5" />
    <rect x="352" y="62" width="2" height="6" rx="1" fill="#475569" />

    {/* ── Passenger windows ── */}
    {[36, 88, 140, 192, 244].map(x => (
      <g key={x}>
        <rect x={x} y="50" width="44" height="34" rx="5" fill="url(#window)" />
        {/* glare streak */}
        <rect x={x + 2} y="52" width="12" height="6" rx="2" fill="white" opacity="0.15" />
      </g>
    ))}

    {/* ── Door (second last bay) ── */}
    <rect x="244" y="62" width="32" height="54" rx="4" fill="url(#doorGrad)" />
    <line x1="260" y1="62" x2="260" y2="116" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
    <circle cx="262" cy="90" r="2.5" fill="#38bdf8" opacity="0.8" />

    {/* ── Body side stripe ── */}
    <rect x="20" y="94" width="314" height="5" rx="2" fill="#38bdf8" opacity="0.25" />

    {/* ── Lower skirt / bumper ── */}
    <rect x="24" y="112" width="310" height="7" rx="3" fill="#0c1a3b" />
    <rect x="335" y="108" width="16" height="10" rx="3" fill="#0c1a3b" />

    {/* Front grill slats */}
    {[64,70,76,82,88].map(y => (
      <line key={y} x1="340" y1={y} x2="354" y2={y} stroke="rgba(56,189,248,0.4)" strokeWidth="1.2" />
    ))}

    {/* ── Headlights (glowing) ── */}
    <rect x="340" y="44" width="16" height="10" rx="4" fill="url(#headlight)" filter="url(#headGlow)" />
    <rect x="340" y="58" width="16" height="7" rx="3" fill="url(#headlight)" opacity="0.65" filter="url(#headGlow)" />
    {/* DRL strip */}
    <rect x="332" y="55" width="8" height="2" rx="1" fill="#fef9c3" opacity="0.8" />

    {/* ── Tail lights ── */}
    <rect x="12" y="44" width="10" height="16" rx="4" fill="#ef4444" opacity="0.95" />
    <rect x="12" y="64" width="10" height="10" rx="3" fill="#f97316" opacity="0.85" />
    {/* Brake light strip */}
    <rect x="20" y="47" width="6" height="3" rx="1" fill="#fca5a5" opacity="0.7" />

    {/* ── Destination board ── */}
    <rect x="60" y="32" width="150" height="12" rx="3" fill="#0a1f5c" />
    <text x="135" y="41" textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="Inter,sans-serif"
      fontWeight="700" letterSpacing="1">KUMTA → GOKARNA</text>

    {/* ── Wheels — metallic spoke rims ── */}
    {[70, 268].map(cx => (
      <g key={cx} className="wheel">
        {/* Tyre */}
        <circle cx={cx} cy="132" r="18" fill="#111827" stroke="#1e3a8a" strokeWidth="3" />
        {/* Rim */}
        <circle cx={cx} cy="132" r="12" fill="url(#rimGrad)" />
        {/* Centre hub */}
        <circle cx={cx} cy="132" r="4" fill="#334155" />
        <circle cx={cx} cy="132" r="2" fill="#94a3b8" />
        {/* 6 spokes */}
        {[0,60,120,180,240,300].map(deg => (
          <line
            key={deg}
            x1={cx + 4 * Math.cos((deg * Math.PI) / 180)}
            y1={132 + 4 * Math.sin((deg * Math.PI) / 180)}
            x2={cx + 11 * Math.cos((deg * Math.PI) / 180)}
            y2={132 + 11 * Math.sin((deg * Math.PI) / 180)}
            stroke="#64748b"
            strokeWidth="2"
          />
        ))}
      </g>
    ))}
  </svg>
);

/* ─── Road dashes ────────────────────────────────────────── */
const RoadDashes = () => (
  <div style={{ position: "relative", width: "100%", height: 8, marginTop: 4 }}>
    <div className="road-dashes" />
  </div>
);

/* ─── Main Component ─────────────────────────────────────── */
const LandingPage = ({ onEnter }) => {
  // P4.1 — Auto-redirect after 2 seconds; "Get Started" is a manual fallback
  useEffect(() => {
    const timer = setTimeout(() => onEnter(), 4000);
    return () => clearTimeout(timer); // cancel if user clicks manually first
  }, [onEnter]);

  return (
    <div className="landing-root" style={{
      background: "radial-gradient(circle at 50% -20%, #1e3a8a, #0f172a 50%, #020617 100%)",
    }}>
      {/* Floating orbs */}
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />

      {/* ── HEADER ── */}
      <motion.header
        className="landing-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", paddingTop: "2rem" }}
      >
        <div className="logo-mark">
          <div className="logo-icon">
            <Bus size={18} color="white" strokeWidth={2.5} />
          </div>
          <span className="logo-text">Real-Time Bus Tracker</span>
        </div>
      </motion.header>

      {/* ── 3-D BUS STAGE ── */}
      <div className="bus-stage">
        <motion.div
          className="bus-wrapper"
          initial={{ x: "-110%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 48, damping: 16, duration: 1.4 }}
        >
          <Bus3D />
          <RoadDashes />
        </motion.div>
      </div>

      {/* ── HERO (glassmorphism card) ── */}
      <motion.div
        className="hero-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="glass-card">
          {/* Headline — large gradient title */}
          <motion.h1
            className="hero-h1"
            variants={fadeUp}
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 900,
              background: "linear-gradient(135deg, #60a5fa, #c084fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              textShadow: "none",
              filter: "drop-shadow(0 10px 30px rgba(96, 165, 250, 0.3))",
              marginBottom: "0.5rem",
            }}
          >
            Track Your Ride{" "}
            <span style={{ display: "block" }}>in Real-Time</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p className="hero-sub" variants={fadeUp}>
            Live GPS positions, instant ETA estimates, and Kumta–Gokarna
            coverage — all in one tap.
          </motion.p>


        </div>
      </motion.div>

      {/* ── LIVE STATUS ── */}
      <section className="section-padded">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-dot" />
            Live Status
          </h2>
          <span className="section-sub">3 buses tracked</span>
        </div>

        <div className="bus-cards-grid">
          {MOCK_BUSES.map((bus, i) => (
            <motion.div
              key={bus.id}
              className="bus-card"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              {/* Accent header */}
              <div
                className="bus-card-header"
                style={{
                  background: `linear-gradient(135deg, ${bus.accentFrom}, ${bus.accentTo})`,
                }}
              >
                <div>
                  <p className="bus-id">{bus.id}</p>
                  <p className="bus-route">{bus.route}</p>
                </div>
                {bus.status === "live" ? (
                  <span className="pill-live">
                    <span className="pill-dot" />
                    Live
                  </span>
                ) : (
                  <span className="pill-waiting">Waiting</span>
                )}
              </div>

              {/* Stats */}
              <div className="bus-card-stats">
                <div>
                  <p className="stat-label">Speed</p>
                  <p className={`stat-value ${bus.status === "live" ? "text-emerald" : "text-muted"}`}>
                    {bus.speed}
                  </p>
                </div>
                <div>
                  <p className="stat-label">ETA</p>
                  <p className="stat-value">{bus.eta}</p>
                </div>
                <div className="stat-full">
                  <p className="stat-label">Next Stop</p>
                  <p className="stat-value stat-stop">
                    <MapPin size={11} className="icon-sky" />
                    {bus.nextStop}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURE STRIP ── */}
      <section className="section-padded section-features">
        <div className="features-grid">
          {FEATURES.map(({ icon: Icon, label, desc, color }, i) => (
            <motion.div
              key={label}
              className="feature-tile"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -6, borderColor: color + "55" }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              <div className="feature-icon-wrap" style={{ background: color + "20" }}>
                <Icon size={20} style={{ color }} strokeWidth={2} />
              </div>
              <div>
                <p className="feature-label">{label}</p>
                <p className="feature-desc">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div className="landing-footer">
        <button onClick={onEnter} className="footer-link">
          Open Live Map <ChevronRight size={15} />
        </button>
        <p className="footer-copy">© 2026 Real-Time Bus Tracker · Kumta–Gokarna Region</p>
      </div>
    </div>
  );
};

export default LandingPage;
