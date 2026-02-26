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
- [ ] **P2.8 — Verify speedometer UI** — When driver mode is active, speedometer widget appears top-right
- [ ] **P2.9 — Verify landing → map transition** — AnimatePresence fade-in/out works correctly on "Get Started" click

---

## ◈ PHASE 3: Backend & Socket Reconnection

> **Goal:** Bi-directional Socket.io is proven working end-to-end. Live location updates visible on map.

- [ ] **P3.1 — Fix double-listener bug** — Refactor `trackHandler.js` to export `(io, socket) => {}` instead of registering its own `io.on('connection')`. `app.js` already handles connection; just call `trackHandler(io, socket)` inside it.
- [ ] **P3.2 — Verify `seed.js` works** — Run seed script, confirm buses appear in MongoDB Atlas collection
- [ ] **P3.3 — Run `Simulate.js`** — Confirm simulated GPS updates appear in server terminal and move bus markers on the live map
- [ ] **P3.4 — Speed gatekeeper review** — Evaluate if the `< 10 km/h` filter in `BusMap.jsx` should be removed or made configurable (stationary buses should still be trackable)
- [ ] **P3.5 — CORS hardening** — Lock CORS `origin` in `app.js` from `"*"` to the actual frontend URL for production
- [ ] **P3.6 — End-to-end integration test** — Open two browser tabs: one as driver (boardBus), one as passenger. Confirm map updates in the passenger tab in real-time.

---

## ◈ PHASE 4: Search & AI Routing Engine

> **Goal:** Users can search for a route/destination; OSRM calculates ETAs.

- [ ] **P4.1 — Wire up "Find Bus" search bar** — Connect the existing search input in `BusMap.jsx` to a filter that highlights matching buses
- [ ] **P4.2 — Route dropdown UI** — Add a `<select>` or autocomplete dropdown listing all available routes from `/api/buses`
- [ ] **P4.3 — Bootstrap `ai-engine/`** — Create `ai-engine/package.json` (or `requirements.txt`), decide on Node.js vs Python
- [ ] **P4.4 — OSRM integration** — Set up OSRM (self-hosted or public API) for route snapping and distance calculation
- [ ] **P4.5 — ETA service** — In `backend/src/services/`, create `etaService.js` that accepts `{ location, speed, nextStop }` and returns ETA in minutes using OSRM
- [ ] **P4.6 — Connect ETA to `trackHandler.js`** — After each `updateLocation` event, call `etaService` and write result back to `bus.eta` + `bus.nextStop` in MongoDB
- [ ] **P4.7 — Display live ETA on map** — Confirm bus popups show real computed ETAs (not null/mock data)
- [ ] **P4.8 — Route polyline on map** — Draw a MapLibre line layer showing the bus's planned route path

---

## ◈ PHASE 5: PWA & Production Hardening  (Future)

- [ ] Add `manifest.json` and service worker for PWA installability
- [ ] Set up environment-based config for staging vs production
- [ ] Add rate-limiting / auth for the `updateLocation` socket event (prevent spoofing)
- [ ] Deploy frontend (Vercel/Netlify) + backend (Railway/Render)
- [ ] Set up MongoDB Atlas IP allowlist + connection pooling
