const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, unique: true },
  route: { type: String, required: true },
  type: { type: String, default: "Express" },

  // Current Live Location
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },

  // 🏎️ NEW: Store the live speed of the bus
  speed: { type: Number, default: 0 },

  activeUsers: { type: Number, default: 0 },
  eta: { type: Number, default: null },
  nextStop: { type: String, default: "Unknown" },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Bus", busSchema);
