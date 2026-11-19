import React from "react";
import { PHASES, DRIVING_TASK, OUTCOME, WHO_SOURCE } from "./data.js";

export const PHASE_GUIDE = {
  m1: {
    now: "Show the two profiles. Collect all four predictions before saying anything about BMI's limits. Ask “What makes you think that?” and “What else would you want to know?”",
    detail: [
      "Share your screen on the Mission 1 page, then ask each student to open Mission 1 on her own device.",
      "Read the central question aloud. Students choose an answer, justify it and set a confidence level, then submit (about 3 minutes).",
      "Watch the four predictions arrive on the Overview tab (or ask for codes). Do not confirm or correct any of them.",
      "Pick one or two contrasting justifications to read back neutrally (“Some of you think…, others think…”). Leave the question open: Mission 6 returns to it.",
    ],
  },
  m2: {
    now: "Students calculate silently. Circulate by asking for screen shares. Listen for cm vs m and unsquared height; ask, don't tell.",
    detail: [
      "Every student completes both cases: Layla (height in cm, needs conversion) and Huda (height in m).",
      "The app checks each step and gives hints, never answers. The calculator and the reverse check unlock after the first BMI attempt.",
      "Use the Student work tab: calculation slips are auto-flagged as possible Category 1 evidence. Confirm or reject each one.",
      "Assessing: “How did you calculate the BMI?” Advancing: “Is your result plausible? How could you check by working backwards?”",
      "At 7 minutes, ask everyone to “Send my work” (code in chat) before pairing.",
    ],
  },
  m3: {
    now: "Open breakout rooms: Pair 1 (A & B), Pair 2 (C & D). Visit each room. Listen for adult cut-offs and “same BMI = same health”.",
    detail: [
      "Both pairs investigate Case File A (Maryam & Noor). Pair 1 also does Case File B (adult cut-off misuse); Pair 2 does Case File C (athlete, fitness app). Case File D is an extension.",
      "Each student first submits her own calculation check, know / don't know / need, and CER. Only then can the pair compare and write an agreed CER.",
      "In each room, use the category questions on the TTLP monitoring tab. Tag responses as Category 2, 3 or 4 and type a short observation.",
      "Note anything unexpected under Unanticipated responses: these are often the best discussion material.",
      "At about 14 minutes, ask for codes so you hold both pairs' work for selecting.",
    ],
  },
  m4: {
    now: "Pairs build their bilingual display. At minute 6, run a 2-minute peer exchange; both pairs must record one improvement.",
    detail: [
      "Each pair writes its own English and Arabic text for six required elements; the checklist beside the live preview turns green as each one is met.",
      "The worked example is checked mathematically. The respect and science checks flag judgmental words and diagnostic language.",
      "Minute 6: each pair shares its screen for 1 minute; the other pair sends one strength and one suggestion through the feedback form (or you type spoken feedback in).",
      "Minutes 8–10: pairs save a “before” version, revise, and record their improvement. They can download a printable page.",
      "While pairs work, start selecting in the Evidence Room for Mission 5.",
    ],
  },
  m5: {
    now: "Present 2–3 selected pieces in sequence: accuracy → interpretation → responsible message. Ask students to connect them.",
    detail: [
      "Select: in the Evidence Room, choose two or three contrasting pieces of authentic work, e.g. one calculation slip, one adult-cut-off interpretation, one pair display.",
      "Sequence: order them from mathematical accuracy, to interpretation, to a justified, responsible health message. Note why each sits where it does.",
      "Connect: press “Show on shared screen” and share that view. Names are hidden by default. Use the six discussion questions to draw out why a correct calculation is not a complete health conclusion.",
      "The actual presentation order is logged automatically for your TTLP record. Type the connections students make in the Connect box.",
    ],
  },
  m6: {
    now: "Silent, individual exit ticket. No hints. Collect codes before students leave.",
    detail: [
      "Each student calculates Rana's BMI with units, states one limitation and writes one respectful, justified message.",
      "The optional reflection shows her own Mission 1 prediction and asks for a CER answer to the central question now.",
      "Collect the final codes, import them, and export the exit-ticket CSV and the TTLP monitoring CSV.",
    ],
  },
};

const MATRIX = [
  ["M1 · The BMI Mystery (5)", "Obj. 3, 5 (activation)", "Launch: engage with the task; elicit prior ideas", "Cat 3: “same BMI = same health”; uncertainty about what BMI includes", "4 individual predictions + justification + confidence, time-stamped"],
  ["M2 · Crack the BMI Code (7)", "Obj. 1", "Explore (individual); monitor & ask assessing questions", "Cat 1: cm not m, unsquared height, no unit; Cat 4: accurate and checked", "Every attempt with error type, units, “why squared”, checking method, meaning of result"],
  ["M3 · Health Detectives (15)", "Obj. 2, 3, 5", "Explore (pairs); monitor, assess, advance; peer checking", "Cat 2: adult cut-offs, BMI as diagnosis; Cat 3: oversimplified comparison; Cat 4", "Individual CER per case, compare notes, pair CER, “what changed” revision"],
  ["M4 · Build a Responsible BMI Tool (10)", "Obj. 1, 2, 4, 5", "Explore → product; formative peer feedback", "Cat 4: responsible bilingual message; Cat 2 if display diagnoses", "Display (6 checked elements), design justification, feedback given and received, revision log, export"],
  ["M5 · The Evidence Room (13)", "Obj. 2, 3, 5", "Share, discuss & analyse: selecting, sequencing, connecting", "Contrasting work from Cats 1–4", "Selected items, planned sequence and stage, actual presentation order, connections recorded"],
  ["M6 · Final Detective Report (5)", "Obj. 1, 2, 5 (+3 via CER)", "Assessment of learning against the lesson goals", "All categories, now individual", "Calculation + units (auto-checked), limitation, message, optional CER reflection; CSV export"],
];

export function Kit() {
  return (
    <div className="kit">
      <nav className="scroll kitnav">
        <a href="#kit-guide">Teacher guide</a><a href="#kit-matrix">TTLP alignment matrix</a><a href="#kit-students">Student instructions</a><a href="#kit-deploy">Deployment</a><a href="#kit-science">Science & safeguards</a>
      </nav>

      <section id="kit-guide" className="panel">
        <h2>Teacher guide: running the 55-minute online lesson</h2>
        <p><b>Driving task.</b> {DRIVING_TASK}</p>
        <p><b>Outcome.</b> {OUTCOME}</p>
        <h3>Before the lesson (10 minutes)</h3>
        <ol>
          <li>Open the link in Teacher mode. Go to Data & export → “Load demonstration data” and click through every tab once. Then press “Start a fresh lesson”.</li>
          <li>On the Overview tab, rename Detectives A–D if you want pseudonyms. Pairs are fixed: Pair 1 = A & B, Pair 2 = C & D.</li>
          <li>Send students the link and tell each one her letter. Prepare two breakout rooms.</li>
          <li>Check the anticipated responses on the TTLP monitoring tab against your lesson plan and edit them to match it exactly.</li>
        </ol>
        <h3>How the work reaches you</h3>
        <p>Each student's work is saved in her own browser. At each checkpoint she presses <i>Send my work → Make my code</i> and pastes the code into the meeting chat (Teams or Zoom). You paste all codes into <i>Data & export → Import</i>. Codes merge safely: newer work replaces older, nothing is duplicated, and peer feedback travels with the code. Suggested checkpoints: end of M1, end of M2, minute 14 of M3, end of M4, end of M6.</p>
        {PHASES.map((p) => (
          <div key={p.id} className="guide-phase">
            <h3>Mission {p.n}: {p.title} <span className="tiny">· {p.stage} · {p.min} min</span></h3>
            <ol>{PHASE_GUIDE[p.id].detail.map((d) => <li key={d}>{d}</li>)}</ol>
          </div>
        ))}
      </section>

      <section id="kit-matrix" className="panel">
        <h2>TTLP alignment matrix</h2>
        <p className="tiny">Objectives: 1 calculate and check BMI; 2 screening not diagnosis, BMI-for-age for adolescents; 3 context (eating, activity, growth); 4 bilingual display with justified design; 5 responsible, respectful messages. Times in minutes; total 55.</p>
        <div className="scroll"><table className="stack prog">
          <thead><tr><th>Game mission</th><th>Lesson objective</th><th>TTLP stage</th><th>Anticipated responses (category)</th><th>Evidence collected</th></tr></thead>
          <tbody>{MATRIX.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
        </table></div>
      </section>

      <section id="kit-students" className="panel">
        <h2>Student instructions</h2>
        <ol className="big">
          <li>Open the link your teacher sent. Choose <b>Student</b> and pick your detective letter.</li>
          <li>Follow the missions in order when your teacher says so. The timer shows which mission the class is on.</li>
          <li>Every person in this game is fictional. Never type your own weight, height, BMI or health information.</li>
          <li>Try first. If something needs another look, you'll get a hint. Use it, then try again; improving earns points.</li>
          <li>In pair missions, answer on your own first, then compare with your partner and agree together.</li>
          <li>Use claim, evidence and reasoning: say what you think, which numbers and details show it, and why, including what BMI cannot tell us.</li>
          <li>Write about habits, not bodies. Be kind and accurate: BMI is a screening measure, not a diagnosis.</li>
          <li>When your teacher asks, press <b>Send my work</b>, make your code and paste it into the lesson chat.</li>
        </ol>
      </section>

      <section id="kit-deploy" className="panel">
        <h2>Technical deployment</h2>
        <h3>What this version is</h3>
        <p>A complete React application in one HTML file, with no server. It runs a real, working lesson in two ways: (a) <b>teacher-led on one device</b>, where students take turns or dictate while you share your screen; or (b) <b>each student on her own device</b>, with work moved to the teacher by submission codes or files. It is <b>not</b> a live multi-user system: nothing syncs automatically between devices, and the app never claims it does.</p>
        <h3>Sharing it</h3>
        <ul>
          <li><b>Claude link.</b> Share the artifact from its page on claude.ai; a public link lets students open it without an account. Work is stored only in each viewer's browser.</li>
          <li><b>School hosting.</b> Download this page and upload the single HTML file to any static host (Microsoft Teams/SharePoint site, school website, GitHub Pages, Netlify). Downloads and printing work normally there.</li>
          <li>Students should use one browser for the whole lesson. Private/incognito windows lose work when closed, so remind them to send codes.</li>
        </ul>
        <h3>What live collaboration would need</h3>
        <ol>
          <li><b>Backend datastore with realtime updates:</b> e.g. Firebase Firestore or Supabase (Postgres + Realtime). Records: class, student, pair, mission response, teacher tag.</li>
          <li><b>Authentication tied to school accounts:</b> Microsoft Entra ID (Office 365) single sign-on so students never create passwords; a teacher role and a student role.</li>
          <li><b>Access rules:</b> students read and write only their own and their pair's records; only the teacher reads all records and controls the shared screen.</li>
          <li><b>Data protection:</b> pseudonymous identifiers, no health data about students (the app collects none), encryption in transit, a retention period (e.g. deleted at the end of term), and approval under MOEHE and school data-protection policy before use with students.</li>
          <li><b>Hosting:</b> a static front end (this app, with the code-transfer layer swapped for the database calls) on HTTPS, served from a school-approved domain.</li>
        </ol>
        <p>The data model in this app (per-student mission records, pair records and teacher tags with timestamps) maps directly onto those database collections, so moving to a live version changes the storage layer, not the lesson.</p>
      </section>

      <section id="kit-science" className="panel">
        <h2>Science & safeguards</h2>
        <ul>
          <li>All profiles are fictional. Students are never asked for personal body measurements or health information.</li>
          <li>BMI = mass (kg) ÷ height (m)², unit kg/m². The app checks calculations to ±0.05 and diagnoses common slips (centimetres, unsquared height, height × 2, reversed order, implausible values).</li>
          <li>{WHO_SOURCE.text} Source: <a href={WHO_SOURCE.url} target="_blank" rel="noreferrer">{WHO_SOURCE.label}</a>. The app does not classify any adolescent profile: students learn why the chart is needed, not a number to label someone with.</li>
          <li>Points reward accuracy, explanation, checking, collaboration and improvement. No points or rankings depend on anyone's BMI.</li>
          <li>Demonstration data is labelled on every card and in every export, and must never be presented as real student work.</li>
        </ul>
      </section>
    </div>
  );
}
