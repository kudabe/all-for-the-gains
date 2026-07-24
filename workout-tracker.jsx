import { useState, useEffect, useCallback } from "react";

/* ---------------- data ---------------- */

const EXERCISES = {
  Chest: ["Bench Press", "Incline Bench Press", "Chest Press", "Chest Fly", "Cable Crossover", "Push-Ups", "Dips"],
  Back: ["Lat Pulldown", "Pull-Ups", "Seated Row", "Bent-Over Row", "T-Bar Row", "Deadlift", "Face Pull"],
  Shoulders: ["Overhead Press", "Arnold Press", "Lateral Raise", "Front Raise", "Rear Delt Fly", "Shrugs"],
  Biceps: ["Bicep Curl", "Hammer Curl", "Preacher Curl", "Concentration Curl", "Cable Curl"],
  Triceps: ["Tricep Pushdown", "Overhead Extension", "Skull Crushers", "Close-Grip Bench Press"],
  Legs: ["Squat", "Leg Press", "Lunges", "Romanian Deadlift", "Leg Extension", "Leg Curl", "Adduction", "Abduction", "Hip Thrust", "Glute Kickback", "Calf Raise"],
  Core: ["Plank", "Crunches", "Leg Raises", "Russian Twists", "Cable Crunch", "Ab Wheel Rollout"],
};

const EQUIPMENT = ["Machine", "Dumbbell", "Barbell", "Kettlebell", "Bodyweight", "Free weight", "Cable"];

const CARDIO_TYPES = [
  { id: "treadmill", label: "Treadmill", fields: ["duration", "incline", "speed", "calories", "hr"] },
  { id: "bike", label: "Stationary bike", fields: ["duration", "intensity", "speed", "calories", "hr"] },
  { id: "walk", label: "Outdoor walk", fields: ["duration", "distance", "calories", "hr"] },
  { id: "jog", label: "Outdoor jog", fields: ["duration", "distance", "calories", "hr"] },
];

const FIELD_META = {
  duration: { label: "Duration", unit: "min" },
  incline: { label: "Incline", unit: "level" },
  speed: { label: "Speed", unit: "km/h" },
  intensity: { label: "Intensity", unit: "level" },
  distance: { label: "Distance", unit: "km" },
  calories: { label: "Calories", unit: "kcal" },
  hr: { label: "Avg heart rate", unit: "bpm" },
};

const AFFIRMATIONS = [
  "That's real progress — be proud of yourself.",
  "Stronger than last time. That's the whole game.",
  "Your future self is cheering right now.",
  "Small steps, big gains. Keep going.",
  "Consistency looks good on you.",
  "You showed up, and it's paying off.",
  "Growth isn't luck — you earned this.",
  "The gains are gaining. Beautiful work.",
];

const RANGES = {
  week: { days: 7, label: "Last 7 days" },
  month: { days: 30, label: "Last 30 days" },
  year: { days: 365, label: "Last 12 months" },
};

const PERSON_COLOR = { p1: "#4A76F5", p2: "#F273B4" };
const DEFAULT_PROFILES = { p1: "Iyadh", p2: "Eeman" };
const EMPTY_DAY = { rest: false, entries: [] };

/* ---------------- helpers ---------------- */

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayKey = (user, dateStr) => `day:${user}:${dateStr}`;

function mondayOf(d) {
  const c = new Date(d);
  const shift = (c.getDay() + 6) % 7; // Mon = 0
  c.setDate(c.getDate() - shift);
  c.setHours(0, 0, 0, 0);
  return c;
}
function weekDays(anchor) {
  const start = mondayOf(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
function niceDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const today = ymd(new Date());
  const label = dt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return dateStr === today ? `Today · ${label}` : label;
}
const uid = () => Math.random().toString(36).slice(2, 9);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fmtW = (w) => (w ? `${w}kg` : "bodyweight");

/* ---------------- storage adapter ---------------- */

const CONFIGURED = true;

const memFallback = {};
const store = {
  async get(key) {
    try {
      const r = await window.storage.get(key, true);
      return r ? JSON.parse(r.value) : null;
    } catch {
      return memFallback[key] ?? null;
    }
  },
  async set(key, value) {
    memFallback[key] = value;
    try {
      await window.storage.set(key, JSON.stringify(value), true);
      return true;
    } catch {
      return false;
    }
  },
  async del(key) {
    delete memFallback[key];
    try {
      await window.storage.delete(key, true);
    } catch {}
  },
  async list(prefix) {
    try {
      const r = await window.storage.list(prefix, true);
      const keys = r?.keys || [];
      return keys.map((k) => (typeof k === "string" ? k : k.key)).filter(Boolean);
    } catch {
      return Object.keys(memFallback).filter((k) => k.startsWith(prefix));
    }
  },
  async getMany(prefix) {
    const keys = await this.list(prefix);
    const out = {};
    for (let i = 0; i < keys.length; i += 8) {
      const chunk = keys.slice(i, i + 8);
      await Promise.all(
        chunk.map(async (k) => {
          const v = await this.get(k);
          if (v != null) out[k] = v;
        })
      );
    }
    return out;
  },
};

/* ---------------- end storage adapter ---------------- */

/* ---------------- clip art ---------------- */

function GuysArt() {
  return (
    <div className="art" aria-hidden="true">
      <svg viewBox="0 0 360 84" xmlns="http://www.w3.org/2000/svg">
        <line x1="14" y1="78" x2="346" y2="78" stroke="var(--figGear)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
        <g stroke="var(--figBody)" strokeWidth="7" strokeLinecap="round" fill="none">
          <path d="M56 40 L56 58" strokeWidth="10" />
          <path d="M56 58 L48 76" />
          <path d="M56 58 L64 76" />
          <path d="M56 42 L42 24" />
          <path d="M56 42 L70 24" />
        </g>
        <circle cx="56" cy="30" r="8" fill="var(--figBody)" />
        <line x1="30" y1="21" x2="82" y2="21" stroke="var(--figGear)" strokeWidth="5" strokeLinecap="round" />
        <rect x="27" y="13" width="7" height="16" rx="3" fill="var(--figGear)" />
        <rect x="78" y="13" width="7" height="16" rx="3" fill="var(--figGear)" />
        <g stroke="var(--figBody)" strokeWidth="7" strokeLinecap="round" fill="none">
          <path d="M165 32 L165 56" strokeWidth="10" />
          <path d="M165 56 L157 76" />
          <path d="M165 56 L173 76" />
          <path d="M165 38 L154 50 L152 37" />
          <path d="M165 38 L176 52" />
        </g>
        <circle cx="165" cy="22" r="8" fill="var(--figBody)" />
        <line x1="146" y1="34" x2="158" y2="34" stroke="var(--figGear)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="147" cy="34" r="3.5" fill="var(--figGear)" />
        <circle cx="157" cy="34" r="3.5" fill="var(--figGear)" />
        <line x1="171" y1="55" x2="183" y2="55" stroke="var(--figGear)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="172" cy="55" r="3.5" fill="var(--figGear)" />
        <circle cx="182" cy="55" r="3.5" fill="var(--figGear)" />
        <g stroke="var(--figBody)" strokeWidth="7" strokeLinecap="round" fill="none">
          <path d="M278 29 L268 50" strokeWidth="10" />
          <path d="M268 50 L283 60 L281 76" />
          <path d="M268 50 L254 60 L260 73" />
          <path d="M276 32 L289 40" />
          <path d="M276 32 L262 39" />
        </g>
        <circle cx="281" cy="20" r="8" fill="var(--figBody)" />
        <line x1="240" y1="26" x2="228" y2="26" stroke="var(--figGear)" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        <line x1="246" y1="36" x2="236" y2="36" stroke="var(--figGear)" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      </svg>
    </div>
  );
}

function GirlsArt() {
  return (
    <div className="art" aria-hidden="true">
      <svg viewBox="0 0 360 84" xmlns="http://www.w3.org/2000/svg">
        <line x1="14" y1="78" x2="346" y2="78" stroke="var(--figGear)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
        <g stroke="var(--figBody)" strokeWidth="6" strokeLinecap="round" fill="none">
          <path d="M56 40 L56 57" strokeWidth="9" />
          <path d="M56 57 L48 76" />
          <path d="M56 57 L64 76" />
          <path d="M56 42 L42 24" />
          <path d="M56 42 L70 24" />
        </g>
        <circle cx="56" cy="30" r="7.5" fill="var(--figBody)" />
        <path d="M62 27 Q72 31 69 42" stroke="var(--figBody)" strokeWidth="5" strokeLinecap="round" fill="none" />
        <line x1="30" y1="21" x2="82" y2="21" stroke="var(--figGear)" strokeWidth="5" strokeLinecap="round" />
        <rect x="27" y="13" width="7" height="16" rx="3" fill="var(--figGear)" />
        <rect x="78" y="13" width="7" height="16" rx="3" fill="var(--figGear)" />
        <g stroke="var(--figBody)" strokeWidth="6" strokeLinecap="round" fill="none">
          <path d="M164 35 L162 51" strokeWidth="9" />
          <path d="M162 51 L150 59 L153 75" />
          <path d="M162 51 L171 61 L168 76" />
          <path d="M163 39 L174 44" />
        </g>
        <circle cx="165" cy="26" r="7.5" fill="var(--figBody)" />
        <path d="M158 24 Q149 27 152 38" stroke="var(--figBody)" strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="179" cy="47" r="5" fill="var(--figGear)" />
        <path d="M175 43 Q179 37 183 43" stroke="var(--figGear)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <g stroke="var(--figBody)" strokeWidth="6" strokeLinecap="round" fill="none">
          <path d="M278 30 L268 50" strokeWidth="9" />
          <path d="M268 50 L283 60 L281 76" />
          <path d="M268 50 L254 60 L260 73" />
          <path d="M276 33 L289 41" />
          <path d="M276 33 L262 40" />
        </g>
        <circle cx="281" cy="21" r="7.5" fill="var(--figBody)" />
        <path d="M287 17 Q299 14 297 27" stroke="var(--figBody)" strokeWidth="5" strokeLinecap="round" fill="none" />
        <line x1="240" y1="26" x2="228" y2="26" stroke="var(--figGear)" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        <line x1="246" y1="36" x2="236" y2="36" stroke="var(--figGear)" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      </svg>
    </div>
  );
}

/* ---------------- small pieces ---------------- */

function Chip({ active, color, onClick, children, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip ${active ? "chip-on" : ""} ${small ? "chip-sm" : ""}`}
      style={active && color ? { borderColor: color, color: "#fff", background: color } : undefined}
    >
      {children}
    </button>
  );
}

function Field({ label, unit, value, onChange, autoFocus }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-box">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={value}
          autoFocus={autoFocus}
          placeholder="–"
          onChange={(e) => onChange(e.target.value)}
        />
        <em>{unit}</em>
      </span>
    </label>
  );
}

function Sheet({ title, onClose, children, footer }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- add strength ---------------- */

function AddStrength({ onSave, onClose }) {
  const groups = Object.keys(EXERCISES);
  const [group, setGroup] = useState(groups[0]);
  const [exercise, setExercise] = useState("");
  const [custom, setCustom] = useState("");
  const [equipment, setEquipment] = useState("");
  const [sets, setSets] = useState([{ reps: "", weight: "" }]);
  const [notes, setNotes] = useState("");

  const name = custom.trim() || exercise;
  const validSets = sets.filter((s) => s.reps !== "" && Number(s.reps) > 0);
  const canSave = name && equipment && validSets.length > 0;

  const updateSet = (i, patch) =>
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addSet = () =>
    setSets((prev) => [...prev, { ...(prev[prev.length - 1] || { reps: "", weight: "" }) }]);
  const removeSet = (i) => setSets((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <Sheet
      title="Add exercise"
      onClose={onClose}
      footer={
        <button
          type="button"
          className="primary"
          disabled={!canSave}
          onClick={() =>
            onSave({
              id: uid(),
              kind: "strength",
              group,
              name,
              equipment,
              sets: validSets.map((s) => ({ reps: Number(s.reps), weight: s.weight === "" ? null : Number(s.weight) })),
              notes: notes.trim() || undefined,
            })
          }
        >
          Save exercise
        </button>
      }
    >
      <p className="eyebrow">Muscle group</p>
      <div className="chip-row scroll-x">
        {groups.map((g) => (
          <Chip key={g} active={group === g} onClick={() => { setGroup(g); setExercise(""); }}>
            {g}
          </Chip>
        ))}
      </div>

      <p className="eyebrow">Exercise</p>
      <div className="chip-row wrap">
        {EXERCISES[group].map((ex) => (
          <Chip key={ex} small active={exercise === ex && !custom.trim()} onClick={() => { setExercise(ex); setCustom(""); }}>
            {ex}
          </Chip>
        ))}
      </div>
      <input
        className="text-input"
        placeholder="Or type your own…"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
      />

      <p className="eyebrow">Equipment</p>
      <div className="chip-row wrap">
        {EQUIPMENT.map((eq) => (
          <Chip key={eq} small active={equipment === eq} onClick={() => setEquipment(eq)}>
            {eq}
          </Chip>
        ))}
      </div>

      <p className="eyebrow">Sets</p>
      <div className="sets">
        {sets.map((s, i) => (
          <div className="set-row" key={i}>
            <span className="set-n">{i + 1}</span>
            <span className="field-box">
              <input
                type="number" inputMode="numeric" min="0" placeholder="reps"
                value={s.reps} onChange={(e) => updateSet(i, { reps: e.target.value })}
              />
              <em>reps</em>
            </span>
            <span className="field-box">
              <input
                type="number" inputMode="decimal" min="0" step="any" placeholder="–"
                value={s.weight} onChange={(e) => updateSet(i, { weight: e.target.value })}
              />
              <em>kg</em>
            </span>
            <button type="button" className="icon-btn dim" onClick={() => removeSet(i)} aria-label={`Remove set ${i + 1}`}>✕</button>
          </div>
        ))}
        <button type="button" className="ghost" onClick={addSet}>+ Add set</button>
      </div>

      <p className="eyebrow">Notes</p>
      <input
        className="text-input"
        placeholder="Optional — how did it feel?"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </Sheet>
  );
}

/* ---------------- add cardio ---------------- */

function AddCardio({ onSave, onClose }) {
  const [type, setType] = useState(CARDIO_TYPES[0].id);
  const [stats, setStats] = useState({});
  const [notes, setNotes] = useState("");
  const cfgType = CARDIO_TYPES.find((t) => t.id === type);
  const hasAny = cfgType.fields.some((f) => stats[f] !== undefined && stats[f] !== "");

  return (
    <Sheet
      title="Add cardio"
      onClose={onClose}
      footer={
        <button
          type="button"
          className="primary"
          disabled={!hasAny}
          onClick={() => {
            const clean = {};
            cfgType.fields.forEach((f) => {
              if (stats[f] !== undefined && stats[f] !== "") clean[f] = Number(stats[f]);
            });
            onSave({ id: uid(), kind: "cardio", type: cfgType.id, label: cfgType.label, stats: clean, notes: notes.trim() || undefined });
          }}
        >
          Save session
        </button>
      }
    >
      <p className="eyebrow">Type</p>
      <div className="chip-row wrap">
        {CARDIO_TYPES.map((t) => (
          <Chip key={t.id} active={type === t.id} onClick={() => setType(t.id)}>
            {t.label}
          </Chip>
        ))}
      </div>

      <p className="eyebrow">Details</p>
      <div className="field-grid">
        {cfgType.fields.map((f, i) => (
          <Field
            key={f}
            autoFocus={i === 0}
            label={FIELD_META[f].label}
            unit={FIELD_META[f].unit}
            value={stats[f] ?? ""}
            onChange={(v) => setStats((prev) => ({ ...prev, [f]: v }))}
          />
        ))}
      </div>

      <p className="eyebrow">Notes</p>
      <input
        className="text-input"
        placeholder="Optional — route, mood, anything"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </Sheet>
  );
}

/* ---------------- names ---------------- */

function EditNames({ profiles, onSave, onClose }) {
  const [n1, setN1] = useState(profiles.p1);
  const [n2, setN2] = useState(profiles.p2);
  return (
    <Sheet
      title="Names"
      onClose={onClose}
      footer={
        <button type="button" className="primary" disabled={!n1.trim() || !n2.trim()}
          onClick={() => onSave({ p1: n1.trim(), p2: n2.trim() })}>
          Save names
        </button>
      }
    >
      <p className="eyebrow" style={{ color: PERSON_COLOR.p1 }}>Person one</p>
      <input className="text-input" value={n1} onChange={(e) => setN1(e.target.value)} />
      <p className="eyebrow" style={{ color: PERSON_COLOR.p2 }}>Person two</p>
      <input className="text-input" value={n2} onChange={(e) => setN2(e.target.value)} />
    </Sheet>
  );
}

/* ---------------- entry cards ---------------- */

function EntryCard({ entry, onDelete }) {
  if (entry.kind === "strength") {
    return (
      <div className="card">
        <div className="card-top">
          <span className="eyebrow">{entry.group} · {entry.equipment}</span>
          <button type="button" className="icon-btn dim" onClick={onDelete} aria-label="Delete entry">✕</button>
        </div>
        <h3>{entry.name}</h3>
        <p className="sets-line">
          {entry.sets.map((s, i) => (
            <span key={i}>{s.reps}<em>×</em>{s.weight == null ? "bw" : `${s.weight}kg`}</span>
          ))}
        </p>
        {entry.notes && <p className="note">“{entry.notes}”</p>}
      </div>
    );
  }
  return (
    <div className="card">
      <div className="card-top">
        <span className="eyebrow">Cardio</span>
        <button type="button" className="icon-btn dim" onClick={onDelete} aria-label="Delete entry">✕</button>
      </div>
      <h3>{entry.label}</h3>
      <div className="stat-row">
        {Object.entries(entry.stats).map(([k, v]) => (
          <span className="stat" key={k}>
            <b>{v}</b> {FIELD_META[k].unit} <i>{FIELD_META[k].label.toLowerCase()}</i>
          </span>
        ))}
      </div>
      {entry.notes && <p className="note">“{entry.notes}”</p>}
    </div>
  );
}

/* ---------------- report helpers ---------------- */

function rangeSeries(range, get) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = [];
  if (range === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets.push({ label: d.toLocaleDateString("en-GB", { weekday: "narrow" }), dates: [ymd(d)] });
    }
  } else if (range === "month") {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    for (let b = 0; b < Math.ceil(days.length / 7); b++) {
      const chunk = days.slice(b * 7, (b + 1) * 7);
      buckets.push({ label: `${chunk[0].getDate()}/${chunk[0].getMonth() + 1}`, dates: chunk.map(ymd) });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const m = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const dates = [];
      const dd = new Date(m);
      while (dd.getMonth() === m.getMonth() && dd <= today) {
        dates.push(ymd(dd));
        dd.setDate(dd.getDate() + 1);
      }
      buckets.push({ label: m.toLocaleDateString("en-GB", { month: "narrow" }), dates });
    }
  }
  return buckets.map((b) => {
    let vol = 0, cmin = 0;
    b.dates.forEach((ds) => {
      const day = get(ds);
      if (!day) return;
      day.entries.forEach((e) => {
        if (e.kind === "strength") e.sets.forEach((s) => (vol += s.reps * (s.weight || 0)));
        else cmin += e.stats.duration || 0;
      });
    });
    return { ...b, vol, cmin };
  });
}

function makeSuggestions(daysArr) {
  const sug = [];
  const groupCount = {};
  Object.keys(EXERCISES).forEach((g) => (groupCount[g] = 0));
  const exSessions = {};
  let cardioMin = 0, sessions = 0;
  daysArr.forEach(({ date, day }) => {
    if (day.entries.length) sessions++;
    day.entries.forEach((e) => {
      if (e.kind === "strength") {
        if (groupCount[e.group] != null) groupCount[e.group]++;
        const topW = Math.max(...e.sets.map((s) => s.weight || 0));
        (exSessions[e.name] = exSessions[e.name] || []).push({ date, topW });
      } else {
        cardioMin += e.stats.duration || 0;
      }
    });
  });
  if (!sessions) {
    sug.push("Nothing logged in this period yet — a simple full-body day (Squat, Bench Press, Seated Row) is a great way in.");
    return sug;
  }
  const least = Object.entries(groupCount).sort((a, b) => a[1] - b[1])[0];
  if (least) {
    const [g] = least;
    const exs = EXERCISES[g].slice(0, 2).join(" and ");
    sug.push(`${g} has had the least attention lately — try ${exs} next session.`);
  }
  Object.entries(exSessions).forEach(([exName, arr]) => {
    if (sug.length >= 3) return;
    if (arr.length >= 3) {
      const ws = arr.map((a) => a.topW);
      if (ws[0] > 0 && ws.every((w) => w === ws[0])) {
        const next = Math.round((ws[0] + 2.5) * 10) / 10;
        sug.push(`${exName} has stayed at ${ws[0]}kg for ${arr.length} sessions — try ${next}kg next time.`);
      }
    }
  });
  if (sug.length < 3 && cardioMin < 60) {
    sug.push("Cardio is light this period — even two 20-minute walks together would round it out.");
  }
  return sug.slice(0, 3);
}

function Bars({ data, field }) {
  const max = Math.max(...data.map((d) => d[field]), 1);
  const n = data.length;
  const W = 320, bw = Math.min(30, (W / n) * 0.62);
  return (
    <svg viewBox={`0 0 ${W} 128`} className="bars">
      <text x="2" y="10" fontSize="9" fill="var(--dim)">max {Math.round(max)}</text>
      {data.map((d, i) => {
        const x = (W / n) * i + (W / n - bw) / 2;
        const h = Math.max(Math.round((d[field] / max) * 90), 2);
        return (
          <g key={i}>
            <rect x={x} y={104 - h} width={bw} height={h} rx="4" fill="var(--figBody)" opacity={d[field] > 0 ? 1 : 0.15} />
            <text x={x + bw / 2} y={118} textAnchor="middle" fontSize="9" fill="var(--dim)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function SparkleArt() {
  const star = "M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z";
  return (
    <svg viewBox="0 0 100 30" className="sparkles" aria-hidden="true">
      <path d={star} transform="translate(20,16) scale(0.8)" fill="var(--accent)" />
      <path d={star} transform="translate(50,13) scale(1.2)" fill="var(--figBody)" />
      <path d={star} transform="translate(80,17) scale(0.7)" fill="var(--accent)" />
    </svg>
  );
}

/* ---------------- app ---------------- */

export default function AllForTheGains() {
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES);
  const [user, setUser] = useState("p1");
  const [view, setView] = useState("log");
  const [anchor, setAnchor] = useState(new Date());
  const [dateStr, setDateStr] = useState(ymd(new Date()));
  const [day, setDay] = useState(EMPTY_DAY);
  const [logged, setLogged] = useState(new Set());
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [affirm, setAffirm] = useState(null);
  const [range, setRange] = useState("week");
  const [report, setReport] = useState({ loading: true });

  const refreshDots = useCallback(async () => {
    const keys = await store.list("day:");
    setLogged(new Set(keys));
  }, []);

  const loadDay = useCallback(async (u, dStr) => {
    setLoading(true);
    const data = await store.get(dayKey(u, dStr));
    setDay(data && Array.isArray(data.entries) ? data : EMPTY_DAY);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const p = await store.get("profiles");
      if (p && p.p1 && p.p2) {
        if (p.p1 === "Ziyan") { p.p1 = "Iyadh"; await store.set("profiles", p); }
        setProfiles(p);
      }
      await refreshDots();
      await loadDay("p1", ymd(new Date()));
    })();
  }, [refreshDots, loadDay]);

  useEffect(() => {
    loadDay(user, dateStr);
  }, [user, dateStr, loadDay]);

  /* re-sync when the app comes back to the foreground */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        refreshDots();
        loadDay(user, dateStr);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [user, dateStr, refreshDots, loadDay]);

  useEffect(() => {
    document.body.style.transition = "background-color .35s";
    document.body.style.backgroundColor = user === "p2" ? "#FBE4EE" : "#0B1822";
  }, [user]);

  /* report loader */
  useEffect(() => {
    if (view !== "report") return;
    let alive = true;
    (async () => {
      setReport({ loading: true });
      const all = await store.getMany(`day:${user}:`);
      const prs = (await store.get(`prs:${user}`)) || {};
      if (!alive) return;
      const N = RANGES[range].days;
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (N - 1));
      const inRange = {};
      const daysArr = [];
      Object.entries(all).forEach(([k, v]) => {
        const ds = k.split(":")[2];
        const [y, m, d] = ds.split("-").map(Number);
        if (new Date(y, m - 1, d) >= start) {
          inRange[ds] = v;
          daysArr.push({ date: ds, day: v });
        }
      });
      let sessions = 0, rest = 0, setsN = 0, vol = 0, cSess = 0, cMin = 0, cal = 0, dist = 0;
      daysArr.forEach(({ day: dv }) => {
        if (dv.rest) rest++;
        if (dv.entries.length) sessions++;
        dv.entries.forEach((e) => {
          if (e.kind === "strength") {
            setsN += e.sets.length;
            e.sets.forEach((s) => (vol += s.reps * (s.weight || 0)));
            cal += 0;
          } else {
            cSess++;
            cMin += e.stats.duration || 0;
            cal += e.stats.calories || 0;
            dist += e.stats.distance || 0;
          }
        });
      });
      const buckets = rangeSeries(range, (ds) => inRange[ds]);
      const sugs = makeSuggestions(daysArr);
      const pbs = Object.entries(prs)
        .filter(([k]) => !k.startsWith("cardio:"))
        .map(([exName, v]) => ({ name: exName, ...v }))
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 4);
      setReport({
        loading: false, sessions, rest, setsN,
        vol: Math.round(vol), cSess, cMin: Math.round(cMin),
        cal: Math.round(cal), dist: Math.round(dist * 10) / 10,
        buckets, sugs, pbs,
      });
    })();
    return () => { alive = false; };
  }, [view, range, user]);

  async function saveDay(next) {
    setDay(next);
    const key = dayKey(user, dateStr);
    if (!next.rest && next.entries.length === 0) {
      await store.del(key);
      setLogged((prev) => { const s = new Set(prev); s.delete(key); return s; });
    } else {
      await store.set(key, next);
      setLogged((prev) => new Set(prev).add(key));
    }
  }

  /* personal-best check → affirmation */
  async function checkPR(entry) {
    try {
      const key = `prs:${user}`;
      const prs = (await store.get(key)) || {};
      const firstName = (profiles[user] || "").split(" ")[0];
      if (entry.kind === "strength") {
        const top = entry.sets.reduce((best, s) => {
          const w = s.weight ?? 0;
          if (!best || w > best.weight || (w === best.weight && s.reps > best.reps)) return { weight: w, reps: s.reps };
          return best;
        }, null);
        if (!top) return;
        const prev = prs[entry.name];
        const better = prev && (top.weight > prev.weight || (top.weight === prev.weight && top.reps > prev.reps));
        if (!prev || better) {
          prs[entry.name] = { ...top, date: dateStr };
          await store.set(key, prs);
          if (better) {
            setAffirm({
              title: `New personal best, ${firstName}!`,
              detail: `${entry.name} — ${top.reps}×${fmtW(top.weight)} (previous best ${prev.reps}×${fmtW(prev.weight)})`,
              msg: pick(AFFIRMATIONS),
            });
          }
        }
      } else {
        const k = `cardio:${entry.type}`;
        const prev = prs[k];
        const dur = entry.stats.duration || 0;
        const distV = entry.stats.distance || 0;
        const betterDist = distV > 0 && prev && distV > (prev.distance || 0);
        const betterDur = dur > 0 && prev && dur > (prev.duration || 0) && !(prev.distance > 0 && distV > 0);
        if (!prev || betterDist || betterDur || dur > (prev?.duration || 0) || distV > (prev?.distance || 0)) {
          prs[k] = {
            duration: Math.max(dur, prev?.duration || 0),
            distance: Math.max(distV, prev?.distance || 0),
            date: dateStr,
          };
          await store.set(key, prs);
        }
        if (betterDist) {
          setAffirm({
            title: `New personal best, ${firstName}!`,
            detail: `${entry.label} — ${distV}km (previous best ${prev.distance}km)`,
            msg: pick(AFFIRMATIONS),
          });
        } else if (betterDur) {
          setAffirm({
            title: `New personal best, ${firstName}!`,
            detail: `${entry.label} — ${dur} minutes (previous best ${prev.duration} min)`,
            msg: pick(AFFIRMATIONS),
          });
        }
      }
    } catch {}
  }

  const addEntry = (entry) => {
    saveDay({ ...day, entries: [...day.entries, entry] });
    setSheet(null);
    checkPR(entry);
  };
  const deleteEntry = (id) => saveDay({ ...day, entries: day.entries.filter((e) => e.id !== id) });
  const toggleRest = () => saveDay({ ...day, rest: !day.rest });

  const days = weekDays(anchor);
  const shiftWeek = (n) => setAnchor((prev) => { const d = new Date(prev); d.setDate(d.getDate() + 7 * n); return d; });

  return (
    <div className={`app ${user === "p2" ? "t-pink" : ""}`}>
      <style>{CSS}</style>

      <header>
        <div className="brand">
          <h1>All For the <span>Gains</span></h1>
          <p className="tagline">two of us · one log</p>
        </div>
        <div className="people">
          {["p1", "p2"].map((p) => (
            <Chip key={p} active={user === p} color={PERSON_COLOR[p]} onClick={() => setUser(p)}>
              <i className="dot" style={{ background: user === p ? "#fff" : PERSON_COLOR[p] }} />
              {profiles[p]}
            </Chip>
          ))}
          <button type="button" className="icon-btn dim" onClick={() => setSheet("names")} aria-label="Edit names">✎</button>
        </div>
      </header>

      {!CONFIGURED && (
        <div className="banner">
          Not synced yet — open <b>config.js</b> and paste your Supabase URL and key (see README).
          Until then, entries only live on this device and disappear on refresh.
        </div>
      )}

      {user === "p2" ? <GirlsArt /> : <GuysArt />}

      <div className="tabs">
        <button type="button" className={`tab ${view === "log" ? "tab-on" : ""}`} onClick={() => setView("log")}>Log</button>
        <button type="button" className={`tab ${view === "report" ? "tab-on" : ""}`} onClick={() => setView("report")}>Report</button>
      </div>

      {view === "log" && (
        <>
          <nav className="week">
            <button type="button" className="icon-btn" onClick={() => shiftWeek(-1)} aria-label="Previous week">‹</button>
            <div className="strip">
              {days.map((d) => {
                const s = ymd(d);
                const isSel = s === dateStr;
                const isToday = s === ymd(new Date());
                return (
                  <button
                    type="button"
                    key={s}
                    className={`day ${isSel ? "sel" : ""} ${isToday ? "today" : ""}`}
                    onClick={() => setDateStr(s)}
                  >
                    <span className="dw">{d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2)}</span>
                    <span className="dn">{d.getDate()}</span>
                    <span className="marks">
                      <i style={{ background: logged.has(dayKey("p1", s)) ? PERSON_COLOR.p1 : "transparent" }} />
                      <i style={{ background: logged.has(dayKey("p2", s)) ? PERSON_COLOR.p2 : "transparent" }} />
                    </span>
                  </button>
                );
              })}
            </div>
            <button type="button" className="icon-btn" onClick={() => shiftWeek(1)} aria-label="Next week">›</button>
          </nav>

          <main>
            <div className="day-head">
              <h2>{niceDate(dateStr)}</h2>
              <button type="button" className={`rest ${day.rest ? "rest-on" : ""}`} onClick={toggleRest}>
                {day.rest ? "Rest day ✓" : "Mark rest day"}
              </button>
            </div>

            {loading ? (
              <p className="hint">Loading…</p>
            ) : (
              <>
                {day.rest && (
                  <div className="rest-card">
                    <svg viewBox="0 0 120 20" aria-hidden="true">
                      <path d="M0 12 Q10 4 20 12 T40 12 T60 12 T80 12 T100 12 T120 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <p>Rest day — with possible cuddles.</p>
                  </div>
                )}

                {day.entries.map((e) => (
                  <EntryCard key={e.id} entry={e} onDelete={() => deleteEntry(e.id)} />
                ))}

                {!day.rest && day.entries.length === 0 && (
                  <p className="hint">
                    Nothing logged for {profiles[user]} yet. Add an exercise or a cardio session below — or mark it a rest day.
                  </p>
                )}
              </>
            )}
          </main>

          <div className="add-bar">
            <button type="button" className="primary" onClick={() => setSheet("strength")}>+ Exercise</button>
            <button type="button" className="secondary" onClick={() => setSheet("cardio")}>+ Cardio</button>
          </div>
        </>
      )}

      {view === "report" && (
        <main>
          <div className="chip-row" style={{ marginBottom: 14 }}>
            {Object.entries(RANGES).map(([id, r]) => (
              <Chip key={id} small active={range === id} onClick={() => setRange(id)}>{r.label}</Chip>
            ))}
          </div>

          {report.loading ? (
            <p className="hint">Crunching the numbers…</p>
          ) : (
            <>
              <div className="tiles">
                <div className="tile"><b>{report.sessions}</b><span>sessions</span></div>
                <div className="tile"><b>{report.rest}</b><span>rest days</span></div>
                <div className="tile"><b>{report.setsN}</b><span>sets</span></div>
                <div className="tile"><b>{report.vol.toLocaleString()}</b><span>kg lifted</span></div>
                <div className="tile"><b>{report.cMin}</b><span>cardio min</span></div>
                <div className="tile"><b>{report.cal.toLocaleString()}</b><span>kcal</span></div>
              </div>

              <div className="card">
                <span className="eyebrow">Strength volume · kg lifted</span>
                <Bars data={report.buckets} field="vol" />
              </div>
              <div className="card">
                <span className="eyebrow">Cardio · minutes</span>
                <Bars data={report.buckets} field="cmin" />
              </div>

              {report.pbs.length > 0 && (
                <div className="card">
                  <span className="eyebrow">Personal bests</span>
                  {report.pbs.map((pb) => (
                    <p className="pb-line" key={pb.name}>
                      <b>{pb.name}</b> — {pb.reps}×{fmtW(pb.weight)}
                      <i> {pb.date}</i>
                    </p>
                  ))}
                </div>
              )}

              <div className="card">
                <span className="eyebrow">Suggestions</span>
                {report.sugs.map((s, i) => (
                  <p className="sug-line" key={i}>{s}</p>
                ))}
              </div>
            </>
          )}
        </main>
      )}

      {sheet === "strength" && <AddStrength onSave={addEntry} onClose={() => setSheet(null)} />}
      {sheet === "cardio" && <AddCardio onSave={addEntry} onClose={() => setSheet(null)} />}
      {sheet === "names" && (
        <EditNames
          profiles={profiles}
          onClose={() => setSheet(null)}
          onSave={async (p) => { setProfiles(p); await store.set("profiles", p); setSheet(null); }}
        />
      )}

      {affirm && (
        <div className="overlay affirm-ov" onClick={() => setAffirm(null)}>
          <div className="affirm" onClick={(e) => e.stopPropagation()}>
            <SparkleArt />
            <p className="eyebrow">{affirm.title}</p>
            <h2>{affirm.detail}</h2>
            <p className="affirm-msg">{affirm.msg}</p>
            <button type="button" className="primary" onClick={() => setAffirm(null)}>Keep going</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- styles ---------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600&display=swap');

.app{
  /* dark theme (Iyadh) */
  --bg:#0B1822; --panel:#13293A; --panel2:#0F2130;
  --line:rgba(228,195,137,.16);
  --text:#F2ECDF; --dim:#8CA3AE;
  --accent:#E4C389; --on-accent:#0B1822;
  --overlay:rgba(4,10,15,.72);
  --figBody:#4A76F5; --figGear:#E4C389;
}
.app.t-pink{
  /* pastel theme (Eeman) */
  --bg:#FBE4EE; --panel:#FFF3F8; --panel2:#FFF8FB;
  --line:rgba(216,84,148,.24);
  --text:#43273A; --dim:#A97E96;
  --accent:#D8549A; --on-accent:#FFFFFF;
  --overlay:rgba(80,25,55,.45);
  --figBody:#E36BAC; --figGear:#B23A78;
}
*{box-sizing:border-box; margin:0}
button{font:inherit; cursor:pointer}
input{font:inherit}
:focus-visible{outline:2px solid var(--accent); outline-offset:2px}

.app{
  min-height:100vh; background:var(--bg); color:var(--text);
  font-family:'Outfit',system-ui,sans-serif; font-weight:300;
  max-width:460px; margin:0 auto; padding:20px 16px 96px;
  transition:background-color .35s, color .35s;
}

/* header */
header{display:flex; flex-direction:column; gap:12px; margin-bottom:10px}
.brand h1{font-family:'DM Serif Display',serif; font-weight:400; font-size:31px; line-height:1.05; letter-spacing:.2px}
.brand h1 span{color:var(--accent)}
.tagline{color:var(--dim); font-size:12px; letter-spacing:.22em; text-transform:uppercase; margin-top:6px}
.people{display:flex; gap:8px; align-items:center}
.dot{width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:7px; transition:background-color .2s}

/* sync banner */
.banner{border:1px solid var(--line); background:var(--panel2); color:var(--dim); font-size:13px; border-radius:12px; padding:10px 12px; margin-bottom:12px; line-height:1.5}
.banner b{color:var(--accent); font-weight:500}

/* clip art strip */
.art{margin:0 0 4px}
.art svg{width:100%; height:auto; display:block}

/* tabs */
.tabs{display:flex; gap:18px; margin:2px 2px 14px}
.tab{background:none; border:none; color:var(--dim); font-size:15px; padding:4px 2px; border-bottom:2px solid transparent; letter-spacing:.04em}
.tab-on{color:var(--text); border-bottom-color:var(--accent); font-weight:500}

/* chips */
.chip{
  display:inline-flex; align-items:center; padding:8px 14px; border-radius:999px;
  border:1px solid var(--line); background:transparent; color:var(--text);
  font-weight:400; font-size:14px;
  transition:background-color .2s, color .2s, border-color .2s;
}
.chip-sm{padding:6px 11px; font-size:13px}
.chip-on{background:var(--accent); border-color:var(--accent); color:var(--on-accent); font-weight:500}

/* week tide strip */
.week{display:flex; align-items:center; gap:2px; margin-bottom:20px}
.strip{display:flex; flex:1; justify-content:space-between; border-top:1px solid var(--line); border-bottom:1px solid var(--line); padding:8px 2px}
.day{
  display:flex; flex-direction:column; align-items:center; gap:3px;
  background:none; border:none; color:var(--dim); padding:4px 6px 6px; border-radius:8px;
  border-bottom:2px solid transparent;
}
.day .dw{font-size:10px; letter-spacing:.14em; text-transform:uppercase}
.day .dn{font-family:'DM Serif Display',serif; font-size:18px; color:var(--text)}
.day.today .dn{color:var(--accent)}
.day.sel{border-bottom-color:var(--accent)}
.day.sel .dw{color:var(--accent)}
.marks{display:flex; gap:3px; height:5px}
.marks i{width:5px; height:5px; border-radius:50%}

/* day view */
.day-head{display:flex; justify-content:space-between; align-items:baseline; gap:10px; margin-bottom:14px}
.day-head h2{font-family:'DM Serif Display',serif; font-weight:400; font-size:21px}
.rest{
  background:none; border:1px solid var(--line); color:var(--dim);
  border-radius:999px; padding:6px 12px; font-size:12.5px; white-space:nowrap;
  transition:border-color .2s, color .2s;
}
.rest-on{border-color:var(--accent); color:var(--accent)}
.rest-card{
  border:1px dashed var(--line); border-radius:14px; padding:20px;
  text-align:center; color:var(--accent); margin-bottom:12px;
}
.rest-card svg{width:110px; margin-bottom:8px}
.rest-card p{color:var(--dim); font-size:14px}
.hint{color:var(--dim); font-size:14px; line-height:1.6; padding:18px 4px}

/* cards */
.card{background:var(--panel2); border:1px solid var(--line); border-radius:14px; padding:14px 16px; margin-bottom:10px; transition:background-color .35s, border-color .35s}
.card-top{display:flex; justify-content:space-between; align-items:center; margin-bottom:2px}
.card h3{font-family:'DM Serif Display',serif; font-weight:400; font-size:19px; margin:2px 0 8px}
.eyebrow{font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--accent); font-weight:500}
.sets-line{display:flex; flex-wrap:wrap; gap:6px 14px; font-size:15px}
.sets-line em{font-style:normal; color:var(--dim); padding:0 1px}
.stat-row{display:flex; flex-wrap:wrap; gap:6px 16px}
.stat{font-size:14px}
.stat b{font-family:'DM Serif Display',serif; font-weight:400; font-size:17px}
.stat i{font-style:normal; color:var(--dim); font-size:12px}
.note{color:var(--dim); font-size:13px; font-style:italic; margin-top:8px; line-height:1.5}

/* report */
.tiles{display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:10px}
.tile{background:var(--panel2); border:1px solid var(--line); border-radius:12px; padding:10px 6px; text-align:center}
.tile b{font-family:'DM Serif Display',serif; font-weight:400; font-size:21px; display:block}
.tile span{font-size:10px; color:var(--dim); letter-spacing:.1em; text-transform:uppercase}
.bars{width:100%; height:auto; margin-top:8px; display:block}
.pb-line{font-size:14px; margin-top:8px; line-height:1.5}
.pb-line b{font-weight:500}
.pb-line i{font-style:normal; color:var(--dim); font-size:12px}
.sug-line{font-size:14px; margin-top:8px; line-height:1.6; color:var(--text)}

/* affirmation */
.affirm-ov{align-items:center}
.affirm{
  background:var(--panel); color:var(--text); border-radius:18px; padding:26px 22px;
  text-align:center; max-width:340px; margin:0 20px;
  animation:pop .25s ease-out;
}
@keyframes pop{from{transform:scale(.9); opacity:0} to{transform:none; opacity:1}}
@media (prefers-reduced-motion: reduce){ .affirm{animation:none} }
.sparkles{width:110px; margin:0 auto 8px; display:block}
.affirm h2{font-family:'DM Serif Display',serif; font-weight:400; font-size:20px; margin:8px 0 10px; line-height:1.35}
.affirm-msg{color:var(--dim); font-size:14.5px; line-height:1.6; margin-bottom:16px}
.affirm .primary{width:100%}

/* add bar */
.add-bar{
  position:fixed; bottom:0; left:0; right:0; margin:0 auto; max-width:460px;
  display:flex; gap:10px; padding:12px 16px calc(18px + env(safe-area-inset-bottom));
}
.primary{
  flex:1; background:var(--accent); color:var(--on-accent); border:none; border-radius:12px;
  padding:13px; font-weight:600; font-size:15px;
  transition:background-color .2s, color .2s;
}
.primary:disabled{opacity:.4; cursor:default}
.secondary{
  flex:1; background:var(--bg); color:var(--accent); border:1px solid var(--accent);
  border-radius:12px; padding:13px; font-weight:500; font-size:15px;
  transition:background-color .35s, color .2s;
}
.ghost{background:none; border:1px dashed var(--line); color:var(--dim); border-radius:10px; padding:9px; width:100%}
.icon-btn{background:none; border:none; color:var(--text); font-size:16px; padding:6px 8px; border-radius:8px}
.icon-btn.dim{color:var(--dim); font-size:13px}

/* sheets */
.overlay{position:fixed; inset:0; background:var(--overlay); display:flex; align-items:flex-end; justify-content:center; z-index:20}
.sheet{
  background:var(--panel); color:var(--text); width:100%; max-width:460px; max-height:88vh;
  border-radius:18px 18px 0 0; display:flex; flex-direction:column;
  animation:up .22s ease-out;
}
@keyframes up{from{transform:translateY(24px); opacity:0} to{transform:none; opacity:1}}
@media (prefers-reduced-motion: reduce){ .sheet{animation:none} }
.sheet-head{display:flex; justify-content:space-between; align-items:center; padding:16px 18px 4px}
.sheet-head h2{font-family:'DM Serif Display',serif; font-weight:400; font-size:22px}
.sheet-body{padding:6px 18px 14px; overflow-y:auto}
.sheet-body .eyebrow{display:block; margin:16px 0 8px}
.sheet-foot{padding:10px 18px calc(14px + env(safe-area-inset-bottom)); border-top:1px solid var(--line)}
.chip-row{display:flex; gap:7px}
.chip-row.wrap{flex-wrap:wrap}
.scroll-x{overflow-x:auto; padding-bottom:4px}
.text-input{
  width:100%; margin-top:8px; background:var(--panel2); border:1px solid var(--line);
  color:var(--text); border-radius:10px; padding:11px 12px; font-size:15px;
}
.text-input::placeholder{color:var(--dim)}

/* fields + sets */
.field-grid{display:grid; grid-template-columns:1fr 1fr; gap:10px}
.field{display:flex; flex-direction:column; gap:5px}
.field-label{font-size:12px; color:var(--dim)}
.field-box{
  display:flex; align-items:center; background:var(--panel2);
  border:1px solid var(--line); border-radius:10px; padding:0 10px;
}
.field-box input{
  background:none; border:none; color:var(--text); width:100%; padding:10px 4px;
  font-size:15px; outline:none;
}
.field-box input::placeholder{color:var(--dim)}
.field-box em{font-style:normal; color:var(--dim); font-size:12px; white-space:nowrap}
.sets{display:flex; flex-direction:column; gap:8px}
.set-row{display:grid; grid-template-columns:24px 1fr 1fr 30px; gap:8px; align-items:center}
.set-n{font-family:'DM Serif Display',serif; color:var(--accent); text-align:center; font-size:16px}
`;
