const Bus = require("../models/Bus");
const { calculateETA } = require("../../../ai-engine/etaEngine");

/**
 * trackHandler — registers socket-level event listeners.
 * Called by app.js inside its ONE io.on("connection") block.
 *
 * @param {import("socket.io").Server} io     — the Socket.io server instance
 * @param {import("socket.io").Socket} socket — the individual client socket
 */
module.exports = (io, socket) => {
  // Listen for GPS updates from the "Driver" (Your phone)
  socket.on("updateLocation", async (data) => {
    try {
      // 🏎️ Extract busId, location, and speed from the payload
      const { busId, location, speed } = data;

      // --- P4.5: Calculate ETA before saving ---
      // Fetch the current nextStop from DB so ETA is always based on
      // the bus's actual scheduled destination, not stale payload data.
      const currentBus = await Bus.findOne({ busNumber: busId }).select("nextStop").lean();
      const nextStop = currentBus?.nextStop || null;

      // Run the Haversine ETA math. Returns null for unknown stops.
      const calculatedEta = nextStop
        ? calculateETA(location, nextStop, speed)
        : null;

      // 1. Update the Database — include the freshly computed ETA
      const updatedBus = await Bus.findOneAndUpdate(
        { busNumber: busId },
        {
          location: location,
          speed: speed,
          ...(calculatedEta !== null && { eta: calculatedEta }), // only write if known
          lastUpdated: Date.now(),
        },
        { new: true },
      );

      if (updatedBus) {
        // 2. Broadcast the new location, speed, AND fresh ETA to every connected client
        io.emit(`bus_${busId}`, updatedBus);

        console.log(
          `🚀 Bus ${busId} moved! Speed: ${speed} km/h | ETA to ${nextStop}: ${calculatedEta ?? "?"} min`
        );
      }
    } catch (error) {
      console.error("Error updating location:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ User Disconnected: ${socket.id}`);
  });
};
