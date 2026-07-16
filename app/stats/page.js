'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  getHomeState,
  parseWorkHours,
  getLearningHours,
} from '../../lib/utils';
import {
  buildWeeklyRhythmSummary,
  formatDisplayHours,
} from '../../lib/weeklyRhythms';
import { useLanguage } from '../../components/LanguageProvider';

function toValueKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parseMovementHours(value) {
  if (!value) return 0;

  const text = String(value).toLowerCase();

  let total = 0;

  const h = text.match(/(\d+(?:\.\d+)?)\s*h/);
  const m = text.match(/(\d+(?:\.\d+)?)\s*m/);

  if (h) total += Number(h[1]);
  if (m) total += Number(m[1]) / 60;

  if (!h && !m) {
    const n = Number(text);
    if (!Number.isNaN(n)) total = n;
  }

  return total;
}

function translateValue(t, value) {
  const key = `values.${toValueKey(value)}`;
  const translated = t(key);

  return translated === key ? value : translated;
}

function formatWeeklyComparison(summary, locale, t) {
  const delta = Math.abs(summary.differenceHours);
  const deltaText = formatDisplayHours(delta, locale);

  if (summary.trend === 'same') {
    return t('stats.sameAsLastWeek');
  }

  if (locale === 'ko') {
    return summary.trend === 'increased'
      ? `지난주보다 ${deltaText} ${t('stats.increased')}`
      : `지난주보다 ${deltaText} ${t('stats.decreased')}`;
  }

  return summary.trend === 'increased'
    ? `↑ ${deltaText} ${t('stats.comparedWithLastWeek')}`
    : `↓ ${deltaText} ${t('stats.comparedWithLastWeek')}`;
}

function formatWeeklyModeSummary(summary, t) {
  if (!summary?.value) {
    return t('stats.noRecordsThisWeek');
  }

  const countLabel = summary.count === 1 ? t('stats.record') : t('stats.records');

  return `${t('stats.thisWeek')}: ${translateValue(t, summary.value)} · ${summary.count} ${countLabel}`;
}

export default function StatisticsPage() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
  const locale = language?.locale ?? 'en';
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    supabase
      .from('field_logs')
      .select('*')
      .eq('is_public', true)
      .then(({ data }) => setLogs(data || []));
  }, []);

  const h = getHomeState(logs);

  const weekly = useMemo(() => buildWeeklyRhythmSummary(logs), [logs]);

  const making = logs.reduce(
    (sum, log) =>
      sum +
      parseWorkHours(log.work?.time),
    0
  );

  const learning = logs.reduce(
    (sum, log) =>
      sum +
      getLearningHours(log),
    0
  );

  const moving = logs.reduce(
    (sum, log) =>
      sum +
      parseMovementHours(
        log.movement?.time
      ),
    0
  );

  const moods = logs
    .map((l) =>
      Number(l.state?.mood)
    )
    .filter((n) => !Number.isNaN(n));

  const averageMood =
    moods.length
      ? moods.reduce(
          (a, b) => a + b,
          0
        ) / moods.length
      : 0;

  let mindWeather = 'Unknown';

  if (averageMood >= 8)
    mindWeather = 'Clear';

  else if (averageMood >= 6)
    mindWeather = 'Stable';

  else if (averageMood >= 4)
    mindWeather = 'Cloudy';

  else if (averageMood > 0)
    mindWeather = 'Heavy';

  return (
    <section className="grid four">

      <div className="panel">
        <p className="label">
          {t('process.making')}
        </p>

        <div className="big">
          {formatDisplayHours(making, locale)}
        </div>

        <p className="muted">
          {t('stats.hoursThisWeek', { hours: formatDisplayHours(weekly.making.currentHours, locale) })}
        </p>

        <p className="muted">
          {formatWeeklyComparison(weekly.making, locale, t)}
        </p>

        <p className="muted">
          {t('stats.totalPublic')}
        </p>
      </div>

      <div className="panel">
        <p className="label">
          {t('process.learning')}
        </p>

        <div className="big">
          {formatDisplayHours(learning, locale)}
        </div>

        <p className="muted">
          {t('stats.hoursThisWeek', { hours: formatDisplayHours(weekly.learning.currentHours, locale) })}
        </p>

        <p className="muted">
          {formatWeeklyComparison(weekly.learning, locale, t)}
        </p>

        <p className="muted">
          {t('stats.totalPublic')}
        </p>
      </div>

      <div className="panel">
        <p className="label">
          {t('process.moving')}
        </p>

        <div className="big">
          {formatDisplayHours(moving, locale)}
        </div>

        <p className="muted">
          {t('stats.hoursThisWeek', { hours: formatDisplayHours(weekly.moving.currentHours, locale) })}
        </p>

        <p className="muted">
          {formatWeeklyComparison(weekly.moving, locale, t)}
        </p>

        <p className="muted">
          {t('stats.totalPublic')}
        </p>
      </div>

      <div className="panel">
        <p className="label">
          {t('process.bodyWeather')}
        </p>

        <div className="big">
          {translateValue(t, h.bodyWeather)}
        </div>

        <p className="muted">
          {formatWeeklyModeSummary(weekly.bodyWeather, t)}
        </p>
      </div>

      <div className="panel">
        <p className="label">
          {t('process.mindWeather')}
        </p>

        <div className="big">
          {translateValue(t, mindWeather)}
        </div>

        <p className="muted">
          {formatWeeklyModeSummary(weekly.mindWeather, t)}
        </p>
      </div>

      <div className="panel">
        <p className="label">
          {t('process.energyTone')}
        </p>

        <div className="big">
          {translateValue(t, h.energyTone)}
        </div>

        <p className="muted">
          {formatWeeklyModeSummary(weekly.energyTone, t)}
        </p>
      </div>

    </section>
  );
}
