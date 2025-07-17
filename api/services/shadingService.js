
const getWeatherData = async (lat, lon) => {
  const openweatherApiKey = process.env.OPENWEATHER_API_KEY;
  const noaaApiKey = process.env.NOAA_API_KEY;

  if (!openweatherApiKey && !noaaApiKey) {
    throw new Error('Weather API keys not configured');
  }

  if (openweatherApiKey) {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openweatherApiKey}&units=imperial`
    );
    return response.json();
  } else {
    const response = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
      headers: {
        'User-Agent': 'LoadCalculator/1.0',
        Accept: 'application/geo+json',
      },
    });
    return response.json();
  }
};

const calculateShadingFactor = (hour, month, weatherData) => {
  let baseShading = 0;
  if (hour < 8 || hour > 18) {
    baseShading = 0.8;
  } else if (hour < 10 || hour > 16) {
    baseShading = 0.3;
  } else {
    baseShading = 0.1;
  }
  if (weatherData.clouds?.all) {
    baseShading += (weatherData.clouds.all / 100) * 0.3;
  }
  return Math.min(baseShading, 1);
};

const calculateSunPosition = (lat, lon, time) => {
  const date = new Date(time);
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 80) * (Math.PI / 180));
  const hour = date.getHours() + date.getMinutes() / 60;
  const hourAngle = (hour - 12) * 15;
  return {
    azimuth: hourAngle,
    elevation: 90 - Math.abs(lat - declination),
    declination,
  };
};

const calculateShadowLength = (weatherData, hour) => {
  const sunAngle = Math.max(0, 90 - Math.abs(hour - 12) * 7.5);
  const baseShadowLength = 10 / Math.tan((sunAngle * Math.PI) / 180);
  let weatherMultiplier = 1;
  if (weatherData.clouds?.all > 50) {
    weatherMultiplier = 0.8;
  }
  return Math.max(0, baseShadowLength * weatherMultiplier);
};

const calculateSolarIrradiance = (month, hour, shadingFactor) => {
  const baseIrradiance = 1000;
  const seasonalFactor = 1 + 0.3 * Math.sin(((month - 6) * Math.PI) / 6);
  const timeFactor = Math.max(0, Math.sin(((hour - 6) * Math.PI) / 12));
  const shadingAdjustment = 1 - shadingFactor;
  return baseIrradiance * seasonalFactor * timeFactor * shadingAdjustment;
};

export const shadingService = {
  getWeatherData,
  calculateShadingFactor,
  calculateSunPosition,
  calculateShadowLength,
  calculateSolarIrradiance,
};
