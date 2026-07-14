"use client";
import { useState } from 'react';
const blank={date:new Date().toISOString().slice(0,10),pace:'Normal',state:{weather:'',temperature:'',weight:'',body_state:'',mood:'',breath:'',energy:'',focus:'',weather_temperature:'',humidity:'',pressure:'',wind:''},nourishment:{breakfast:'',lunch:'',dinner:'',snack:'',water:'',coffee:''},body:[],work:{time:'',project:'',items:[]},learning:[],media:[],observation:'',alignment:'',tomorrow:[],is_public:false};
const toLines=t=>String(t||'').split('\\n').map(x=>x.trim()).filter(Boolean);
const fromLines=a=>(a||[]).join('\\n');
const mediaFromText=t=>toLines(t).map(line=>{const [type='media',...rest]=line.split(':');return {type:type.trim(),name:rest.join(':').trim()||line.trim()};});
const mediaToText=a=>(a||[]).map(x=>`${x.type||'media'}: ${x.name||x.url||''}`).join('\\n');
export default function LogForm({initial,onSubmit}) {
  const [form,setForm]=useState(initial||blank);
  const update=(path,value)=>setForm(prev=>{const next=structuredClone(prev);const keys=path.split('.');let target=next;keys.slice(0,-1).forEach(k=>target=target[k]);target[keys.at(-1)]=value;return next;});
  const submit=e=>{e.preventDefault();onSubmit({...form,body:Array.isArray(form.body)?form.body:toLines(form.body),learning:Array.isArray(form.learning)?form.learning:toLines(form.learning),tomorrow:Array.isArray(form.tomorrow)?form.tomorrow:toLines(form.tomorrow),media:Array.isArray(form.media)?form.media:mediaFromText(form.media),work:{...form.work,items:Array.isArray(form.work.items)?form.work.items:toLines(form.work.items)}});};
  return <form onSubmit={submit}>
    <div className="grid two"><label>Date <input type="date" value={form.date} onChange={e=>update('date',e.target.value)}/></label><label>Current Mode <select value={form.pace} onChange={e=>update('pace',e.target.value)}>{['Recovery','Slow','Normal','Deep Work','Exploration','Listening','Making','Learning'].map(x=><option key={x}>{x}</option>)}</select></label></div>
    <h3>Morning Calibration</h3><div className="grid three">{[['weather','Weather'],['weather_temperature','Weather Temp'],['humidity','Humidity'],['pressure','Pressure'],['wind','Wind'],['temperature','Body Temperature'],['weight','Weight'],['body_state','Body State 1–10'],['mood','Mood'],['breath','Breath'],['energy','Energy 1–10'],['focus','Focus']].map(([k,l])=><label key={k}>{l}<input value={form.state[k]||''} onChange={e=>update(`state.${k}`,e.target.value)}/></label>)}</div>
    <h3>Nourishment</h3><div className="grid three">{['breakfast','lunch','dinner','snack','water','coffee'].map(k=><label key={k}>{k}<input value={form.nourishment[k]||''} onChange={e=>update(`nourishment.${k}`,e.target.value)}/></label>)}</div>
    <h3>Movement</h3><textarea value={Array.isArray(form.body)?fromLines(form.body):form.body} onChange={e=>update('body',e.target.value)}/>
    <h3>Making</h3><div className="grid two"><label>Making Time<input value={form.work.time||''} onChange={e=>update('work.time',e.target.value)}/></label><label>Project<input value={form.work.project||''} onChange={e=>update('work.project',e.target.value)}/></label></div><textarea value={Array.isArray(form.work.items)?fromLines(form.work.items):form.work.items} onChange={e=>update('work.items',e.target.value)}/>
    <h3>Learning</h3><textarea value={Array.isArray(form.learning)?fromLines(form.learning):form.learning} onChange={e=>update('learning',e.target.value)}/>
    <h3>Collected Media</h3><p className="muted">Example: sound: hallway_breath.mp3 / image: window_light.jpg</p><textarea value={Array.isArray(form.media)?mediaToText(form.media):form.media} onChange={e=>update('media',e.target.value)}/>
    <h3>Observation</h3><textarea value={form.observation||''} onChange={e=>update('observation',e.target.value)}/>
    <h3>Alignment</h3><textarea value={form.alignment||''} onChange={e=>update('alignment',e.target.value)}/>
    <h3>Tomorrow</h3><textarea value={Array.isArray(form.tomorrow)?fromLines(form.tomorrow):form.tomorrow} onChange={e=>update('tomorrow',e.target.value)}/>
    <label><input type="checkbox" checked={form.is_public} onChange={e=>update('is_public',e.target.checked)}/> Public</label>
    <div className="actions"><button className="primary" type="submit">Save Entry</button></div>
  </form>;
}
