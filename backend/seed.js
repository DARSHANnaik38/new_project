require("dotenv").config();
const mongoose = require("mongoose");
const Bus = require("./src/models/Bus");

// Logic to inject data
const seedData = async () => {
  try {
    // 1. Clear existing data
    console.log("🧹 Clearing old data...");
    await Bus.deleteMany({});

    // 2. Create Dummy Buses
    const buses = [
      {
        busNumber: "KA-47-F-101",
        route: "Kumta - Gokarna",
        type: "Express",
        location: { lat: 14.4231, lng: 74.4022 },
        activeUsers: 2,
        lastUpdated: new Date(),
      },
      {
        busNumber: "KA-47-S-205",
        route: "Kumta - Honnavar",
        type: "Shuttle",
        location: { lat: 14.2833, lng: 74.45 },
        activeUsers: 5,
        lastUpdated: new Date(),
      },
    ];

    // 3. Inject into Database
    await Bus.insertMany(buses);
    console.log("🎉 Data Injected Successfully!");

    // 4. Close Connection
    process.exit();
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
};

// --- MAIN EXECUTION ---
// Only run seedData AFTER connecting
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected. Starting Seed...");
    seedData();
  })
  .catch((err) => {
    console.error("❌ Connection Error:", err);
  });
