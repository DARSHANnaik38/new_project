const busController = require("../controllers/busController");
const { calculateETA } = require("../services/etaService");

const GOKARNA_COORDS = { lat: 14.5428, lng: 74.3183 };

module.exports = (io, socket) => {
  socket.on("updateLocation", async (data) => {
    console.log(`📍 Ping from ${data.busId}`);

    // 1. Calculate ETA
    const minutesLeft = calculateETA(data.location, GOKARNA_COORDS);

    // 2. Prepare the data for the Frontend
    // CRITICAL FIX: We map 'busId' to 'busNumber' so the frontend recognizes it
    const enrichedData = {
      busNumber: data.busId, // <--- This fixes the mismatch
      location: data.location,
      nextStop: "Gokarna Stand",
      eta: minutesLeft,
      lastUpdated: new Date(),
    };

    // 3. Save to DB
    await busController.updateBusLocation(
      data.busId,
      data.location.lat,
      data.location.lng,
    );

    // 4. Broadcast
    io.emit(`bus_${data.busId}`, enrichedData);
  });
};
