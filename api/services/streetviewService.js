
const getStreetViewMetadata = async (location, heading, source) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${location}&heading=${heading}&source=${source}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Metadata API failed: ${response.statusText}`);
  }
  return response.json();
};

const getStreetViewImageUrl = (location, width, height, heading, pitch, fov) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }
  return (
    `https://maps.googleapis.com/maps/api/streetview?` +
    `location=${location}` +
    `&size=${width}x${height}` +
    `&heading=${heading}` +
    `&pitch=${pitch}` +
    `&fov=${fov}` +
    `&key=${apiKey}`
  );
};

const getErrorMessage = (status) => {
  switch (status) {
    case 'ZERO_RESULTS':
      return 'No street view imagery available at this location. Try a nearby address or use satellite imagery instead.';
    case 'NOT_FOUND':
      return 'The specified location could not be found. Please check the address and try again.';
    case 'OVER_QUERY_LIMIT':
      return 'Street View API quota exceeded. Please try again later.';
    case 'REQUEST_DENIED':
      return 'Street View request was denied. Please contact support.';
    case 'INVALID_REQUEST':
      return 'Invalid street view request parameters. Please check your input.';
    case 'UNKNOWN_ERROR':
      return 'Unknown error occurred while fetching street view. Please try again.';
    default:
      return `Street view unavailable (${status}). Satellite imagery may be available instead.`;
  }
};

export const streetviewService = {
  getStreetViewMetadata,
  getStreetViewImageUrl,
  getErrorMessage,
};
