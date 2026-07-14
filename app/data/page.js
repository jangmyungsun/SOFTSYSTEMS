'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { parseNumber, parseWorkHours, getLearningHours } from '../../lib/utils';

function numericRows(logs) {
  return logs.slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).map((log, index) => ({
    index,
    date: log.date,
    body_temperature: parseNumber(log.state?.temperature),
    weight: parseNumber(log.state?.weight),
    body_state: parseNumber(log.state?.body_state),
    energy: parseNumber(log.state?.energy),
    making_hours: parseWorkHours(log.work?.time),
    learning_hours: getLearningHours(log),
    weather_temperature: parseNumber(log.state?.weather_temperature),
    humidity: parseNumber(log.state?.humidity),
    pressure: parseNumber(log.state?.pressure),
    wind: parseNumber(log.state?.wind),
  }));
}

function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows) {
  const headers = ['index','date','body_temperature','weight','body_state','energy','making_hours','learning_hours','weather_temperature','humidity','pressure','wind'];
  const clean = (value) => value === null || value === undefined ? '' : String(value).replaceAll('"', '""');
  return [headers.join(','), ...rows.map((row) => headers.map((key) => `"${clean(row[key])}"`).join(','))].join('\n');
}

export default function DataPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    supabase.from('field_logs').select('*').eq('is_public', true).order('date', { ascending: true })
      .then(({ data }) => setLogs(data || []));
  }, []);

  const rows = useMemo(() => numericRows(logs), [logs]);

  return (
    <>
      <section className="panel">
        <h2>Data Output</h2>
        <p className="subtitle">Numeric body, weather, making, and learning data for Max/MSP, sound mapping, and visual systems.</p>
        <div className="actions">
          <button className="primary" onClick={() => download('SOFTSYSTEM_numeric_data.csv', toCSV(rows), 'text/csv')}>Export CSV</button>
          <button onClick={() => download('SOFTSYSTEM_numeric_data.json', JSON.stringify(rows, null, 2), 'application/json')}>Export JSON</button>
        </div>
      </section>

      <section className="panel">
        <h2>Mapping Fields</h2>
        <p>body_temperature / weight / body_state / energy</p>
        <p>making_hours / learning_hours</p>
        <p>weather_temperature / humidity / pressure / wind</p>
      </section>

      <section className="panel">
        <h2>Preview</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>{['index','date','body_temperature','weight','body_state','energy','making_hours','learning_hours','weather_temperature','humidity','pressure','wind'].map((key) => <th key={key}>{key}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.date}-${row.index}`}>
                  {Object.values(row).map((value, i) => <td key={i}>{value ?? ''}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <p className="muted">No public numeric data yet.</p>}
      </section>
    </>
  );
}
