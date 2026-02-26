const Bus = require("../models/Bus");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 New User Connected: ${socket.id}`);

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
          // 2. Broadcast the new location AND speed to everyone else looking at the map
          io.emit(`bus_${busId}`, updatedBus);

          // Secretly log it so you can verify it's working on your laptop terminal
          console.log(`🚀 Bus ${busId} moved! Speed: ${speed} km/h`);
        }
      } catch (error) {
        console.error("Error updating location:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ User Disconnected: ${socket.id}`);
    });
  });
};
