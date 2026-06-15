# LLM Reliability Lab — Medical QA Hallucination Benchmarking Platform

> A systematic AI safety research platform for evaluating large language model reliability on medical question answering benchmarks, with structured hallucination detection and cross-model prompt strategy comparison.

**Live Demo:** https://llm-reliability-lab.vercel.app  
**Stack:** Next.js 15 · TypeScript · Groq Cloud API · Zustand · Recharts · Framer Motion · Tailwind CSS · Vercel

---

## Overview

LLM Reliability Lab is a browser-accessible evaluation platform that benchmarks LLM reliability on medical QA tasks. The system measures accuracy, classifies hallucination types, and compares prompt strategy effectiveness across multiple open-source model families via live Groq Cloud API inference — without requiring any local compute infrastructure.

The platform is designed to make LLM evaluation reproducible and accessible: the full pipeline from configuration to hallucination inspection runs in the browser, and results are exportable as structured text reports.

---

## Problem Statement

LLMs are increasingly used in high-stakes domains including healthcare, clinical decision support, and medical education. Their tendency to generate confident but factually incorrect responses poses risks when deployed without systematic evaluation.

Three specific gaps motivated this platform:

1. Most benchmarks report aggregate accuracy only, without classifying how or why models fail
2. Cross-model and cross-prompt comparisons are rarely conducted on identical question sets under identical conditions
3. Existing evaluation tools require specialised infrastructure and are inaccessible to non-specialist researchers

---

## Research Motivation

The central finding from this benchmark: **prompt strategy is not cosmetic**. Chain-of-thought prompting reduces the hallucination rate to approximately half that of zero-shot on this benchmark. On a 20-question medical QA set:

- LLaMA 3 70B zero-shot: 70% accuracy, 20% hallucination rate
- LLaMA 3 70B chain-of-thought: 85% accuracy, 10% hallucination rate

The gap between a 10% and 20% hallucination rate in a clinical tool is the difference between a research aid and a patient risk. This platform provides the infrastructure to quantify and communicate that gap.

---

## Dataset

**Primary benchmark:** 20 curated medical QA pairs with verified ground truth answers.

| Difficulty | Count |
|---|---|
| Easy | 8 |
| Medium | 8 |
| Hard | 4 |

**Domain coverage:** clinical pharmacology · anatomy and physiology · disease pathophysiology · treatment protocols and clinical guidelines · biochemistry and genetics

**Scoring pipeline:**

```
Ground Truth Answer
        │
        ▼
Keyword Extraction (content words > 3 characters)
        │
        ▼
Token-Level Match Ratio   ρ = |{w ∈ K : w ∈ R}| / |K|
        │
        ├── ρ ≥ 0.40  →  CORRECT
        │
        └── ρ < 0.40  →  INCORRECT → Hallucination Classification
                                ├── Overconfident  (certainty markers + response length > 200 chars)
                                ├── Fabricated     (zero keyword overlap + response length > 150 chars)
                                └── Factual Error  (all other incorrect responses)
```

---

## System Architecture

```
User Configuration (Model + Prompt Strategy + Sample Count)
        │
        ▼
Question Dispatch ──► Groq Cloud API (LLaMA3 / Mixtral / Gemma2)
        │
        ▼
Response Scoring ──► Keyword Match Ratio ──► Correct / Incorrect
        │
        ├──► Hallucination Classification (Fabricated / Overconfident / Factual Error)
        │
        ▼
Zustand Global State ──► Results Dashboard ──► Charts + Report Export
```

**Pages:**

| Page | Function |
|---|---|
| Dataset Explorer | Browse all 20 QA samples with category/difficulty filters; select subsets |
| Configure | Select model, prompt strategy, sample count, optional custom prompt override |
| Experiment Runner | Live Groq API calls with real-time per-question response display |
| Results Dashboard | Accuracy bar charts, hallucination pie charts, radar performance view |
| Hallucination Analysis | Side-by-side ground truth vs model output with type categorisation |
| Insights & Report | Research-style summary; one-click TXT report export |
| Ethics & About | Risk analysis, responsible AI principles, deployment disclaimer |

---

## Models Supported

| Display Name | Groq Model ID | Characteristics |
|---|---|---|
| LLaMA 3 8B | `llama3-8b-8192` | Fast inference; suitable for high-volume evaluation runs |
| LLaMA 3 70B | `llama3-70b-8192` | Higher accuracy; stronger on multi-step reasoning |
| Mixtral 8x7B | `mixtral-8x7b-32768` | Mixture-of-experts architecture; strong on reasoning tasks |
| Gemma 2 9B | `gemma2-9b-it` | Google instruction-tuned; efficient on factual QA |

---

## Prompt Strategies

| Strategy | Description |
|---|---|
| Zero-Shot | Direct question with no additional context — tests raw model knowledge |
| Structured | Explicit medical expert role framing with conciseness instruction |
| Chain-of-Thought | Step-by-step reasoning elicitation before the final answer |

---

## Hallucination Taxonomy

| Type | Detection Criteria | Clinical Risk |
|---|---|---|
| Overconfident | Response > 200 chars AND contains certainty markers (`therefore`, `thus`, `clearly`) | Highest |
| Fabricated | Response > 150 chars AND zero keyword overlap with ground truth | High |
| Factual Error | Incorrect response not matching above patterns | Medium |

---

## Results (from published write-up; individual runs vary due to stochastic decoding)

**Accuracy and hallucination rate by model and prompt strategy:**

| Model | Strategy | Accuracy | Hallucination Rate |
|---|---|---|---|
| LLaMA 3 70B | Zero-Shot | ~70% | ~20% |
| LLaMA 3 70B | Structured | ~80% | ~15% |
| LLaMA 3 70B | Chain-of-Thought | ~85% | ~10% |
| Mixtral 8x7B | Zero-Shot | ~65% | ~25% |
| Mixtral 8x7B | Structured | ~75% | ~20% |
| Mixtral 8x7B | Chain-of-Thought | ~80% | ~15% |
| LLaMA 3 8B | Zero-Shot | ~55% | ~30% |
| LLaMA 3 8B | Structured | ~65% | ~25% |
| LLaMA 3 8B | Chain-of-Thought | ~70% | ~20% |

**Hallucination type breakdown — LLaMA 3 70B:**

| Prompt Strategy | Factual Error | Fabricated | Overconfident | Total |
|---|---|---|---|---|
| Zero-Shot | 2 | 1 | 1 | 4 |
| Structured | 2 | 1 | 0 | 3 |
| Chain-of-Thought | 2 | 0 | 0 | 2 |

**Key observations:**
- Chain-of-thought prompting eliminates fabricated and overconfident failures at this benchmark scale
- Structured prompting removes overconfident responses but does not improve factual recall
- Hard-difficulty items (multi-hop clinical reasoning) show ~50% accuracy — the primary failure mode across all models
- Consistency score (1 − hallucination rate) ranges from 0.70 to 0.90 across all conditions

---

## Limitations

- **Scoring heuristic:** keyword match ratio is an approximation — semantically correct responses worded differently may be penalised
- **Small benchmark:** 20 QA samples limit statistical significance; results are directionally informative, not definitive
- **No persistence:** experiment results are session-scoped and not saved across browser sessions
- **Client-side API key:** Groq key is exposed via `NEXT_PUBLIC_` — not suitable for production without a server-side proxy
- **No fine-tuning:** models are evaluated without domain-specific medical adaptation
- **Single pass:** stochastic decoding means results vary across runs; multiple passes with confidence intervals are needed for rigorous conclusions

---

## Future Work

- Server-side API proxy to secure the Groq API key
- Expand benchmark to 100+ QA pairs with source citations
- Semantic similarity scoring via sentence embeddings alongside keyword match ratio
- Cross-run persistence using PostgreSQL or Supabase
- Support for fine-tuned medical LLMs (BioMedLM, Med-PaLM)
- JSON / CSV export for downstream statistical analysis
- Confidence calibration metrics and reliability diagrams
- Docker containerisation for reproducible local deployment

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| LLM Inference | Groq Cloud API (LLaMA 3 8B / 70B, Mixtral 8x7B, Gemma 2 9B) |
| State Management | Zustand |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Local Setup

**Prerequisites:** Node.js ≥ 18 · Groq API key (free at [console.groq.com](https://console.groq.com))

**1. Clone**
```bash
git clone https://github.com/yamireddy04/llm-reliability-lab.git
cd llm-reliability-lab
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment**

Create `.env.local` in the project root:
```
NEXT_PUBLIC_GROQ_API_KEY=gsk_your_key_here
```

**4. Run development server**
```bash
npm run dev
```
Visit `http://localhost:3000`

**5. Run an experiment**
- Go to **Dataset** → browse and optionally filter questions
- Go to **Configure** → choose model, prompt strategy, and sample count
- Go to **Experiment** → click Start Experiment and observe results stream live
- Navigate to **Results**, **Hallucination**, and **Insights** pages for full analysis

---

## Repository Structure

```
llm-reliability-lab/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── dataset/                  # Dataset explorer
│   ├── configure/                # Experiment configuration
│   ├── experiment/               # Live Groq inference runner
│   ├── results/                  # Accuracy and hallucination charts
│   ├── hallucination/            # Side-by-side analysis
│   ├── insights/                 # Report generation
│   └── ethics/                   # Responsible AI disclosure
├── lib/
│   ├── groq.ts                   # Groq API client
│   ├── scoring.ts                # Keyword match ratio + hallucination classification
│   └── store.ts                  # Zustand global experiment state
├── data/
│   └── questions.ts              # 20 curated medical QA pairs
├── paper/                        # Project write-up (PDF + LaTeX source)
└── README.md
```

---

*Built by Yamini G · [GitHub](https://github.com/yamireddy04/llm-reliability-lab) · [Live Demo](https://llm-reliability-lab.vercel.app)*
