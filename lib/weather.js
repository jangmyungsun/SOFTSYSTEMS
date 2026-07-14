export async function getCurrentWeather() {
  if (typeof window === "undefined") {
    return null;
  }

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 10 * 60 * 1000,
      }
    );
  });

  const { latitude, longitude } = position.coords;

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),

    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "surface_pressure",
      "wind_speed_10m",
      "weather_code",
    ].join(","),

    daily: [
      "sunrise",
      "sunset",
    ].join(","),

    timezone: "auto",
    forecast_days: "1",
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      `Weather request failed: ${response.status}`
    );
  }

  const data = await response.json();

  return {
    latitude,
    longitude,

    weather_code:
      data.current?.weather_code ?? null,

    weather:
      weatherCodeToText(
        data.current?.weather_code
      ),

    temperature:
      data.current?.temperature_2m ?? null,

    humidity:
      data.current?.relative_humidity_2m ??
      null,

    pressure:
      data.current?.surface_pressure ?? null,

    wind:
      data.current?.wind_speed_10m ?? null,

    sunrise:
      data.daily?.sunrise?.[0] ?? "",

    sunset:
      data.daily?.sunset?.[0] ?? "",

    units: {
      temperature:
        data.current_units?.temperature_2m ||
        "",

      humidity:
        data.current_units
          ?.relative_humidity_2m || "",

      pressure:
        data.current_units?.surface_pressure ||
        "",

      wind:
        data.current_units?.wind_speed_10m ||
        "",
    },

    collected_at:
      new Date().toISOString(),
  };
}

function weatherCodeToText(code) {
  const labels = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",

    45: "Fog",
    48: "Rime fog",

    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",

    56: "Light freezing drizzle",
    57: "Freezing drizzle",

    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",

    66: "Light freezing rain",
    67: "Freezing rain",

    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",

    77: "Snow grains",

    80: "Light rain showers",
    81: "Rain showers",
    82: "Heavy rain showers",

    85: "Light snow showers",
    86: "Heavy snow showers",

    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Strong thunderstorm with hail",
  };

  return labels[code] || "Unknown";
}
