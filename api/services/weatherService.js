
const getOpenWeatherData = async (lat, lon) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenWeather API key not configured');
  }
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
  );
  return response.json();
};

const getNoaaData = async (lat, lon) => {
  const apiKey = process.env.NOAA_API_KEY;
  if (!apiKey) {
    throw new Error('NOAA API key not configured');
  }
  const response = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
    headers: {
      'User-Agent': 'LoadCalculator/1.0',
      Accept: 'application/geo+json',
    },
  });
  return response.json();
};

const getWeatherData = (provider, lat, lon) => {
  switch (provider) {
    case 'openweather':
      return getOpenWeatherData(lat, lon);
    case 'noaa':
      return getNoaaData(lat, lon);
    default:
      throw new Error('Invalid weather provider');
  }
};

export const weatherService = {
  getWeatherData,
};
