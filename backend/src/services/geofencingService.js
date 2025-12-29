const { OfficeLocation } = require('../models');
const logger = require('../utils/logger');

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {Number} lat1 - Latitude of first point
 * @param {Number} lon1 - Longitude of first point
 * @param {Number} lat2 - Latitude of second point
 * @param {Number} lon2 - Longitude of second point
 * @returns {Number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Get reverse geocoding address from coordinates
 * This is a placeholder - in production, use Google Maps API or similar
 */
async function getAddressFromCoordinates(latitude, longitude) {
  try {
    // Placeholder - in production, integrate with Google Maps Geocoding API
    // const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`);
    // return response.data.results[0].formatted_address;
    
    return `Lat: ${latitude}, Lng: ${longitude}`;
  } catch (error) {
    logger.error('Get address from coordinates error:', error);
    return null;
  }
}

/**
 * Verify if GPS coordinates are within allowed radius of office location
 */
async function verifyLocation(companyId, latitude, longitude, branchId = null) {
  try {
    if (!latitude || !longitude) {
      return {
        valid: false,
        error: 'GPS coordinates are required'
      };
    }

    // Find office location(s) for the company
    const whereClause = {
      companyId,
      isActive: true
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    const officeLocations = await OfficeLocation.findAll({
      where: whereClause,
      order: [['isDefault', 'DESC']]
    });

    if (officeLocations.length === 0) {
      return {
        valid: false,
        error: 'No office location configured for this company/branch'
      };
    }

    // Check distance from each office location
    let nearestLocation = null;
    let minDistance = Infinity;

    for (const location of officeLocations) {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(location.latitude),
        parseFloat(location.longitude)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestLocation = location;
      }

      // If within allowed radius, return success
      if (distance <= parseFloat(location.allowedRadius)) {
        const address = await getAddressFromCoordinates(latitude, longitude);
        
        return {
          valid: true,
          location: {
            id: location.id,
            name: location.locationName,
            address: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
            allowedRadius: location.allowedRadius
          },
          distance: Math.round(distance),
          address: address || null
        };
      }
    }

    // If not within any location's radius
    const address = await getAddressFromCoordinates(latitude, longitude);
    
    return {
      valid: false,
      error: `Location is ${Math.round(minDistance)} meters away from office. Allowed radius is ${nearestLocation.allowedRadius} meters.`,
      location: nearestLocation ? {
        id: nearestLocation.id,
        name: nearestLocation.locationName,
        address: nearestLocation.address
      } : null,
      distance: Math.round(minDistance),
      address: address || null
    };
  } catch (error) {
    logger.error('Verify location error:', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Get nearest office location
 */
async function getNearestOfficeLocation(companyId, latitude, longitude, branchId = null) {
  try {
    const whereClause = {
      companyId,
      isActive: true
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    const officeLocations = await OfficeLocation.findAll({
      where: whereClause
    });

    if (officeLocations.length === 0) {
      return null;
    }

    let nearest = null;
    let minDistance = Infinity;

    for (const location of officeLocations) {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(location.latitude),
        parseFloat(location.longitude)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = location;
      }
    }

    return {
      location: nearest,
      distance: Math.round(minDistance)
    };
  } catch (error) {
    logger.error('Get nearest office location error:', error);
    return null;
  }
}

module.exports = {
  calculateDistance,
  verifyLocation,
  getNearestOfficeLocation,
  getAddressFromCoordinates
};



