# Bus Pass — Project Specification (Blueprint)

> **Last Audited:** 2026-02-27  
> **Status:** Phase 4 — UX Polish & AI Routing Engine (In Progress)  
> **GSD Layer:** Layer-by-Layer, strictly sequential

---

## 1. App Description

**Bus Pass** is a crowdsourced, real-time bus tracking Progressive Web App (PWA) for the **Kumta–Gokarna coastal region**.  
Passengers and drivers act as GPS beacons. When a driver (or any rider) boards a bus and presses **"I'm on this Bus"**, their phone begins broadcasting live GPS coordinates + speed over Socket.io. Every other connected user sees the bus move on the map in real time.

---

## 2. Tech Stack (Audited & Confirmed)

| Layer | Technology | Version | Status |
|---|---|---|---|
| **Frontend Framework** | React (Vite) | 19.x | ✅ Installed |
| **Map Engine** | `react-map-gl` + `maplibre-gl` | 8.x / 5.x | ✅ In use (replaced Leaflet) |
| **Map Tiles** | CartoDB Voyager GL Style (vector) | — | ✅ Configured |
| **3D Buildings** | MapLibre `fill-extrusion` layer | — | ✅ Configured (pitch 60°) |
| **Realtime** | Socket.io Client | 4.x | ✅ In use |
| **HTTP Client** | Axios | 1.x | ✅ In use |
| **Animations** | Framer Motion | 12.x | ✅ In use |
| **Icons** | Lucide React | 0.5x | ✅ In use |
| **Backend Runtime** | Node.js + Express 5 | 5.x | ✅ Installed |
| **Realtime Server** | Socket.io Server | 4.x | ✅ Configured |
| **Database** | MongoDB Atlas + Mongoose | 9.x | ✅ Configured |
| **AI / Routing Engine** | OSRM (planned) | — | ❌ Not started |
| **CSS Utility** | TailwindCSS v4 (via Vite plugin) | 4.x | ✅ Installed |
| **Monospace Font** | IBM Plex Mono (Google Fonts) | — | ✅ Global (`*, body` in `index.css`) |

> **Note:** The original Leaflet map has been fully replaced by `react-map-gl/maplibre`. Do NOT reintroduce Leaflet.

---

## 3. Architecture

> ⚠️ **GPS Permission Gate:** The map requires a GPS permission grant before rendering clearly and showing the Search UI. Until permission is granted (or while awaiting it), the `BusMap` container is rendered with a CSS blur filter applied. On successful geolocation, the blur is removed, `map.flyTo()` is triggered to the user's coordinates, and the Search Bar fades in.

> 📍 **Smart Fly-To Geofence:** The map utilizes a Smart Fly-To geofence (Lat: 14.0–15.0, Lng: 74.2–74.6). Users detected outside this coastal bounding box are automatically snapped to the Kumta center to ensure buses remain visible.

```
┌─────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                      │
│                                                         │
│  LandingPage.jsx ──auto-redirect (2s)──► BusMap.jsx     │
│  (Framer Motion, 3D SVG Bus,    (react-map-gl/maplibre  │
│   Glassmorphism CTA)             CartoDB tiles, 3D bldg │
│                                  GPS permission gate    │
│                                  Socket.io client       │
│                                  Speedometer UI)        │
└────────────────────────▲────────────────────────────────┘
                         │  HTTP (REST) + WebSocket
               ┌─────────┴──────────┐
               │   Node.js Server   │
               │   (Express 5)      │
               │                   │
               │  /api/buses  ──► busController.getBuses()
               │                   │
               │  Socket.io  ───► trackHandler.js
               │  'updateLocation'   └─► Bus.findOneAndUpdate()
               │  'bus_<id>'  ◄──── io.emit() broadcast
               └─────────┬──────────┘
                         │  Mongoose ODM
               ┌─────────▼──────────┐
               │   MongoDB Atlas    │
               │   Bus Collection   │
               │  (busNumber, route,│
               │   location{lat,lng}│
               │   speed, eta,      │
               │   nextStop)        │
               └────────────────────┘
               
               ┌────────────────────┐
               │   AI Engine        │  ← PLANNED (empty)
               │   ai-engine/       │
               │   (OSRM routing,   │
               │    ETA spatial     │
               │    math, Python or │
               │    Node.js scripts)│
               └────────────────────┘
```

---

## 4. File Map (Audited)

### Frontend (`frontend/`)
```
src/
├── App.jsx               — Two-view router: 'landing' | 'map' (AnimatePresence)
├── main.jsx              — React root mount
├── index.css             — Global styles (glassmorphism, bus animations, orbs,
│                           IBM Plex Mono import, slideUpFade keyframe)
├── App.css               — App-level resets
└── components/
    ├── LandingPage.jsx   — ✅ UPDATED: citizen-friendly branding ("Real-Time Bus Tracker"),
    │                         global IBM Plex Mono, removed CliPill & "Live Network" badge,
    │                         Framer Motion staggered slide-up on hero + status cards.
    ├── CliPill.jsx       — ✅ NEW: CodeRabbit-style terminal pill (IBM Plex Mono,
    │                         CSS slideUpFade, #F04006 orange highlight, hover glow
    │                         + arrow shift — NO Framer Motion)
    └── BusMap.jsx        — ✅ FIXED: react-map-gl/maplibre, CartoDB tiles, pitch 60°,
                              Socket.io listeners de-duped, selectedBus popup pattern,
                              env-var backend URL, Ngrok bypass header.
```

### Backend (`backend/`)
```
src/
├── app.js                — ✅ Express server, Socket.io init, Mongoose connect
├── controllers/
│   └── busController.js  — ✅ getBuses() + updateBusLocation()
├── models/
│   └── Bus.js            — ✅ Schema: busNumber, route, location{lat,lng}, speed,
│                              eta, nextStop, lastUpdated
├── routes/
│   └── busRoutes.js      — ✅ GET /api/buses
├── sockets/
│   └── trackHandler.js   — ⚠️ DOUBLE-REGISTERED: registers its own io.on('connection')
│                              handler inside app.js which ALSO does io.on('connection').
│                              This causes duplicate event listeners.
└── services/             — (empty, reserved for AI/OSRM service calls)

seed.js                   — MongoDB seed script (bus data for Kumta–Gokarna routes)
Simulate.js               — GPS movement simulator script
```

### AI Engine (`ai-engine/`)
```
(empty — only .gitkeep)   — ❌ NOT STARTED. Planned: OSRM route matching, ETA calc.
```

---

## 5. Known Issues (Audit Findings)

| # | Severity | File | Issue |
|---|---|---|---|
| 1 | ✅ Fixed | `BusMap.jsx` | Backend IP was hardcoded — now uses `VITE_BACKEND_URL` env var with `localhost:5000` fallback. |
| 2 | ✅ Fixed | `vite.config.js` | Build was failing — `react-map-gl/maplibre` aliased to `dist/maplibre.js` via `resolve.alias`. |
| 3 | ✅ Fixed | `trackHandler.js` | Double `io.on('connection')` registration — refactored to export `(io, socket) => {}`. Single listener in `app.js`. |
| 4 | ✅ Fixed | `BusMap.jsx` | Speed gatekeeper threshold lowered from `< 10 km/h` to `< 2 km/h` — slow coastal traffic now broadcasts; only parked GPS drift is filtered. |
| 5 | ✅ Fixed | `BusMap.jsx` | Per-bus socket listeners stacked on re-fetch — now registered once post-fetch with cleanup. |
| 6 | 🟡 Medium | `backend/src/services/` | Empty — OSRM/ETA service layer not implemented (Phase 4). |
| 7 | 🟢 Low | `ai-engine/` | Completely empty — placeholder only (Phase 4). |
| 8 | ✅ Fixed | `frontend/package.json` | `mapbox-gl` (unused) uninstalled. |
| 9 | 🔴 **Rule** | `BusMap.jsx` (all API calls) | **Ngrok tunnel intercepts `axios` requests and returns an HTML warning page instead of JSON.** All `axios` calls to the backend **MUST** include the header `"ngrok-skip-browser-warning": "69420"`. Omitting this header causes a `TypeError: buses.map is not a function` White Screen of Death. |

---

## 6. Routing & Navigation Flow

```
/ (App.jsx)
├── view === 'landing'  →  <LandingPage onEnter={() => setView('map')} />
└── view === 'map'      →  <BusMap />
```
No client-side router (React Router) is used. View state is a simple `useState` toggle in `App.jsx`.

> **Auto-Redirect (Phase 4):** `LandingPage` now auto-redirects to the map view after **2 seconds** — no manual "Get Started" click required. The `onEnter()` callback is triggered automatically via a `setTimeout` on mount.

---

## 7. Socket.io Protocol

| Direction | Event | Payload | Description |
|---|---|---|---|
| Client → Server | `updateLocation` | `{ busId, location: {lat, lng}, speed }` | Driver broadcasts GPS position |
| Server → All Clients | `bus_<busNumber>` | Full `Bus` document | Server fans out updated bus to all watchers |

---

## 8. MongoDB Schema

```js
Bus {
  busNumber:   String  (unique, required)   // e.g. "KA-15-1234"
  route:       String  (required)           // e.g. "Kumta → Gokarna"
  type:        String  (default: "Express")
  location: {
    lat:       Number  (required)
    lng:       Number  (required)
  }
  speed:       Number  (default: 0)         // km/h
  activeUsers: Number  (default: 0)
  eta:         Number  (default: null)      // minutes
  nextStop:    String  (default: "Unknown")
  lastUpdated: Date
}
```

---

## 9. Environment Variables

### Backend (`.env`)
```
MONGO_URI=<MongoDB Atlas connection string>
PORT=5000
```

### Frontend (`frontend/.env`)
```
# For local dev:
VITE_BACKEND_URL=http://localhost:5000

# For Ngrok / Pinggy tunnel (update URL each session):
VITE_BACKEND_URL=https://<your-tunnel-subdomain>.ngrok-free.app
```

> ⚠️ **Tunnel Rule:** Every `axios` call that goes through a Ngrok or Pinggy tunnel **must** include
> the header `"ngrok-skip-browser-warning": "69420"`. Without it the tunnel returns an HTML
> interstitial page instead of JSON, causing a White Screen of Death.

---

## 10. Planned: AI Engine

The `ai-engine/` directory is reserved for:
- **OSRM** route-matching: snap raw GPS coords to the nearest road
- **ETA calculation**: given current speed and distance to next stop, compute arrival time
- This will be a Node.js or Python microservice that `trackHandler.js` calls after each location update, writing the result back to `bus.eta` and `bus.nextStop`
