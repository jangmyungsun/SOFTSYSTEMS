export default function EntryCard({ log, admin=false, onEdit, onDelete, onToggle }) {
  return <div className="entry"><div className="entry-head"><div className="entry-date">{log.date}</div><div><span className="pace">{log.pace}</span> <span className="badge">{log.is_public?'public':'private'}</span></div></div><div className="entry-grid">
    <div className="block"><p className="block-title">State</p><p>Weather — {log.state?.weather||''}</p><p>Weather Temp — {log.state?.weather_temperature||''}</p><p>Humidity — {log.state?.humidity||''}</p><p>Pressure — {log.state?.pressure||''}</p><p>Wind — {log.state?.wind||''}</p><p>Body Temp — {log.state?.temperature||''}</p><p>Weight — {log.state?.weight||''}</p><p>Body — {log.state?.body_state||''}</p><p>Mood — {log.state?.mood||''}</p><p>Breath — {log.state?.breath||''}</p><p>Energy — {log.state?.energy||''}</p><p>Focus — {log.state?.focus||''}</p></div>
    <div className="block"><p className="block-title">Nourishment</p><p>Breakfast — {log.nourishment?.breakfast||''}</p><p>Lunch — {log.nourishment?.lunch||''}</p><p>Dinner — {log.nourishment?.dinner||''}</p><p>Snack — {log.nourishment?.snack||''}</p><p>Water — {log.nourishment?.water||''}</p><p>Coffee — {log.nourishment?.coffee||''}</p></div>
    <div className="block"><p className="block-title">Movement</p>{(log.body||[]).map(x=><p key={x}>{x}</p>)}</div>
    <div className="block"><p className="block-title">Making</p><p>{log.work?.time||''}{log.work?.project?` — ${log.work.project}`:''}</p>{(log.work?.items||[]).map(x=><p key={x}>{x}</p>)}</div>
    <div className="block"><p className="block-title">Learning</p>{(log.learning||[]).map(x=><p key={x}>{x}</p>)}</div>
    <div className="block"><p className="block-title">Collected Media</p>{(log.media||[]).map((x,i)=><p key={i}>{x.type||'media'} — {x.name||x.url||''}</p>)}</div>
    <div className="block full"><p className="block-title">Observation</p><p>{log.observation||''}</p></div><div className="block full"><p className="block-title">Alignment</p><p>{log.alignment||''}</p></div>
    {admin && <div className="block full actions"><button onClick={()=>onEdit(log)}>Edit</button><button onClick={()=>onToggle(log)}>{log.is_public?'Make Private':'Make Public'}</button><button onClick={()=>onDelete(log)}>Delete</button></div>}
  </div></div>;
}
