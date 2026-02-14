// Function to calculate distance between two coordinates in km
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Simple AI Logic: Estimate time based on distance & average speed
exports.calculateETA = (busLocation, destLocation) => {
  const distanceKm = getDistanceFromLatLonInKm(
    busLocation.lat,
    busLocation.lng,
    destLocation.lat,
    destLocation.lng,
  );

  const avgSpeed = 40; // Rural buses average 40 km/h
  const timeHours = distanceKm / avgSpeed;
  const timeMinutes = Math.round(timeHours * 60);

  return timeMinutes; // Returns minutes (e.g., 12)
};
