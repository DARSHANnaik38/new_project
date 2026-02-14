const io = require("socket.io-client");

// Connect to your own server (acting like a user's phone)
const socket = io("http://localhost:5000");

const BUS_ID = "KA-47-F-101"; // The bus we want to move
let lat = 14.4231; // Starting at Kumta
let lng = 74.4022;

console.log(`🚌 Simulation Started for ${BUS_ID}...`);

socket.on("connect", () => {
  console.log("✅ Connected to Server. Driving now...");

  // Send a new location every 2 seconds
  setInterval(() => {
    // Move slightly North-West (towards Gokarna)
    lat += 0.001;
    lng -= 0.0005;

    const payload = {
      busId: BUS_ID,
      location: { lat, lng },
    };

    console.log(`📍 Ping: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);

    // Emit the event exactly like the frontend expects
    socket.emit("updateLocation", payload);
  }, 2000); // 2000ms = 2 seconds
});
