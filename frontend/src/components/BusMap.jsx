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

// --- MAIN COMPONENT ---
const BusMap = () => {
  const [buses, setBuses] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [myBusId, setMyBusId] = useState(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [selectedBus, setSelectedBus] = useState(null); // P2.7: click-to-popup

  const [viewState, setViewState] = useState({
    longitude: 74.4022,
    latitude: 14.4231,
    zoom: 12,
    pitch: 60,
    bearing: -10,
  });

  const watchIdRef = useRef(null);

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

    // Get initial user location (passive, not driving mode)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        (err) => console.error("Geolocation error:", err)
      );
    }

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

      {/* ✨ FLOATING GLASS SEARCH BAR */}
      <div
        style={{
          position: "absolute", top: "20px", left: "5%", right: "5%",
          zIndex: 1000, background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)", padding: "12px 20px",
          borderRadius: "30px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", gap: "10px",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        <span style={{ fontSize: "20px" }}>🔍</span>
        <input
          type="text"
          placeholder="Where are you going?"
          style={{
            border: "none", outline: "none", background: "transparent",
            width: "100%", fontSize: "16px", fontWeight: "500", color: "#333",
          }}
        />
        <div
          style={{
            background: "#2563eb", color: "white", padding: "8px 15px",
            borderRadius: "20px", fontSize: "12px", fontWeight: "bold", cursor: "pointer",
          }}
        >
          Find Bus
        </div>
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

      {/* 🗺️ THE 3D MAP */}
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        maxPitch={85}
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

        {/* P2.6: Bus markers — click sets selectedBus */}
        {buses.map((bus) => (
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
            anchor="bottom"
            offset={myBusId === selectedBus.busNumber ? 35 : 30}
            onClose={() => setSelectedBus(null)}
            closeOnClick={false}
            className="bus-popup-3d"
            style={{ zIndex: 10, maxWidth: "220px" }}
          >
            <div style={{ textAlign: "center", minWidth: "180px", fontFamily: "system-ui" }}>
              {/* Header */}
              <div
                style={{
                  background: myBusId === selectedBus.busNumber ? "#ef4444" : "#0ea5e9",
                  color: "white", padding: "8px",
                  borderRadius: "5px 5px 0 0", marginBottom: "8px",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px" }}>{selectedBus.busNumber}</h3>
                <small>{selectedBus.route}</small>
              </div>

              {/* Speed stat */}
              <div
                style={{
                  display: "flex", justifyContent: "space-between",
                  background: "#f1f5f9", padding: "8px", borderRadius: "5px",
                  marginBottom: "10px", fontSize: "12px", fontWeight: "bold", color: "#334155",
                }}
              >
                <span>Live Speed:</span>
                <span style={{ color: selectedBus.speed > 10 ? "#10b981" : "#ef4444" }}>
                  {selectedBus.speed ? `${selectedBus.speed} km/h` : "Waiting..."}
                </span>
              </div>

              {/* ETA row */}
              {selectedBus.eta ? (
                <div
                  style={{
                    background: "#f0fdf4", padding: "8px", borderRadius: "5px",
                    border: "1px solid #86efac", marginBottom: "10px",
                  }}
                >
                  <strong style={{ color: "#166534", fontSize: "15px" }}>
                    ⏱️ {selectedBus.eta} min
                  </strong>
                  <div style={{ fontSize: "11px", color: "#666" }}>
                    to {selectedBus.nextStop}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "12px", color: "#999", marginBottom: "10px" }}>
                  Calculating route...
                </div>
              )}

              {/* Board / alight button */}
              <button
                onClick={() => handleBoardBus(selectedBus.busNumber)}
                style={{
                  width: "100%",
                  background: myBusId === selectedBus.busNumber ? "#ef4444" : "#0f172a",
                  color: "white", border: "none", padding: "10px",
                  borderRadius: "5px", cursor: "pointer",
                  fontWeight: "bold", fontSize: "13px", transition: "all 0.2s ease",
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

      {/* ✨ BOTTOM SHEET — Popular Routes */}
      <div
        style={{
          position: "absolute", bottom: "0", left: "0", right: "0", zIndex: 1000,
          background: "white", padding: "20px", borderRadius: "25px 25px 0 0",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.1)", transition: "transform 0.3s ease-out",
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
          {["📍 Kumta Stand", "🏖️ Gokarna Beach", "➕ More Stops"].map((label, i) => (
            <button
              key={label}
              style={{
                flex: "0 0 auto",
                background: i < 2 ? "#eff6ff" : "#f1f5f9",
                border: i < 2 ? "1px solid #bfdbfe" : "1px solid #cbd5e1",
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
