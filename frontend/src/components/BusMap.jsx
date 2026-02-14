import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import io from "socket.io-client";
import L from "leaflet";

// --- Fix for Leaflet's Default Icon in React ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;
// -----------------------------------------------

// Connect to your Backend
const socket = io("http://localhost:5000");

const BusMap = () => {
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    // 1. Fetch Initial Bus Data
    const fetchBuses = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/buses");
        setBuses(res.data);
        console.log("Initial Bus Data:", res.data);

        // 2. Set up Real-time Listeners for EACH bus found
        res.data.forEach((bus) => {
          // Listen for specific bus updates
          socket.on(`bus_${bus.busNumber}`, (updatedBus) => {
            console.log("🔔 Update received for:", updatedBus.busNumber);

            // Update the state with the new location & ETA
            setBuses((prevBuses) =>
              prevBuses.map((b) =>
                b.busNumber === updatedBus.busNumber
                  ? { ...b, ...updatedBus } // <--- FIX: Merge new data with old data
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

    // Cleanup: Disconnect socket when user leaves page
    return () => {
      socket.off();
    };
  }, []);

  return (
    // Center map on Kumta (14.4231, 74.4022)
    <MapContainer
      center={[14.4231, 74.4022]}
      zoom={13}
      style={{ height: "100vh", width: "100vw" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {/* Render a Marker for each bus */}
      {buses.map((bus) => (
        <Marker key={bus._id} position={[bus.location.lat, bus.location.lng]}>
          <Popup>
            <div style={{ textAlign: "center" }}>
              <h3 style={{ margin: "0" }}>🚍 {bus.busNumber}</h3>
              <p style={{ margin: "5px 0" }}>{bus.route}</p>

              {/* Show ETA if it exists */}
              {bus.eta ? (
                <div
                  style={{
                    background: "#e6fffa",
                    padding: "5px",
                    borderRadius: "5px",
                    marginTop: "5px",
                    border: "1px solid #b2f5ea",
                  }}
                >
                  <strong>⏱️ ETA: {bus.eta} mins</strong>
                  <br />
                  <small>to {bus.nextStop}</small>
                </div>
              ) : (
                <small style={{ color: "gray" }}>Waiting for GPS...</small>
              )}

              <small style={{ display: "block", marginTop: "5px" }}>
                {bus.activeUsers} tracking • {bus.type}
              </small>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default BusMap;
