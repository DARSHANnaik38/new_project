const Bus = require("../models/Bus");

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
      // 🏎️ We are now extracting 'speed' from the data payload
      const { busId, location, speed } = data;

      // 1. Update the Database
      const updatedBus = await Bus.findOneAndUpdate(
        { busNumber: busId },
        {
          location: location,
          speed: speed, // Save the speed!
          lastUpdated: Date.now(),
        },
        { new: true },
      );

      if (updatedBus) {
        // 2. Broadcast the new location AND speed to everyone watching the map
        io.emit(`bus_${busId}`, updatedBus);

        console.log(`🚀 Bus ${busId} moved! Speed: ${speed} km/h`);
      }
    } catch (error) {
      console.error("Error updating location:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ User Disconnected: ${socket.id}`);
  });
};
