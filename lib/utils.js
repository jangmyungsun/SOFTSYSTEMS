export function parseWorkHours(text='') {
  const h = String(text||'').match(/(\d+(\.\d+)?)\s*h/i);
  const m = String(text||'').match(/(\d+)\s*m/i);
  return (h ? parseFloat(h[1]) : 0) + (m ? parseInt(m[1],10)/60 : 0);
}
export function parseNumber(text='') {
  const m = String(text||'').match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}
export function isThisMonth(dateText) {
  const d = new Date(dateText), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}
export function isWithinDays(dateText, days) {
  const d = new Date(dateText), n = new Date();
  const diff = (n-d)/(1000*60*60*24);
  return diff >= 0 && diff <= days;
}
export function getLearningHours(log) {
  return (log.learning||[]).reduce((s,x)=>s+parseWorkHours(x),0);
}
export function tone(value,type='energy') {
  if (value == null || Number.isNaN(value)) return 'Unrecorded';
  if (type === 'body') {
    if (value >= 8) return 'Stable';
    if (value >= 6) return 'Softly stable';
    if (value >= 4) return 'Recovering';
    return 'Fragile';
  }
  if (value >= 8) return 'Clear';
  if (value >= 6) return 'Calm';
  if (value >= 4) return 'Low but moving';
  return 'Tired';
}
export function getHomeState(logs) {
  const days = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
  const month = logs.filter(l=>isThisMonth(l.date));
  const week = logs.filter(l=>isWithinDays(l.date,7));
  const making = month.reduce((s,l)=>s+parseWorkHours(l.work?.time),0)/days;
  const learning = month.reduce((s,l)=>s+getLearningHours(l),0)/days;
  const bodyVals = week.map(l=>parseNumber(l.state?.body_state)).filter(v=>v!=null);
  const energyVals = week.map(l=>parseNumber(l.state?.energy)).filter(v=>v!=null);
  const bodyAvg = bodyVals.length ? bodyVals.reduce((a,b)=>a+b,0)/bodyVals.length : null;
  const energyAvg = energyVals.length ? energyVals.reduce((a,b)=>a+b,0)/energyVals.length : null;
  let mode = 'Listening';
  if (energyAvg != null && energyAvg < 4) mode = 'Recovering';
  else if (making >= 3) mode = 'Making';
  else if (learning >= 1.5) mode = 'Learning';
  else if (month.length >= 5) mode = 'Slow but active';
  return {making, learning, bodyWeather:tone(bodyAvg,'body'), energyTone:tone(energyAvg,'energy'), mode};
}
export function collectElements(log) {
  const out=[]; const add=(name,group)=>{ if(!name)return; const v=String(name).trim(); if(v) out.push({name:v,group}); };
  add(log.pace,'mode');
  ['weather','mood','breath','focus','energy','weight','temperature','body_state'].forEach(k=>add(log.state?.[k], k==='weather'?'weather':k==='body_state'?'body':'state'));
  ['breakfast','lunch','dinner','snack','coffee'].forEach(k=>add(log.nourishment?.[k],'food'));
  (log.body||[]).forEach(x=>add(x,'movement'));
  add(log.work?.project,'making');
  (log.work?.items||[]).forEach(x=>add(x,'making'));
  (log.learning||[]).forEach(x=>add(x,'learning'));
  (log.media||[]).forEach(x=>add(x?.name||x?.type,'media'));
  return out;
}
export function buildWeave(logs) {
  const nodes={}, edges={};
  const keyOf=e=>`${e.group}:${e.name}`;
  logs.forEach(log=>{
    const keys=collectElements(log).map(e=>{const k=keyOf(e); nodes[k]=nodes[k]||{key:k,...e,weight:0}; nodes[k].weight++; return k;});
    for(let i=0;i<keys.length;i++) for(let j=i+1;j<keys.length;j++){ const k=[keys[i],keys[j]].sort().join('::'); edges[k]=(edges[k]||0)+1; }
  });
  return {nodes:Object.values(nodes), edges:Object.entries(edges).map(([k,weight])=>{const [source,target]=k.split('::'); return {source,target,weight};}).sort((a,b)=>b.weight-a.weight)};
}
export function getEcosystemPatterns(logs) {
  const patterns=[];
  const avgWork=set=>set.length ? set.reduce((s,l)=>s+parseWorkHours(l.work?.time),0)/set.length : 0;
  ['Walk','Run','Yoga','Stretch','Meditation'].forEach(term=>{
    const yes=logs.filter(l=>(l.body||[]).some(x=>String(x).toLowerCase().includes(term.toLowerCase())));
    const no=logs.filter(l=>!(l.body||[]).some(x=>String(x).toLowerCase().includes(term.toLowerCase())));
    if(yes.length>=2 && avgWork(yes)>avgWork(no)) patterns.push(`${term} appears with longer Making sessions.`);
  });
  const rain=logs.filter(l=>String(l.state?.weather||'').toLowerCase().includes('rain'));
  if(rain.some(l=>JSON.stringify(l.work||{}).toLowerCase().includes('writing'))) patterns.push('Rain appears near Writing.');
  if(logs.some(l=>(l.media||[]).length)) patterns.push('Collected media is beginning to form a visible material layer.');
  if(!patterns.length) patterns.push('More public entries are needed before SOFTSYSTEM can read stable patterns.');
  return patterns;
}
