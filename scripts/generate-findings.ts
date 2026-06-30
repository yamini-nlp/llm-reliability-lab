import Groq from "groq-sdk";
import { medicalDataset, type MedicalQuestion } from "../src/lib/data";
import { wilsonInterval, accuracyByGroup } from "../src/lib/stats";
import * as fs from "fs";
const GROQ_MODEL_MAP: Record<string, string> = {
  "llama3-8b": "llama-3.1-8b-instant",
  "llama3-70b": "llama-3.3-70b-versatile",
  "gpt-oss-120b": "openai/gpt-oss-120b",
};
const MODELS = ["llama3-70b"];
const STRATEGIES = ["zero-shot", "structured", "chain-of-thought"] as const;
const SAMPLE_SIZE = medicalDataset.length;

const JUDGE_MODEL = "llama-3.3-70b-versatile";
const DELAY_MS = 400; 
function buildPrompt(question: string, strategy: string): string {
  switch (strategy) {
    case "structured":
      return `You are a highly accurate medical expert. Answer the following medical question concisely and precisely. Only provide the direct answer without elaboration.\n\nQuestion: ${question}\n\nAnswer:`;
    case "chain-of-thought":
      return `Think through this medical question step by step, then provide your final concise answer.\n\nQuestion: ${question}\n\nStep-by-step reasoning and final answer:`;
    default:
      return `Question: ${question}\n\nAnswer:`;
  }
}

type HallucinationType = "overconfident" | "fabricated" | "factual_error" | undefined;

function scoreResponse(
  response: string,
  groundTruth: string
): { isCorrect: boolean; isHallucination: boolean; hallucinationType: HallucinationType } {
  const r = response.toLowerCase();
  const gt = groundTruth.toLowerCase();
  const keywords = gt.split(/[\s,()]+/).filter((w) => w.length > 3);
  const matchCount = keywords.filter((kw) => r.includes(kw)).length;
  const matchRatio = keywords.length > 0 ? matchCount / keywords.length : 0;

  const isCorrect = matchRatio >= 0.4;

  let isHallucination = false;
  let hallucinationType: HallucinationType = undefined;

  if (!isCorrect) {
    if (response.length > 200 && (r.includes("therefore") || r.includes("thus") || r.includes("clearly"))) {
      isHallucination = true;
      hallucinationType = "overconfident";
    } else if (response.length > 150 && !keywords.some((k) => r.includes(k))) {
      isHallucination = true;
      hallucinationType = "fabricated";
    } else {
      isHallucination = true;
      hallucinationType = "factual_error";
    }
  }

  return { isCorrect, isHallucination, hallucinationType };
}

async function judgeResponse(
  groq: Groq,
  question: string,
  groundTruth: string,
  modelResponse: string
): Promise<{ semanticCorrect: boolean; judgeConfidence: number; judgeRationale: string }> {
  try {
    const prompt = `You are grading a medical question answer for semantic correctness.

Question: ${question}

Ground truth answer: ${groundTruth}

Model response: ${modelResponse}

Decide whether the model response is semantically correct compared to the ground truth answer. Synonyms, rephrasing, or extra correct detail should be counted as correct. Wrong facts, fabricated specifics, or non-answers should be counted as incorrect.

Respond ONLY with JSON of this exact shape, with no other text:
{ "correct": boolean, "confidence": number between 0 and 1, "rationale": string under 200 characters }`;

    const completion = await groq.chat.completions.create({
      model: JUDGE_MODEL,
      messages: [
        { role: "system", content: "You are a strict, careful grading assistant. Output only valid JSON." },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    return {
      semanticCorrect: parsed.correct,
      judgeConfidence: parsed.confidence,
      judgeRationale: parsed.rationale,
    };
  } catch {
    return { semanticCorrect: false, judgeConfidence: 0, judgeRationale: "judge_api_error" };
  }
}

interface RunResult {
  model: string;
  strategy: string;
  questionId: number;
  question: string;
  groundTruth: string;
  modelResponse: string;
  isCorrect: boolean;
  isHallucination: boolean;
  hallucinationType: HallucinationType;
  ambiguityType: MedicalQuestion["ambiguityType"];
  semanticCorrect: boolean;
  judgeRationale: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not set. Export it or add it to .env.local and run with `node --env-file=.env.local` / `tsx --env-file=.env.local`.");
    process.exit(1);
  }
  const groq = new Groq({ apiKey });

  const questions = medicalDataset.slice(0, SAMPLE_SIZE);
  const allResults: RunResult[] = [];

  for (const modelKey of MODELS) {
    const groqModel = GROQ_MODEL_MAP[modelKey];
    if (!groqModel) {
      console.error(`Unknown model key "${modelKey}" — check GROQ_MODEL_MAP.`);
      continue;
    }

    for (const strategy of STRATEGIES) {
      console.log(`\n=== ${modelKey} / ${strategy} ===`);

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const prompt = buildPrompt(q.question, strategy);

        let modelResponse = "";
        try {
          const completion = await groq.chat.completions.create({
            model: groqModel,
            messages: [
              { role: "system", content: "You are a concise medical expert. Answer questions accurately and briefly." },
              { role: "user", content: prompt },
            ],
            max_tokens: 1000,
          });
          modelResponse = completion.choices[0]?.message?.content?.trim() || "No response from model.";
        } catch (err) {
          modelResponse = `API error: ${err instanceof Error ? err.message : String(err)}`;
        }

        const { isCorrect, isHallucination, hallucinationType } = scoreResponse(modelResponse, q.answer);
        await sleep(DELAY_MS);

        const judged = await judgeResponse(groq, q.question, q.answer, modelResponse);
        await sleep(DELAY_MS);

        allResults.push({
          model: modelKey,
          strategy,
          questionId: q.id,
          question: q.question,
          groundTruth: q.answer,
          modelResponse,
          isCorrect,
          isHallucination,
          hallucinationType,
          ambiguityType: q.ambiguityType,
          semanticCorrect: judged.semanticCorrect,
          judgeRationale: judged.judgeRationale,
        });

        process.stdout.write(isCorrect ? "." : "x");
      }
      console.log("");
    }
  }

  fs.writeFileSync("findings-raw.json", JSON.stringify(allResults, null, 2));
  console.log("\nWrote findings-raw.json");


  let md = `# Sample Findings\n\nGenerated ${new Date().toISOString().slice(0, 10)} against the live Groq API using the project's actual dataset and scoring logic. n=${SAMPLE_SIZE} per condition, single pass.\n\n`;

  for (const modelKey of MODELS) {
    for (const strategy of STRATEGIES) {
      const subset = allResults.filter((r) => r.model === modelKey && r.strategy === strategy);
      if (subset.length === 0) continue;

      const overall = accuracyByGroup(subset);
      const precise = accuracyByGroup(subset.filter((r) => r.ambiguityType === "precise"));
      const ambiguous = accuracyByGroup(subset.filter((r) => r.ambiguityType === "ambiguous"));

      const judged = subset.filter((r) => r.semanticCorrect !== undefined);
      const agreementCount = judged.filter((r) => r.semanticCorrect === r.isCorrect).length;
      const agreementRate = judged.length > 0 ? Math.round((agreementCount / judged.length) * 100) : null;

      const hallTypes = subset.reduce<Record<string, number>>((acc, r) => {
        if (r.hallucinationType) acc[r.hallucinationType] = (acc[r.hallucinationType] || 0) + 1;
        return acc;
      }, {});

      md += `## ${modelKey} — ${strategy}\n\n`;
      md += `- Accuracy: ${overall.rate}% (${overall.lower}-${overall.upper}% CI, n=${overall.n})\n`;
      md += `- Precise phrasing: ${precise.rate}% (n=${precise.n}) · Ambiguous phrasing: ${ambiguous.rate}% (n=${ambiguous.n})\n`;
      md += `- Judge agreement rate: ${agreementRate !== null ? `${agreementRate}%` : "N/A"} (${agreementCount}/${judged.length})\n`;
      md += `- Hallucination types: ${Object.entries(hallTypes).map(([k, v]) => `${k}=${v}`).join(", ") || "none"}\n\n`;
    }
  }

  fs.writeFileSync("findings-summary.md", md);
  console.log("Wrote findings-summary.md");
}

main();