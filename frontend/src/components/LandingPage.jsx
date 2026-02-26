import React from "react";
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

/* ─── 3-D SVG Bus ────────────────────────────────────────── */
const Bus3D = () => (
  <svg
    viewBox="0 0 320 130"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ width: "100%", maxWidth: 340, filter: "drop-shadow(0 20px 40px rgba(14,165,233,0.35))" }}
  >
    {/* Body shadow/depth (3-D bottom face) */}
    <ellipse cx="160" cy="122" rx="130" ry="10" fill="rgba(0,0,0,0.35)" />

    {/* Bus body */}
    <rect x="18" y="28" width="284" height="82" rx="14" fill="url(#bodyGrad)" />

    {/* Roof accent stripe */}
    <rect x="18" y="28" width="284" height="18" rx="14" fill="url(#roofGrad)" />
    <rect x="18" y="36" width="284" height="10" fill="url(#roofGrad)" />

    {/* Front face highlight */}
    <rect x="286" y="32" width="16" height="74" rx="6" fill="url(#frontFace)" />

    {/* Windows row */}
    {[36, 92, 148, 204].map((x) => (
      <rect key={x} x={x} y="52" width="46" height="30" rx="6" fill="url(#windowGrad)" opacity="0.92" />
    ))}

    {/* Window reflection glare */}
    {[36, 92, 148, 204].map((x) => (
      <rect key={x + "g"} x={x + 2} y="53" width="14" height="8" rx="3" fill="white" opacity="0.18" />
    ))}

    {/* Door */}
    <rect x="254" y="52" width="30" height="52" rx="6" fill="url(#doorGrad)" />
    <line x1="269" y1="52" x2="269" y2="104" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

    {/* Bumper / lower skirt */}
    <rect x="22" y="100" width="276" height="8" rx="4" fill="#0c1a3b" />

    {/* Front grill */}
    <rect x="290" y="72" width="12" height="24" rx="3" fill="#0c1a3b" />
    {[76, 82, 88, 92].map((y) => (
      <line key={y} x1="290" y1={y} x2="302" y2={y} stroke="rgba(14,165,233,0.5)" strokeWidth="1" />
    ))}

    {/* Headlights */}
    <rect x="292" y="42" width="18" height="10" rx="4" fill="url(#headlightGrad)" />
    <rect x="292" y="56" width="18" height="8" rx="3" fill="url(#headlightGrad)" opacity="0.7" />

    {/* Tail lights */}
    <rect x="10" y="46" width="10" height="14" rx="4" fill="#ef4444" opacity="0.9" />
    <rect x="10" y="64" width="10" height="10" rx="3" fill="#f97316" opacity="0.8" />

    {/* Route destination board */}
    <rect x="60" y="33" width="130" height="12" rx="3" fill="#0a2257" />
    <text x="125" y="43" textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="0.8">KUMTA → GOKARNA</text>

    {/* Wheels */}
    <g className="wheel">
      <circle cx="68" cy="115" r="16" fill="#111827" stroke="#1e40af" strokeWidth="3" />
      <circle cx="68" cy="115" r="8" fill="#1e3a8a" />
      <circle cx="68" cy="115" r="3" fill="#38bdf8" />
      {/* Spokes */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1={68 + 3.5 * Math.cos((deg * Math.PI) / 180)}
          y1={115 + 3.5 * Math.sin((deg * Math.PI) / 180)}
          x2={68 + 10 * Math.cos((deg * Math.PI) / 180)}
          y2={115 + 10 * Math.sin((deg * Math.PI) / 180)}
          stroke="#38bdf8"
          strokeWidth="1.5"
          opacity="0.7"
        />
      ))}
    </g>
    <g className="wheel">
      <circle cx="252" cy="115" r="16" fill="#111827" stroke="#1e40af" strokeWidth="3" />
      <circle cx="252" cy="115" r="8" fill="#1e3a8a" />
      <circle cx="252" cy="115" r="3" fill="#38bdf8" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1={252 + 3.5 * Math.cos((deg * Math.PI) / 180)}
          y1={115 + 3.5 * Math.sin((deg * Math.PI) / 180)}
          x2={252 + 10 * Math.cos((deg * Math.PI) / 180)}
          y2={115 + 10 * Math.sin((deg * Math.PI) / 180)}
          stroke="#38bdf8"
          strokeWidth="1.5"
          opacity="0.7"
        />
      ))}
    </g>

    {/* SVG Gradients */}
    <defs>
      <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e40af" />
        <stop offset="100%" stopColor="#0d2a72" />
      </linearGradient>
      <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="frontFace" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#1e40af" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="windowGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="doorGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#1d4ed8" />
        <stop offset="100%" stopColor="#1e40af" />
      </linearGradient>
      <linearGradient id="headlightGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#fde047" />
      </linearGradient>
    </defs>
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
  return (
    <div className="landing-root">
      {/* Animated gradient background */}
      <div className="bg-gradient-anim" aria-hidden="true" />

      {/* Floating orbs */}
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />

      {/* ── HEADER ── */}
      <motion.header
        className="landing-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
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
          {/* Badge */}
          <motion.span className="hero-badge" variants={fadeUp}>
            <Wifi size={12} />
            Powered by real-time Socket.io
          </motion.span>

          {/* Headline */}
          <motion.h1 className="hero-h1" variants={fadeUp}>
            Track Your Ride{" "}
            <span className="gradient-text">in Real-Time</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p className="hero-sub" variants={fadeUp}>
            Live GPS positions, instant ETA estimates, and Kumta–Gokarna
            coverage — all in one tap.
          </motion.p>


          {/* CTA */}
          <motion.div variants={fadeUp}>
            <motion.button
              id="get-started-btn"
              onClick={onEnter}
              className="cta-btn"
              whileHover={{ scale: 1.06, boxShadow: "0 0 40px rgba(14,165,233,0.55)" }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Zap size={20} strokeWidth={2.5} />
              Get Started
              <ChevronRight size={18} className="cta-arrow" />
            </motion.button>
            <p className="cta-footnote">No account needed · Works on any phone</p>
          </motion.div>
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
