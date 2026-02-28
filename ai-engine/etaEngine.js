/**
 * etaEngine.js — AI Engine: Spatial ETA Calculator
 *
 * Moved from backend/src/services/etaService.js as part of the Phase 4
 * architectural refactor to enforce strict separation of concerns.
 *
 * Calculates estimated arrival time (in minutes) from a bus's current GPS
 * coordinates to its next stop using the Haversine great-circle formula.
 *
 * No external dependencies — pure math.
 * Consumed by: backend/src/sockets/trackHandler.js
 */

// --- Hardcoded coordinates for main coastal stops ---
const STOP_COORDINATES = {
  "Kumta Stand":    { lat: 14.4231, lng: 74.4022 },
  "Gokarna Beach":  { lat: 14.5400, lng: 74.3180 },
  "Honnavar Stand": { lat: 14.2800, lng: 74.4400 },
  "Karwar Stand":   { lat: 14.8185, lng: 74.1300 },
};

// Minimum speed threshold: below this we assume the bus is
// parked / stuck and substitute an average coastal route speed.
const MIN_MOVING_SPEED_KMH  = 5;
const DEFAULT_AVG_SPEED_KMH = 35;

/**
 * Haversine formula — returns straight-line distance in kilometres
 * between two lat/lng points on the Earth's surface.
 *
 * @param {{ lat: number, lng: number }} a
 * @param {{ lat: number, lng: number }} b
 * @returns {number} distance in km
 */
function haversineDistance(a, b) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const area =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

  const c = 2 * Math.atan2(Math.sqrt(area), Math.sqrt(1 - area));
  return R * c;
}

/**
 * calculateETA — main export.
 *
 * @param {{ lat: number, lng: number }} currentLocation — live GPS from driver
 * @param {string}  nextStopName — name matching a key in STOP_COORDINATES
 * @param {number}  speedKmh     — live speed reported by the driver's device
 * @returns {number} ETA in whole minutes (always a clean number)
 */
function calculateETA(currentLocation, nextStopName, speedKmh) {
  // Fall back to Kumta Stand if the stop name is unrecognised or "Unknown"
  // so the ETA engine always returns a clean number rather than null.
  const destination = STOP_COORDINATES[nextStopName] || STOP_COORDINATES["Kumta Stand"];

  const distanceKm = haversineDistance(currentLocation, destination);

  // If speed is missing, invalid, or extremely slow (< 5 km/h), default to
  // an average of 35 km/h to prevent Infinity / NaN ETAs.
  const activeSpeed =
    (speedKmh && !isNaN(speedKmh) && speedKmh >= MIN_MOVING_SPEED_KMH)
      ? speedKmh
      : DEFAULT_AVG_SPEED_KMH;

  const timeMinutes = (distanceKm / activeSpeed) * 60;
  return Math.round(timeMinutes);
}

module.exports = { calculateETA };
