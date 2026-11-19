// ───────────────────────────────────────────────────────────────
// BMI Detective: content and science logic
// All people below are FICTIONAL. No student is ever asked for her own data.
// ───────────────────────────────────────────────────────────────

export const DRIVING_TASK =
  "Our school wants a simple, responsible BMI information tool for students and families. Using fictional adolescent profiles, calculate and check BMI, explain what the result can and cannot tell us, and create a short bilingual (English–Arabic) calculator display with a clear health message. How can we avoid drawing unfair conclusions from one number?";

export const CENTRAL_Q = "Can one number tell us how healthy a person is?";
export const OUTCOME =
  "B1014.4 — Explain how exercise and balanced dietary choices can help achieve weight loss and maintain a healthy lifestyle, using body mass index (BMI) as a measure.";

export const STUDENTS = ["A", "B", "C", "D"];
export const PAIRS = { 1: ["A", "B"], 2: ["C", "D"] };
export const pairOf = (s) => (PAIRS[1].includes(s) ? 1 : 2);
export const partnerOf = (s) => PAIRS[pairOf(s)].find((x) => x !== s);
export const otherPair = (p) => (p === 1 ? 2 : 1);

export const PHASES = [
  { id: "m1", n: 1, title: "The BMI Mystery", stage: "Engage", min: 5, grouping: "Individual" },
  { id: "m2", n: 2, title: "Crack the BMI Code", stage: "Individual exploration", min: 7, grouping: "Individual" },
  { id: "m3", n: 3, title: "Health Detectives", stage: "Pair investigation & checking", min: 15, grouping: "Pairs" },
  { id: "m4", n: 4, title: "Build a Responsible BMI Tool", stage: "Bilingual prototype & revision", min: 10, grouping: "Pairs" },
  { id: "m5", n: 5, title: "The Evidence Room", stage: "Whole-class discussion (teacher-led)", min: 13, grouping: "Whole class" },
  { id: "m6", n: 6, title: "Final Detective Report", stage: "Individual exit ticket", min: 5, grouping: "Individual" },
];
export const TOTAL_MIN = PHASES.reduce((a, p) => a + p.min, 0); // 55

export const bmi = (kg, m) => kg / (m * m);
export const r1 = (x) => Math.round(x * 10) / 10;
export const num = (s) => {
  if (s === null || s === undefined) return NaN;
  const t = String(s).trim().replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(",", ".");
  if (t === "") return NaN;
  return Number(t);
};

// Mission 1: two fictional students with near-identical BMI, different routines
export const M1_PAIR = [
  {
    id: "maryam", name: "Maryam", age: 15, sex: "Female", kg: 58, m: 1.6,
    routine: [
      "Walks about 20 minutes to and from the bus stop each day",
      "Plays on the school basketball team three times a week",
      "Usually eats breakfast at home with her family",
      "Sleeps around 8 hours on school nights",
    ],
  },
  {
    id: "noor", name: "Noor", age: 15, sex: "Female", kg: 61, m: 1.64,
    routine: [
      "Takes the school bus door to door",
      "Spends most free time on a coding project at her desk",
      "Often skips breakfast because her bus leaves early",
      "Sleeps around 6 hours during exam weeks",
    ],
  },
];
export const M1_OPTIONS = ["Yes, the number is enough", "No, we need more information", "It depends", "I'm not sure yet"];

// Mission 2: individual calculation cases (everyone does both)
export const M2_CASES = [
  {
    id: "c1", name: "Layla", age: 15, sex: "Female", kg: 52, heightLabel: "158 cm", m: 1.58, cm: 158, givenInCm: true,
    context: "Enjoys swimming at weekends. Her family says she has grown taller this year.",
  },
  {
    id: "c2", name: "Huda", age: 16, sex: "Female", kg: 70, heightLabel: "1.65 m", m: 1.65, cm: 165, givenInCm: false,
    context: "Walks with her sister most evenings and helps cook family meals.",
  },
];
export const M2_FIELDS = [
  { id: "age", label: "Age" }, { id: "sex", label: "Sex" }, { id: "mass", label: "Mass" },
  { id: "height", label: "Height" }, { id: "context", label: "Daily routine" },
];
export const UNIT_OPTIONS = ["kg", "kg/m", "kg/m²", "m²/kg", "%", "No unit"];

// Mission 3: pair case files
export const M3_CASES = {
  A: {
    id: "A", title: "Same number, different days", forPairs: [1, 2],
    people: [M1_PAIR[0], M1_PAIR[1]],
    brief: "Maryam and Noor are back. You saw them in Mission 1. Now look at the numbers and the routines together.",
    check: { label: "Check Noor's BMI yourself", kg: 61, m: 1.64 },
    prompt: "Does having nearly the same BMI mean Maryam and Noor have the same health situation?",
  },
  B: {
    id: "B", title: "The confident conclusion", forPairs: [1],
    people: [M2_CASES[1]],
    brief: "A fictional health blog posted this comment about Huda (16):",
    quote: "“Huda's BMI is 25.7. Adult charts say 25 or more is overweight, so Huda is overweight and unhealthy.”",
    check: { label: "Is 25.7 correct? Recalculate Huda's BMI", kg: 70, m: 1.65 },
    prompt: "Is the calculation correct? Is the conclusion supported by the evidence?",
  },
  C: {
    id: "C", title: "The athlete's app", forPairs: [2],
    people: [{ id: "khalid", name: "Khalid", age: 16, sex: "Male", kg: 82, m: 1.78, context: "Trains with a football academy five evenings a week." }],
    brief: "A fictional fitness app showed Khalid (16) this result:",
    quote: "“BMI 25.9: Overweight (adult chart). Consider losing weight.”",
    check: { label: "Check the app: recalculate Khalid's BMI", kg: 82, m: 1.78 },
    prompt: "What can the app reasonably conclude about Khalid, and what can it not?",
  },
  D: {
    id: "D", title: "Missing pieces (extension)", forPairs: [1, 2], optional: true,
    people: [{ id: "sara", name: "Sara", age: 14, sex: "Female", kg: 41, m: 1.55, context: "Grew 7 cm in the past year. Plays padel with her cousins." }],
    brief: "Only some information is available about Sara (14).",
    check: { label: "Calculate Sara's BMI", kg: 41, m: 1.55 },
    prompt: "What would you need to know before saying anything about Sara's health?",
  },
};
export const casesForPair = (p) => Object.values(M3_CASES).filter((c) => c.forPairs.includes(p));

export const DETECTIVE_QUESTIONS = [
  "How did you calculate the BMI?",
  "Are you interpreting an adult or adolescent case?",
  "Would the same BMI always mean the same health situation?",
  "What additional information would you need?",
  "What evidence supports your conclusion?",
];

// Mission 6
export const EXIT_CASE = { name: "Rana", age: 15, sex: "Female", kg: 49, cm: 152, m: 1.52 };

// ── Error diagnosis for BMI attempts (feeds hints + TTLP Category 1 suggestions)
export function diagnoseBMI(value, kg, m) {
  const truth = bmi(kg, m);
  if (!isFinite(value)) return { ok: false, code: "nan" };
  const d = Math.abs(value - truth);
  if (d <= 0.06) return { ok: true, code: "ok" };
  if (d <= 0.6) return { ok: false, code: "rounding" };
  const cm = m * 100;
  const near = (x) => Math.abs(value - x) / Math.abs(x) < 0.03;
  if (near(kg / (cm * cm))) return { ok: false, code: "cm_squared", cat1: true };
  if (near(kg / cm)) return { ok: false, code: "cm_not_squared", cat1: true };
  if (near(kg / m)) return { ok: false, code: "not_squared", cat1: true };
  if (near(kg / (2 * m))) return { ok: false, code: "doubled", cat1: true };
  if (near((m * m) / kg) || near(kg * m * m)) return { ok: false, code: "order", cat1: true };
  if (value < 10 || value > 60) return { ok: false, code: "implausible", cat1: true };
  return { ok: false, code: "other", cat1: true };
}

export const DIAG_LABEL = {
  cm_squared: "Used centimetres (squared)",
  cm_not_squared: "Used centimetres, not squared",
  not_squared: "Forgot to square height",
  doubled: "Multiplied height by 2 instead of squaring",
  order: "Formula order reversed",
  implausible: "Implausible result accepted",
  other: "Calculation error",
  rounding: "Rounding / precision",
};

export function bmiHint(code, attempt) {
  if (attempt >= 3 && code !== "rounding")
    return "Try it step by step: (1) write height in metres, (2) multiply height × height, (3) divide the mass by that answer. Check each step in the boxes above.";
  switch (code) {
    case "nan": return "Enter a number, for example 21.4.";
    case "rounding": return "Very close! Keep more decimal places in height² and round only the final answer to 1 decimal place.";
    case "cm_squared":
    case "cm_not_squared": return "Which unit should you use for height? The formula needs metres.";
    case "not_squared": return "Have you squared the height?";
    case "doubled": return "Squaring means height × height, not height × 2.";
    case "order": return "Check the order: mass is divided by height squared.";
    case "implausible": return "Is this result plausible for a teenager? How could you check your calculation?";
    default: return "How could you check your calculation? Try working backwards: BMI × height² should give the mass.";
  }
}

export function heightHint(value, m) {
  const cm = m * 100;
  if (!isFinite(value)) return "Enter the height in metres, for example 1.72.";
  if (Math.abs(value - cm) < 0.5) return "Which unit should you use for height? 100 cm = 1 m.";
  if (Math.abs(value - cm / 10) < 0.05) return "Check the conversion: 1 m = 100 cm, so divide by 100.";
  return "Divide the height in centimetres by 100.";
}
export function sqHint(value, m) {
  if (!isFinite(value)) return "Enter height × height.";
  if (Math.abs(value - 2 * m) < 0.02) return "Squaring means height × height, not height × 2.";
  if (value > 100) return "Are you still using centimetres? Square the height in metres.";
  return "Multiply the height in metres by itself. Keep 3–4 decimal places.";
}

// ── Respectful language check
const FLAG_WORDS = [
  "fat", "lazy", "ugly", "skinny", "chubby", "greedy", "gross", "disgusting", "too heavy", "too thin",
  "should lose weight", "must lose weight", "need to lose weight", "bad body",
  "سمين", "سمينة", "بدين", "بدينة", "كسول", "كسولة", "قبيح",
];
const DIAG_WORDS = ["you are overweight", "you are obese", "you are underweight", "you are unhealthy", "is unhealthy", "is obese", "انت سمين", "أنت بدين", "غير صحي"];
export function languageCheck(text) {
  const t = (text || "").toLowerCase();
  const out = [];
  FLAG_WORDS.forEach((w) => { if (t.includes(w)) out.push({ w, kind: "respect" }); });
  DIAG_WORDS.forEach((w) => { if (t.includes(w)) out.push({ w, kind: "diagnosis" }); });
  return out;
}

// ── Bilingual terminology bank
export const GLOSSARY = [
  ["Body mass index (BMI)", "مؤشر كتلة الجسم"],
  ["Mass", "الكتلة"],
  ["Height", "الطول"],
  ["Kilogram (kg)", "كيلوغرام (كغ)"],
  ["Metre (m)", "متر (م)"],
  ["Screening measure", "أداة فحص أولي"],
  ["Diagnosis", "تشخيص"],
  ["BMI-for-age", "مؤشر كتلة الجسم حسب العمر"],
  ["Growth chart", "منحنى النمو"],
  ["Adolescent", "مراهق / مراهقة"],
  ["Balanced diet", "نظام غذائي متوازن"],
  ["Physical activity", "النشاط البدني"],
  ["Healthy lifestyle", "نمط حياة صحي"],
  ["Healthcare professional", "أخصائي رعاية صحية"],
  ["Evidence", "دليل"],
];
export const FORMULA_EN = "BMI = mass (kg) ÷ height (m)²";
export const FORMULA_AR = "مؤشر كتلة الجسم = الكتلة (كغ) ÷ مربع الطول (م²)";

export const THEMES = {
  clinic: { label: "Clinic teal", bg: "#eef6f5", ink: "#0f2d2f", accent: "#1d6f72", soft: "#d3e9e6" },
  maroon: { label: "School maroon", bg: "#faf2f4", ink: "#2b0f19", accent: "#7a1f3d", soft: "#f0d9e0" },
  sky: { label: "Calm sky", bg: "#f0f5fb", ink: "#132235", accent: "#2b5f9e", soft: "#d8e5f4" },
};

// ── TTLP monitoring categories
export const CATEGORIES = {
  1: { title: "Unit or calculation error", desc: "Uses centimetres instead of metres, forgets to square height, or accepts an implausible result." },
  2: { title: "Correct BMI, incorrect interpretation", desc: "Calculates correctly but applies adult cut-offs to adolescents or treats BMI as a diagnosis." },
  3: { title: "Oversimplified comparison", desc: "Assumes two teenagers with similar BMI must have identical health situations." },
  4: { title: "Careful evidence-based solution", desc: "Accurate, checked calculation; recognises BMI limits; writes a responsible bilingual message." },
};
export const DEFAULT_ANTICIPATED = {
  1: [
    "Uses 158 instead of 1.58, giving a BMI of about 0.002 (or 0.33 if height is not squared).",
    "Divides by height without squaring, giving about 32.9 for Layla.",
    "Writes the answer with no unit or with kg instead of kg/m².",
  ],
  2: [
    "“Huda's BMI is 25.7, so she is overweight” using the adult ≥25 cut-off.",
    "“Khalid's BMI shows he is unhealthy and should lose weight.”",
    "Treats the BMI number as a diagnosis rather than a screening measure.",
  ],
  3: [
    "“Maryam and Noor have the same BMI, so they are equally healthy.”",
    "Ignores routine differences (activity, sleep, breakfast) because the numbers match.",
  ],
  4: [
    "Calculates 20.8 kg/m² and checks by working backwards (20.8 × 1.58² ≈ 52 kg).",
    "States BMI is a screening measure; adolescents need age- and sex-specific BMI-for-age charts interpreted by a professional.",
    "Writes a respectful message about balanced eating and activity without judging bodies.",
  ],
};
export const DEFAULT_QUESTIONS = {
  1: {
    assessing: ["How did you calculate the BMI?", "Which unit did you use for height?"],
    advancing: ["Is your result plausible for a teenager? How do you know?", "How could you check by working backwards from your answer?"],
  },
  2: {
    assessing: ["Are you interpreting an adult or adolescent case?", "What exactly does your number tell you?"],
    advancing: ["Why might adult cut-offs mislead us for a 16-year-old who is still growing?", "What would a BMI-for-age chart need to know about this person?"],
  },
  3: {
    assessing: ["Would the same BMI always mean the same health situation?", "What is different about the two routines?"],
    advancing: ["What could matter for health that BMI cannot show?", "What additional information would you need?"],
  },
  4: {
    assessing: ["What evidence supports your conclusion?", "How did you check your calculation?"],
    advancing: ["How would a family feel reading your message? What would you change?", "What could we improve before sharing this with families?"],
  },
};

export const DISCUSSION_QUESTIONS = [
  "Which calculation is correct, and how do you know?",
  "Why might two people with similar BMI values have different health situations?",
  "Why should we avoid using adult BMI categories for a 15-year-old?",
  "Which evidence supports your interpretation?",
  "Which bilingual health message is most responsible, and why?",
  "What could we improve before sharing this information with families?",
];
export const SEQ_STAGES = ["1 · Mathematical accuracy", "2 · Interpretation", "3 · Responsible health message"];

export const TEACHER_BADGES = ["Evidence Expert", "Critical Questioner", "Collaborator", "Responsible Messenger"];

export const WHO_SOURCE = {
  label: "WHO Growth Reference 2007, BMI-for-age (5–19 years)",
  url: "https://www.who.int/tools/growth-reference-data-for-5to19-years/indicators/bmi-for-age",
  text: "For ages 5–19, WHO interprets BMI using age- and sex-specific BMI-for-age charts (z-scores), not the adult cut-offs of 18.5, 25 and 30. The adult cut-offs line up with the charts only at age 19.",
};
