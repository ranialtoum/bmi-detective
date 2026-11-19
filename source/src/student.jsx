import React, { useState } from "react";
import {
  M1_PAIR, M1_OPTIONS, M2_CASES, M2_FIELDS, UNIT_OPTIONS, CENTRAL_Q, DRIVING_TASK, PHASES, DETECTIVE_QUESTIONS,
  casesForPair, pairOf, partnerOf, otherPair, PAIRS, EXIT_CASE, GLOSSARY, THEMES, DISCUSSION_QUESTIONS,
  diagnoseBMI, bmiHint, heightHint, sqHint, num, bmi, WHO_SOURCE,
} from "./data.js";
import { progress, points, autoBadges, makeCode, readCode, applyCode, displayChecks, cerDone, filled, m2Status, now } from "./store.js";
import { Field, LangCheck, Feedback, Badge, Profile, BMICalculator, ReverseCheck, DisplayPreview, displayHTML, saveFile, copyText, cx } from "./ui.jsx";

// ────────────────────────────── Hub
export function StudentHub({ S, me, go }) {
  const pr = progress(S, me); const pts = points(S, me); const badges = [...autoBadges(S, me), ...(S.teacher.badges[me] || [])];
  const status = {
    m1: pr.m1 ? "Submitted" : "Not started",
    m2: `${pr.m2}/2 cases accurate`,
    m3: `${pr.m3i}/${pr.m3of} individual · ${pr.m3p}/${pr.m3of} pair`,
    m4: `${pr.m4}/${pr.m4of} requirements${pr.improved ? " · revised" : ""}`,
    m5: "Teacher-led",
    m6: pr.m6 ? "Submitted" : "Not started",
  };
  const done = { m1: pr.m1, m2: pr.m2 === 2, m3: pr.m3p === pr.m3of && pr.m3i === pr.m3of, m4: pr.m4 === pr.m4of && pr.improved, m5: false, m6: pr.m6 };
  return (
    <div className="hub">
      <section className="hub-hero">
        <div>
          <p className="kicker">Case brief for {S.teacher.names[me]} · Pair {pairOf(me)} with {S.teacher.names[partnerOf(me)]}</p>
          <h1>{CENTRAL_Q}</h1>
          <p className="task">{DRIVING_TASK}</p>
        </div>
        <div className="hub-score">
          <div className="score-n">{pts.total}</div>
          <div className="score-l">your detective points</div>
          <p className="tiny">Points come from accurate maths, explanations, checking, teamwork and improving after feedback. Never from anyone's BMI.</p>
          <div className="badges">{badges.length ? badges.map((b) => <Badge key={b}>{b}</Badge>) : <span className="tiny">Badges appear as you work.</span>}</div>
        </div>
      </section>
      <ol className="missions">
        {PHASES.map((p) => (
          <li key={p.id}>
            <button className={cx("mcard", done[p.id] && "done")} onClick={() => go(p.id)}>
              <span className="mnum">{p.n}</span>
              <span className="mtitle">{p.title}</span>
              <span className="mstage">{p.stage} · {p.min} min</span>
              <span className="mstatus">{status[p.id]}</span>
            </button>
          </li>
        ))}
      </ol>
      <SendWork S={S} me={me} />
    </div>
  );
}

export function SendWork({ S, me, up }) {
  const [code, setCode] = useState(""); const [msg, setMsg] = useState("");
  return (
    <section className="panel send">
      <h3>Send my work to the teacher</h3>
      <p className="muted">Your work is saved in this browser only. At each checkpoint, make a code and paste it into the lesson chat (or send the file) so your teacher can see it.</p>
      <div className="row wrap">
        <button className="btn primary" onClick={async () => { const c = await makeCode(S, me); setCode(c); setMsg(""); }}>Make my code</button>
        {code && <button className="btn" onClick={async () => setMsg((await copyText(code)) ? "Copied. Paste it in the lesson chat." : "Select the code below and copy it.")}>Copy code</button>}
        {code && <button className="btn ghost" onClick={async () => { const r = await saveFile(`bmi-detective-${me}-${new Date().toISOString().slice(11, 16).replace(":", "")}.txt`, code); setMsg(r === "saved" ? "File saved." : "Use Copy instead."); }}>Save as file</button>}
        {msg && <span className="exp-msg">{msg}</span>}
      </div>
      {code && <textarea className="code" readOnly rows={3} value={code} onFocus={(e) => e.target.select()} aria-label="Your submission code" />}
    </section>
  );
}

function MissionHead({ p, children }) {
  return (
    <header className="mhead">
      <p className="kicker">Mission {p.n} · {p.stage} · {p.min} minutes · {p.grouping}</p>
      <h1>{p.title}</h1>
      {children}
    </header>
  );
}

// ────────────────────────────── Mission 1
export function Mission1({ S, up, me }) {
  const r = S.students[me].m1; const locked = !!r.ts;
  const set = (k, v) => up((n) => { n.students[me].m1[k] = v; });
  return (
    <div>
      <MissionHead p={PHASES[0]}><p className="lead">Two fictional Grade 10 students have almost the same BMI. Read their profiles, then make your own prediction. There is no score for being “right” yet.</p></MissionHead>
      <div className="two">{M1_PAIR.map((p) => <Profile key={p.id} p={p} showBMI />)}</div>
      <p className="tiny">Fictional students. Routines are described, not judged.</p>
      <section className="panel">
        <h2 className="q">{CENTRAL_Q}</h2>
        <fieldset className="choices" disabled={locked}>
          <legend className="sr">Your prediction</legend>
          {M1_OPTIONS.map((o) => (
            <label key={o} className={cx("choice", r.choice === o && "on")}>
              <input type="radio" name="m1" checked={r.choice === o} onChange={() => set("choice", o)} />{o}
            </label>
          ))}
        </fieldset>
        <Field label="Why do you think so?" hint="What makes you think that? What else would you want to know about Maryam and Noor?" value={r.why} onChange={(v) => set("why", v)} disabled={locked} />
        <label className="field"><span className="flabel">How confident are you? {r.confidence ? `${r.confidence}/5` : ""}</span>
          <input type="range" min="1" max="5" value={r.confidence || 3} disabled={locked} onChange={(e) => set("confidence", +e.target.value)} />
        </label>
        {locked ? (
          <div className="fb ok">Prediction locked in at {new Date(r.ts).toLocaleTimeString()}. Your teacher can see it. You will return to this question at the end of the lesson.</div>
        ) : (
          <button className="btn primary" disabled={!r.choice || !filled(r.why)} onClick={() => up((n) => { const x = n.students[me].m1; x.confidence = x.confidence || 3; x.ts = now(); })}>Submit my prediction</button>
        )}
      </section>
    </div>
  );
}

// ────────────────────────────── Mission 2
export function Mission2({ S, up, me }) {
  const [tab, setTab] = useState("c1");
  const anyAttempt = M2_CASES.some((c) => (S.students[me].m2[c.id].attempts || []).length);
  return (
    <div>
      <MissionHead p={PHASES[1]}>
        <p className="lead">Work on your own. Calculate BMI for two fictional teenagers, check your work, and explain what the number does and does not tell us.</p>
        <div className="formula-chip">BMI = mass (kg) ÷ height (m)²</div>
      </MissionHead>
      <div className="tabs" role="tablist">
        {M2_CASES.map((c, i) => {
          const st = m2Status(S.students[me].m2[c.id]);
          return <button key={c.id} role="tab" aria-selected={tab === c.id} className={cx("tab", tab === c.id && "on")} onClick={() => setTab(c.id)}>Case {i + 1}: {c.name} {st.correct ? "✓" : ""}</button>;
        })}
      </div>
      <div className="m2grid">
        <CaseCalc key={tab} S={S} up={up} me={me} c={M2_CASES.find((c) => c.id === tab)} first={tab === "c1"} />
        <aside className="side">
          <div className="panel">
            <h3>BMI calculator</h3>
            {anyAttempt ? <BMICalculator compact /> : <p className="muted">Unlocks after your first BMI attempt, so you can use it to check your own working.</p>}
          </div>
          <div className="panel"><h3>Detective prompts</h3><ul className="qlist">
            <li>Which unit should you use for height?</li><li>Have you squared the height?</li><li>How could you check your calculation?</li><li>What does your numerical result tell you?</li></ul></div>
        </aside>
      </div>
    </div>
  );
}

function CaseCalc({ S, up, me, c, first }) {
  const r = S.students[me].m2[c.id];
  const [fb, setFb] = useState({});
  const set = (k, v) => up((n) => { n.students[me].m2[c.id][k] = v; n.students[me].m2[c.id].ts = now(); });
  const fields = r.fields || [];
  const toggle = (id) => set("fields", fields.includes(id) ? fields.filter((x) => x !== id) : [...fields, id]);
  const last = (r.attempts || []).at(-1);
  const solved = last && last.ok;

  const checkFields = () => {
    const ok = fields.includes("mass") && fields.includes("height") && !fields.includes("context");
    let text = ok ? "Yes: the formula needs only mass and height." : "Look at the formula again. Which two measurements does it use?";
    if (ok && (fields.includes("age") || fields.includes("sex"))) text += " Age and sex are not in the formula, but keep them in mind: you will need them to interpret a teenager's BMI.";
    else if (ok) text += " Keep age and sex in mind for later: you will need them to interpret a teenager's BMI.";
    setFb((f) => ({ ...f, fields: { ok, text } }));
  };
  const checkH = () => { const v = num(r.hM); const ok = Math.abs(v - c.m) < 0.006; setFb((f) => ({ ...f, h: { ok, text: ok ? "Height is in metres." : heightHint(v, c.m) } })); };
  const checkSq = () => { const v = num(r.hSq); const ok = Math.abs(v - c.m * c.m) / (c.m * c.m) < 0.01; setFb((f) => ({ ...f, sq: { ok, text: ok ? "Height² is correct." : sqHint(v, c.m) } })); };
  const submit = () => {
    const v = num(r.bmiInput); const d = diagnoseBMI(v, c.kg, c.m);
    const n = (r.attempts || []).length + 1;
    up((s) => { const x = s.students[me].m2[c.id]; x.attempts = [...(x.attempts || []), { value: r.bmiInput, ok: d.ok, code: d.code, cat1: !!d.cat1, ts: now() }]; x.ts = now(); });
    setFb((f) => ({ ...f, bmi: { ok: d.ok, text: d.ok ? "Accurate. Now add the unit, check your working and explain your result." : `Attempt ${n}: ${bmiHint(d.code, n)}` } }));
  };
  const unitFb = r.unit ? (r.unit === "kg/m²" ? { ok: true, text: "Correct unit." } : { ok: false, text: "Look at the formula: kilograms divided by metres squared." }) : null;

  return (
    <section className="panel case">
      <div className="case-top">
        <Profile p={c} />
        <div className="steps-key"><p className="tiny">Fictional profile. Complete the steps in order. Hints appear if something needs another look; answers are never given away.</p></div>
      </div>
      <ol className="steps">
        <li>
          <span className="step-t">Which information do you need for the calculation?</span>
          <div className="chips">{M2_FIELDS.map((f) => <button key={f.id} className={cx("chip", fields.includes(f.id) && "on")} aria-pressed={fields.includes(f.id)} onClick={() => toggle(f.id)}>{f.label}</button>)}</div>
          <button className="btn small" onClick={checkFields} disabled={!fields.length}>Check</button><Feedback fb={fb.fields} />
        </li>
        <li>
          <span className="step-t">{c.givenInCm ? "Convert the height to metres" : `Height is given as ${c.heightLabel}. Write it in metres`}</span>
          <div className="row"><input inputMode="decimal" aria-label="Height in metres" value={r.hM || ""} onChange={(e) => set("hM", e.target.value)} placeholder="m" /><span className="unit">m</span><button className="btn small" onClick={checkH} disabled={!r.hM}>Check</button></div>
          <Feedback fb={fb.h} />
        </li>
        <li>
          <span className="step-t">Square the height (height × height)</span>
          <div className="row"><input inputMode="decimal" aria-label="Height squared" value={r.hSq || ""} onChange={(e) => set("hSq", e.target.value)} placeholder="m²" /><span className="unit">m²</span><button className="btn small" onClick={checkSq} disabled={!r.hSq}>Check</button></div>
          <Feedback fb={fb.sq} />
        </li>
        <li>
          <span className="step-t">Calculate BMI (1 decimal place)</span>
          <div className="row"><input inputMode="decimal" aria-label="BMI" value={r.bmiInput || ""} onChange={(e) => set("bmiInput", e.target.value)} disabled={solved} /><button className="btn primary small" onClick={submit} disabled={!r.bmiInput || solved}>Submit BMI</button></div>
          <Feedback fb={fb.bmi || (solved ? { ok: true, text: "Accurate." } : null)} />
          {(r.attempts || []).length > 0 && <p className="tiny">Attempts: {r.attempts.map((a) => a.value + (a.ok ? " ✓" : "")).join(" → ")}</p>}
        </li>
        <li>
          <span className="step-t">Which unit goes with your answer?</span>
          <select value={r.unit || ""} onChange={(e) => set("unit", e.target.value)} aria-label="Unit"><option value="">Choose…</option>{UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}</select>
          <Feedback fb={unitFb} />
        </li>
        {first && (
          <li><Field label="Why must height be squared in the formula?" hint="Think about how body size changes as people get taller." value={r.whySquared} onChange={(v) => set("whySquared", v)} /></li>
        )}
        <li>
          <Field label="How did you check your calculation?" value={r.check} onChange={(v) => set("check", v)} rows={2} />
          {(r.attempts || []).length > 0 && <ReverseCheck />}
        </li>
        <li><Field label="What does your numerical result tell you, and what can it not tell you?" value={r.meaning} onChange={(v) => set("meaning", v)} /><LangCheck text={r.meaning} /></li>
      </ol>
    </section>
  );
}

// ────────────────────────────── Mission 3
export function Mission3({ S, up, me }) {
  const pid = pairOf(me); const cases = casesForPair(pid);
  const [tab, setTab] = useState(cases[0].id);
  const c = cases.find((x) => x.id === tab);
  return (
    <div>
      <MissionHead p={PHASES[2]}>
        <p className="lead">Pair {pid}: {PAIRS[pid].map((x) => S.teacher.names[x]).join(" & ")}. First, answer on your own. Then compare with your partner, and agree a pair CER.</p>
      </MissionHead>
      <div className="tabs" role="tablist">
        {cases.map((x) => <button key={x.id} role="tab" aria-selected={tab === x.id} className={cx("tab", tab === x.id && "on")} onClick={() => setTab(x.id)}>Case File {x.id}: {x.title} {cerDone(S.pairs[pid].m3[x.id]) ? "✓" : ""}</button>)}
      </div>
      <div className="m2grid">
        <CaseFile key={c.id} S={S} up={up} me={me} c={c} />
        <aside className="side">
          <div className="panel"><h3>Questions to ask each other</h3><ul className="qlist">{DETECTIVE_QUESTIONS.map((q) => <li key={q}>{q}</li>)}</ul></div>
          <div className="panel"><h3>CER guide</h3>
            <p><b>Claim:</b> What can we reasonably conclude?</p>
            <p><b>Evidence:</b> Which numbers and case details support it?</p>
            <p><b>Reasoning:</b> Why does the evidence support the claim, and what are its limits?</p></div>
          <div className="panel"><h3>Calculator</h3><BMICalculator compact /></div>
        </aside>
      </div>
    </div>
  );
}

function CaseFile({ S, up, me, c }) {
  const pid = pairOf(me); const mate = partnerOf(me);
  const mine = S.students[me].m3[c.id] || {}; const theirs = S.students[mate].m3[c.id] || {};
  const pair = S.pairs[pid].m3[c.id] || {};
  const [fb, setFb] = useState(null);
  const [imp, setImp] = useState(""); const [impMsg, setImpMsg] = useState("");
  const setMine = (k, v) => up((n) => { n.students[me].m3[c.id] = { ...(n.students[me].m3[c.id] || {}), [k]: v, ts: now() }; });
  const setPair = (k, v) => up((n) => { n.pairs[pid].m3[c.id] = { ...(n.pairs[pid].m3[c.id] || {}), [k]: v, ts: now(), by: me }; });
  const submitted = !!mine.submitted;
  const partnerHere = !!theirs.submitted;
  const canPair = submitted && (partnerHere || mine.partnerConfirmed);
  const checkCalc = () => { const d = diagnoseBMI(num(mine.calcValue), c.check.kg, c.check.m); setFb({ ok: d.ok, text: d.ok ? "Your calculation is accurate." : bmiHint(d.code, 1) }); };
  return (
    <section className="panel case">
      {c.optional && <p className="note">Extension case: complete only if your pair finishes early.</p>}
      <p className="lead">{c.brief}</p>
      {c.quote && <blockquote className="claim-quote">{c.quote}<span className="tiny"> (fictional)</span></blockquote>}
      <div className="two">{c.people.map((p) => <Profile key={p.id} p={p} />)}</div>

      <h3 className="stepH"><span>1</span> On your own</h3>
      <div className="row wrap">
        <label className="field grow"><span className="flabel">{c.check.label}</span>
          <span className="row"><input inputMode="decimal" value={mine.calcValue || ""} onChange={(e) => setMine("calcValue", e.target.value)} aria-label="BMI value" disabled={submitted} /><span className="unit">kg/m²</span><button className="btn small" onClick={checkCalc} disabled={!mine.calcValue}>Check</button></span></label>
      </div>
      <Feedback fb={fb} />
      <Field label="How did you calculate it?" value={mine.calc} onChange={(v) => setMine("calc", v)} rows={1} disabled={submitted} />
      <p className="flabel">{c.prompt}</p>
      <div className="three">
        <Field label="What do we know?" value={mine.know} onChange={(v) => setMine("know", v)} disabled={submitted} />
        <Field label="What don't we know?" value={mine.dontKnow} onChange={(v) => setMine("dontKnow", v)} disabled={submitted} />
        <Field label="What extra evidence would we need?" value={mine.need} onChange={(v) => setMine("need", v)} disabled={submitted} />
      </div>
      <CER r={mine} set={setMine} disabled={submitted} />
      {!submitted ? (
        <button className="btn primary" disabled={!cerDone(mine)} onClick={() => setMine("submitted", true)}>Submit my individual response</button>
      ) : <div className="fb ok">Individual response submitted. It stays as your own evidence; you can now compare.</div>}

      <h3 className="stepH"><span>2</span> Compare with {S.teacher.names[mate]}</h3>
      {!submitted ? <p className="muted">Submit your own response first, so both voices count before you compare.</p> : (
        <>
          {partnerHere ? (
            <div className="compare">
              <div><h4>{S.teacher.names[me]} (you)</h4><Mini r={mine} /></div>
              <div><h4>{S.teacher.names[mate]}</h4><Mini r={theirs} /></div>
            </div>
          ) : (
            <div className="note">
              <p>{S.teacher.names[mate]}'s response isn't on this device. Read your responses aloud to each other in your breakout room, or paste her code here to see it side by side.</p>
              <div className="row wrap"><input className="grow" value={imp} onChange={(e) => setImp(e.target.value)} placeholder="Paste partner's code" aria-label="Partner code" />
                <button className="btn small" disabled={!imp} onClick={async () => { try { const p = await readCode(imp); if (p.who !== mate) throw new Error(`That code belongs to ${S.teacher.names[p.who]}.`); up((n) => applyCode(n, p)); setImpMsg("Loaded."); setImp(""); } catch (e) { setImpMsg(e.message); } }}>Load</button>{impMsg && <span className="exp-msg">{impMsg}</span>}</div>
              <label className="check"><input type="checkbox" checked={!!mine.partnerConfirmed} onChange={(e) => setMine("partnerConfirmed", e.target.checked)} /> My partner has submitted her own response on her device, and we have compared.</label>
            </div>
          )}
          <Field label="Where do you agree? Where do you disagree?" value={mine.compareNote} onChange={(v) => setMine("compareNote", v)} rows={2} />
        </>
      )}

      <h3 className="stepH"><span>3</span> Pair agreement</h3>
      {!canPair ? <p className="muted">Unlocks after you have both answered individually and compared.</p> : (
        <>
          <CER r={pair} set={setPair} pairMode />
          <Field label="What changed in our thinking after comparing?" value={pair.changed} onChange={(v) => setPair("changed", v)} rows={2} />
          <LangCheck text={`${pair.claim || ""} ${pair.reasoning || ""}`} />
          {cerDone(pair) && <div className="fb ok">Pair CER saved. Either partner can still improve it.</div>}
        </>
      )}
    </section>
  );
}

function CER({ r, set, disabled, pairMode }) {
  return (
    <div className="cer">
      <Field label={pairMode ? "CLAIM: what can we reasonably conclude together?" : "CLAIM: what can we reasonably conclude?"} value={r.claim} onChange={(v) => set("claim", v)} rows={2} disabled={disabled} />
      <Field label="EVIDENCE: which numbers and case details support the claim?" value={r.evidence} onChange={(v) => set("evidence", v)} rows={2} disabled={disabled} />
      <Field label="REASONING: why does this evidence support the claim, and what are its limits?" value={r.reasoning} onChange={(v) => set("reasoning", v)} rows={3} disabled={disabled} />
    </div>
  );
}
function Mini({ r }) {
  return <dl className="mini">{[["BMI", r.calcValue], ["Know", r.know], ["Don't know", r.dontKnow], ["Need", r.need], ["Claim", r.claim], ["Evidence", r.evidence], ["Reasoning", r.reasoning]].map(([k, v]) => v ? <div key={k}><dt>{k}</dt><dd>{v}</dd></div> : null)}</dl>;
}

// ────────────────────────────── Mission 4
export function Mission4({ S, up, me }) {
  const pid = pairOf(me); const d = S.pairs[pid].m4; const op = otherPair(pid); const od = S.pairs[op].m4;
  const set = (k, v) => up((n) => { n.pairs[pid].m4[k] = v; n.pairs[pid].m4.ts = now(); n.pairs[pid].m4.by = me; });
  const checks = displayChecks(d);
  const label = `Pair ${pid}`;
  const [msg, setMsg] = useState("");
  const [fbDraft, setFbDraft] = useState({});
  const given = (od.feedback || []).filter((f) => f.from === pid);
  const exFb = (() => { const kg = num(d.exKg), m = num(d.exM), r = num(d.exResult); if (!d.exResult) return null; const x = diagnoseBMI(r, kg, m); return { ok: x.ok, text: x.ok ? "Worked example is correct." : bmiHint(x.code, 1) }; })();
  return (
    <div>
      <MissionHead p={PHASES[3]}><p className="lead">{label}: design a short bilingual display for students and families. Write your own wording: the tool checks the maths and the requirements, not your ideas.</p></MissionHead>
      <div className="designer">
        <div className="editor">
          <section className="panel">
            <h3>1 · Title</h3>
            <div className="two"><Field rows={1} label="English" value={d.titleEn} onChange={(v) => set("titleEn", v)} /><Field rows={1} dir="rtl" label="العربية" value={d.titleAr} onChange={(v) => set("titleAr", v)} /></div>
            <h3>2 · Formula</h3>
            <label className="check"><input type="checkbox" checked={!!d.showFormula} onChange={(e) => set("showFormula", e.target.checked)} /> Show the BMI formula in English and Arabic</label>
            <h3>3 · Worked example (fictional teenager)</h3>
            <div className="row wrap">
              <label className="mini-in">Mass (kg)<input inputMode="decimal" value={d.exKg || ""} onChange={(e) => set("exKg", e.target.value)} /></label>
              <label className="mini-in">Height (m)<input inputMode="decimal" value={d.exM || ""} onChange={(e) => set("exM", e.target.value)} /></label>
              <label className="mini-in">Your BMI result<input inputMode="decimal" value={d.exResult || ""} onChange={(e) => set("exResult", e.target.value)} /></label>
            </div>
            <Feedback fb={exFb} />
            <h3>4 · Screening, not diagnosis</h3>
            <div className="two"><Field label="English" value={d.screenEn} onChange={(v) => set("screenEn", v)} rows={2} /><Field dir="rtl" label="العربية" value={d.screenAr} onChange={(v) => set("screenAr", v)} rows={2} /></div>
            <h3>5 · Caution for adolescents</h3>
            <p className="tiny">Science note: {WHO_SOURCE.text} <a href={WHO_SOURCE.url} target="_blank" rel="noreferrer">WHO source</a></p>
            <div className="two"><Field label="English" value={d.teenEn} onChange={(v) => set("teenEn", v)} rows={2} /><Field dir="rtl" label="العربية" value={d.teenAr} onChange={(v) => set("teenAr", v)} rows={2} /></div>
            <h3>6 · Respectful message on eating and activity</h3>
            <div className="two"><Field label="English" value={d.msgEn} onChange={(v) => set("msgEn", v)} rows={2} /><Field dir="rtl" label="العربية" value={d.msgAr} onChange={(v) => set("msgAr", v)} rows={2} /></div>
            <LangCheck text={`${d.msgEn || ""} ${d.msgAr || ""} ${d.screenEn || ""} ${d.teenEn || ""}`} />
            <h3>7 · Bilingual key terms (choose at least 3)</h3>
            <div className="chips">{GLOSSARY.map(([en, ar], i) => {
              const on = (d.glossary || []).includes(i);
              return <button key={i} className={cx("chip", on && "on")} aria-pressed={on} onClick={() => set("glossary", on ? d.glossary.filter((x) => x !== i) : [...(d.glossary || []), i])}>{en} · <span dir="rtl">{ar}</span></button>;
            })}</div>
            <h3>8 · Design choices</h3>
            <div className="row wrap">
              <label className="mini-in">Colour<select value={d.theme} onChange={(e) => set("theme", e.target.value)}>{Object.entries(THEMES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}</select></label>
              <label className="mini-in">Layout<select value={d.layout} onChange={(e) => set("layout", e.target.value)}><option value="split">Side by side</option><option value="stacked">Stacked</option></select></label>
              <label className="mini-in">Text size<select value={d.size || "normal"} onChange={(e) => set("size", e.target.value)}><option value="normal">Normal</option><option value="large">Large (easier to read)</option></select></label>
            </div>
            <Field label="Why did you make these choices? Use evidence from your investigation." value={d.justify} onChange={(v) => set("justify", v)} rows={3} />
          </section>
        </div>
        <div className="preview-col">
          <div className="sticky">
            <ul className="checklist">{checks.map((c) => <li key={c.id} className={c.ok ? "ok" : ""}>{c.ok ? "✓" : "○"} {c.label}</li>)}</ul>
            <DisplayPreview d={d} pairLabel={label} />
            <div className="row wrap" style={{ marginTop: 10 }}>
              <button className="btn" onClick={async () => { const r = await saveFile(`bmi-display-pair${pid}.html`, displayHTML(d, label)); setMsg(r === "saved" ? "Saved. Open the file and print it from your browser." : "Download unavailable here: use Copy HTML."); }}>Download printable page ⤓</button>
              <button className="btn ghost" onClick={async () => setMsg((await copyText(displayHTML(d, label))) ? "HTML copied" : "Copy failed")}>Copy HTML</button>
              <button className="btn ghost" onClick={() => { try { window.print(); } catch { setMsg("Printing is blocked in this view. Download the page instead."); } }}>Print</button>
              {msg && <span className="exp-msg">{msg}</span>}
            </div>
          </div>
        </div>
      </div>

      <section className="panel">
        <h2>Peer feedback and revision</h2>
        <div className="two">
          <div>
            <h3>Give feedback to Pair {op}</h3>
            {od.ts ? <details><summary>See Pair {op}'s display (on this device)</summary><DisplayPreview d={od} pairLabel={`Pair ${op}`} /></details>
              : <p className="muted">Pair {op}'s display isn't on this device. Ask them to share their screen.</p>}
            <Field label="One strength (with evidence)" value={fbDraft.strength} onChange={(v) => setFbDraft({ ...fbDraft, strength: v })} rows={2} />
            <Field label="One suggestion to make it more accurate or more respectful" value={fbDraft.suggestion} onChange={(v) => setFbDraft({ ...fbDraft, suggestion: v })} rows={2} />
            <button className="btn primary" disabled={!filled(fbDraft.strength) || !filled(fbDraft.suggestion)} onClick={() => { up((n) => { n.pairs[op].m4.feedback = [...(n.pairs[op].m4.feedback || []), { from: pid, by: me, ...fbDraft, ts: now() }]; }); setFbDraft({}); }}>Send feedback</button>
            {given.length > 0 && <p className="tiny">You have given {given.length} piece(s) of feedback. It travels to the other pair with your code.</p>}
          </div>
          <div>
            <h3>Feedback we received</h3>
            {(d.feedback || []).length ? (d.feedback || []).map((f) => (
              <div key={f.ts} className="fbcard"><p><b>Strength:</b> {f.strength}</p><p><b>Suggestion:</b> {f.suggestion}</p><span className="tiny">From Pair {f.from}</span></div>
            )) : <p className="muted">No feedback yet. You can also record spoken feedback from your teacher or the other pair below.</p>}
            <button className="btn ghost small" onClick={() => up((n) => { n.pairs[pid].m4.revisions = [...(n.pairs[pid].m4.revisions || []), { ts: now(), snapshot: JSON.stringify({ ...d, feedback: undefined, revisions: undefined }) }]; })}>Save a “before revision” version</button>
            {(d.revisions || []).length > 0 && <p className="tiny">{d.revisions.length} saved version(s); your teacher can compare them.</p>}
            <Field label="At least one improvement we made after feedback (required)" value={d.improvement} onChange={(v) => set("improvement", v)} rows={2} />
          </div>
        </div>
      </section>
    </div>
  );
}

// ────────────────────────────── Mission 5 (student view)
export function Mission5Student({ S, me }) {
  return (
    <div>
      <MissionHead p={PHASES[4]}><p className="lead">Your teacher leads this mission and shares selected work on screen. Be ready to explain your thinking, ask questions and build on others' ideas.</p></MissionHead>
      <section className="panel"><h3>Think about…</h3><ul className="qlist big">{DISCUSSION_QUESTIONS.map((q) => <li key={q}>{q}</li>)}</ul></section>
      <p className="muted">Make sure your teacher has your latest work: use “Send my work” on the mission map.</p>
    </div>
  );
}

// ────────────────────────────── Mission 6
export function Mission6({ S, up, me }) {
  const e = S.students[me].m6; const locked = !!e.ts; const m1 = S.students[me].m1;
  const set = (k, v) => up((n) => { n.students[me].m6[k] = v; });
  return (
    <div>
      <MissionHead p={PHASES[5]}><p className="lead">Final Detective Report. Work on your own: this is evidence of your learning, so there are no hints here.</p></MissionHead>
      <section className="panel">
        <div className="two">
          <Profile p={{ ...EXIT_CASE, heightLabel: `${EXIT_CASE.cm} cm` }} />
          <div>
            <h3>1 · Calculate Rana's BMI, with units</h3>
            <Field label="Show your working" value={e.working} onChange={(v) => set("working", v)} rows={2} disabled={locked} />
            <div className="row wrap">
              <label className="mini-in">BMI<input inputMode="decimal" value={e.value || ""} onChange={(ev) => set("value", ev.target.value)} disabled={locked} /></label>
              <label className="mini-in">Unit<select value={e.unit || ""} onChange={(ev) => set("unit", ev.target.value)} disabled={locked}><option value="">Choose…</option>{UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}</select></label>
            </div>
          </div>
        </div>
        <Field label="2 · One important limitation of BMI" value={e.limitation} onChange={(v) => set("limitation", v)} rows={2} disabled={locked} />
        <Field label="3 · One respectful, scientifically justified health message" value={e.message} onChange={(v) => set("message", v)} rows={2} disabled={locked} />
        <LangCheck text={e.message} />
        <details className="opt"><summary>Optional CER reflection (if time allows)</summary>
          {m1.ts && <p className="tiny">At the start you predicted: “{m1.choice}”, because {m1.why}</p>}
          <Field label={`Return to the question: ${CENTRAL_Q} Give your claim, evidence and reasoning now.`} value={e.reflect} onChange={(v) => set("reflect", v)} rows={4} disabled={locked} />
        </details>
        {locked ? <div className="fb ok">Report filed at {new Date(e.ts).toLocaleTimeString()}. Send your code to your teacher.</div> :
          <button className="btn primary" disabled={!e.value || !e.unit || !filled(e.limitation) || !filled(e.message)} onClick={() => up((n) => { n.students[me].m6.ts = now(); })}>Submit my report</button>}
      </section>
    </div>
  );
}
