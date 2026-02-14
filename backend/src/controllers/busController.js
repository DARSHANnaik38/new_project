const Bus = require("../models/Bus");

// 1. Get All Buses (For the initial map load)
exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find(); // Fetch all buses from MongoDB
    res.status(200).json(buses);
  } catch (err) {
    res.status(500).json({ error: "Server Error fetching buses" });
  }
};

// 2. Update Bus Location (To be used by Socket.io & API)
// We separate this logic so both HTTP and Sockets can use it
exports.updateBusLocation = async (busId, lat, lng) => {
  try {
    const bus = await Bus.findOne({ busNumber: busId });

    if (!bus) {
      console.log(`❌ Bus ${busId} not found`);
      return null;
    }

    // Update location and time
    bus.location = { lat, lng };
    bus.lastUpdated = Date.now();

    await bus.save(); // Save to MongoDB
    console.log(`✅ Database Updated: ${busId} -> [${lat}, ${lng}]`);
    return bus;
  } catch (err) {
    console.error("❌ Error updating DB:", err);
    return null;
  }
};
