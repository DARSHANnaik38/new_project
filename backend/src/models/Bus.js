const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, unique: true },
  route: { type: String, required: true },
  type: {
    type: String,
    enum: ["Express", "Shuttle", "Ordinary"],
    default: "Ordinary",
  },

  // Real-time Position
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },

  // The AI/ETA Data
  nextStop: { type: String }, // e.g., "Gokarna Cross"
  eta: { type: Number }, // Minutes remaining to next stop
  speed: { type: Number }, // Current speed in km/h

  lastUpdated: { type: Date, default: Date.now },
  activeUsers: { type: Number, default: 0 },
});

module.exports = mongoose.model("Bus", busSchema);
