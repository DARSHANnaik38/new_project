import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import io from "socket.io-client";
import L from "leaflet";

// --- 1. CONFIGURATION ---
const LAPTOP_IP = "http://192.168.1.34:5000";
const socket = io(LAPTOP_IP);

// --- 2. MODERN SVG ICONS (The Polish ✨) ---

// A. The Standard Bus (Blue/Teal)
const busSvg = `
<svg width="40" height="40" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.3"/>
  </filter>
  <g filter="url(#shadow)">
    <rect x="100" y="80" width="312" height="360" rx="40" fill="#0ea5e9" stroke="#0369a1" stroke-width="10"/>
    <path d="M 120 100 L 392 100 L 392 220 L 120 220 Z" fill="#cffafe" stroke="#0369a1" stroke-width="5"/>
    <circle cx="150" cy="400" r="25" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
    <circle cx="362" cy="400" r="25" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
    <rect x="200" y="380" width="112" height="40" rx="10" fill="#0369a1"/>
  </g>
</svg>
`;

const busIcon = L.divIcon({
  html: busSvg,
  className: "", // No extra class needed
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// B. The Active Bus (Red + Radar Pulse Effect)
const activeBusSvg = `
<svg width="50" height="50" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <style>
    @keyframes pulse {
      0% { r: 250; opacity: 0.8; }
      100% { r: 350; opacity: 0; }
    }
    .radar { animation: pulse 1.5s infinite ease-out; transform-box: fill-box; transform-origin: center; }
  </style>
  <circle cx="256" cy="256" r="250" fill="#ef4444" opacity="0.4" class="radar"/>
  
  <filter id="shadowActive" x="-50%" y="-50%" width="200%" height="200%">
    <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity="0.5"/>
  </filter>
  <g filter="url(#shadowActive)">
    <rect x="100" y="80" width="312" height="360" rx="40" fill="#ef4444" stroke="#7f1d1d" stroke-width="10"/>
    <path d="M 120 100 L 392 100 L 392 220 L 120 220 Z" fill="#fee2e2" stroke="#7f1d1d" stroke-width="5"/>
    <circle cx="150" cy="400" r="25" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
    <circle cx="362" cy="400" r="25" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
    <rect x="200" y="380" width="112" height="40" rx="10" fill="#7f1d1d"/>
  </g>
</svg>
`;

const activeBusIcon = L.divIcon({
  html: activeBusSvg,
  className: "",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

// --- MAIN COMPONENT ---
const BusMap = () => {
  const [buses, setBuses] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [myBusId, setMyBusId] = useState(null);
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
      if (watchIdRef.current)
        navigator.geolocation.clearWatch(watchIdRef.current);
      return;
    }

    const confirmBoard = window.confirm(
      `👮‍♂️ Are you the driver of ${busId}? \nClick OK to broadcast your location.`,
    );
    if (!confirmBoard) return;

    setMyBusId(busId);
    alert(`🚀 You are now driving ${busId}! The bus will move with you.`);

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          socket.emit("updateLocation", {
            busId: busId,
            location: { lat: latitude, lng: longitude },
          });
        },
        (error) => console.error("Tracking Error:", error),
        { enableHighAccuracy: true },
      );
    }
  };

  return (
    <MapContainer
      center={[14.4231, 74.4022]}
      zoom={12}
      style={{ height: "100vh", width: "100vw" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />

      {/* 🔵 User Location */}
      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={8}
          pathOptions={{
            color: "white",
            fillColor: "#2563eb",
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      )}

      {/* 🚍 Buses with NEW ICONS */}
      {buses.map((bus) => (
        <Marker
          key={bus._id}
          position={[bus.location.lat, bus.location.lng]}
          icon={myBusId === bus.busNumber ? activeBusIcon : busIcon}
        >
          <Popup className="bus-popup">
            <div style={{ textAlign: "center", minWidth: "180px" }}>
              {/* Header */}
              <div
                style={{
                  background: myBusId === bus.busNumber ? "#ef4444" : "#0ea5e9",
                  color: "white",
                  padding: "8px",
                  borderRadius: "5px 5px 0 0",
                  marginBottom: "8px",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "16px" }}>{bus.busNumber}</h3>
                <small>{bus.route}</small>
              </div>

              {/* Info Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "5px",
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    background: "#f1f5f9",
                    padding: "5px",
                    borderRadius: "4px",
                  }}
                >
                  ⚡ {bus.type}
                </div>
                <div
                  style={{
                    background: "#f1f5f9",
                    padding: "5px",
                    borderRadius: "4px",
                  }}
                >
                  👥 {bus.activeUsers} Users
                </div>
              </div>

              {/* ETA */}
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
                  Waiting for GPS...
                </div>
              )}

              {/* Button */}
              <button
                onClick={() => handleBoardBus(bus.busNumber)}
                style={{
                  width: "100%",
                  background: myBusId === bus.busNumber ? "#ef4444" : "#0f172a",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "13px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                }}
              >
                {myBusId === bus.busNumber
                  ? "🛑 Stop Driving"
                  : "🧑‍✈️ I'm on this Bus"}
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default BusMap;
