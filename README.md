# BMI Detective: Beyond the Number

An interactive game for a 55-minute Grade 10 Biology lesson (Qatar curriculum **B1014.4**), built around the Thinking Through a Lesson Protocol (TTLP).

**Play:** https://ranialtoum.github.io/bmi-detective/

**Driving question:** Can one number tell us how healthy a person is?

## What's inside
- **Student mode** (Detectives A–D, two pairs): six missions covering prediction, step-by-step BMI calculation with hints, pair case files with Claim–Evidence–Reasoning, a bilingual (English–Arabic) BMI information display with peer feedback, and an exit ticket.
- **Teacher mode:** lesson timer, live student work, TTLP monitoring tool (Categories 1–4 plus unanticipated responses), Evidence Room for selecting, sequencing and connecting, exit tickets, CSV exports, and a teacher kit (guide, alignment matrix, student instructions, deployment notes).

## How data moves
There is no server. Each student's work is saved in her own browser. She sends it to the teacher as a code (pasted in the lesson chat) or a file; the teacher imports it in **Data & export**. Nothing syncs automatically between devices.

## Safeguards
- All profiles are fictional; students never enter their own measurements.
- BMI is presented as a screening measure, not a diagnosis. Adolescent BMI is interpreted only with age- and sex-specific BMI-for-age charts ([WHO Growth Reference 2007](https://www.who.int/tools/growth-reference-data-for-5to19-years/indicators/bmi-for-age)).
- Points reward reasoning and accuracy, never BMI values. No rankings.

## Rebuilding from source
`index.html` is the built app. To change it, edit `source/src/`, then from `source/` run `npm install react@18.3.1 react-dom@18.3.1 esbuild@0.24.0 && node build.mjs` and copy `dist/index.html` to the repository root.
