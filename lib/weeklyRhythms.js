import { parseNumber } from "./utils";

function pad(value) {
  return String(value).padStart(2, "0");
}

export function getLocalDateKey(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
}

export function getWeeklyDateRanges(referenceDate = new Date()) {
  const localDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  localDate.setHours(0, 0, 0, 0);

  const dayOffset = (localDate.getDay() + 6) % 7;

  const currentStart = new Date(localDate);
  currentStart.setDate(localDate.getDate() - dayOffset);

  const currentEnd = new Date(localDate);
  const previousStart = new Date(currentStart);
  previousStart.setDate(currentStart.getDate() - 7);

  const previousEnd = new Date(currentStart);
  previousEnd.setDate(currentStart.getDate() - 1);

  return {
    currentStartKey: getLocalDateKey(currentStart),
    currentEndKey: getLocalDateKey(currentEnd),
    previousStartKey: getLocalDateKey(previousStart),
    previousEndKey: getLocalDateKey(previousEnd),
  };
}

function normalizeDurationSource(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .trim()
    .split(/[—–]/, 1)[0]
    .trim();
}

export function parseWeeklyDurationHours(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const text = normalizeDurationSource(value).toLowerCase();

  if (!text) {
    return 0;
  }

  const directNumber = Number(text);

  if (Number.isFinite(directNumber)) {
    return directNumber;
  }

  const colonMatch = text.match(/^(\d+):(\d{1,2})$/);

  if (colonMatch) {
    return Number(colonMatch[1]) + Number(colonMatch[2]) / 60;
  }

  let total = 0;

  for (const match of text.matchAll(
    /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/g
  )) {
    total += Number(match[1]);
  }

  for (const match of text.matchAll(
    /(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)\b/g
  )) {
    total += Number(match[1]) / 60;
  }

  return Number.isFinite(total) ? total : 0;
}

function isWithinRange(dateKey, startKey, endKey) {
  return Boolean(dateKey) && dateKey >= startKey && dateKey <= endKey;
}

function sumDurationHours(logs, selector, isLearningEntry = false) {
  return logs.reduce((sum, log) => {
    const value = selector(log);

    if (Array.isArray(value) && isLearningEntry) {
      return (
        sum +
        value.reduce(
          (entrySum, entry) => entrySum + parseWeeklyDurationHours(entry),
          0
        )
      );
    }

    return sum + parseWeeklyDurationHours(value);
  }, 0);
}

function summarizeDuration(currentLogs, previousLogs, selector, isLearningEntry = false) {
  const currentHours = sumDurationHours(currentLogs, selector, isLearningEntry);
  const previousHours = sumDurationHours(previousLogs, selector, isLearningEntry);
  const differenceHours = currentHours - previousHours;

  let trend = "same";

  if (Math.abs(differenceHours) >= 0.05) {
    trend = differenceHours > 0 ? "increased" : "decreased";
  }

  return {
    currentHours,
    previousHours,
    differenceHours,
    trend,
  };
}

function summarizeMode(currentLogs, selector) {
  const counts = new Map();

  currentLogs.forEach((log, index) => {
    const rawValue = selector(log);
    const value = String(rawValue || "").trim();

    if (!value) {
      return;
    }

    const current = counts.get(value) || {
      value,
      count: 0,
      lastIndex: -1,
    };

    current.count += 1;
    current.lastIndex = index;
    counts.set(value, current);
  });

  let winner = null;

  for (const entry of counts.values()) {
    if (
      !winner ||
      entry.count > winner.count ||
      (entry.count === winner.count && entry.lastIndex > winner.lastIndex)
    ) {
      winner = entry;
    }
  }

  return winner;
}

function derivedBodyWeather(log) {
  const value = parseNumber(log?.state?.body_state);

  if (value >= 8) {
    return "Stable";
  }

  if (value >= 6) {
    return "Softly stable";
  }

  if (value >= 4) {
    return "Recovering";
  }

  if (value > 0) {
    return "Fragile";
  }

  return "";
}

function derivedMindWeather(log) {
  const value = parseNumber(log?.state?.mood);

  if (value >= 8) {
    return "Clear";
  }

  if (value >= 6) {
    return "Stable";
  }

  if (value >= 4) {
    return "Cloudy";
  }

  if (value > 0) {
    return "Heavy";
  }

  return "";
}

function derivedEnergyTone(log) {
  const value = parseNumber(log?.state?.energy);

  if (value >= 8) {
    return "Clear";
  }

  if (value >= 6) {
    return "Calm";
  }

  if (value >= 4) {
    return "Low but moving";
  }

  if (value > 0) {
    return "Tired";
  }

  return "";
}

export function buildWeeklyRhythmSummary(logs, referenceDate = new Date()) {
  const sortedLogs = Array.isArray(logs)
    ? logs
        .slice()
        .sort((first, second) => String(first?.date || "").localeCompare(String(second?.date || "")))
    : [];

  const ranges = getWeeklyDateRanges(referenceDate);

  const currentWeekLogs = sortedLogs.filter((log) => {
    const dateKey = getLocalDateKey(log?.date);
    return isWithinRange(dateKey, ranges.currentStartKey, ranges.currentEndKey);
  });

  const previousWeekLogs = sortedLogs.filter((log) => {
    const dateKey = getLocalDateKey(log?.date);
    return isWithinRange(dateKey, ranges.previousStartKey, ranges.previousEndKey);
  });

  return {
    ranges,
    making: summarizeDuration(currentWeekLogs, previousWeekLogs, (log) => log?.work?.time),
    learning: summarizeDuration(currentWeekLogs, previousWeekLogs, (log) => log?.learning, true),
    moving: summarizeDuration(currentWeekLogs, previousWeekLogs, (log) => log?.movement?.time),
    bodyWeather: summarizeMode(currentWeekLogs, derivedBodyWeather),
    mindWeather: summarizeMode(currentWeekLogs, derivedMindWeather),
    energyTone: summarizeMode(currentWeekLogs, derivedEnergyTone),
  };
}

export function formatDisplayHours(hours, locale) {
  const unit = locale === "ko" ? "시간" : "h";

  return `${Number(hours || 0).toFixed(1)}${unit}`;
}