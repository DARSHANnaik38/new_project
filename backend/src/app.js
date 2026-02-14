require("dotenv").config(); // Load environment variables
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");

// Import Routes & Handlers
const busRoutes = require("./routes/busRoutes");
const trackHandler = require("./sockets/trackHandler");

// Initialize App
const app = express();
const server = http.createServer(app); // Create HTTP server for Socket.io

// Middleware
app.use(cors()); // Allow cross-origin requests (crucial for PWA)
app.use(express.json()); // Parse JSON bodies

// Routes
app.use("/api/buses", busRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected to Atlas"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Exit process with failure
  });

// Socket.io Setup (Real-time Engine)
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from your React PWA
    methods: ["GET", "POST"],
  },
});

// Socket Event Listeners
io.on("connection", (socket) => {
  console.log(`🔌 New User Connected: ${socket.id}`);

  // Initialize the Track Handler for this user
  // This handles 'updateLocation' and 'joinBus' events
  trackHandler(io, socket);

  socket.on("disconnect", () => {
    console.log("❌ User Disconnected");
  });
});

// Health Check Route
app.get("/", (req, res) => {
  res.send("Bus Pass API is Running 🚀");
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
