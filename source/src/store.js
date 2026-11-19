import {
  STUDENTS, PAIRS, M2_CASES, M3_CASES, EXIT_CASE, diagnoseBMI, DIAG_LABEL, num, bmi, r1,
  DEFAULT_ANTICIPATED, DEFAULT_QUESTIONS, casesForPair, pairOf, PHASES,
} from "./data.js";

export const STORE_KEY = "bmi-detective-v1";
export const now = () => Date.now();

export function blankStudent() {
  return { m1: {}, m2: { c1: { attempts: [] }, c2: { attempts: [] } }, m3: {}, m6: {} };
}
export function blankPair() {
  return { m3: {}, m4: { glossary: [], theme: "clinic", layout: "split", feedback: [], revisions: [] } };
}
export function initialState() {
  const students = {}; STUDENTS.forEach((s) => (students[s] = blankStudent()));
  return {
    v: 1,
    demo: false,
    className: "Grade 10 Biology",
    students,
    pairs: { 1: blankPair(), 2: blankPair() },
    teacher: {
      names: { A: "Detective A", B: "Detective B", C: "Detective C", D: "Detective D" },
      timer: { startedAt: null, pausedElapsed: 0, running: false },
      tags: {},
      catNotes: { 1: "", 2: "", 3: "", 4: "" },
      anticipated: JSON.parse(JSON.stringify(DEFAULT_ANTICIPATED)),
      questions: JSON.parse(JSON.stringify(DEFAULT_QUESTIONS)),
      unanticipated: [],
      sequence: [],
      presented: [],
      connections: "",
      badges: { A: [], B: [], C: [], D: [] },
      shareAnon: true,
    },
    me: null, // which detective this device belongs to in Student mode
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    return deepMerge(initialState(), parsed);
  } catch { return initialState(); }
}
export function save(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
}

function isObj(x) { return x && typeof x === "object" && !Array.isArray(x); }
function deepMerge(base, over) {
  if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
  const out = { ...base };
  Object.keys(over).forEach((k) => { out[k] = isObj(base[k]) && isObj(over[k]) ? deepMerge(base[k], over[k]) : over[k]; });
  return out;
}

// ── Merge imported work (newer timestamp wins per record)
function mergeRecord(a, b) {
  if (!b) return a; if (!a) return b;
  return (b.ts || 0) >= (a.ts || 0) ? deepMerge(a, b) : deepMerge(b, a);
}
export function mergeStudent(cur, inc) {
  const out = JSON.parse(JSON.stringify(cur));
  out.m1 = mergeRecord(cur.m1, inc.m1);
  out.m6 = mergeRecord(cur.m6, inc.m6);
  ["c1", "c2"].forEach((c) => {
    const a = cur.m2[c] || { attempts: [] }, b = (inc.m2 || {})[c];
    if (!b) return;
    const merged = mergeRecord(a, b);
    const seen = new Set(); merged.attempts = [...(a.attempts || []), ...(b.attempts || [])]
      .filter((x) => { const k = x.ts + "|" + x.value; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((x, y) => x.ts - y.ts);
    out.m2[c] = merged;
  });
  Object.keys(inc.m3 || {}).forEach((k) => { out.m3[k] = mergeRecord(cur.m3[k], inc.m3[k]); });
  return out;
}
export function mergePair(cur, inc) {
  const out = JSON.parse(JSON.stringify(cur));
  Object.keys(inc.m3 || {}).forEach((k) => { out.m3[k] = mergeRecord(cur.m3[k], inc.m3[k]); });
  if (inc.m4) {
    const fb = [...(cur.m4.feedback || []), ...(inc.m4.feedback || [])];
    const seen = new Set();
    out.m4 = mergeRecord(cur.m4, inc.m4);
    out.m4.feedback = fb.filter((f) => (seen.has(f.ts) ? false : seen.add(f.ts)));
    const rv = [...(cur.m4.revisions || []), ...(inc.m4.revisions || [])]; const s2 = new Set();
    out.m4.revisions = rv.filter((f) => (s2.has(f.ts) ? false : s2.add(f.ts)));
  }
  return out;
}

// ── Submission codes (student → teacher / partner)
async function gz(str) {
  if (typeof CompressionStream === "undefined") return null;
  const cs = new Blob([str]).stream().pipeThrough(new CompressionStream("gzip"));
  const buf = new Uint8Array(await new Response(cs).arrayBuffer());
  let bin = ""; buf.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
async function gunz(b64) {
  const bin = atob(b64); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const ds = new Blob([u]).stream().pipeThrough(new DecompressionStream("gzip"));
  return await new Response(ds).text();
}
const b64u = (s) => btoa(unescape(encodeURIComponent(s)));
const ub64 = (s) => decodeURIComponent(escape(atob(s)));

export async function makeCode(state, who) {
  const payload = { kind: "bmi-detective", v: 1, who, at: now(), demo: !!state.demo,
    student: state.students[who], pairId: pairOf(who), pair: state.pairs[pairOf(who)],
    given: { toPair: pairOf(who) === 1 ? 2 : 1, feedback: (state.pairs[pairOf(who) === 1 ? 2 : 1].m4.feedback || []).filter((f) => f.from === pairOf(who)) } };
  const json = JSON.stringify(payload);
  try { const z = await gz(json); if (z) return "BMID1Z:" + z; } catch { /* fall through */ }
  return "BMID1:" + b64u(json);
}
export async function readCode(code) {
  const c = (code || "").trim().replace(/\s+/g, "");
  let json;
  if (c.startsWith("BMID1Z:")) json = await gunz(c.slice(7));
  else if (c.startsWith("BMID1:")) json = ub64(c.slice(6));
  else if (c.startsWith("{")) json = c;
  else throw new Error("This doesn't look like a BMI Detective code.");
  const p = JSON.parse(json);
  if (p.kind !== "bmi-detective" || !STUDENTS.includes(p.who)) throw new Error("Code not recognised.");
  return p;
}
export function applyCode(state, p) {
  state.students[p.who] = mergeStudent(state.students[p.who], p.student || {});
  if (p.pair) state.pairs[p.pairId] = mergePair(state.pairs[p.pairId], p.pair);
  if (p.given && p.given.feedback && p.given.feedback.length) {
    const tgt = state.pairs[p.given.toPair].m4; const have = new Set((tgt.feedback || []).map((f) => f.ts));
    tgt.feedback = [...(tgt.feedback || []), ...p.given.feedback.filter((f) => !have.has(f.ts))];
  }
  if (p.demo) state.demo = true;
}

// ── Derived status
export const filled = (s) => !!(s && String(s).trim().length > 2);
export function m2Status(c) {
  const last = (c.attempts || []).at(-1);
  return { correct: !!(last && last.ok), tries: (c.attempts || []).length, hadError: (c.attempts || []).some((a) => !a.ok) };
}
export function cerDone(r) { return r && filled(r.claim) && filled(r.evidence) && filled(r.reasoning); }

export function displayChecks(d) {
  const kg = num(d.exKg), m = num(d.exM), res = num(d.exResult);
  const exampleOk = isFinite(kg) && isFinite(m) && m > 0.5 && m < 2.5 && isFinite(res) && Math.abs(res - bmi(kg, m)) <= 0.06;
  return [
    { id: "formula", label: "BMI formula", ok: !!d.showFormula },
    { id: "example", label: "Correct worked example", ok: exampleOk },
    { id: "screening", label: "Screening, not diagnosis (EN + AR)", ok: filled(d.screenEn) && filled(d.screenAr) },
    { id: "adolescent", label: "Adolescent BMI-for-age caution (EN + AR)", ok: filled(d.teenEn) && filled(d.teenAr) },
    { id: "message", label: "Respectful eating & activity message (EN + AR)", ok: filled(d.msgEn) && filled(d.msgAr) },
    { id: "terms", label: "At least 3 bilingual terms", ok: (d.glossary || []).length >= 3 },
  ];
}

export function progress(state, s) {
  const st = state.students[s], p = state.pairs[pairOf(s)];
  const m1 = !!st.m1.ts;
  const m2 = ["c1", "c2"].filter((c) => m2Status(st.m2[c]).correct).length;
  const myCases = casesForPair(pairOf(s)).filter((c) => !c.optional);
  const m3i = myCases.filter((c) => cerDone(st.m3[c.id])).length;
  const m3p = myCases.filter((c) => cerDone(p.m3[c.id])).length;
  const checks = displayChecks(p.m4); const m4 = checks.filter((c) => c.ok).length;
  const m6 = !!st.m6.ts;
  return { m1, m2, m2of: 2, m3i, m3p, m3of: myCases.length, m4, m4of: checks.length, improved: filled(p.m4.improvement), m6 };
}

// Points reward reasoning, accuracy, collaboration and improvement — never BMI values.
export function points(state, s) {
  const st = state.students[s], p = state.pairs[pairOf(s)];
  const items = [];
  const add = (n, why) => items.push({ n, why });
  if (st.m1.ts) add(3, "Made a prediction");
  if (filled(st.m1.why)) add(4, "Justified the prediction");
  ["c1", "c2"].forEach((c, i) => {
    const r = st.m2[c]; const ms = m2Status(r);
    if (ms.correct) add(10, `Case ${i + 1}: accurate BMI`);
    if (ms.correct && ms.hadError) add(5, `Case ${i + 1}: improved after feedback`);
    if (r.unit === "kg/m²") add(3, `Case ${i + 1}: correct units`);
    if (filled(r.check)) add(3, `Case ${i + 1}: checked the calculation`);
    if (filled(r.meaning)) add(3, `Case ${i + 1}: explained the result`);
  });
  if (filled(st.m2.c1.whySquared)) add(4, "Explained why height is squared");
  casesForPair(pairOf(s)).forEach((c) => {
    if (cerDone(st.m3[c.id])) add(8, `Case File ${c.id}: individual CER`);
    if (cerDone(p.m3[c.id])) add(6, `Case File ${c.id}: pair CER`);
    if (filled((p.m3[c.id] || {}).changed)) add(4, `Case File ${c.id}: revised thinking after comparing`);
  });
  const checks = displayChecks(p.m4); add(checks.filter((c) => c.ok).length * 2, "Display requirements met");
  if (filled(p.m4.justify)) add(4, "Justified design choices");
  if ((state.pairs[pairOf(s) === 1 ? 2 : 1].m4.feedback || []).length) add(4, "Gave peer feedback");
  if (filled(p.m4.improvement)) add(6, "Improved the display after feedback");
  if (st.m6.ts) {
    const d = diagnoseBMI(num(st.m6.value), EXIT_CASE.kg, EXIT_CASE.m);
    if (d.ok) add(10, "Exit ticket: accurate BMI");
    if (st.m6.unit === "kg/m²") add(2, "Exit ticket: units");
    if (filled(st.m6.limitation)) add(5, "Exit ticket: BMI limitation");
    if (filled(st.m6.message)) add(5, "Exit ticket: responsible message");
  }
  (state.teacher.badges[s] || []).forEach((b) => add(5, `Teacher badge: ${b}`));
  return { total: items.reduce((a, b) => a + b.n, 0), items };
}

export function autoBadges(state, s) {
  const st = state.students[s], p = state.pairs[pairOf(s)];
  const b = [];
  const c1 = m2Status(st.m2.c1), c2 = m2Status(st.m2.c2);
  if (c1.correct && c2.correct && st.m2.c1.unit === "kg/m²" && st.m2.c2.unit === "kg/m²") b.push("Unit Master");
  if ((c1.correct && c1.hadError) || (c2.correct && c2.hadError)) b.push("Self-Corrector");
  if (casesForPair(pairOf(s)).some((c) => cerDone(st.m3[c.id]))) b.push("CER Builder");
  if (displayChecks(p.m4).every((c) => c.ok)) b.push("Bilingual Designer");
  if (filled(p.m4.improvement)) b.push("Responsive Reviser");
  if (st.m6.ts) b.push("Report Filed");
  return b;
}

// ── Pool of authentic responses (only what students actually entered)
export function responsePool(state) {
  const names = state.teacher.names; const out = [];
  const push = (o) => out.push({ demo: state.demo, ...o });
  STUDENTS.forEach((s) => {
    const st = state.students[s]; const who = names[s];
    if (st.m1.ts) push({ key: `${s}|m1`, by: s, whoLabel: who, mission: "m1", title: "Initial prediction",
      text: `${st.m1.choice || "(no choice)"}: ${st.m1.why || ""}${st.m1.confidence ? ` (confidence ${st.m1.confidence}/5)` : ""}`, ts: st.m1.ts });
    M2_CASES.forEach((c, i) => {
      const r = st.m2[c.id] || {};
      (r.attempts || []).forEach((a, j) => {
        push({ key: `${s}|m2|${c.id}|${j}`, by: s, whoLabel: who, mission: "m2", title: `${c.name}: BMI attempt ${j + 1}`,
          text: `Entered ${a.value}${r.unit && j === r.attempts.length - 1 ? " " + r.unit : ""}. ${a.ok ? "Correct." : `Not yet: ${DIAG_LABEL[a.code] || a.code}.`}`,
          ts: a.ts, auto: a.cat1 ? 1 : null, autoWhy: a.cat1 ? DIAG_LABEL[a.code] : null });
      });
      const parts = [];
      if (filled(r.whySquared)) parts.push(`Why squared: ${r.whySquared}`);
      if (filled(r.check)) parts.push(`How I checked: ${r.check}`);
      if (filled(r.meaning)) parts.push(`What the result tells us: ${r.meaning}`);
      if (parts.length) push({ key: `${s}|m2|${c.id}|explain`, by: s, whoLabel: who, mission: "m2", title: `${c.name}: explanations`, text: parts.join("\n"), ts: r.ts });
    });
    Object.keys(st.m3).forEach((cid) => {
      const r = st.m3[cid]; if (!r) return;
      push({ key: `${s}|m3|${cid}`, by: s, whoLabel: who, mission: "m3", title: `Case File ${cid}: individual`,
        text: cerText(r), ts: r.ts });
    });
    if (st.m6.ts) push({ key: `${s}|m6`, by: s, whoLabel: who, mission: "m6", title: "Exit ticket",
      text: `Calculation: ${st.m6.working || ""} → ${st.m6.value || "?"} ${st.m6.unit || ""}\nLimitation: ${st.m6.limitation || ""}\nMessage: ${st.m6.message || ""}${filled(st.m6.reflect) ? "\nReflection: " + st.m6.reflect : ""}`, ts: st.m6.ts });
  });
  [1, 2].forEach((pid) => {
    const p = state.pairs[pid]; const who = `Pair ${pid} (${PAIRS[pid].map((x) => names[x]).join(" & ")})`;
    Object.keys(p.m3).forEach((cid) => {
      const r = p.m3[cid]; if (!r) return;
      push({ key: `P${pid}|m3|${cid}`, by: `P${pid}`, whoLabel: who, mission: "m3", title: `Case File ${cid}: pair agreement`,
        text: cerText(r) + (filled(r.changed) ? `\nWhat changed after comparing: ${r.changed}` : ""), ts: r.ts });
    });
    const d = p.m4;
    if (d.ts) push({ key: `P${pid}|m4`, by: `P${pid}`, whoLabel: who, mission: "m4", title: "Bilingual display",
      text: [d.titleEn && `Title: ${d.titleEn} / ${d.titleAr || ""}`, d.screenEn && `Screening: ${d.screenEn} / ${d.screenAr || ""}`,
        d.teenEn && `Adolescent caution: ${d.teenEn} / ${d.teenAr || ""}`, d.msgEn && `Message: ${d.msgEn} / ${d.msgAr || ""}`,
        d.exKg && `Worked example: ${d.exKg} kg, ${d.exM} m → ${d.exResult}`, d.justify && `Design reasoning: ${d.justify}`,
        d.improvement && `Improvement after feedback: ${d.improvement}`].filter(Boolean).join("\n"), ts: d.ts, display: pid });
  });
  return out;
}
export function cerText(r) {
  return [r.calc && `BMI check: ${r.calc}`, r.know && `We know: ${r.know}`, r.dontKnow && `We don't know: ${r.dontKnow}`, r.need && `Evidence needed: ${r.need}`,
    r.claim && `CLAIM: ${r.claim}`, r.evidence && `EVIDENCE: ${r.evidence}`, r.reasoning && `REASONING: ${r.reasoning}`].filter(Boolean).join("\n");
}

// ── Exports
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
export function toCSV(rows) { return rows.map((r) => r.map(csvCell).join(",")).join("\r\n"); }

export function monitoringRows(state) {
  const pool = responsePool(state); const T = state.teacher;
  const rows = [["Data status", "Category", "Anticipated or observed", "Student / pair", "Mission", "Response", "Teacher observation", "Selected for discussion", "Planned order", "Stage", "Actually presented (order)"]];
  const status = state.demo ? "DEMONSTRATION DATA" : "Lesson data";
  [1, 2, 3, 4].forEach((c) => T.anticipated[c].forEach((a) => rows.push([status, c, "Anticipated (plan)", "", "", a, "", "", "", "", ""])));
  pool.forEach((r) => {
    const tag = T.tags[r.key]; if (!tag) return;
    const si = T.sequence.findIndex((x) => x.key === r.key);
    const pi = T.presented.findIndex((x) => x.key === r.key);
    rows.push([status, tag.cat === "U" ? "Unanticipated" : tag.cat, "Observed", r.whoLabel, r.mission.toUpperCase(), r.text, tag.note || "",
      si >= 0 ? "Yes" : "No", si >= 0 ? si + 1 : "", si >= 0 ? T.sequence[si].stage || "" : "", pi >= 0 ? pi + 1 : ""]);
  });
  T.unanticipated.forEach((u) => rows.push([status, "Unanticipated", "Observed (teacher note)", u.who, u.mission || "", u.text, u.note || "", "", "", "", ""]));
  return rows;
}
export function exitRows(state) {
  const rows = [["Data status", "Student", "Working", "BMI entered", "Unit", "Accurate?", "Limitation of BMI", "Health message", "Optional CER reflection", "Submitted"]];
  STUDENTS.forEach((s) => {
    const e = state.students[s].m6; const d = diagnoseBMI(num(e.value), EXIT_CASE.kg, EXIT_CASE.m);
    rows.push([state.demo ? "DEMONSTRATION DATA" : "Lesson data", state.teacher.names[s], e.working || "", e.value || "", e.unit || "",
      e.ts ? (d.ok ? "Yes" : "No") : "", e.limitation || "", e.message || "", e.reflect || "", e.ts ? new Date(e.ts).toLocaleString() : "Not submitted"]);
  });
  return rows;
}
export function allResponsesRows(state) {
  const rows = [["Data status", "Student / pair", "Mission", "Item", "Response", "Teacher tag", "Time"]];
  responsePool(state).forEach((r) => {
    const t = state.teacher.tags[r.key];
    rows.push([state.demo ? "DEMONSTRATION DATA" : "Lesson data", r.whoLabel, r.mission.toUpperCase(), r.title, r.text,
      t ? (t.cat === "U" ? "Unanticipated" : "Category " + t.cat) : "", r.ts ? new Date(r.ts).toLocaleTimeString() : ""]);
  });
  return rows;
}

// ── Timer
export function timerElapsed(t) {
  if (!t) return 0;
  return t.running && t.startedAt ? t.pausedElapsed + (now() - t.startedAt) : t.pausedElapsed;
}
export function phaseAt(ms) {
  let acc = 0; const min = ms / 60000;
  for (const p of PHASES) { if (min < acc + p.min) return { phase: p, left: (acc + p.min - min) * 60000, startMin: acc }; acc += p.min; }
  return { phase: null, left: 0, startMin: acc };
}
export function phaseStartMs(id) {
  let acc = 0; for (const p of PHASES) { if (p.id === id) return acc * 60000; acc += p.min; } return 0;
}

// ── Demonstration data (clearly flagged; never presented as real student work)
export function demoState() {
  const s = initialState(); s.demo = true; const t = now() - 40 * 60000; let k = 0; const ts = () => t + (k += 45000);
  const S = s.students;
  S.A.m1 = { choice: "It depends", why: "Maybe, because their numbers are almost the same but Maryam plays basketball and Noor sits a lot.", confidence: 3, ts: ts() };
  S.B.m1 = { choice: "Yes, the number is enough", why: "BMI is the scientific measure, so same BMI means same health.", confidence: 4, ts: ts() };
  S.C.m1 = { choice: "No, we need more information", why: "Sleep and breakfast matter too and BMI doesn't show them.", confidence: 4, ts: ts() };
  S.D.m1 = { choice: "I'm not sure yet", why: "I don't know what BMI includes.", confidence: 2, ts: ts() };
  const att = (v, kg, m) => { const d = diagnoseBMI(v, kg, m); return { value: String(v), ok: d.ok, code: d.code, cat1: !!d.cat1, ts: ts() }; };
  S.A.m2.c1 = { fields: ["mass", "height"], hM: "1.58", hSq: "2.4964", unit: "kg/m²", attempts: [att(20.8, 52, 1.58)], whySquared: "Taller people have more body in two directions, so dividing by height squared makes it fair between tall and short people.", check: "20.8 × 2.4964 = 51.9, close to 52 kg.", meaning: "It is a number to compare mass with height. It does not say if Layla is healthy.", ts: ts() };
  S.A.m2.c2 = { fields: ["mass", "height"], hM: "1.65", hSq: "2.7225", unit: "kg/m²", attempts: [att(25.7, 70, 1.65)], check: "Worked backwards.", meaning: "25.7 kg/m².", ts: ts() };
  S.B.m2.c1 = { fields: ["mass", "height", "age"], hM: "158", hSq: "", unit: "kg/m", attempts: [att(0.33, 52, 1.58), att(32.9, 52, 1.58), att(20.8, 52, 1.58)], whySquared: "Because the formula says so.", check: "I used the calculator after.", meaning: "Healthy.", ts: ts() };
  S.B.m2.c2 = { fields: ["mass", "height"], hM: "1.65", hSq: "2.7225", unit: "kg/m²", attempts: [att(25.7, 70, 1.65)], meaning: "She is overweight.", ts: ts() };
  S.C.m2.c1 = { fields: ["mass", "height"], hM: "1.58", hSq: "2.4964", unit: "kg/m²", attempts: [att(20.83, 52, 1.58)], whySquared: "Mass depends on volume not just height; squaring height scales for body size.", check: "Calculated twice and reversed it.", meaning: "Only a screening number; need BMI-for-age for a 15-year-old.", ts: ts() };
  S.C.m2.c2 = { fields: ["mass", "height"], hM: "1.65", hSq: "2.7225", unit: "kg/m²", attempts: [att(25.71, 70, 1.65)], check: "Reverse check 25.71 × 2.7225 = 70.0", ts: ts() };
  S.D.m2.c1 = { fields: ["mass", "height"], hM: "1.58", hSq: "3.16", unit: "kg", attempts: [att(16.5, 52, 1.58), att(20.8, 52, 1.58)], whySquared: "Not sure.", ts: ts() };
  S.A.m3.A = { calc: "61 ÷ 1.64² = 22.7 kg/m²", know: "Both about 22.7. Maryam is more active, Noor sleeps less.", dontKnow: "Their diet details, growth, family history.", need: "Activity, sleep, eating, growth chart.", claim: "Similar BMI does not mean the same health situation.", evidence: "22.7 vs 22.7 but different activity and sleep.", reasoning: "BMI only uses mass and height; habits affect health too.", ts: ts() };
  S.B.m3.A = { calc: "22.7", know: "Same BMI.", dontKnow: "-", need: "-", claim: "They are equally healthy.", evidence: "Both BMI 22.7.", reasoning: "Same BMI means same health.", ts: ts() };
  S.A.m3.B = { calc: "70 ÷ 2.7225 = 25.7 correct", know: "Calculation is right.", dontKnow: "BMI-for-age for 16-year-old girls.", need: "WHO chart, her growth.", claim: "The calculation is correct but the conclusion is not supported.", evidence: "25.7 is right, but they used adult chart.", reasoning: "Teens are still growing so adult cut-offs don't apply.", ts: ts() };
  S.B.m3.B = { calc: "25.7", know: "25.7 is above 25.", dontKnow: "", need: "", claim: "Huda is overweight.", evidence: "BMI 25.7 > 25.", reasoning: "Adult chart says 25+ is overweight.", ts: ts() };
  S.C.m3.A = { calc: "22.68 kg/m²", know: "Nearly identical BMI, different routines.", dontKnow: "Muscle, diet quality.", need: "More data on habits.", claim: "We can't say they are equally healthy.", evidence: "Same BMI, different sleep/activity.", reasoning: "BMI is screening only.", ts: ts() };
  S.D.m3.C = { calc: "82 ÷ 1.78² = 25.9", know: "He trains 5 evenings.", dontKnow: "Muscle vs fat.", need: "Body composition, BMI-for-age.", claim: "The app shouldn't tell him to lose weight.", evidence: "25.9 with lots of training.", reasoning: "Muscle is heavy; BMI can't tell muscle from fat; adult chart wrong age.", ts: ts() };
  S.C.m3.C = { calc: "25.88", know: "Calculation correct.", dontKnow: "Age-based chart value.", need: "WHO BMI-for-age (boys).", claim: "BMI alone can't decide; adult category is the wrong reference.", evidence: "Age 16, athlete.", reasoning: "Adolescents need age- and sex-specific charts.", ts: ts() };
  s.pairs[1].m3.A = { claim: "Similar BMI doesn't mean same health.", evidence: "Both 22.7; routines differ.", reasoning: "BMI ignores habits; we disagreed at first.", changed: "B changed her mind after we compared routines.", ts: ts() };
  s.pairs[2].m3.C = { claim: "Correct calculation, unsupported advice.", evidence: "25.9 for a 16-year-old athlete.", reasoning: "Adult cut-offs and muscle mass.", changed: "We added body composition as evidence needed.", ts: ts() };
  Object.assign(s.pairs[1].m4, { titleEn: "Know your BMI, and its limits", titleAr: "اعرف مؤشر كتلة جسمك وحدوده", showFormula: true, exKg: "52", exM: "1.58", exResult: "20.8",
    screenEn: "BMI is a screening measure, not a diagnosis.", screenAr: "مؤشر كتلة الجسم أداة فحص أولي وليس تشخيصاً.",
    teenEn: "For teenagers, use WHO BMI-for-age charts by age and sex.", teenAr: "للمراهقين، استخدموا منحنيات مؤشر كتلة الجسم حسب العمر والجنس.",
    msgEn: "Enjoy balanced meals and move every day, every body is different.", msgAr: "استمتعوا بوجبات متوازنة وتحركوا كل يوم، فكل جسم مختلف.",
    glossary: [0, 5, 7, 10, 11], justify: "Teal looks calm and medical; Arabic on the right so families read in their language.", ts: ts() });
  s.pairs[2].m4.feedback = []; s.pairs[1].m4.feedback = [{ from: 2, strength: "Clear formula and correct example.", suggestion: "Say who should interpret the chart.", ts: ts() }];
  s.pairs[1].m4.improvement = "Added: ask a school nurse or doctor to interpret BMI-for-age.";
  S.A.m6 = { working: "1.52 × 1.52 = 2.3104; 49 ÷ 2.3104", value: "21.2", unit: "kg/m²", limitation: "It cannot tell muscle from fat, and teens need BMI-for-age charts.", message: "Healthy habits matter more than one number.", reflect: "I first said it depends; now I can explain why.", ts: ts() };
  S.B.m6 = { working: "49 ÷ 1.52²", value: "21.2", unit: "kg/m²", limitation: "It doesn't show habits like sleep.", message: "Eat balanced meals and stay active.", ts: ts() };
  return s;
}
