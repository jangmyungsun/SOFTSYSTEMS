const WEATHER_CODES = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",

  45: "Fog",
  48: "Rime fog",

  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",

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
  99: "Heavy thunderstorm with hail",
};

function getDateString(date = new Date()) {
  return date
    .toISOString()
    .slice(0, 10);
}

function parseDate(dateString) {
  const date =
    new Date(
      `${dateString}T12:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "Invalid weather date."
    );
  }

  return date;
}

function daysBetween(
  firstDate,
  secondDate
) {
  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  return Math.round(
    (
      secondDate.getTime() -
      firstDate.getTime()
    ) /
      millisecondsPerDay
  );
}

function getAverage(values) {
  const numbers = (
    Array.isArray(values)
      ? values
      : []
  )
    .map(Number)
    .filter(
      Number.isFinite
    );

  if (!numbers.length) {
    return null;
  }

  const total =
    numbers.reduce(
      (sum, value) =>
        sum + value,
      0
    );

  return Number(
    (
      total /
      numbers.length
    ).toFixed(1)
  );
}

function getMiddleValue(values) {
  if (
    !Array.isArray(values) ||
    !values.length
  ) {
    return null;
  }

  const middleIndex =
    Math.floor(
      values.length / 2
    );

  const value =
    Number(
      values[middleIndex]
    );

  return Number.isFinite(value)
    ? value
    : null;
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  const match =
    String(value).match(
      /T(\d{2}:\d{2})/
    );

  return match
    ? match[1]
    : String(value);
}

function getWeatherLabel(code) {
  return (
    WEATHER_CODES[
      Number(code)
    ] ||
    "Unknown"
  );
}

function getCurrentPosition() {
  return new Promise(
    (resolve, reject) => {
      if (
        typeof navigator ===
          "undefined" ||
        !navigator.geolocation
      ) {
        reject(
          new Error(
            "Geolocation is not supported by this browser."
          )
        );

        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude:
              position.coords
                .latitude,

            longitude:
              position.coords
                .longitude,
          });
        },

        (error) => {
          if (
            error.code === 1
          ) {
            reject(
              new Error(
                "Location permission was denied."
              )
            );

            return;
          }

          reject(
            new Error(
              "Your location could not be detected."
            )
          );
        },

        {
          enableHighAccuracy:
            false,

          timeout:
            12000,

          maximumAge:
            1000 *
            60 *
            30,
        }
      );
    }
  );
}

function chooseApiEndpoint(
  dateString
) {
  const today =
    parseDate(
      getDateString()
    );

  const selectedDate =
    parseDate(dateString);

  const difference =
    daysBetween(
      selectedDate,
      today
    );

  /*
   * 최근 날짜는 Forecast API가
   * 더 안정적으로 제공한다.
   *
   * 오래된 날짜는 Historical
   * Weather API를 사용한다.
   */
  if (
    difference <= 5
  ) {
    return {
      endpoint:
        "https://api.open-meteo.com/v1/forecast",

      source:
        "forecast",
    };
  }

  return {
    endpoint:
      "https://archive-api.open-meteo.com/v1/archive",

    source:
      "historical",
  };
}

function buildWeatherUrl({
  latitude,
  longitude,
  dateString,
}) {
  const {
    endpoint,
    source,
  } =
    chooseApiEndpoint(
      dateString
    );

  const parameters =
    new URLSearchParams({
      latitude:
        String(latitude),

      longitude:
        String(longitude),

      start_date:
        dateString,

      end_date:
        dateString,

      timezone:
        "auto",

      temperature_unit:
        "celsius",

      wind_speed_unit:
        "kmh",

      precipitation_unit:
        "mm",

      daily: [
        "weather_code",
        "temperature_2m_mean",
        "temperature_2m_max",
        "temperature_2m_min",
        "sunrise",
        "sunset",
      ].join(","),

      hourly: [
        "relative_humidity_2m",
        "surface_pressure",
        "wind_speed_10m",
      ].join(","),
    });

  return {
    url:
      `${endpoint}?${parameters.toString()}`,

    source,
  };
}

function parseWeatherResponse(
  data,
  dateString,
  source
) {
  const daily =
    data?.daily || {};

  const hourly =
    data?.hourly || {};

  const weatherCode =
    daily.weather_code?.[0] ??
    null;

  const temperature =
    daily
      .temperature_2m_mean?.[0] ??
    getMiddleValue(
      [
        daily
          .temperature_2m_max?.[0],

        daily
          .temperature_2m_min?.[0],
      ].filter(
        (value) =>
          value !== undefined
      )
    );

  const humidity =
    getAverage(
      hourly
        .relative_humidity_2m
    );

  const pressure =
    getAverage(
      hourly.surface_pressure
    );

  const wind =
    getAverage(
      hourly.wind_speed_10m
    );

  return {
    date:
      dateString,

    weather:
      getWeatherLabel(
        weatherCode
      ),

    weather_code:
      weatherCode,

    temperature:
      temperature ??
      null,

    temperature_max:
      daily
        .temperature_2m_max?.[0] ??
      null,

    temperature_min:
      daily
        .temperature_2m_min?.[0] ??
      null,

    humidity,

    pressure,

    wind,

    sunrise:
      formatTime(
        daily.sunrise?.[0]
      ),

    sunset:
      formatTime(
        daily.sunset?.[0]
      ),

    latitude:
      data.latitude,

    longitude:
      data.longitude,

    timezone:
      data.timezone || "",

    source,

    collected_at:
      new Date()
        .toISOString(),

    units: {
      temperature:
        data
          .daily_units
          ?.temperature_2m_mean ||
        "°C",

      humidity:
        data
          .hourly_units
          ?.relative_humidity_2m ||
        "%",

      pressure:
        data
          .hourly_units
          ?.surface_pressure ||
        "hPa",

      wind:
        data
          .hourly_units
          ?.wind_speed_10m ||
        "km/h",
    },
  };
}

export async function getWeatherForDate(
  dateString
) {
  if (!dateString) {
    throw new Error(
      "A date is required to collect weather."
    );
  }

  const {
    latitude,
    longitude,
  } =
    await getCurrentPosition();

  const {
    url,
    source,
  } =
    buildWeatherUrl({
      latitude,
      longitude,
      dateString,
    });

  const response =
    await fetch(url, {
      method: "GET",

      cache: "no-store",
    });

  if (!response.ok) {
    let message =
      "Weather data could not be collected.";

    try {
      const errorData =
        await response.json();

      message =
        errorData.reason ||
        message;
    } catch {
      // JSON 응답이 아니면
      // 기본 오류 메시지를 사용한다.
    }

    throw new Error(
      message
    );
  }

  const data =
    await response.json();

  return parseWeatherResponse(
    data,
    dateString,
    source
  );
}

export async function getCurrentWeather() {
  return getWeatherForDate(
    getDateString()
  );
}
