import React, { useEffect, useState, useRef, useCallback } from "react";
import Map, { Marker, Popup, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import axios from "axios";
import io from "socket.io-client";

// --- 1. CONFIGURATION ---
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Socket is created once at module scope — avoids reconnects on re-render.
// The listeners are managed inside useEffect with proper cleanup.
const socket = io(BACKEND_URL, { autoConnect: true });

// Open source vector map styling (CartoDB Voyager GL)
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

// --- 2. MODERN SVG ICONS ---
const busSvg = `<svg width="40" height="40" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.3"/></filter><g filter="url(#shadow)"><rect x="100" y="80" width="312" height="360" rx="40" fill="#0ea5e9" stroke="#0369a1" stroke-width="10"/><path d="M 120 100 L 392 100 L 392 220 L 120 220 Z" fill="#cffafe" stroke="#0369a1" stroke-width="5"/><circle cx="150" cy="400" r="25" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/><circle cx="362" cy="400" r="25" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/><rect x="200" y="380" width="112" height="40" rx="10" fill="#0369a1"/></g></svg>`;

const activeBusSvg = `<svg width="50" height="50" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><style>@keyframes pulse { 0% { r: 250; opacity: 0.8; } 100% { r: 350; opacity: 0; } } .radar { animation: pulse 1.5s infinite ease-out; transform-box: fill-box; transform-origin: center; }</style><circle cx="256" cy="256" r="250" fill="#ef4444" opacity="0.4" class="radar"/><filter id="shadowActive" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity="0.5"/></filter><g filter="url(#shadowActive)"><rect x="100" y="80" width="312" height="360" rx="40" fill="#ef4444" stroke="#7f1d1d" stroke-width="10"/><path d="M 120 100 L 392 100 L 392 220 L 120 220 Z" fill="#fee2e2" stroke="#7f1d1d" stroke-width="5"/><circle cx="150" cy="400" r="25" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/><circle cx="362" cy="400" r="25" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/><rect x="200" y="380" width="112" height="40" rx="10" fill="#7f1d1d"/></g></svg>`;

// --- 3. 3D BUILDINGS LAYER ---
const buildingLayer = {
  id: "3d-buildings",
  source: "composite",
  "source-layer": "building",
  filter: ["==", "extrude", "true"],
  type: "fill-extrusion",
  minzoom: 15,
  paint: {
    "fill-extrusion-color": "#aaa",
    "fill-extrusion-height": [
      "interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"],
    ],
    "fill-extrusion-base": [
      "interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "min_height"],
    ],
    "fill-extrusion-opacity": 0.6,
  },
};

// --- Predictive Proximity Engine: hub coordinates ---
const HUB_COORDS = {
  "Kumta":    { lat: 14.4231, lng: 74.4022 },
  "Gokarna":  { lat: 14.5400, lng: 74.3180 },
  "Honnavar": { lat: 14.2800, lng: 74.4400 },
  "Sirsi":    { lat: 14.6195, lng: 74.8354 }, // inland hub for out-of-zone users
};

// Probable outgoing routes from each hub
const OUTGOING_ROUTES = {
  "Kumta":    ["🚌 Sirsi", "🚌 Karwar", "🚌 Honnavar", "🏖️ Gokarna"],
  "Gokarna":  ["🚌 Kumta", "🚌 Ankola", "🚌 Karwar"],
  "Honnavar": ["🚌 Kumta", "🚌 Bhatkal", "🏖️ Murdeshwar"],
  "Sirsi":    ["🚌 Kumta", "🚌 Hubli", "🚌 Yellapur"],
};

/**
 * getPredictiveRoutes — finds the nearest hub to the user's GPS using
 * Euclidean distance (sufficient for small coastal lat/lng deltas) and
 * returns its probable outgoing route chips.
 */
const getPredictiveRoutes = (userLoc) => {
  if (!userLoc) return ["📍 Kumta", "🏖️ Gokarna", "🚌 Honnavar"]; // default before GPS

  let nearestHub = "Kumta";
  let minDistance = Infinity;

  Object.keys(HUB_COORDS).forEach((hub) => {
    const dist = Math.hypot(
      HUB_COORDS[hub].lat - userLoc.lat,
      HUB_COORDS[hub].lng - userLoc.lng,
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearestHub = hub;
    }
  });

  return OUTGOING_ROUTES[nearestHub] || OUTGOING_ROUTES["Kumta"];
};

// --- P4 UX Polish: GPS modal animation keyframe ---
const GPS_MODAL_STYLE = (
  <style>{`
    @keyframes slideBus {
      0%   { transform: translateX(-25px); }
      50%  { transform: translateX(25px); }
      100% { transform: translateX(-25px); }
    }
  `}</style>
);

// --- MAIN COMPONENT ---
const BusMap = () => {
  const [buses, setBuses] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [myBusId, setMyBusId] = useState(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [selectedBus, setSelectedBus] = useState(null); // P2.7: click-to-popup

  // P4.1 / P4.2 — GPS gate: map starts blurred, UI hidden until GPS resolves
  const [isMapReady, setIsMapReady] = useState(false);

  // Hotfix: OS-level GPS block error state
  const [gpsError, setGpsError] = useState(null);

  // P4.4 — Search & Filter Engine
  const [searchQuery, setSearchQuery] = useState("");

  // Predictive Proximity Engine — recalculates nearest hub whenever userLocation updates
  const suggestedRoutes = getPredictiveRoutes(userLocation);

  // P4.4 — Derive filtered buses from live bus list
  const filteredBuses = searchQuery.trim()
    ? buses.filter((bus) => {
        const q = searchQuery.toLowerCase();
        return (
          (bus.route && bus.route.toLowerCase().includes(q)) ||
          (bus.busNumber && bus.busNumber.toLowerCase().includes(q)) ||
          (bus.nextStop && bus.nextStop.toLowerCase().includes(q))
        );
      })
    : buses;

  const [viewState, setViewState] = useState({
    longitude: 74.4022,
    latitude: 14.4231,
    zoom: 12,
    pitch: 60,
    bearing: -10,
  });

  const watchIdRef = useRef(null);
  // P4.2 — Imperative map handle for flyTo
  const mapRef = useRef(null);

  // P4.2 / Strict GPS Gate — reusable location requester (called on mount & Retry button)
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setIsMapReady(true); // Browser lacks geolocation — unblur immediately
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setGpsError(null);
        setUserLocation({ lat: userLat, lng: userLng });

        // Smart Fly-To: snap to Kumta if user is outside the coastal tracking zone
        // Check if user is North/South OR East/West of the Kumta-Gokarna coastal strip
        const isOutsideZone = userLat > 15.0 || userLat < 14.0 || userLng > 74.6 || userLng < 74.2;
        const targetCenter = isOutsideZone ? [74.4022, 14.4231] : [userLng, userLat];
        const targetZoom   = isOutsideZone ? 11 : 14;

        try {
          mapRef.current?.flyTo({ center: targetCenter, zoom: targetZoom, duration: 800 });
        } catch (flyErr) {
          console.warn("flyTo out-of-bounds or map not ready:", flyErr);
        }
        // Reveal map + UI immediately — no stall on out-of-bounds users
        setIsMapReady(true);
      },
      (err) => {
        // GPS denied or OS-level disabled — keep map blurred, show modal
        console.warn("Geolocation error:", err);
        setGpsError("⚠️ Location Access Required");
        // DO NOT call setIsMapReady(true) — map stays blurred until GPS granted
      }
    );
  };

  // P2.4 FIX: useEffect fetches buses once, then sets up ONE socket listener
  // per bus using the returned bus list — not inside the async fetch callback.
  // All listeners are torn down in the cleanup function.
  useEffect(() => {
    let mounted = true;

    const fetchAndSubscribe = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/buses`, {
          headers: {
            // Bypass Ngrok's browser-warning interception page.
            // Without this header, the tunnel returns HTML instead of JSON,
            // causing a "buses.map is not a function" crash.
            "ngrok-skip-browser-warning": "69420",
          },
        });
        if (!mounted) return;

        const fetchedBuses = Array.isArray(res.data) ? res.data : [];
        setBuses(fetchedBuses);

        // Register one listener per bus, keyed by busNumber.
        // This runs only once (mount), so no stacking.
        fetchedBuses.forEach((bus) => {
          socket.on(`bus_${bus.busNumber}`, (updatedBus) => {
            setBuses((prev) =>
              prev.map((b) =>
                b.busNumber === updatedBus.busNumber ? { ...b, ...updatedBus } : b
              )
            );
            // Keep the selected popup in sync with live data
            setSelectedBus((prev) =>
              prev && prev.busNumber === updatedBus.busNumber
                ? { ...prev, ...updatedBus }
                : prev
            );
          });
        });
      } catch (err) {
        console.error("Error fetching buses:", err);
      }
    };

    fetchAndSubscribe();

    requestLocation();

    // Cleanup: remove ALL socket listeners and GPS watch on unmount
    return () => {
      mounted = false;
      socket.off(); // removes all listeners registered in this scope
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []); // empty dep array = runs once on mount

  // --- Driver mode: board / alight bus ---
  const handleBoardBus = useCallback(
    (busId) => {
      if (myBusId === busId) {
        alert(`🚏 You got off bus ${busId}`);
        setMyBusId(null);
        setCurrentSpeed(0);
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        return;
      }

      const confirmBoard = window.confirm(
        `👮‍♂️ Are you the driver of ${busId}?\nClick OK to broadcast your location.`
      );
      if (!confirmBoard) return;

      setMyBusId(busId);

      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, speed } = position.coords;
            const speedKmh = speed ? parseFloat((speed * 3.6).toFixed(1)) : 0;
            setCurrentSpeed(speedKmh);

            // Speed gatekeeper: filter parked GPS drift, allow slow traffic
            if (speedKmh < 2) return; // Allow slow traffic, but filter parked GPS drift

            setUserLocation({ lat: latitude, lng: longitude });
            socket.emit("updateLocation", {
              busId,
              location: { lat: latitude, lng: longitude },
              speed: speedKmh,
            });
          },
          (error) => console.error("Tracking Error:", error),
          { enableHighAccuracy: true }
        );
      }
    },
    [myBusId]
  );

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* Inject slideBus keyframe animation */}
      {GPS_MODAL_STYLE}

      {/* ✨ FLOATING GLASS SEARCH BAR — fades in after GPS resolves (P4.2) */}
      <div
        style={{
          position: "absolute", top: "20px", left: "5%", right: "5%",
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.05)",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
          padding: "12px 20px",
          borderRadius: "30px",
          display: "flex", alignItems: "center", gap: "10px",
          // GPS gate: hidden until map is ready
          opacity: isMapReady ? 1 : 0,
          pointerEvents: isMapReady ? "auto" : "none",
          transition: "opacity 1.2s ease-in-out",
        }}
      >
        <span style={{ fontSize: "20px" }}>🔍</span>
        <input
          type="text"
          placeholder="Where are you going?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur(); // dismiss mobile keyboard
            }
          }}
          style={{
            border: "none", outline: "none",
            backgroundColor: "transparent", background: "transparent",
            width: "100%", fontSize: "16px", fontWeight: "500", color: "#333",
          }}
        />
        {searchQuery && (
          <div
            onClick={() => setSearchQuery("")}
            style={{
              background: "#ef4444", color: "white", padding: "8px 15px",
              borderRadius: "20px", fontSize: "12px", fontWeight: "bold",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            ✖ Clear
          </div>
        )}
      </div>

      {/* 🏎️ SPEEDOMETER (only shown in driver mode) */}
      {myBusId && (
        <div
          style={{
            position: "absolute", top: "90px", right: "5%", zIndex: 1000,
            background: "white", padding: "10px 15px", borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)", textAlign: "center",
            borderTop: currentSpeed >= 2 ? "4px solid #10b981" : "4px solid #ef4444",
          }}
        >
          <div style={{ fontSize: "10px", color: "#666", fontWeight: "bold" }}>YOUR SPEED</div>
          <div
            style={{
              fontSize: "22px", fontWeight: "900",
              color: currentSpeed >= 2 ? "#10b981" : "#ef4444",
            }}
          >
            {currentSpeed} <span style={{ fontSize: "12px" }}>km/h</span>
          </div>
        </div>
      )}

      {/* 🗺️ THE 3D MAP — wrapped in blur container (P4.1 / P4.2) */}
      <div
        style={{
          width: "100%", height: "100%",
          filter: isMapReady ? "none" : "blur(10px)",
          transition: "filter 1.5s ease-in-out",
        }}
      >
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        maxPitch={85}
        maxBounds={[ [74.0, 11.5], [78.6, 18.5] ]}
        minZoom={6}
        onClick={() => setSelectedBus(null)} // click map background = close popup
      >
        {/* 3D buildings layer */}
        <Layer {...buildingLayer} />

        {/* User location dot */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div
              style={{
                width: "16px", height: "16px", backgroundColor: "#2563eb",
                border: "3px solid white", borderRadius: "50%",
                boxShadow: "0 0 8px rgba(0,0,0,0.5)",
              }}
            />
          </Marker>
        )}

        {/* P2.6 / P4.4: Bus markers — filtered by searchQuery */}
        {filteredBuses.map((bus) => (
          <Marker
            key={bus._id}
            longitude={bus.location.lng}
            latitude={bus.location.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation(); // prevent map click from closing popup
              setSelectedBus(bus);
            }}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: myBusId === bus.busNumber ? activeBusSvg : busSvg,
              }}
              style={{
                width: myBusId === bus.busNumber ? "50px" : "40px",
                height: myBusId === bus.busNumber ? "50px" : "40px",
                cursor: "pointer",
                transform: "translateY(-5px)",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
              }}
            />
          </Marker>
        ))}

        {/* P2.7: Popup — only for the selectedBus */}
        {selectedBus && (
          <Popup
            longitude={selectedBus.location.lng}
            latitude={selectedBus.location.lat}
            offset={[0, -10]}
            onClose={() => setSelectedBus(null)}
            closeOnClick={false}
            className="bus-popup-3d"
            style={{ zIndex: 10, maxWidth: "250px" }}
          >
            <div style={{ textAlign: "center", minWidth: "160px", maxWidth: "250px", padding: "10px", fontFamily: "system-ui" }}>
              {/* Header */}
              <div
                style={{
                  background: myBusId === selectedBus.busNumber ? "#ef4444" : "#0ea5e9",
                  color: "white", padding: "6px 8px",
                  borderRadius: "5px 5px 0 0", marginBottom: "6px",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "14px", lineHeight: 1.2 }}>{selectedBus.busNumber}</h3>
                <small style={{ fontSize: "11px" }}>{selectedBus.route}</small>
              </div>

              {/* Speed stat */}
              <div
                style={{
                  display: "flex", justifyContent: "space-between",
                  background: "#f1f5f9", padding: "5px 8px", borderRadius: "5px",
                  marginBottom: "6px", fontSize: "11px", fontWeight: "bold", color: "#334155",
                }}
              >
                <span>Live Speed:</span>
                <span style={{ color: selectedBus.speed > 10 ? "#10b981" : "#ef4444" }}>
                  {selectedBus.speed ? `${selectedBus.speed} km/h` : "Waiting..."}
                </span>
              </div>

              {/* ETA row — shows bold green value when backend data arrives */}
              <div
                style={{
                  background: "#f0fdf4", padding: "5px 8px", borderRadius: "5px",
                  border: "1px solid #86efac", marginBottom: "6px",
                  fontSize: "11px", color: "#666",
                }}
              >
                ⏱️{" "}
                {selectedBus.eta
                  ? <span style={{ fontWeight: "bold", color: "#10b981", fontSize: "12px" }}>{selectedBus.eta} min</span>
                  : "Calculating route..."
                }
                {selectedBus.eta && selectedBus.nextStop && (
                  <div style={{ fontSize: "10px", marginTop: "2px" }}>to {selectedBus.nextStop}</div>
                )}
              </div>

              {/* Board / alight button */}
              <button
                onClick={() => handleBoardBus(selectedBus.busNumber)}
                style={{
                  width: "100%",
                  background: myBusId === selectedBus.busNumber ? "#ef4444" : "#0f172a",
                  color: "white", border: "none", padding: "8px 0",
                  borderRadius: "5px", cursor: "pointer",
                  fontWeight: "bold", fontSize: "12px",
                  marginTop: "10px", transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {myBusId === selectedBus.busNumber ? "🛑 Stop Driving" : "🧑‍✈️ I'm on this Bus"}
              </button>
            </div>
          </Popup>
        )}
      </Map>
      </div> {/* end blur wrapper */}

      {/* Strict GPS Gate — centered modal, shown only while map is not ready AND there is an error */}
      {!isMapReady && gpsError && (
        <div
          style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 3000, background: "white",
            padding: "25px", borderRadius: "15px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            width: "85%", maxWidth: "350px",
          }}
        >
          <div style={{ animation: "slideBus 2.5s infinite ease-in-out", fontSize: "35px", marginBottom: "10px" }}>
            🚌
          </div>
          <h2 style={{ margin: "0 0 8px 0", color: "#ef4444", fontSize: "20px" }}>
            Location Access Required
          </h2>
          <p style={{ margin: "0 0 5px 0", color: "#475569", fontSize: "14px", lineHeight: "1.5" }}>
            This app needs your GPS to find nearby buses and show live routes.
          </p>
          <p style={{ margin: "0", color: "#94a3b8", fontSize: "12px" }}>
            Please enable Location Services on your device and tap Retry.
          </p>
          <button
            onClick={() => requestLocation()}
            style={{
              background: "#ef4444", color: "white",
              padding: "12px 20px", borderRadius: "10px",
              border: "none", fontWeight: "bold",
              fontSize: "16px", marginTop: "15px",
              cursor: "pointer", width: "100%",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#dc2626")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#ef4444")}
          >
            🔄 Retry Location
          </button>
          <p style={{ fontSize: "11px", color: "#64748b", marginTop: "15px" }}>
            Desktop user? If you enabled GPS in site settings, please reload the page.
          </p>
        </div>
      )}

      {/* ✨ BOTTOM SHEET — Popular Routes — fades in after GPS resolves (P4.2) */}
      <div
        style={{
          position: "absolute", bottom: "0", left: "0", right: "0", zIndex: 1000,
          background: "rgba(255, 255, 255, 0.05)",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "0 -8px 32px 0 rgba(31, 38, 135, 0.15)",
          padding: "20px", borderRadius: "25px 25px 0 0",
          transition: "transform 0.3s ease-out, opacity 1.2s ease-in-out",
          // GPS gate: hidden until map is ready
          opacity: isMapReady ? 1 : 0,
          pointerEvents: isMapReady ? "auto" : "none",
        }}
      >
        <div
          style={{
            width: "40px", height: "5px", background: "#e2e8f0",
            borderRadius: "10px", margin: "0 auto 15px auto",
          }}
        />

        <h3 style={{ margin: "0 0 15px 0", color: "#1e293b", fontSize: "18px" }}>
          Popular Routes
        </h3>

        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "10px" }}>
          {suggestedRoutes.map((label, i) => (
            <button
              key={label}
              onClick={() => setSearchQuery(label.substring(label.indexOf(" ") + 1))}
              style={{
                flex: "0 0 auto",
                background: "rgba(255, 255, 255, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                color: i < 2 ? "#1d4ed8" : "#475569",
                padding: "10px 15px", borderRadius: "15px",
                fontWeight: "bold", display: "flex", alignItems: "center",
                gap: "5px", cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusMap;
