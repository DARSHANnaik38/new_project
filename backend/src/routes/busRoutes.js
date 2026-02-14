const express = require("express");
const router = express.Router();
const busController = require("../controllers/busController");

// GET /api/buses
// This will return all the buses currently in the database
router.get("/", busController.getBuses);

module.exports = router;
