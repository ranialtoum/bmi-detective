import React, { useState, useEffect } from "react";
import { PHASES, STUDENTS, PAIRS, CATEGORIES, DISCUSSION_QUESTIONS, SEQ_STAGES, TEACHER_BADGES, CENTRAL_Q, pairOf } from "./data.js";
import {
  progress, points, autoBadges, responsePool, timerElapsed, phaseAt, phaseStartMs, now, readCode, applyCode,
  toCSV, monitoringRows, exitRows, allResponsesRows, demoState, initialState, displayChecks,
} from "./store.js";
import { Badge, DisplayPreview, ExportButtons, Confirm, useTick, cx } from "./ui.jsx";
import { PHASE_GUIDE } from "./kit.jsx";

const fmt = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

export function TimerControls({ S, up }) {
  useTick(1000);
  const t = S.teacher.timer; const el = timerElapsed(t); const pa = phaseAt(el); const phase = el > 0 ? pa.phase : null; const left = pa.left;
  const start = () => up((n) => { n.teacher.timer = { ...n.teacher.timer, running: true, startedAt: now() }; });
  const pause = () => up((n) => { const x = n.teacher.timer; n.teacher.timer = { running: false, startedAt: null, pausedElapsed: timerElapsed(x) }; });
  const jump = (id) => up((n) => { const run = n.teacher.timer.running; n.teacher.timer = { running: run, startedAt: run ? now() : null, pausedElapsed: phaseStartMs(id) }; });
  return (
    <section className="panel timerpanel">
      <div className="timer-big">
        <div><span className="tiny">Now</span><b>{phase ? `Mission ${phase.n} · ${phase.title}` : el > 0 ? "Lesson complete" : "Not started"}</b></div>
        <div><span className="tiny">Mission time left</span><b className="mono">{phase ? fmt(left) : "–"}</b></div>
        <div><span className="tiny">Lesson elapsed</span><b className="mono">{fmt(el)} / 55:00</b></div>
      </div>
      <div className="phasebar" aria-hidden="true">
        {PHASES.map((p) => { const st = phaseStartMs(p.id), w = p.min * 60000; const f = Math.min(1, Math.max(0, (el - st) / w));
          return <div key={p.id} style={{ flex: p.min }} className={cx("pb", phase && phase.id === p.id && "cur")}><i style={{ width: `${f * 100}%` }} /><span>{p.n}</span></div>; })}
      </div>
      <div className="row wrap">
        {t.running ? <button className="btn" onClick={pause}>Pause</button> : <button className="btn primary" onClick={start}>{el > 0 ? "Resume" : "Start lesson timer"}</button>}
        <span className="tiny">Jump to:</span>
        {PHASES.map((p) => <button key={p.id} className="btn ghost small" onClick={() => jump(p.id)}>M{p.n}</button>)}
        <Confirm text="Reset timer?" onYes={() => up((n) => { n.teacher.timer = { running: false, startedAt: null, pausedElapsed: 0 }; })}>Reset</Confirm>
      </div>
      {phase && <div className="guide-now"><b>Teacher move now:</b> {PHASE_GUIDE[phase.id].now}</div>}
    </section>
  );
}

function Overview({ S, up }) {
  const N = S.teacher.names;
  return (
    <div className="tgrid">
      <TimerControls S={S} up={up} />
      <section className="panel">
        <h2>Mission 1: initial predictions</h2>
        <p className="tiny">All four responses, for your eyes. Do not reveal a preferred interpretation yet. Question: “{CENTRAL_Q}”</p>
        <div className="four">{STUDENTS.map((s) => { const r = S.students[s].m1; return (
          <div key={s} className="pred"><h4>{N[s]}</h4>{r.ts ? <><p><b>{r.choice}</b></p><p>{r.why}</p><p className="tiny">Confidence {r.confidence || "–"}/5</p></> : <p className="muted">Not submitted yet</p>}</div>); })}</div>
      </section>
      <section className="panel">
        <h2>Progress by detective</h2>
        <p className="tiny">Shown in fixed A–D order. No ranking.</p>
        <div className="scroll"><table className="prog">
          <thead><tr><th>Detective</th><th>Pair</th><th>M1</th><th>M2 accurate</th><th>M3 indiv. / pair</th><th>M4 display</th><th>M6</th><th>Points</th><th>Badges</th></tr></thead>
          <tbody>{STUDENTS.map((s) => { const p = progress(S, s); const pt = points(S, s); return (
            <tr key={s}>
              <td><input className="name-in" aria-label={`Name for ${s}`} value={N[s]} onChange={(e) => up((n) => { n.teacher.names[s] = e.target.value; })} /></td>
              <td>{pairOf(s)}</td><td>{p.m1 ? "✓" : "–"}</td><td>{p.m2}/2</td><td>{p.m3i}/{p.m3of} · {p.m3p}/{p.m3of}</td>
              <td>{p.m4}/{p.m4of}{p.improved ? " · revised" : ""}</td><td>{p.m6 ? "✓" : "–"}</td>
              <td title={pt.items.map((i) => `+${i.n} ${i.why}`).join("\n")}>{pt.total}</td>
              <td><div className="badges">{autoBadges(S, s).map((b) => <Badge key={b}>{b}</Badge>)}
                {TEACHER_BADGES.map((b) => { const on = (S.teacher.badges[s] || []).includes(b);
                  return <button key={b} className={cx("chip tiny-chip", on && "on")} aria-pressed={on} onClick={() => up((n) => { const a = n.teacher.badges[s] || []; n.teacher.badges[s] = on ? a.filter((x) => x !== b) : [...a, b]; })}>{b}</button>; })}</div></td>
            </tr>); })}</tbody>
        </table></div>
        <p className="tiny">Use pseudonyms if you prefer. Award teacher badges for reasoning, questioning and collaboration you observe live.</p>
      </section>
    </div>
  );
}

export function ResponseCard({ r, S, up, compact }) {
  const tag = S.teacher.tags[r.key]; const inSeq = S.teacher.sequence.some((x) => x.key === r.key);
  const setTag = (cat) => up((n) => { if (n.teacher.tags[r.key] && n.teacher.tags[r.key].cat === cat) delete n.teacher.tags[r.key]; else n.teacher.tags[r.key] = { ...(n.teacher.tags[r.key] || {}), cat, ts: now() }; });
  return (
    <article className={cx("rcard", inSeq && "sel")}>
      <header><b>{r.title}</b><span className="tiny">{r.whoLabel}</span>{r.demo && <span className="demo-tag">DEMO DATA</span>}</header>
      {r.display && !compact ? <details><summary>Show display</summary><DisplayPreview d={S.pairs[r.display].m4} /></details> : null}
      <pre className="rtext">{r.text}</pre>
      {r.auto && !tag && <p className="tiny sugg">Auto-detected: {r.autoWhy}. Confirm as Category 1 if you agree.</p>}
      <div className="row wrap tagrow">
        <span className="tiny">Tag:</span>
        {[1, 2, 3, 4].map((c) => <button key={c} className={cx("chip tiny-chip", tag && tag.cat === c && "on")} aria-pressed={!!(tag && tag.cat === c)} title={CATEGORIES[c].title} onClick={() => setTag(c)}>Cat {c}</button>)}
        <button className={cx("chip tiny-chip", tag && tag.cat === "U" && "on")} aria-pressed={!!(tag && tag.cat === "U")} onClick={() => setTag("U")}>Unanticipated</button>
        <button className={cx("btn small", inSeq ? "ghost" : "")} onClick={() => up((n) => { const q = n.teacher.sequence; const i = q.findIndex((x) => x.key === r.key); if (i >= 0) q.splice(i, 1); else q.push({ key: r.key, stage: SEQ_STAGES[Math.min(q.length, 2)] }); })}>{inSeq ? "Remove from discussion" : "Select for discussion"}</button>
      </div>
      {tag && <input className="note-in" placeholder="Teacher observation" value={tag.note || ""} onChange={(e) => up((n) => { n.teacher.tags[r.key].note = e.target.value; })} aria-label="Teacher observation" />}
    </article>
  );
}

function Responses({ S, up }) {
  const [m, setM] = useState("all"); const [who, setWho] = useState("all");
  const pool = responsePool(S).filter((r) => (m === "all" || r.mission === m) && (who === "all" || r.by === who));
  return (
    <div>
      <div className="row wrap filters">
        <label className="mini-in">Mission<select value={m} onChange={(e) => setM(e.target.value)}><option value="all">All</option>{PHASES.filter((p) => p.id !== "m5").map((p) => <option key={p.id} value={p.id}>M{p.n} · {p.title}</option>)}</select></label>
        <label className="mini-in">Who<select value={who} onChange={(e) => setWho(e.target.value)}><option value="all">Everyone</option>{STUDENTS.map((s) => <option key={s} value={s}>{S.teacher.names[s]}</option>)}<option value="P1">Pair 1</option><option value="P2">Pair 2</option></select></label>
        <span className="tiny">{pool.length} authentic responses. Only what students actually entered appears here.</span>
      </div>
      {pool.length === 0 ? <p className="empty">No student work on this device yet. Import student codes in the Data tab, or let students work on this device.</p> :
        <div className="cards">{pool.map((r) => <ResponseCard key={r.key} r={r} S={S} up={up} />)}</div>}
    </div>
  );
}

function LinesEditor({ value, onChange, label }) {
  return <label className="field"><span className="flabel">{label}</span><textarea rows={Math.max(2, value.length + 1)} value={value.join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} /><span className="fhint">One per line.</span></label>;
}

function Monitoring({ S, up }) {
  const pool = responsePool(S); const T = S.teacher;
  const [u, setU] = useState({ who: "A", mission: "M3", text: "", note: "" });
  return (
    <div>
      <div className="row wrap"><p className="lead grow">TTLP monitoring tool. Anticipated responses come from the lesson plan; observed responses are only real work you tag during the lesson.</p>
        <ExportButtons filename="ttlp-monitoring.csv" getData={() => toCSV(monitoringRows(S))} label="Export monitoring CSV" /></div>
      {S.demo && <p className="note warn">Demonstration data is loaded. Exports are labelled DEMONSTRATION DATA.</p>}
      {[1, 2, 3, 4].map((c) => {
        const observed = pool.filter((r) => T.tags[r.key] && T.tags[r.key].cat === c);
        const sugg = c === 1 ? pool.filter((r) => r.auto === 1 && !T.tags[r.key]) : [];
        return (
          <section key={c} className={cx("panel cat", `cat${c}`)}>
            <h2>Category {c}: {CATEGORIES[c].title}</h2><p className="muted">{CATEGORIES[c].desc}</p>
            <div className="catgrid">
              <div className="col-ant">
                <h3>Anticipated <span className="tiny">(from plan, editable)</span></h3>
                <LinesEditor label="Anticipated responses" value={T.anticipated[c]} onChange={(v) => up((n) => { n.teacher.anticipated[c] = v; })} />
                <LinesEditor label="Assessing questions" value={T.questions[c].assessing} onChange={(v) => up((n) => { n.teacher.questions[c].assessing = v; })} />
                <LinesEditor label="Advancing questions" value={T.questions[c].advancing} onChange={(v) => up((n) => { n.teacher.questions[c].advancing = v; })} />
              </div>
              <div className="col-obs">
                <h3>Observed in this lesson <span className="count">{observed.length}</span></h3>
                {observed.length ? observed.map((r) => <ResponseCard key={r.key} r={r} S={S} up={up} compact />) : <p className="empty small">Nothing tagged yet. Tag responses in “Student work”.</p>}
                {sugg.length > 0 && <><h4>Auto-detected calculation slips ({sugg.length}), awaiting your confirmation</h4>{sugg.map((r) => <ResponseCard key={r.key} r={r} S={S} up={up} compact />)}</>}
                <label className="field"><span className="flabel">Teacher observations for this category</span><textarea rows={3} value={T.catNotes[c] || ""} onChange={(e) => up((n) => { n.teacher.catNotes[c] = e.target.value; })} /></label>
              </div>
            </div>
          </section>
        );
      })}
      <section className="panel cat catU">
        <h2>Unanticipated responses</h2>
        {pool.filter((r) => T.tags[r.key] && T.tags[r.key].cat === "U").map((r) => <ResponseCard key={r.key} r={r} S={S} up={up} compact />)}
        {T.unanticipated.map((x, i) => (
          <div key={x.ts} className="rcard"><header><b>{x.mission}</b><span className="tiny">{x.who}</span></header><p>{x.text}</p>{x.note && <p className="tiny">Note: {x.note}</p>}
            <button className="btn ghost small" onClick={() => up((n) => { n.teacher.unanticipated.splice(i, 1); })}>Remove</button></div>))}
        <h3>Record something you heard or saw</h3>
        <div className="row wrap">
          <label className="mini-in">Who<select value={u.who} onChange={(e) => setU({ ...u, who: e.target.value })}>{STUDENTS.map((s) => <option key={s} value={s}>{S.teacher.names[s]}</option>)}<option value="Pair 1">Pair 1</option><option value="Pair 2">Pair 2</option></select></label>
          <label className="mini-in">Mission<select value={u.mission} onChange={(e) => setU({ ...u, mission: e.target.value })}>{PHASES.map((p) => <option key={p.id}>M{p.n}</option>)}</select></label>
        </div>
        <label className="field"><span className="flabel">What the student said or did</span><textarea rows={2} value={u.text} onChange={(e) => setU({ ...u, text: e.target.value })} /></label>
        <label className="field"><span className="flabel">Your observation / question you asked</span><input value={u.note} onChange={(e) => setU({ ...u, note: e.target.value })} /></label>
        <button className="btn primary" disabled={!u.text.trim()} onClick={() => { up((n) => { n.teacher.unanticipated.push({ ...u, who: S.teacher.names[u.who] || u.who, ts: now() }); }); setU({ ...u, text: "", note: "" }); }}>Add unanticipated response</button>
      </section>
    </div>
  );
}

function EvidenceRoom({ S, up, present }) {
  const pool = responsePool(S); const T = S.teacher; const byKey = Object.fromEntries(pool.map((r) => [r.key, r]));
  const [cat, setCat] = useState("all"); const [mis, setMis] = useState("all");
  const shown = pool.filter((r) => (cat === "all" || (T.tags[r.key] && String(T.tags[r.key].cat) === cat)) && (mis === "all" || r.mission === mis));
  const move = (i, d) => up((n) => { const q = n.teacher.sequence; const j = i + d; if (j < 0 || j >= q.length) return; [q[i], q[j]] = [q[j], q[i]]; });
  return (
    <div className="evroom">
      <div>
        <h2>Select</h2>
        <p className="muted">Choose two or three contrasting pieces of authentic work.</p>
        <label className="mini-in">Show<select value={cat} onChange={(e) => setCat(e.target.value)}><option value="all">All responses</option>{[1, 2, 3, 4].map((c) => <option key={c} value={String(c)}>Category {c}</option>)}<option value="U">Unanticipated</option></select></label>
        <label className="mini-in">Mission<select value={mis} onChange={(e) => setMis(e.target.value)}><option value="all">All</option>{PHASES.filter((p) => p.id !== "m5").map((p) => <option key={p.id} value={p.id}>M{p.n}</option>)}</select></label>
        <div className="cards narrow pick">{shown.length ? shown.map((r) => <ResponseCard key={r.key} r={r} S={S} up={up} compact />) : <p className="empty">No matching work yet.</p>}</div>
      </div>
      <div>
        <h2>Sequence</h2>
        <p className="muted">Move from mathematical accuracy, to interpretation, to a justified, responsible health message.</p>
        {T.sequence.length > 3 && <p className="note warn">You have {T.sequence.length} items. Two or three usually fit the 13 minutes.</p>}
        <ol className="seq">{T.sequence.map((x, i) => { const r = byKey[x.key]; if (!r) return null; return (
          <li key={x.key}>
            <div className="seq-h"><b>{i + 1}. {r.title}</b><span className="tiny">{r.whoLabel}</span>{r.demo && <span className="demo-tag">DEMO</span>}</div>
            <pre className="rtext short">{r.text}</pre>
            <div className="row wrap">
              <select aria-label="Stage" value={x.stage} onChange={(e) => up((n) => { n.teacher.sequence[i].stage = e.target.value; })}>{SEQ_STAGES.map((s) => <option key={s}>{s}</option>)}</select>
              <button className="btn ghost small" onClick={() => move(i, -1)} aria-label="Move up">↑</button>
              <button className="btn ghost small" onClick={() => move(i, 1)} aria-label="Move down">↓</button>
              <button className="btn small" onClick={() => present(i)}>Show on shared screen</button>
              <button className="btn ghost small" onClick={() => up((n) => { n.teacher.sequence.splice(i, 1); })}>Remove</button>
            </div>
            <input className="note-in" placeholder="Why this piece, at this point?" value={x.note || ""} onChange={(e) => up((n) => { n.teacher.sequence[i].note = e.target.value; })} />
          </li>); })}</ol>
        {!T.sequence.length && <p className="empty">Nothing selected yet.</p>}
        <div className="row wrap">
          <button className="btn primary" disabled={!T.sequence.length} onClick={() => present(0)}>Start presenting</button>
          <label className="check"><input type="checkbox" checked={T.shareAnon} onChange={(e) => up((n) => { n.teacher.shareAnon = e.target.checked; })} /> Hide names on the shared screen</label>
        </div>
        <h2>Connect</h2>
        <ul className="qlist">{DISCUSSION_QUESTIONS.map((q) => <li key={q}>{q}</li>)}</ul>
        <label className="field"><span className="flabel">Connections students made (why a correct calculation is not a complete health conclusion)</span>
          <textarea rows={4} value={T.connections} onChange={(e) => up((n) => { n.teacher.connections = e.target.value; })} /></label>
        <h3>Actual presentation order</h3>
        {T.presented.length ? <ol className="tiny">{T.presented.map((p) => <li key={p.key + p.at}>{(byKey[p.key] || {}).title} · {(byKey[p.key] || {}).whoLabel} · {new Date(p.at).toLocaleTimeString()}</li>)}</ol> : <p className="tiny">Recorded automatically when you show work.</p>}
        {T.presented.length > 0 && <Confirm text="Clear the log?" onYes={() => up((n) => { n.teacher.presented = []; })}>Clear log</Confirm>}
      </div>
    </div>
  );
}

export function PresentOverlay({ S, up, idx, setIdx }) {
  const T = S.teacher; const pool = responsePool(S); const byKey = Object.fromEntries(pool.map((r) => [r.key, r]));
  const item = T.sequence[idx]; const r = item && byKey[item.key];
  const [q, setQ] = useState(0);
  useEffect(() => { if (r) up((n) => { const l = n.teacher.presented; if (!l.some((p) => p.key === r.key)) l.push({ key: r.key, at: now() }); }); }, [idx]); // eslint-disable-line
  useEffect(() => { const h = (e) => { if (e.key === "Escape") setIdx(null); if (e.key === "ArrowRight") setIdx(Math.min(T.sequence.length - 1, idx + 1)); if (e.key === "ArrowLeft") setIdx(Math.max(0, idx - 1)); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); });
  if (!r) return null;
  const label = T.shareAnon ? (r.by.startsWith("P") ? `Pair work ${idx + 1}` : `Student work ${idx + 1}`) : r.whoLabel;
  return (
    <div className="present" role="dialog" aria-label="Shared screen">
      <div className="present-top"><span>{item.stage}</span><span>{idx + 1} / {T.sequence.length}</span><button className="btn ghost" onClick={() => setIdx(null)}>Close (Esc)</button></div>
      <div className="present-body">
        <p className="kicker">{label}{r.demo ? " · demonstration data" : ""}</p>
        <h1>{r.title}</h1>
        {r.display ? <DisplayPreview d={S.pairs[r.display].m4} /> : <pre className="present-text">{r.text}</pre>}
      </div>
      <div className="present-q"><span className="tiny">Discussion question</span><b>{DISCUSSION_QUESTIONS[q]}</b>
        <div className="row wrap">{DISCUSSION_QUESTIONS.map((x, i) => <button key={i} className={cx("chip tiny-chip", q === i && "on")} onClick={() => setQ(i)}>Q{i + 1}</button>)}</div></div>
      <div className="present-nav"><button className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Previous</button><button className="btn primary" disabled={idx >= T.sequence.length - 1} onClick={() => setIdx(idx + 1)}>Next →</button></div>
    </div>
  );
}

function ExitTickets({ S }) {
  const rows = exitRows(S);
  return (
    <div>
      <div className="row wrap"><p className="lead grow">Mission 6: individual exit tickets.</p><ExportButtons filename="exit-tickets.csv" getData={() => toCSV(rows)} label="Export CSV" /></div>
      <div className="scroll"><table className="stack prog"><thead><tr>{rows[0].slice(1).map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.slice(1).map((r, i) => <tr key={i}>{r.slice(1).map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>
      {S.demo && <p className="note warn">Demonstration data loaded.</p>}
    </div>
  );
}

function DataTab({ S, up, setS }) {
  const [codes, setCodes] = useState(""); const [log, setLog] = useState([]);
  const alertish = (m) => setLog([m]);
  const importText = async (text) => {
    const parts = text.split(/\s+(?=BMID1)/).map((x) => x.trim()).filter(Boolean); const out = [];
    for (const p of parts) {
      try { const d = await readCode(p); up((n) => applyCode(n, d)); out.push(`✓ ${S.teacher.names[d.who]}: work from ${new Date(d.at).toLocaleTimeString()} merged${d.demo ? " (demo)" : ""}`); }
      catch (e) { out.push(`✗ ${e.message}`); }
    }
    setLog(out);
  };
  return (
    <div className="tgrid">
      <section className="panel">
        <h2>Import student codes</h2>
        <p className="muted">Students press “Send my work” and paste their code into the lesson chat. Paste one or many codes here. Newer work replaces older work; nothing is duplicated.</p>
        <textarea className="code" rows={5} value={codes} onChange={(e) => setCodes(e.target.value)} placeholder="BMID1Z:…" aria-label="Student codes" />
        <div className="row wrap"><button className="btn primary" disabled={!codes.trim()} onClick={() => { importText(codes); setCodes(""); }}>Import</button>
          <label className="btn ghost">Import files<input type="file" multiple accept=".txt,.json" hidden onChange={async (e) => { let all = ""; for (const f of e.target.files) all += " " + (await f.text()); importText(all); e.target.value = ""; }} /></label></div>
        {log.length > 0 && <ul className="tiny">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>}
      </section>
      <section className="panel">
        <h2>Export evidence</h2>
        <div className="exports">
          <div><b>All student responses</b><ExportButtons filename="all-responses.csv" getData={() => toCSV(allResponsesRows(S))} label="CSV" /></div>
          <div><b>TTLP monitoring tool</b><ExportButtons filename="ttlp-monitoring.csv" getData={() => toCSV(monitoringRows(S))} label="CSV" /></div>
          <div><b>Exit tickets</b><ExportButtons filename="exit-tickets.csv" getData={() => toCSV(exitRows(S))} label="CSV" /></div>
          <div><b>Full backup (restore later)</b><ExportButtons filename="bmi-detective-backup.json" getData={() => JSON.stringify({ kind: "bmi-detective-backup", ...S }, null, 1)} label="JSON" /></div>
        </div>
        <label className="btn ghost">Restore a backup<input type="file" accept=".json" hidden onChange={async (e) => { try { const j = JSON.parse(await e.target.files[0].text()); if (j.kind !== "bmi-detective-backup") throw 0; delete j.kind; setS({ ...initialState(), ...j }); } catch { alertish("Not a BMI Detective backup."); } e.target.value = ""; }} /></label>
      </section>
      <section className="panel">
        <h2>Demonstration and reset</h2>
        <p className="muted">Demo data lets you rehearse with four sample accounts. Every demo item is labelled DEMO DATA on screen and DEMONSTRATION DATA in exports. Never present it as real student work.</p>
        <div className="row wrap">
          <Confirm className="btn" text="Replace everything on this device with demo data?" onYes={() => setS(demoState())}>Load demonstration data</Confirm>
          <Confirm className="btn danger" text="Erase all work on this device?" onYes={() => setS(initialState())}>Start a fresh lesson</Confirm>
        </div>
        <p className="tiny">Status: {S.demo ? "demonstration data present" : "lesson data only"}.</p>
      </section>
    </div>
  );
}

export function TeacherApp({ S, up, setS, tab, setTab, Kit }) {
  const [presentIdx, setPresentIdx] = useState(null);
  const tabs = [["overview", "Overview & timer"], ["work", "Student work"], ["monitor", "TTLP monitoring"], ["evidence", "Evidence Room (M5)"], ["exit", "Exit tickets"], ["data", "Data & export"], ["kit", "Teacher kit"]];
  return (
    <div className="teacher">
      <nav className="ttabs scroll" role="tablist">{tabs.map(([id, l]) => <button key={id} role="tab" aria-selected={tab === id} className={cx("tab", tab === id && "on")} onClick={() => setTab(id)}>{l}</button>)}</nav>
      {tab === "overview" && <Overview S={S} up={up} />}
      {tab === "work" && <Responses S={S} up={up} />}
      {tab === "monitor" && <Monitoring S={S} up={up} />}
      {tab === "evidence" && <EvidenceRoom S={S} up={up} present={setPresentIdx} />}
      {tab === "exit" && <ExitTickets S={S} />}
      {tab === "data" && <DataTab S={S} up={up} setS={setS} />}
      {tab === "kit" && <Kit />}
      {presentIdx !== null && <PresentOverlay S={S} up={up} idx={presentIdx} setIdx={setPresentIdx} />}
    </div>
  );
}
