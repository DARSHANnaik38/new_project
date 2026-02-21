import React, { useEffect, useState, useRef } from "react";
import Map, { Marker, Popup, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import axios from "axios";
import io from "socket.io-client";

// --- 1. CONFIGURATION ---
const LAPTOP_IP = "http://192.168.1.34:5000";
const socket = io(LAPTOP_IP);

// Open source vector map styling
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

// --- 2. ROUTE DATA ---

// --- 3. MODERN SVG ICONS ---
const busSvg = `<svg width="40" height="40" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.3"/></filter><g filter="url(#shadow)"><rect x="100" y="80" width="312" height="360" rx="40" fill="#0ea5e9" stroke="#0369a1" stroke-width="10"/><path d="M 120 100 L 392 100 L 392 220 L 120 220 Z" fill="#cffafe" stroke="#0369a1" stroke-width="5"/><circle cx="150" cy="400" r="25" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/><circle cx="362" cy="400" r="25" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/><rect x="200" y="380" width="112" height="40" rx="10" fill="#0369a1"/></g></svg>`;

const activeBusSvg = `<svg width="50" height="50" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><style>@keyframes pulse { 0% { r: 250; opacity: 0.8; } 100% { r: 350; opacity: 0; } } .radar { animation: pulse 1.5s infinite ease-out; transform-box: fill-box; transform-origin: center; }</style><circle cx="256" cy="256" r="250" fill="#ef4444" opacity="0.4" class="radar"/><filter id="shadowActive" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity="0.5"/></filter><g filter="url(#shadowActive)"><rect x="100" y="80" width="312" height="360" rx="40" fill="#ef4444" stroke="#7f1d1d" stroke-width="10"/><path d="M 120 100 L 392 100 L 392 220 L 120 220 Z" fill="#fee2e2" stroke="#7f1d1d" stroke-width="5"/><circle cx="150" cy="400" r="25" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/><circle cx="362" cy="400" r="25" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/><rect x="200" y="380" width="112" height="40" rx="10" fill="#7f1d1d"/></g></svg>`;

// --- 4. 3D BUILDINGS LAYER ---
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
      "interpolate",
      ["linear"],
      ["zoom"],
      15,
      0,
      15.05,
      ["get", "height"],
    ],
    "fill-extrusion-base": [
      "interpolate",
      ["linear"],
      ["zoom"],
      15,
      0,
      15.05,
      ["get", "min_height"],
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
  
  // Set initial viewport with a 60-degree pitch for the 3D effect
  const [viewState, setViewState] = useState({
    longitude: 74.37,
    latitude: 14.48,
    zoom: 12,
    pitch: 60, // The 3D view angle
    bearing: -10,
  });

  const watchIdRef = useRef(null);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await axios.get(`${LAPTOP_IP}/api/buses`);
        setBuses(res.data);
        res.data.forEach((bus) => {
          socket.on(`bus_${bus.busNumber}`, (updatedBus) => {
            setBuses((prevBuses) =>
              prevBuses.map((b) =>
                b.busNumber === updatedBus.busNumber
                  ? { ...b, ...updatedBus }
                  : b,
              ),
            );
          });
        });
      } catch (err) {
        console.error("Error fetching buses:", err);
      }
    };
    fetchBuses();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        (err) => console.error(err),
      );
    }
    return () => {
      socket.off();
      if (watchIdRef.current)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const handleBoardBus = (busId) => {
    if (myBusId === busId) {
      alert(`🚏 You got off bus ${busId}`);
      setMyBusId(null);
      setCurrentSpeed(0);
      if (watchIdRef.current)
        navigator.geolocation.clearWatch(watchIdRef.current);
      return;
    }
    const confirmBoard = window.confirm(
      `👮‍♂️ Are you the driver of ${busId}? \nClick OK to broadcast your location.`,
    );
    if (!confirmBoard) return;
    setMyBusId(busId);

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed } = position.coords;
          const speedKmh = speed ? (speed * 3.6).toFixed(1) : 0;
          setCurrentSpeed(parseFloat(speedKmh));

          if (speedKmh < 10) return; // Gatekeeper

          setUserLocation({ lat: latitude, lng: longitude });
          socket.emit("updateLocation", {
            busId: busId,
            location: { lat: latitude, lng: longitude },
            speed: speedKmh,
          });
        },
        (error) => console.error("Tracking Error:", error),
        { enableHighAccuracy: true },
      );
    }
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* ✨ 1. THE FLOATING "GLASS" SEARCH BAR */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "5%",
          right: "5%",
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          padding: "12px 20px",
          borderRadius: "30px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        <span style={{ fontSize: "20px" }}>🔍</span>
        <input
          type="text"
          placeholder="Where are you going?"
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            width: "100%",
            fontSize: "16px",
            fontWeight: "500",
            color: "#333",
          }}
        />
        <div
          style={{
            background: "#2563eb",
            color: "white",
            padding: "8px 15px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Find Bus
        </div>
      </div>

      {/* 🏎️ SPEEDOMETER */}
      {myBusId && (
        <div
          style={{
            position: "absolute",
            top: "90px",
            right: "5%",
            zIndex: 1000,
            background: "white",
            padding: "10px 15px",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            textAlign: "center",
            borderTop:
              currentSpeed >= 10 ? "4px solid #10b981" : "4px solid #ef4444",
          }}
        >
          <div style={{ fontSize: "10px", color: "#666", fontWeight: "bold" }}>
            YOUR SPEED
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: "900",
              color: currentSpeed >= 10 ? "#10b981" : "#ef4444",
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
      >
        {/* Adds 3D buildings layer styling to the map */}
        <Layer {...buildingLayer} />

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.lng}
            latitude={userLocation.lat}
            anchor="center"
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#2563eb",
                border: "3px solid white",
                borderRadius: "50%",
                boxShadow: "0 0 8px rgba(0,0,0,0.5)",
              }}
            />
          </Marker>
        )}

        {/* Bus Markers & Popups */}
        {buses.map((bus) => (
          <React.Fragment key={bus._id}>
            <Marker
              longitude={bus.location.lng}
              latitude={bus.location.lat}
              anchor="center"
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: myBusId === bus.busNumber ? activeBusSvg : busSvg,
                }}
                style={{
                  width: myBusId === bus.busNumber ? "50px" : "40px",
                  height: myBusId === bus.busNumber ? "50px" : "40px",
                  cursor: "pointer",
                  /* Slightly lift the marker so it sits above 3D buildings */
                  transform: "translateY(-5px)",
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
                }}
              />
            </Marker>

            <Popup
              longitude={bus.location.lng}
              latitude={bus.location.lat}
              anchor="bottom"
              offset={myBusId === bus.busNumber ? 35 : 30}
              closeButton={false}
              closeOnClick={false}
              className="bus-popup-3d"
              style={{ zIndex: 10, maxWidth: "220px" }}
            >
              <div style={{ textAlign: "center", minWidth: "180px", fontFamily: "system-ui" }}>
                <div
                  style={{
                    background:
                      myBusId === bus.busNumber ? "#ef4444" : "#0ea5e9",
                    color: "white",
                    padding: "8px",
                    borderRadius: "5px 5px 0 0",
                    marginBottom: "8px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "16px" }}>
                    {bus.busNumber}
                  </h3>
                  <small>{bus.route}</small>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    background: "#f1f5f9",
                    padding: "8px",
                    borderRadius: "5px",
                    marginBottom: "10px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#334155",
                  }}
                >
                  <span>Live Speed:</span>
                  <span
                    style={{ color: bus.speed > 10 ? "#10b981" : "#ef4444" }}
                  >
                    {bus.speed ? `${bus.speed} km/h` : "Waiting..."}
                  </span>
                </div>

                {bus.eta ? (
                  <div
                    style={{
                      background: "#f0fdf4",
                      padding: "8px",
                      borderRadius: "5px",
                      border: "1px solid #86efac",
                      marginBottom: "10px",
                    }}
                  >
                    <strong style={{ color: "#166534", fontSize: "15px" }}>
                      ⏱️ {bus.eta} min
                    </strong>
                    <div style={{ fontSize: "11px", color: "#666" }}>
                      to {bus.nextStop}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      marginBottom: "10px",
                    }}
                  >
                    Calculating route...
                  </div>
                )}
                <button
                  onClick={() => handleBoardBus(bus.busNumber)}
                  style={{
                    width: "100%",
                    background:
                      myBusId === bus.busNumber ? "#ef4444" : "#0f172a",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "13px",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                  onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
                >
                  {myBusId === bus.busNumber
                    ? "🛑 Stop Driving"
                    : "🧑‍✈️ I'm on this Bus"}
                </button>
              </div>
            </Popup>
          </React.Fragment>
        ))}
      </Map>

      {/* ✨ 2. THE BOTTOM SHEET (Quick Actions) */}
      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          right: "0",
          zIndex: 1000,
          background: "white",
          padding: "20px",
          borderRadius: "25px 25px 0 0",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
          transition: "transform 0.3s ease-out",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "5px",
            background: "#e2e8f0",
            borderRadius: "10px",
            margin: "0 auto 15px auto",
          }}
        ></div>

        <h3
          style={{ margin: "0 0 15px 0", color: "#1e293b", fontSize: "18px" }}
        >
          Popular Routes
        </h3>

        <div
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "10px",
          }}
        >
          <button
            style={{
              flex: "0 0 auto",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              padding: "10px 15px",
              borderRadius: "15px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer"
            }}
          >
            📍 Kumta Stand
          </button>
          <button
            style={{
              flex: "0 0 auto",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              padding: "10px 15px",
              borderRadius: "15px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer"
            }}
          >
            🏖️ Gokarna Beach
          </button>
          <button
            style={{
              flex: "0 0 auto",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              color: "#475569",
              padding: "10px 15px",
              borderRadius: "15px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer"
            }}
          >
            ➕ More Stops
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusMap;
