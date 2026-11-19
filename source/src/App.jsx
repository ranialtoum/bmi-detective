import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { STUDENTS, PHASES, CENTRAL_Q, DRIVING_TASK, pairOf } from "./data.js";
import { load, save, timerElapsed, phaseAt, now } from "./store.js";
import { useTick, cx } from "./ui.jsx";
import { StudentHub, SendWork, Mission1, Mission2, Mission3, Mission4, Mission5Student, Mission6 } from "./student.jsx";
import { TeacherApp } from "./teacher.jsx";
import { Kit } from "./kit.jsx";

const fmt = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

function parseHash() {
  const h = (location.hash || "").slice(1);
  let m;
  if ((m = h.match(/^teacher(?:-([a-z]+))?$/))) return { mode: "teacher", tab: m[1] || "overview" };
  if ((m = h.match(/^student-([a-d])(?:-(m[1-6]))?$/))) return { mode: "student", me: m[1].toUpperCase(), view: m[2] || "hub" };
  return { mode: "home" };
}
function setHash(r) {
  const h = r.mode === "teacher" ? `teacher-${r.tab}` : r.mode === "student" ? `student-${r.me.toLowerCase()}${r.view !== "hub" ? "-" + r.view : ""}` : "home";
  if (location.hash.slice(1) !== h) { try { history.replaceState(null, "", "#" + h); } catch { location.hash = h; } }
}

function HeaderTimer({ S, up, teacher }) {
  useTick(1000);
  const t = S.teacher.timer; const el = timerElapsed(t); const pa = phaseAt(el); const phase = el > 0 ? pa.phase : null; const left = pa.left;
  return (
    <div className="htimer" aria-label="Lesson timer">
      <svg viewBox="0 0 36 36" className="ring" aria-hidden="true"><circle cx="18" cy="18" r="15" className="ring-bg" /><circle cx="18" cy="18" r="15" className="ring-fg" strokeDasharray={`${Math.min(1, el / 3300000) * 94.2} 94.2`} /></svg>
      <div className="ht-txt">
        <b className="mono">{phase ? fmt(left) : el ? "Done" : "55:00"}</b>
        <span>{phase ? `M${phase.n} · ${phase.title}` : el ? "Lesson complete" : "Timer not started"}</span>
      </div>
      {!teacher && !t.running && !el && <button className="btn ghost small" onClick={() => up((n) => { n.teacher.timer = { running: true, startedAt: now(), pausedElapsed: 0 }; })} title="Start when your teacher starts the lesson">Start</button>}
    </div>
  );
}

function Home({ S, go }) {
  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-copy">
          <p className="kicker">Grade 10 Biology · Qatar curriculum B1014.4 · 55-minute TTLP lesson</p>
          <h1>BMI Detective<span>Beyond the Number</span></h1>
          <p className="q-big">{CENTRAL_Q}</p>
          <p className="task">{DRIVING_TASK}</p>
        </div>
        <HeroArt />
      </section>
      {S.demo && <p className="note warn">This device holds demonstration data. Teachers can start a fresh lesson in Teacher mode → Data & export.</p>}
      <section className="enter">
        <div className="panel">
          <h2>I'm a student detective</h2>
          <p className="muted">Pick the letter your teacher gave you.</p>
          <div className="letters">{STUDENTS.map((s) => (
            <button key={s} className="letter" onClick={() => go({ mode: "student", me: s, view: "hub" })}>
              <b>{s}</b><span>{S.teacher.names[s]}</span><small>Pair {pairOf(s)}</small>
            </button>))}</div>
        </div>
        <div className="panel">
          <h2>I'm the teacher</h2>
          <p className="muted">Timer, live student work, the TTLP monitoring tool, the Evidence Room, exit tickets, exports and the teacher kit.</p>
          <button className="btn primary big" onClick={() => go({ mode: "teacher", tab: "overview" })}>Open teacher dashboard</button>
          <p className="tiny">No login. Work is saved in this browser; students send it to you with a code. Everyone in the game is fictional.</p>
        </div>
      </section>
    </div>
  );
}

// Abstract "evidence board": a magnifier over a scatter of identical numbers with different routine icons.
function HeroArt() {
  const dots = [[40, 60], [120, 40], [200, 80], [70, 150], [160, 170], [240, 140], [110, 230], [220, 230]];
  return (
    <svg className="hero-art" viewBox="0 0 300 300" role="img" aria-label="A magnifying glass over two identical BMI readings with different daily routines">
      <defs><linearGradient id="lens" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset="1" stopColor="#fff" stopOpacity=".35" /></linearGradient></defs>
      <rect x="8" y="8" width="284" height="284" rx="22" className="art-board" />
      {dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" className="art-dot" />)}
      <g transform="translate(34 70)"><rect width="104" height="132" rx="12" className="art-card" /><text x="52" y="40" className="art-n">22.7</text><text x="52" y="58" className="art-u">kg/m²</text>
        <g className="art-ic"><circle cx="28" cy="90" r="9" /><path d="M23 90h10M28 85v10" /><rect x="46" y="81" width="18" height="18" rx="4" /><path d="M72 99l8-16 8 16z" /></g><text x="52" y="122" className="art-u">Maryam</text></g>
      <g transform="translate(160 96)"><rect width="104" height="132" rx="12" className="art-card" /><text x="52" y="40" className="art-n">22.7</text><text x="52" y="58" className="art-u">kg/m²</text>
        <g className="art-ic"><rect x="18" y="82" width="20" height="14" rx="3" /><path d="M28 96v5M22 101h12" /><circle cx="56" cy="90" r="8" /><path d="M56 85v5l3 2" /><path d="M72 84h16v12H72z" /></g><text x="52" y="122" className="art-u">Noor</text></g>
      <g className="art-lens"><circle cx="196" cy="98" r="44" fill="url(#lens)" /><circle cx="196" cy="98" r="44" className="art-rim" /><path d="M228 130l40 40" className="art-handle" /></g>
      <text x="150" y="276" className="art-q">same number · different days</text>
    </svg>
  );
}

function StudentShell({ S, up, r, go }) {
  const me = r.me; const view = r.view;
  const nav = (v) => go({ ...r, view: v });
  const idx = PHASES.findIndex((p) => p.id === view);
  const props = { S, up, me };
  return (
    <div className="student">
      <nav className="snav scroll">
        <button className={cx("tab", view === "hub" && "on")} onClick={() => nav("hub")}>Mission map</button>
        {PHASES.map((p) => <button key={p.id} className={cx("tab", view === p.id && "on")} onClick={() => nav(p.id)}>{p.n}. {p.title}</button>)}
      </nav>
      {view === "hub" && <StudentHub S={S} me={me} go={nav} />}
      {view === "m1" && <Mission1 {...props} />}
      {view === "m2" && <Mission2 {...props} />}
      {view === "m3" && <Mission3 {...props} />}
      {view === "m4" && <Mission4 {...props} />}
      {view === "m5" && <Mission5Student {...props} />}
      {view === "m6" && <Mission6 {...props} />}
      {view !== "hub" && (
        <div className="mfoot">
          {idx > 0 && <button className="btn ghost" onClick={() => nav(PHASES[idx - 1].id)}>← Mission {idx}</button>}
          <button className="btn ghost" onClick={() => nav("hub")}>Mission map</button>
          {idx < PHASES.length - 1 && <button className="btn" onClick={() => nav(PHASES[idx + 1].id)}>Mission {idx + 2} →</button>}
        </div>
      )}
      {view !== "hub" && <SendWork S={S} me={me} />}
    </div>
  );
}

function App() {
  const [S, setS] = useState(load);
  const [r, setR] = useState(parseHash);
  const up = useCallback((fn) => setS((prev) => { const n = structuredClone(prev); fn(n); return n; }), []);
  useEffect(() => { save(S); }, [S]);
  useEffect(() => { const h = () => setR(parseHash()); window.addEventListener("hashchange", h); return () => window.removeEventListener("hashchange", h); }, []);
  const go = (nr) => { setR(nr); setHash(nr); window.scrollTo({ top: 0 }); };
  useEffect(() => { setHash(r); }, []); // eslint-disable-line
  return (
    <>
      <header className="top">
        <button className="brand" onClick={() => go({ mode: "home" })} aria-label="BMI Detective home">
          <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="13" cy="13" r="9" /><path d="M20 20l8 8" /><text x="13" y="17" textAnchor="middle">kg</text></svg>
          <span>BMI Detective</span>
        </button>
        <span className="who">{r.mode === "teacher" ? "Teacher mode" : r.mode === "student" ? `${S.teacher.names[r.me]} · Pair ${pairOf(r.me)}` : ""}</span>
        {S.demo && <span className="demo-tag">DEMO DATA</span>}
        {r.mode !== "home" && <HeaderTimer S={S} up={up} teacher={r.mode === "teacher"} />}
        {r.mode !== "home" && <button className="btn ghost small" onClick={() => go({ mode: "home" })}>Switch mode</button>}
      </header>
      <main className="page">
        {r.mode === "home" && <Home S={S} go={go} />}
        {r.mode === "student" && <StudentShell S={S} up={up} r={r} go={go} />}
        {r.mode === "teacher" && <TeacherApp S={S} up={up} setS={setS} tab={r.tab} setTab={(t) => go({ mode: "teacher", tab: t })} Kit={Kit} />}
      </main>
      <footer className="foot">All profiles are fictional. BMI is a screening measure, not a diagnosis. Adolescent BMI is interpreted with age- and sex-specific BMI-for-age charts.</footer>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
