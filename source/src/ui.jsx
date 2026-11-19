import React, { useState, useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { bmi, r1, num, GLOSSARY, FORMULA_EN, FORMULA_AR, THEMES, languageCheck, WHO_SOURCE } from "./data.js";

export const cx = (...a) => a.filter(Boolean).join(" ");

export function Field({ label, hint, value, onChange, rows = 3, dir, placeholder, disabled, id }) {
  return (
    <label className="field">
      <span className="flabel">{label}</span>
      {hint && <span className="fhint">{hint}</span>}
      {rows === 1 ? (
        <input id={id} dir={dir} value={value || ""} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <textarea id={id} dir={dir} rows={rows} value={value || ""} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function LangCheck({ text }) {
  const flags = languageCheck(text);
  if (!flags.length) return null;
  const respect = flags.filter((f) => f.kind === "respect").map((f) => f.w);
  const diag = flags.filter((f) => f.kind === "diagnosis").map((f) => f.w);
  return (
    <div className="note warn" role="status">
      {respect.length > 0 && <p><b>Respect check:</b> “{respect.join("”, “")}” could make someone feel judged. Could you focus on habits rather than bodies?</p>}
      {diag.length > 0 && <p><b>Science check:</b> “{diag.join("”, “")}” sounds like a diagnosis. BMI is a screening measure. How could you reword this?</p>}
    </div>
  );
}

export function Feedback({ fb }) {
  if (!fb) return null;
  return <div className={cx("fb", fb.ok ? "ok" : "try")} role="status" aria-live="polite">{fb.ok ? "✓ " : "↻ "}{fb.text}</div>;
}

export function Badge({ children, kind }) { return <span className={cx("badge", kind)}>{children}</span>; }

export function Profile({ p, showBMI }) {
  const h = p.heightLabel || (p.m ? `${p.m.toFixed(2)} m` : "");
  return (
    <div className="profile">
      <div className="pf-head">
        <Silhouette seed={p.name} />
        <div>
          <div className="pf-name">{p.name}</div>
          <div className="pf-meta">{p.age} years · {p.sex}</div>
        </div>
      </div>
      <dl className="pf-data">
        <div><dt>Mass</dt><dd>{p.kg} kg</dd></div>
        <div><dt>Height</dt><dd>{h}</dd></div>
        {showBMI && <div><dt>BMI</dt><dd>{r1(bmi(p.kg, p.m)).toFixed(1)} kg/m²</dd></div>}
      </dl>
      {p.routine && <ul className="pf-routine">{p.routine.map((r) => <li key={r}>{r}</li>)}</ul>}
      {p.context && <p className="pf-ctx">{p.context}</p>}
    </div>
  );
}

// Neutral abstract avatar: no body shape, so nothing to judge.
export function Silhouette({ seed = "x" }) {
  let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (
    <svg className="avatar" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill={`hsl(${h} 35% 82%)`} />
      <text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="700" fill={`hsl(${h} 40% 25%)`}>{seed[0]}</text>
    </svg>
  );
}

export function BMICalculator({ compact }) {
  const [kg, setKg] = useState(""); const [h, setH] = useState(""); const [unit, setUnit] = useState("cm");
  const mass = num(kg), hv = num(h);
  const m = unit === "cm" ? hv / 100 : hv;
  const valid = isFinite(mass) && isFinite(m) && mass > 0 && m > 0.5 && m < 2.6;
  return (
    <div className={cx("calc", compact && "compact")}>
      <div className="calc-in">
        <label>Mass (kg)<input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="e.g. 55" /></label>
        <label>Height<span className="row"><input inputMode="decimal" value={h} onChange={(e) => setH(e.target.value)} placeholder={unit === "cm" ? "e.g. 162" : "e.g. 1.62"} />
          <select value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Height unit"><option value="cm">cm</option><option value="m">m</option></select></span></label>
      </div>
      <div className="calc-steps" aria-live="polite">
        {valid ? (
          <>
            <div><span>Height in metres</span><b>{m.toFixed(2)} m</b></div>
            <div><span>Height²</span><b>{(m * m).toFixed(4)} m²</b></div>
            <div className="calc-res"><span>BMI = {mass} ÷ {(m * m).toFixed(4)}</span><b>{(mass / (m * m)).toFixed(1)} <small>kg/m²</small></b></div>
          </>
        ) : (
          <p className="muted">{isFinite(hv) && hv > 0 && !(m > 0.5 && m < 2.6) ? "Check the height and its unit." : "Enter a fictional mass and height to see each step."}</p>
        )}
      </div>
      <p className="tiny">A number only: interpreting it for adolescents needs age- and sex-specific BMI-for-age charts.</p>
    </div>
  );
}

export function ReverseCheck() {
  const [b, setB] = useState(""); const [h, setH] = useState("");
  const bv = num(b), hv = num(h);
  const ok = isFinite(bv) && isFinite(hv) && hv > 0.5 && hv < 2.6;
  return (
    <div className="reverse">
      <span className="flabel">Work backwards: BMI × height² should give the mass</span>
      <div className="row wrap">
        <input aria-label="Your BMI" inputMode="decimal" placeholder="your BMI" value={b} onChange={(e) => setB(e.target.value)} />
        <span>×</span>
        <input aria-label="Height in metres" inputMode="decimal" placeholder="height (m)" value={h} onChange={(e) => setH(e.target.value)} />
        <span>² =</span>
        <b className="mono">{ok ? (bv * hv * hv).toFixed(1) + " kg" : "…"}</b>
      </div>
      <span className="fhint">Does that match the mass in the profile?</span>
    </div>
  );
}

// ── The student-made bilingual display (also rendered to standalone HTML for export)
export function DisplayPreview({ d, pairLabel }) {
  const th = THEMES[d.theme] || THEMES.clinic;
  const kg = num(d.exKg), m = num(d.exM), res = num(d.exResult);
  const exOk = isFinite(kg) && isFinite(m) && m > 0.5 && isFinite(res) && Math.abs(res - bmi(kg, m)) <= 0.06;
  const big = d.size === "large";
  const st = {
    wrap: { background: th.bg, color: th.ink, borderRadius: 14, padding: big ? 28 : 22, fontFamily: "'Source Sans 3', 'Noto Naskh Arabic', system-ui, sans-serif", fontSize: big ? 18 : 15.5, lineHeight: 1.45, border: `2px solid ${th.accent}` },
    h: { fontFamily: "Archivo, system-ui, sans-serif", fontWeight: 800, margin: 0, fontSize: big ? 30 : 24, lineHeight: 1.1, color: th.accent },
    hAr: { fontFamily: "'Noto Naskh Arabic', serif", fontWeight: 700, margin: "4px 0 0", fontSize: big ? 26 : 21, color: th.accent },
    formula: { background: th.accent, color: "#fff", borderRadius: 10, padding: "12px 14px", margin: "14px 0", display: "grid", gap: 4 },
    grid: { display: "grid", gridTemplateColumns: d.layout === "stacked" ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 },
    box: { background: "#ffffffcc", borderRadius: 10, padding: "10px 12px", borderInlineStart: `4px solid ${th.accent}` },
    k: { fontSize: 12, fontWeight: 700, letterSpacing: 0.2, color: th.accent, marginBottom: 2 },
    ar: { direction: "rtl", textAlign: "right", fontFamily: "'Noto Naskh Arabic', serif" },
    gl: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", fontSize: "0.9em" },
  };
  const Pair = ({ k, kAr, en, ar }) => (en || ar) ? (
    <div style={st.box}>
      <div style={st.k}>{k}</div>{en && <div>{en}</div>}
      {ar && <div style={{ ...st.ar, marginTop: 6 }}><div style={{ ...st.k, ...st.ar }}>{kAr}</div>{ar}</div>}
    </div>) : null;
  return (
    <div style={st.wrap} className="display-preview">
      <h2 style={st.h}>{d.titleEn || "Your English title"}</h2>
      <p style={{ ...st.hAr, ...st.ar }}>{d.titleAr || "العنوان بالعربية"}</p>
      {d.showFormula && (
        <div style={st.formula}><b>{FORMULA_EN}</b><b style={st.ar}>{FORMULA_AR}</b></div>
      )}
      <div style={st.grid}>
        {(d.exKg || d.exM || d.exResult) && (
          <div style={st.box}>
            <div style={st.k}>Worked example · مثال محلول</div>
            <div>Fictional teen: {d.exKg || "?"} kg, {d.exM || "?"} m</div>
            <div>BMI = {d.exKg || "?"} ÷ ({d.exM || "?"})² = <b>{d.exResult || "?"} kg/m²</b> {exOk ? "✓" : ""}</div>
          </div>
        )}
        <Pair k="Screening, not diagnosis" kAr="فحص أولي وليس تشخيصاً" en={d.screenEn} ar={d.screenAr} />
        <Pair k="For teenagers" kAr="للمراهقين" en={d.teenEn} ar={d.teenAr} />
        <Pair k="Healthy habits" kAr="عادات صحية" en={d.msgEn} ar={d.msgAr} />
        {(d.glossary || []).length > 0 && (
          <div style={st.box}>
            <div style={st.k}>Key terms · مصطلحات</div>
            <div style={st.gl}>{d.glossary.map((i) => (
              <React.Fragment key={i}><span>{GLOSSARY[i][0]}</span><span style={st.ar}>{GLOSSARY[i][1]}</span></React.Fragment>))}</div>
          </div>
        )}
      </div>
      <p style={{ fontSize: 12, opacity: 0.75, margin: "12px 0 0" }}>
        All examples are fictional. Reference for adolescents: {WHO_SOURCE.label}.{pairLabel ? ` Made by ${pairLabel}.` : ""}
      </p>
    </div>
  );
}

export function displayHTML(d, pairLabel) {
  const body = renderToStaticMarkup(<DisplayPreview d={d} pairLabel={pairLabel} />);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${(d.titleEn || "BMI information display").replace(/</g, "&lt;")}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Noto+Naskh+Arabic:wght@400;700&family=Source+Sans+3:wght@400;600&display=swap">
<style>body{margin:0;padding:24px;background:#fff}main{max-width:900px;margin:auto}@media print{body{padding:0}}</style></head><body><main>${body}</main></body></html>`;
}

// ── Export helpers (works inside the Claude artifact frame and on ordinary hosting)
let dlPromise = null;
function getDownloads() {
  if (!dlPromise) dlPromise = (window.claude && typeof window.claude.use === "function") ? window.claude.use("downloads").catch(() => null) : Promise.resolve(null);
  return dlPromise;
}
export async function saveFile(filename, data) {
  const dl = await getDownloads();
  if (dl) {
    try { await dl.save({ filename, data }); return "saved"; }
    catch (e) { if (e && e.code === "declined") return "declined"; }
  }
  try {
    const blob = new Blob([data], { type: filename.endsWith(".csv") ? "text/csv" : filename.endsWith(".html") ? "text/html" : "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return "saved";
  } catch { return "failed"; }
}
export async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch {
    try { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; }
    catch { return false; }
  }
}

export function ExportButtons({ filename, getData, label = "Export" }) {
  const [msg, setMsg] = useState("");
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3500); };
  return (
    <span className="exp">
      <button className="btn" onClick={async () => { const r = await saveFile(filename, getData()); flash(r === "saved" ? "Download started" : r === "declined" ? "Download cancelled" : "Download blocked here, use Copy"); }}>{label} ⤓</button>
      <button className="btn ghost" onClick={async () => flash((await copyText(getData())) ? "Copied" : "Copy failed: select and copy manually")}>Copy</button>
      {msg && <span className="exp-msg" role="status">{msg}</span>}
    </span>
  );
}

export function useTick(ms = 1000) {
  const [, set] = useState(0);
  useEffect(() => { const id = setInterval(() => set((x) => x + 1), ms); return () => clearInterval(id); }, [ms]);
}

export function Confirm({ text, onYes, children, className }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <span className="confirm"><span>{text}</span><button className="btn danger" onClick={() => { setOpen(false); onYes(); }}>Yes</button><button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button></span>
  ) : <button className={className || "btn ghost"} onClick={() => setOpen(true)}>{children}</button>;
}
