# 🔬 LLM Reliability Lab

**A browser-based evaluation framework for measuring hallucination and prompt-strategy sensitivity in LLMs on medical question answering** — built as a research instrument comparing keyword-overlap scoring against an LLM-as-judge semantic comparator, with Wilson confidence intervals and a phrasing-ambiguity axis baked into the dataset itself.

**Live Demo:** https://llm-reliability-lab.vercel.app

**Repository:** https://github.com/yamini-nlp/llm-reliability-lab

![Stack](https://img.shields.io/badge/Stack-Next.js%2015%20%7C%20TypeScript%20%7C%20Tailwind-blue?style=flat-square)
![Inference](https://img.shields.io/badge/Inference-Groq%20Cloud%20API-orange?style=flat-square)
![State](https://img.shields.io/badge/State-Zustand-764ABC?style=flat-square)
![Charts](https://img.shields.io/badge/Charts-Recharts-8884d8?style=flat-square)
![Deployment](https://img.shields.io/badge/Deployment-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-Research%20Prototype-lightgrey?style=flat-square)

---

## 💡 Motivation

Most LLM QA benchmarks report a single aggregate accuracy number and stop there. That number hides two things that matter for safety-critical use: *why* a model failed (a wrong fact, a fabricated detail, or an overconfident wrong answer are different failure modes with different risk profiles) and *whether the scoring method itself is trustworthy* (keyword overlap penalizes correct answers worded differently from the ground truth). This project was built to make both of those visible — by pairing a deterministic keyword-match scorer with an independent LLM-as-judge semantic comparator, reporting where they agree and disagree, and tagging every question with whether its phrasing is precise or ambiguous so accuracy can be broken down by that axis as well as by model and prompt strategy.

---

## 🧭 Overview

LLM Reliability Lab is a Next.js application where a person selects a model, a prompting strategy, and a sample size, runs a live evaluation against a 40-question medical QA dataset, and gets back accuracy, hallucination-type breakdowns, Wilson-interval confidence bounds, and a judge-vs-heuristic agreement rate — all computed client-side from real API responses, not pre-baked numbers. The dataset, scoring logic, and statistics layer are implemented as plain TypeScript modules (`src/lib/`) so the evaluation methodology is auditable independently of the UI.

---

## 🎯 Problem Statement

Three gaps motivated the design:

- A single keyword-match heuristic cannot distinguish a wrong answer from a correctly-phrased synonym, so its accuracy numbers are not trustworthy on their own.
- Aggregate accuracy collapses three distinct failure modes — factual error, fabrication, and overconfident wrongness — into one bucket, even though they carry different clinical risk.
- Benchmark questions are usually written with uniform phrasing, so it's rarely possible to tell whether a model is failing on the *medicine* or failing on *interpreting an ambiguously worded question*.

---

## 🧩 What It Does

**Dataset Explorer** (`/dataset`) lists all 40 questions with a text search (matches question text or category) and dropdown filters for category and difficulty. Each question card shows its difficulty and category as badges; a person can expand any question to view its ground-truth answer and explanation, and pre-select a specific subset to run instead of the first *N* questions. The dataset's `ambiguityType` tag is used downstream for results breakdowns (see Insights, below) but is not currently exposed as a filter or badge on this page.

**Configure** (`/configure`) selects a model, a prompt strategy (zero-shot, structured, or chain-of-thought, each with a visible example template), an optional custom prompt template using a `{question}` placeholder, and a sample count from 1 up to the full dataset. The selectable models are:

| Model | Provider | Badge |
|---|---|---|
| Llama 3.1 8B Instant | Meta (via Groq) | LIVE API |
| Llama 3.3 70B Versatile | Meta (via Groq) | LIVE API |
| GPT-OSS 120B | OpenAI (via Groq) | LIVE API |
| GPT-4 (Mock) | OpenAI | SIMULATED |
| LLaMA 3.1 (Mock) | Meta | SIMULATED |
| Ground-Truth Oracle | Scripted baseline | BASELINE |

"LIVE API" models make a real network call through `/api/groq` to Groq Cloud for every question. "SIMULATED" models run a scripted, weighted-random response generator (`getMockResponse` in `src/app/experiment/page.tsx`) that probabilistically returns either the ground truth or a generic wrong answer — useful for exercising the UI and scoring pipeline without API calls, but not a reflection of real model behavior. "BASELINE" (the oracle) always returns the exact ground-truth answer and exists purely as a fixed reference point, not a model under test.

**Experiment Runner** (`/experiment`) executes the run question-by-question. For the three LIVE API models it calls the live Groq API and streams each response into the UI as it arrives; for SIMULATED and BASELINE models it generates a response locally with a short artificial delay instead. Every response is scored with the keyword-match heuristic, and — for the three Groq-backed models only — additionally sent to the LLM-as-judge for an independent semantic correctness call. A run can be stopped mid-way or reset.

**Results Dashboard** (`/results`) renders accuracy and hallucination-rate bar charts, a hallucination-type pie chart, a per-prompt-strategy comparison, and a radar view, using Recharts.

**Hallucination Analysis** (`/hallucination`) shows every hallucinated response side-by-side with its ground truth, grouped by failure type (factual error, fabricated, overconfident), each with an explanation of the detection rule that flagged it.

**Insights & Report** (`/insights`) generates a structured research-style summary — abstract, key findings (including the precise-vs-ambiguous accuracy breakdown and the judge agreement rate), recommendations, and a citation block — exportable as a `.txt` file.

**Ethics & About** (`/ethics`) documents risk analysis (hallucination, bias and fairness, reliability/consistency, patient autonomy) and a set of responsible-AI principles for clinical LLM deployment.

---

## 🏗️ Architecture

```
Browser (Configure: model + strategy + sample count)
        │
        ▼
Experiment Runner ──► buildPrompt() ──► POST /api/groq (Next.js route handler)
        │                                       │
        │                                       ▼
        │                              Groq SDK ──► llama-3.1-8b-instant /
        │                                            llama-3.3-70b-versatile /
        │                                            openai/gpt-oss-120b
        ▼
scoreResponse() ── keyword-overlap heuristic (ratio ≥ 0.4 → correct)
        │
        ├──► judgeResponse() ──► POST /api/groq (judge prompt, llama-3.3-70b-versatile) ──► semanticCorrect
        │
        ▼
Zustand store (results[]) ──► Results / Hallucination / Insights pages
```

The Groq API key lives server-side in `src/app/api/groq/route.ts` (`GROQ_API_KEY`, read via `process.env`) and is never sent to the browser; both the experiment runner and the judge call this same route handler rather than hitting Groq directly from client code.

Three additional model options — a ground-truth oracle and two scripted mock responders — are available in the configure step as non-API baselines for comparing real model behavior against deterministic reference points without consuming API quota; only the three Groq-backed models listed above go through the live scoring and judging pipeline. There is no Anthropic API integration in the current codebase (see Limitations).

---

## 🧠 Scoring Methodology

**Heuristic scorer** (`scoreResponse` in `src/app/experiment/page.tsx`): ground truth is tokenized into content words longer than 3 characters; a response is marked correct if it contains at least 40% of those tokens. An incorrect response is further classified as *overconfident* (length > 200 chars and contains a certainty marker such as "therefore", "thus", "clearly"), *fabricated* (length > 150 chars with zero keyword overlap), or *factual error* (everything else).

**LLM-as-judge** (`src/lib/judge.ts`): the question, ground truth, and model response are sent to `llama-3.3-70b-versatile` with instructions to return strict JSON — `correct`, `confidence`, and a `rationale` under 200 characters — treating synonyms and valid rephrasing as correct. This runs independently of the heuristic for every Groq-backed response.

**Agreement rate**: the Insights page computes how often the heuristic and the judge agree on judged responses, surfacing every disagreement case with its judge rationale — this is the project's check on whether the cheap heuristic scorer is actually measuring what it claims to.

**Confidence intervals** (`src/lib/stats.ts`): `wilsonInterval()` computes a 95% Wilson score interval for any successes/total pair, and `accuracyByGroup()` applies it to a results subset (e.g., precise-phrasing vs. ambiguous-phrasing questions) to report accuracy with bounds rather than a bare point estimate. `consistencyScore()` computes pairwise agreement across repeated runs of the same question, for use when a question is evaluated more than once.

---

## 📊 Dataset

40 medical QA pairs (`src/lib/data.ts`), each with a category, a difficulty level, a worked explanation, a `sourceType`, and an `ambiguityType` tag.

| Difficulty | Count |
|---|---|
| Easy | 14 |
| Medium | 18 |
| Hard | 8 |

| Source type | Count |
|---|---|
| Textbook fact | 26 |
| Clinical guideline | 9 |
| Constructed | 5 |

| Ambiguity type | Count |
|---|---|
| Precise phrasing | 25 |
| Ambiguous phrasing | 15 |

**Category coverage:** Pharmacology (7), Immunology (5), Pathology (4), Endocrinology (3), Microbiology (3), Neurology (3), Radiology (3), Biochemistry (2), Anatomy (2), Genetics (2), Clinical Chemistry (2), Physiology (2), Nephrology (1), Nutrition (1).

`ambiguityType: "constructed"` entries are deliberately written with an embedded but incorrect premise (for example, attributing a known condition to the wrong mechanism mid-question) to test whether a model corrects the premise or echoes it back — a probe for sycophantic agreement rather than recall failure.

---

## 📈 Sample Findings

A single live run (`llama-3.3-70b-versatile`, judge `llama-3.3-70b-versatile`, n=40 per condition, single pass per question, generated June 30, 2026 via `scripts/generate-findings.ts`):

| Strategy | Accuracy | 95% Wilson CI | Hallucination types | Judge agreement |
|---|---|---|---|---|
| Zero-shot | 85.0% | 70.9–92.9% | factual_error: 6 | 80% (32/40) |
| Structured | 75.0% | 59.8–85.8% | factual_error: 10 | 75% (30/40) |
| Chain-of-thought | 87.5% | 73.9–94.5% | overconfident: 1, fabricated: 3, factual_error: 1 | 85% (34/40) |

Three things are worth calling out, all consistent with this being one n=40 run rather than a finished study:

- **The strategy ranking isn't statistically clean.** CoT scores highest and structured scores lowest, but the confidence intervals overlap substantially — structured's upper bound (85.8%) sits inside both zero-shot's and CoT's ranges. At this sample size the differences are suggestive, not statistically distinct. Repeated runs through `consistencyScore()` (currently unused by the UI — see Limitations) would be needed to say whether structured prompting genuinely underperforms here.
- **Ambiguous-phrasing questions scored higher than precise-phrasing questions in every condition** (e.g. 100% vs. 76% under zero-shot) — the opposite of what the `ambiguityType` tag is meant to probe. Rather than concluding the model handles ambiguity well, this is flagged as a likely artifact of the keyword-overlap scorer: if ambiguous-phrasing ground-truth answers in this dataset tend to be shorter or more generic, they clear the ≥40% keyword threshold more easily regardless of whether the model actually resolved the ambiguity. The judge agreement rate (75–85%, not 100%) supports treating this gap with caution rather than as a clean result.
- **The hallucination-type mix shifted with strategy even as the total count dropped.** Zero-shot and structured produced only `factual_error` hallucinations; CoT had fewer hallucinations overall (5 vs. 10 under structured) but was the only strategy where `overconfident` and `fabricated` were flagged at all. Since those two classifiers are length-gated (see Scoring Methodology), this may reflect the scorer reacting to longer CoT-style responses rather than a genuine behavioral shift — worth checking against the transcripts in `findings-raw.json` before treating it as a real finding.

Raw per-question responses are in `findings-raw.json` (not committed); the run is reproducible against the live API with `scripts/generate-findings.ts`, which imports this project's actual `data.ts` and `stats.ts` rather than reimplementing them.

---

## ⚙️ Key Design Decisions

| Component | Choice | Rationale |
|---|---|---|
| Inference | Groq Cloud API via server route | Low-latency open-weight inference; API key never reaches the browser |
| Scoring | Dual heuristic + LLM-as-judge | A single scorer's accuracy number is not falsifiable on its own; agreement rate gives a validity check |
| Confidence reporting | Wilson score interval | More reliable than a normal approximation at small sample sizes, which this benchmark has |
| Dataset tagging | `ambiguityType` + `sourceType` fields | Lets accuracy be broken down by phrasing clarity, not just by model and prompt strategy |
| State | Zustand, in-memory | Single global store for config, selected questions, and results; no persistence needed for a single-session research tool |
| Frontend | Next.js App Router, no backend database | Every page is a client component reading from the same in-memory store; results are computed, not fetched |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| LLM Inference | Groq Cloud API (`groq-sdk`) — `llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, `openai/gpt-oss-120b` |
| State Management | Zustand |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Deployment | Vercel |

---

## 📁 Repository Structure

```
llm-reliability-lab/
├── public/                        # Static SVG assets
├── scripts/
│   └── generate-findings.ts       # Reproducible live-API evaluation run
├── src/
│   ├── app/
│   │   ├── api/groq/route.ts      # Server-side Groq proxy
│   │   ├── configure/page.tsx     # Model + strategy + sample count
│   │   ├── dataset/page.tsx       # Dataset explorer, search/filters
│   │   ├── ethics/page.tsx        # Risk analysis & principles
│   │   ├── experiment/page.tsx    # Runner: scoring + judging
│   │   ├── hallucination/page.tsx # Failure-type breakdown
│   │   ├── insights/page.tsx      # Report + TXT export
│   │   ├── results/page.tsx       # Charts
│   │   └── page.tsx               # Landing page
│   ├── components/Navbar.tsx
│   └── lib/
│       ├── data.ts                 # Dataset + type definitions
│       ├── judge.ts                # LLM-as-judge scorer
│       ├── stats.ts                # Wilson interval, stats helpers
│       └── store.ts                # Zustand experiment state
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Local Setup

**Prerequisites:** Node.js 18+, a Groq API key (free at [console.groq.com](https://console.groq.com)).

```bash
git clone https://github.com/yamini-nlp/llm-reliability-lab.git
cd llm-reliability-lab
npm install
```

`.env.local`:

```
GROQ_API_KEY=gsk_your_key_here
```

```bash
npm run dev
```

Visit `http://localhost:3000`. Then: **Dataset** to browse and optionally pre-select questions → **Configure** to set model, strategy, and sample count → **Experiment** to run it live → **Results / Hallucination / Insights** for analysis and report export.

---

## 🔒 Security

- `GROQ_API_KEY` is read server-side only, inside the `/api/groq` route handler; it is not exposed to client-side JavaScript.
- `.env.local` is excluded from version control via `.gitignore` (`.env*` is ignored); it has never been committed to this repository's git history.
- The Groq API key used in earlier development was rotated after exposure outside this repository. The current key is supplied only via local `.env.local` / the Vercel project's environment variables and is not present in any tracked file or commit.

---

## ⚠️ Limitations

- **Keyword-overlap scorer is a heuristic.** It can mis-score a semantically correct but differently-worded response; this is why the LLM-as-judge agreement check exists, though the judge itself is also a single model call and can be wrong. The Sample Findings run above shows a concrete instance of this: ambiguous-phrasing accuracy exceeded precise-phrasing accuracy in every condition, plausibly because shorter ground-truth answers are easier to keyword-match, not because ambiguity was genuinely resolved better.
- **Small benchmark.** 40 questions limit statistical power; Wilson intervals are reported specifically because point estimates alone would be misleading at this sample size.
- **Single pass per question by default.** A single run's accuracy is one sample from a stochastic distribution; `consistencyScore()` exists in `stats.ts` for repeated-run agreement, but the UI doesn't yet drive multiple runs per question.
- **Single-rater LLM-as-judge.** One judge call per response, no inter-rater or multi-judge agreement.
- **No persistence.** Results live only in the in-memory Zustand store for the current session and clear on refresh.
- **Resolved: model-ID routing bug (commit `65b7e59`).** An earlier version listed a "Claude Sonnet 4 (Anthropic)" model marked "LIVE API" with no real Anthropic route behind it; an unrecognized-model fallback silently returned the ground-truth answer instead, so every "live" run on that entry was correct by construction, not by inference. Fixed by removing the entry, routing all live models through an explicit `GROQ_MODEL_MAP`, and making the fallback throw instead of silently defaulting. Disclosed here since the commit history shows it regardless.

---

## 🔭 Future Work

- Drive multiple runs per question through the existing `consistencyScore()` function to report run-to-run consistency in the UI, not just compute it.
- Expand the dataset beyond 40 questions and add source citations for each ground truth answer.
- Add a second independent judge model and report inter-judge agreement alongside judge-vs-heuristic agreement.
- Persist experiment runs (e.g., to a lightweight database) so results survive a page refresh and can be compared across sessions.
- Add CSV/JSON export alongside the existing TXT report for downstream statistical analysis.
- Surface `ambiguityType` as a visible badge and filter on the Dataset Explorer, matching how it's already used in the Insights breakdown.
- Either wire the orphaned `gpt-oss-20b` mapping into the Configure page's model list or remove it from `GROQ_MODEL_MAP` to keep the two in sync.

---

<div align="center">

Built by Yamini G

</div>
