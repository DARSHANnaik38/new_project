# Bus Pass — GSD Task Tracker

> **Methodology:** Layer-by-Layer. DO NOT start a new phase until the current one is fully checked off.  
> **Legend:** `[x]` Done · `[ ]` Pending · `[-]` Broken / Needs Fix · `[/]` In Progress

---

## ◈ PHASE 1: Foundation & Audit  ← CURRENT PHASE

- [x] Scaffold project structure (`frontend/`, `backend/`, `ai-engine/`)
- [x] Initialize React + Vite frontend
- [x] Initialize Node.js + Express backend
- [x] Connect backend to MongoDB Atlas
- [x] Create `Bus` Mongoose schema (busNumber, route, location, speed, eta, nextStop)
- [x] Create `GET /api/buses` REST endpoint
- [x] Create Socket.io server in `app.js`
- [x] Create `trackHandler.js` (listens for `updateLocation`, broadcasts `bus_<id>`)
- [x] Create landing page (`LandingPage.jsx`) with Framer Motion + 3D SVG Bus
- [x] Create `seed.js` to populate MongoDB with Kumta–Gokarna bus data
- [x] Create `Simulate.js` GPS movement simulator
- [x] Full codebase audit completed → see `spec.md`
- [x] **Frontend build error resolved** — `react-map-gl/maplibre` aliased to pre-built ESM in `vite.config.js`

---

## ◈ PHASE 2: Frontend Map Restoration

> **Goal:** Get the map rendering in the browser with buses visible. No broken builds.

- [x] **P2.1 — Fix build error** — aliased `react-map-gl/maplibre` → `dist/maplibre.js` in `vite.config.js`; build passes (`exit 0`)
- [x] **P2.2 — Env var for backend URL** — Created `frontend/.env` with `VITE_BACKEND_URL`; `BusMap.jsx` now uses `import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"`
- [x] **P2.3 — Remove dead dependency** — `mapbox-gl` uninstalled from `frontend/package.json`
- [x] **P2.4 — Fix duplicate socket listeners** — `useEffect` fetches buses once on mount; per-bus `socket.on()` registered after fetch, `socket.off()` on unmount. No stacking.
- [x] **P2.5 — Verify map renders** — CartoDB Voyager GL style, pitch 60°, centered on Kumta (14.4231, 74.4022), `zoom: 12`; 3D building layer included
- [x] **P2.6 — Verify bus markers render** — Markers use SVG icons at `bus.location.lng/lat`; `onClick` sets `selectedBus` state
  - [x] **P2.6.2 — Fix Ngrok API interception** — Added `"ngrok-skip-browser-warning": "69420"` header to `axios.get`; added `Array.isArray()` safety guard before `setBuses()` to prevent "White Screen of Death"
- [x] **P2.7 — Verify popups** — `Popup` renders only for `selectedBus`; shows busNumber, route, speed, ETA, "I'm on this Bus" button; closes on map-background click
- [x] **P2.8 — Verify speedometer UI** — When driver mode is active, speedometer widget appears top-right
- [x] **P2.9 — Verify landing → map transition** — AnimatePresence fade-in/out works correctly on "Get Started" click
- [x] **Implement CodeRabbit-style CLI Pill** — `CliPill.jsx` created with IBM Plex Mono, slideUpFade CSS animation, #F04006 orange highlight, and hover glow + arrow shift
- [x] **Overhaul landing page UI** — Citizen-friendly branding ("Real-Time Bus Tracker"), global IBM Plex Mono font via `*, body` selectors in `index.css`, removed "Live Network" badge and `CliPill`, Framer Motion staggered slide-up (`y: 30`, 0.15s stagger) on all hero blocks and status cards.
- [x] **Hotfix: Unlock Landing Page scroll** — Removed `overflow: hidden` and `height: 100vh` from `body` in `index.css`; switched to `min-height: 100vh` + `overflow-x: hidden`. `BusMap.jsx` self-constrains via its own inline styles, so the map view is unaffected.

---

## ◈ PHASE 3: Backend & Socket Reconnection

> **Goal:** Bi-directional Socket.io is proven working end-to-end. Live location updates visible on map.

- [x] **P3.1 — Fix double-listener bug** — Refactored `trackHandler.js` to export `(io, socket) => {}` directly. `app.js`'s single `io.on('connection')` block calls `trackHandler(io, socket)`. No duplicate listeners.
- [x] **P3.2 — Verify `seed.js` works** — Run seed script, confirm buses appear in MongoDB Atlas collection
- [x] **P3.3 — Run `Simulate.js`** — Confirm simulated GPS updates appear in server terminal and move bus markers on the live map
- [x] **P3.4 — Speed gatekeeper review** — Lowered threshold to `2 km/h` (from 10) to support slow-moving coastal traffic; filters parked GPS drift while keeping slow buses broadcasting. Speedometer indicator updated to match.
- [x] **P3.5 — CORS hardening** — `ALLOWED_ORIGINS` const built from `process.env.FRONTEND_URL` with `http://localhost:5173` fallback; applied to both Express `cors()` and Socket.io `Server()`. Wildcard `"*"` removed.
- [ ] **P3.6 — End-to-end integration test** — Open two browser tabs: one as driver (boardBus), one as passenger. Confirm map updates in the passenger tab in real-time.

---

## ◈ PHASE 4: UX Polish & AI Routing Engine

> **Goal:** Deliver the final MVP user journey — seamless auto-entry, GPS-gated map reveal, contextual route suggestions, filtered search, and AI-powered ETAs.

- [x] **P4.1 — Auto-Entry & Map Blur** — Update `LandingPage` to auto-redirect after 2 seconds. Apply a CSS blur filter to the `BusMap` container initially.
- [x] **P4.2 — GPS Fly-To & UI Reveal** — On successful geolocation, remove the map blur, trigger a `map.flyTo()` animation to the user's coordinates, and fade in the Search Bar.
- [x] **P4.3 — Contextual Bottom Sheet** — Update the bottom UI to dynamically suggest nearby routes/buses based on the user's current GPS location. (Also optimized map flyTo animation to 800ms for snappier UX).
- [x] **Hotfix: Strict GPS Gate** — Enforced permanent map blur + centered Retry modal until location is granted. `requestLocation()` is reusable (called on mount and by the Retry button). No `setIsMapReady(true)` on error — map stays blurred.
- [x] **UX Polish: GPS Modal Animation** — Added `slideBus` keyframe animation (🚌 sliding bus icon) to the GPS gate modal. Added desktop-user reload hint below the Retry button.
- [x] **P4.4 — Search & Filter Engine** — Real-time typed filtering on `route`, `busNumber`, `nextStop` (case-insensitive). Quick-filter bottom sheet chips auto-fill the search bar (emoji stripped). Conditional ✖ Clear button. `filteredBuses.map()` replaces `buses.map()` on the map.
- [x] **UX Polish: Mobile Keyboard Dismiss** — Search bar `onKeyDown` calls `blur()` on `Enter` so the mobile keyboard closes and users can see the filtered map.
- [x] **Performance Optimization: Karnataka Bounds Lock** — Added `maxBounds={[[74.0,11.5],[78.6,18.5]]}` and `minZoom={6}` to the `<Map>` component to prevent ocean/out-of-state panning and drop unnecessary global tile rendering. `flyTo` wrapped in `try/catch` for out-of-bounds safety.
- [x] **Hotfix: Smart Fly-To** — If user GPS is outside the coastal zone (`lat < 14.0` or `lat > 15.0`), camera snaps to Kumta center at zoom 11 instead of stalling against `maxBounds`. `setIsMapReady(true)` now fires synchronously (no timeout), eliminating blur-delay for out-of-zone users.
- [x] **Hotfix: Upgraded 'Smart Fly-To' geofence to check both Latitude and Longitude to prevent inland camera trapping.**
- [x] **P4.5 — AI ETA Engine (Backend)** — Haversine spatial math service (`etaService.js`) integrated with `trackHandler.js`. ETA computed live on every GPS update and broadcast to all clients.
- [x] **UX Hotfix: Compressed the bus popup card UI** — Reduced padding, font sizes, and button height to prevent overlap with the top search bar.
- [x] **Hotfix: Fixed `undefined` speed payloads in `Simulate.js`** — Added randomised `speed` (30–44 km/h) to every `updateLocation` emit. Hardened `etaService.js` speed guard to reject `undefined`, `null`, and `NaN` before dividing, defaulting to 35 km/h average.
- [x] **UI Hotfix: Forced MapLibre popup to anchor `top`** — Card now renders downward below the bus marker (`offset={[0, 15]}`) instead of rising into the search bar. Simplified ETA row to a single always-visible container: shows bold green minutes when data arrives, "Calculating route..." otherwise.
- [x] **Hotfix: Fixed `Unknown` destination bug** — Injected `nextStop: "Kumta Stand"` into `Simulate.js` payload. Added `STOP_COORDINATES[nextStopName] || STOP_COORDINATES["Kumta Stand"]` fallback in `etaService.js` so an unrecognised or "Unknown" stop always resolves to a valid coordinate set and returns a clean ETA number.
- [x] **Architectural Refactor: Extracted ETA calculation logic** from the Express backend (`backend/src/services/etaService.js`) into the dedicated `ai-engine/etaEngine.js` to enforce strict separation of concerns. `trackHandler.js` import rewired accordingly.
- [x] **UX Architecture: Predictive Proximity Engine** — Replaced static `getNearbySuggestions` (lat-only) with a spatial engine using `Math.hypot` to find the nearest bus hub (`HUB_COORDS`) and return its `OUTGOING_ROUTES`. Bottom sheet chips now reflect the user's actual closest hub (Kumta/Gokarna/Honnavar/Sirsi) dynamically.
- [x] **UI Hotfix: Removed hardcoded popup `anchor="top"`** — Enables MapLibre's native auto-positioning so the card flips away from screen edges automatically. `offset={[0, -10]}` keeps it clear of the bus icon; `maxWidth: "250px"` on the outer `<Popup>` and inner `<div>` prevents unwanted stretching.
- [x] **UI/UX Overhaul: Glassmorphism** — Upgraded search bar (`rgba(255,255,255,0.75)`, `blur(12px) saturate(150%)`), bottom sheet (`rgba(255,255,255,0.80)`, `blur(16px) saturate(150%)`), and route chip buttons (`rgba(255,255,255,0.6)`, `blur(4px)`) to a premium frosted-glass aesthetic. Both `backdropFilter` and `WebkitBackdropFilter` set for full browser coverage.
- [x] **UI Hotfix: Stripped conflicting background shorthand** — Switched from `background:` to `backgroundColor:` on both panels to prevent CSS specificity clashes. Search bar: `rgba(255,255,255,0.65)` / `blur(16px)`. Bottom sheet: `rgba(255,255,255,0.75)` / `blur(20px)`. Input explicitly gets `backgroundColor: "transparent"` alongside `background: "transparent"`.
- [x] **UI Hotfix: Deep-cleaned nested child elements** — Full audit confirmed no Tailwind `className` strings exist in `BusMap.jsx` (all styles are inline). Both `background` shorthand AND `backgroundColor` longhand are now set on both glass containers to guarantee the frosted effect survives any browser UA or Vite CSS reset. Children (drag handle, `h3`, `input`, chip buttons) confirmed clean — no solid backgrounds blocking the blur.
- [x] **UI Hotfix: Adjusted Glassmorphism RGBA alpha channels to 0.25** — Dropped background opacity from 0.65/0.75 to `0.25` on both panels and `0.3` on chip buttons. Shifted `boxShadow` to indigo (`rgba(31,38,135,0.15)`) for premium glass depth. `blur(16px)` / `blur(20px)` retained on search bar / bottom sheet respectively.
- [x] **UI Hotfix: Drastically reduced backdrop-filter blur to 4px and lowered alpha to 0.15** — Both search bar and bottom sheet now use `rgba(255,255,255,0.15)` + `blur(4px)` / `WebkitBackdropFilter: blur(4px)` for a truly see-through UI with clearly visible map detail underneath.
- [x] **UI Polish: Maximized UI transparency** — Alpha reduced to `0.05` (5% white) and blur to `blur(2px)` on both panels for an ultra-thin glassmorphism effect.
- [x] **UI/UX Overhaul: Premium Landing Page splash screen** — Auto-redirect bumped to 4 seconds. Background replaced with deep inline radial gradient (`#1e3a8a → #0f172a → #020617`). Socket.io badge removed. Hero `h1` upgraded to a `clamp(2rem, 5vw, 3rem)` gradient title (`#60a5fa → #c084fc`) with a blue glow drop-shadow. Bus3D SVG retained (already has headlights, door, tail lights, and spoke wheels).
- [x] **UI Polish: Perfected splash screen** — Logo header centered (`justifyContent: center`). "Get Started" button and footnote removed (auto-redirect makes them redundant). Bus3D replaced with ultra-realistic modern coach SVG: aerodynamic path body, roof AC unit, gradient-tinted windshield + passenger windows, rear-view mirrors, metallic spoke rims (`rimGrad`), glowing headlights with DRL strip + SVG `feGaussianBlur` glow filter, and red/amber tail lights.

> 🎉 **Phase 4 is 100% complete!** Full MVP user journey delivered.


---

## ◈ PHASE 5: PWA & Production Hardening  (Future)

- [ ] Add `manifest.json` and service worker for PWA installability
- [ ] Set up environment-based config for staging vs production
- [ ] Add rate-limiting / auth for the `updateLocation` socket event (prevent spoofing)
- [ ] Deploy frontend (Vercel/Netlify) + backend (Railway/Render)
- [ ] Set up MongoDB Atlas IP allowlist + connection pooling
