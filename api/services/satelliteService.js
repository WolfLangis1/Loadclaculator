
const getGoogleSatelliteUrl = (lat, lon, zoom, width, height) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=${width}x${height}&maptype=satellite&key=${apiKey}`;
};

const getMapboxSatelliteUrl = (lat, lon, zoom, width, height) => {
  const apiKey = process.env.MAPBOX_API_KEY;
  if (!apiKey) {
    throw new Error('Mapbox API key not configured');
  }
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lon},${lat},${zoom}/${width}x${height}?access_token=${apiKey}`;
};

const getBingSatelliteUrl = (lat, lon, zoom, width, height) => {
  const apiKey = process.env.BING_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Bing Maps API key not configured');
  }
  return `https://dev.virtualearth.net/REST/v1/Imagery/Map/Aerial/${lat},${lon}/${zoom}?mapSize=${width},${height}&key=${apiKey}`;
};

const getSatelliteData = (provider, lat, lon, zoom, width, height) => {
  switch (provider) {
    case 'google':
      return { type: 'image', url: getGoogleSatelliteUrl(lat, lon, zoom, width, height), provider: 'google' };
    case 'mapbox':
      return { type: 'image', url: getMapboxSatelliteUrl(lat, lon, zoom, width, height), provider: 'mapbox' };
    case 'bing':
      return { type: 'image', url: getBingSatelliteUrl(lat, lon, zoom, width, height), provider: 'bing' };
    default:
      throw new Error('Invalid satellite provider');
  }
};

export const satelliteService = {
  getSatelliteData,
};
