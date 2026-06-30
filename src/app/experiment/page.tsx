"use client";
import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { medicalDataset, ExperimentResult } from "@/lib/data";
import { useRouter } from "next/navigation";
import { Play, Square, RotateCcw, CheckCircle, XCircle, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import { judgeResponse } from "@/lib/judge";

function buildPrompt(question: string, strategy: string, custom?: string): string {
  if (custom && custom.trim()) return custom.replace("{question}", question);
  switch (strategy) {
    case "structured":
      return `You are a highly accurate medical expert. Answer the following medical question concisely and precisely. Only provide the direct answer without elaboration.\n\nQuestion: ${question}\n\nAnswer:`;
    case "chain-of-thought":
      return `Think through this medical question step by step, then provide your final concise answer.\n\nQuestion: ${question}\n\nStep-by-step reasoning and final answer:`;
    default:
      return `Question: ${question}\n\nAnswer:`;
  }
}
function scoreResponse(
  response: string,
  groundTruth: string
): { isCorrect: boolean; isHallucination: boolean; hallucinationType?: ExperimentResult["hallucinationType"] } {
  const r = response.toLowerCase();
  const gt = groundTruth.toLowerCase();
  const keywords = gt.split(/[\s,()]+/).filter((w) => w.length > 3);
  const matchCount = keywords.filter((kw) => r.includes(kw)).length;
  const matchRatio = keywords.length > 0 ? matchCount / keywords.length : 0;

  const isCorrect = matchRatio >= 0.4;

  let isHallucination = false;
  let hallucinationType: ExperimentResult["hallucinationType"] = undefined;

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

function getMockResponse(question: string, model: string, groundTruth: string): string {
  const coin = Math.random();
  if (model === "gpt-4-mock") {
    if (coin > 0.2) return groundTruth;
    return (
      "Based on current clinical guidelines, the answer would be " +
      groundTruth.split(" ")[0] +
      " derivatives, though this may vary by patient context and comorbidities."
    );
  }
  if (model === "llama-mock") {
    if (coin > 0.3) return groundTruth;
    if (coin > 0.15)
      return (
        "This is a complex medical question. The primary consideration involves " +
        question.split(" ").slice(-3).join(" ") +
        " and related pathophysiology."
      );
    return "The treatment involves multiple factors and clinical judgment. Generally speaking, the standard approach involves supportive care and specialist referral.";
  }
  return groundTruth;
}

const GROQ_MODEL_MAP: Record<string, string> = {
  "llama3-8b":   "llama3-8b-8192",
  "llama3-70b":  "llama3-70b-8192",
  "mixtral":     "mixtral-8x7b-32768",
  "gemma2":      "gemma2-9b-it",
};

const GROQ_MODELS = new Set(Object.keys(GROQ_MODEL_MAP));

export default function ExperimentPage() {
  const router = useRouter();
  const {
    config,
    selectedQuestions,
    results,
    addResult,
    clearResults,
    setIsRunning,
    isRunning,
    progress,
    setProgress,
  } = useAppStore();

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentResponse, setCurrentResponse] = useState("");
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const questions =
    selectedQuestions.length > 0
      ? selectedQuestions.slice(0, config.sampleCount)
      : medicalDataset.slice(0, config.sampleCount);

  const runExperiment = async () => {
    clearResults();
    setDone(false);
    setApiError(null);
    setIsRunning(true);
    abortRef.current = false;
    setCurrentIndex(0);

    for (let i = 0; i < questions.length; i++) {
      if (abortRef.current) break;

      const q = questions[i];
      setCurrentIndex(i);
      setCurrentResponse("");
      setProgress(Math.round((i / questions.length) * 100));

      let modelResponse = "";

      try {
        if (GROQ_MODELS.has(config.model)) {
          const groqModel = GROQ_MODEL_MAP[config.model];
          const prompt = buildPrompt(q.question, config.promptStrategy, config.customPrompt);

          const res = await fetch("/api/groq", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: groqModel,
              messages: [
                {
                  role: "system",
                  content:
                    "You are a concise medical expert. Answer questions accurately and briefly.",
                },
                { role: "user", content: prompt },
              ],
              max_tokens: 1000,
            }),
          });

          const parsed = await res.json();

          if (!res.ok) {
            throw new Error(parsed.error);
          }

          modelResponse = parsed.content || "No response from model.";
        } else {
          await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
          modelResponse = getMockResponse(q.question, config.model, q.answer);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        modelResponse = `API error: ${message}`;
        setApiError(`Question #${q.id} failed: ${message}`);
      }

      setCurrentResponse(modelResponse);

      const { isCorrect, isHallucination, hallucinationType } = scoreResponse(
        modelResponse,
        q.answer
      );

      const judgeResult = GROQ_MODELS.has(config.model)
        ? await judgeResponse(q.question, q.answer, modelResponse)
        : { semanticCorrect: undefined, judgeConfidence: undefined, judgeRationale: undefined };

      const result: ExperimentResult = {
        questionId: q.id,
        question: q.question,
        groundTruth: q.answer,
        modelResponse,
        isCorrect,
        isHallucination,
        hallucinationType,
        model: config.model,
        promptStrategy: config.promptStrategy,
        ambiguityType: q.ambiguityType,
        semanticCorrect: judgeResult.semanticCorrect,
        judgeConfidence: judgeResult.judgeConfidence,
        judgeRationale: judgeResult.judgeRationale,
      };

      addResult(result);
      await new Promise((r) => setTimeout(r, 400));
    }

    setProgress(100);
    setIsRunning(false);
    setDone(true);
  };

  const stopExperiment = () => {
    abortRef.current = true;
    setIsRunning(false);
  };

  const reset = () => {
    abortRef.current = true;
    setIsRunning(false);
    clearResults();
    setCurrentIndex(-1);
    setCurrentResponse("");
    setDone(false);
    setProgress(0);
    setApiError(null);
  };

  const currentQ = currentIndex >= 0 ? questions[currentIndex] : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-accent text-xs font-mono mb-2">
          <Play size={12} /> experiment runner
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Run Experiment</h1>
        <p className="text-dim text-sm">
          Live evaluation pipeline · {questions.length} questions · {config.model} ·{" "}
          {config.promptStrategy}
        </p>
      </div>

      {apiError && (
        <div className="mb-4 p-4 rounded-xl border border-danger/30 bg-danger/5 text-danger text-xs font-mono">
          ⚠ {apiError}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        {!isRunning && !done && (
          <button
            onClick={runExperiment}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-bg rounded-lg font-mono text-sm font-bold hover:bg-accent/90 transition-all"
          >
            <Play size={14} /> Start Experiment
          </button>
        )}
        {isRunning && (
          <button
            onClick={stopExperiment}
            className="flex items-center gap-2 px-5 py-2.5 bg-danger/20 border border-danger/30 text-danger rounded-lg font-mono text-sm hover:bg-danger/30 transition-all"
          >
            <Square size={14} /> Stop
          </button>
        )}
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2.5 border border-border text-dim rounded-lg font-mono text-sm hover:text-text hover:border-border/80 transition-all"
        >
          <RotateCcw size={14} /> Reset
        </button>
        {done && (
          <button
            onClick={() => router.push("/results")}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-accent3/20 border border-accent3/30 text-accent3 rounded-lg font-mono text-sm font-bold hover:bg-accent3/30 transition-all"
          >
            View Results <ArrowRight size={14} />
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs font-mono text-muted mb-2">
          <span>
            {isRunning
              ? `Processing question ${currentIndex + 1}/${questions.length}...`
              : done
              ? "Experiment complete"
              : "Ready"}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface border border-border overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {currentQ && (
        <div className="mb-6 p-5 rounded-xl border border-accent/20 bg-accent/5 scan-line relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            {isRunning ? (
              <Loader2 size={14} className="text-accent animate-spin" />
            ) : (
              <CheckCircle size={14} className="text-accent3" />
            )}
            <span className="text-xs font-mono text-accent">
              PROCESSING #{String(questions[currentIndex]?.id).padStart(2, "0")}
            </span>
          </div>
          <p className="text-sm text-text font-medium mb-3">{currentQ.question}</p>
          {currentResponse && (
            <div className="p-3 rounded-lg bg-surface border border-border">
              <div className="text-[10px] font-mono text-muted mb-1">MODEL RESPONSE</div>
              <p className="text-xs text-dim leading-relaxed">{currentResponse}</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {results.map((r, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl border transition-all ${
              r.isHallucination
                ? "border-danger/20 bg-danger/5"
                : r.isCorrect
                ? "border-accent3/20 bg-accent3/5"
                : "border-warn/20 bg-warn/5"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {r.isHallucination ? (
                  <AlertTriangle size={15} className="text-danger" />
                ) : r.isCorrect ? (
                  <CheckCircle size={15} className="text-accent3" />
                ) : (
                  <XCircle size={15} className="text-warn" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-muted">
                    #{String(r.questionId).padStart(2, "0")}
                  </span>
                  {r.isHallucination && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-danger/30 text-danger bg-danger/10">
                      {r.hallucinationType?.replace("_", " ").toUpperCase()}
                    </span>
                  )}
                  {r.isCorrect && (
                    <span className="text-[9px] font-mono text-accent3">CORRECT</span>
                  )}
                  {r.semanticCorrect !== undefined && r.semanticCorrect !== r.isCorrect && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-warn/30 text-warn bg-warn/10">
                      JUDGE DISAGREES
                    </span>
                  )}
                </div>
                <p className="text-xs text-dim truncate">{r.question}</p>
                <div className="mt-1 text-[10px] font-mono">
                  <span className="text-muted">GT: </span>
                  <span className="text-text">{r.groundTruth.substring(0, 60)}...</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {done && results.length > 0 && (
        <div className="mt-6 p-5 rounded-xl border border-accent/20 bg-surface/50">
          <h3 className="font-display font-semibold text-white text-sm mb-4">Quick Summary</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg border border-accent3/20 bg-accent3/5">
              <div className="font-display text-2xl font-bold text-accent3">
                {Math.round(
                  (results.filter((r) => r.isCorrect).length / results.length) * 100
                )}
                %
              </div>
              <div className="text-[10px] font-mono text-muted">Accuracy</div>
            </div>
            <div className="text-center p-3 rounded-lg border border-danger/20 bg-danger/5">
              <div className="font-display text-2xl font-bold text-danger">
                {Math.round(
                  (results.filter((r) => r.isHallucination).length / results.length) * 100
                )}
                %
              </div>
              <div className="text-[10px] font-mono text-muted">Hallucination Rate</div>
            </div>
            <div className="text-center p-3 rounded-lg border border-accent/20 bg-accent/5">
              <div className="font-display text-2xl font-bold text-accent">
                {results.length}
              </div>
              <div className="text-[10px] font-mono text-muted">Questions Evaluated</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}