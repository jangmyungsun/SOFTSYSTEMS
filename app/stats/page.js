'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  getHomeState,
  parseWorkHours,
  getLearningHours,
} from '../../lib/utils';
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

export default function StatisticsPage() {
  const language = useLanguage();
  const t = language?.t ?? ((key) => key);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    supabase
      .from('field_logs')
      .select('*')
      .eq('is_public', true)
      .then(({ data }) => setLogs(data || []));
  }, []);

  const h = getHomeState(logs);

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
          {making.toFixed(1)}h
        </div>

        <p className="muted">
          {t('stats.totalPublic')}
        </p>
      </div>

      <div className="panel">
        <p className="label">
          {t('process.learning')}
        </p>

        <div className="big">
          {learning.toFixed(1)}h
        </div>

        <p className="muted">
          {t('stats.totalPublic')}
        </p>
      </div>

      <div className="panel">
        <p className="label">
          {t('process.moving')}
        </p>

        <div className="big">
          {moving.toFixed(1)}h
        </div>

        <p className="muted">
          {t('stats.totalPublic')}
        </p>
      </div>

      <div className="panel">
        <p className="label">
          {t('process.bodyWeather')}
        </p>

        <div className="big">
          {t(`values.${toValueKey(h.bodyWeather)}`) !== `values.${toValueKey(h.bodyWeather)}`
            ? t(`values.${toValueKey(h.bodyWeather)}`)
            : h.bodyWeather}
        </div>
      </div>

      <div className="panel">
        <p className="label">
          {t('process.mindWeather')}
        </p>

        <div className="big">
          {t(`values.${toValueKey(mindWeather)}`) !== `values.${toValueKey(mindWeather)}`
            ? t(`values.${toValueKey(mindWeather)}`)
            : mindWeather}
        </div>
      </div>

      <div className="panel">
        <p className="label">
          {t('process.energyTone')}
        </p>

        <div className="big">
          {t(`values.${toValueKey(h.energyTone)}`) !== `values.${toValueKey(h.energyTone)}`
            ? t(`values.${toValueKey(h.energyTone)}`)
            : h.energyTone}
        </div>
      </div>

    </section>
  );
}
