"use client";
import { useAppStore } from "@/lib/store";
import { medicalDataset } from "@/lib/data";
import { useRouter } from "next/navigation";
import { Settings, Cpu, MessageSquare, Hash, ArrowRight, ChevronRight } from "lucide-react";

const models = [
  {
    id: "llama3-8b",
    name: "Llama 3.1 8B Instant",
    provider: "Meta (via Groq)",
    desc: "Fast, low-latency open-weight model. Good baseline for quick runs.",
    badge: "LIVE API",
    badgeColor: "text-accent3 border-accent3/20 bg-accent3/5",
  },
  {
    id: "llama3-70b",
    name: "Llama 3.3 70B Versatile",
    provider: "Meta (via Groq)",
    desc: "Larger open-weight model, stronger reasoning, still served at low latency by Groq.",
    badge: "LIVE API",
    badgeColor: "text-accent3 border-accent3/20 bg-accent3/5",
  },
  {
    id: "gpt-oss-120b",
    name: "GPT-OSS 120B",
    provider: "OpenAI (via Groq)",
    desc: "Open-weight flagship model with reasoning capabilities, served on Groq's LPU hardware.",
    badge: "LIVE API",
    badgeColor: "text-accent3 border-accent3/20 bg-accent3/5",
  },
  {
    id: "gpt-4-mock",
    name: "GPT-4 (Mock)",
    provider: "OpenAI",
    desc: "Simulated GPT-4 responses for comparative analysis. Uses pre-generated outputs.",
    badge: "SIMULATED",
    badgeColor: "text-warn border-warn/20 bg-warn/5",
  },
  {
    id: "llama-mock",
    name: "LLaMA 3.1 (Mock)",
    provider: "Meta",
    desc: "Open-source model simulation. Demonstrates open vs closed model comparison.",
    badge: "SIMULATED",
    badgeColor: "text-warn border-warn/20 bg-warn/5",
  },
  {
    id: "oracle",
    name: "Ground-Truth Oracle",
    provider: "Scripted baseline",
    desc: "Always returns the exact ground-truth answer. Fixed reference point for comparison, not a model.",
    badge: "BASELINE",
    badgeColor: "text-muted border-muted/20 bg-muted/5",
  },
];

const promptStrategies = [
  {
    id: "zero-shot",
    name: "Zero-Shot",
    desc: "Direct question without examples or instructions. Tests raw model knowledge.",
    example: "Q: {question}\nA:",
    color: "text-accent",
  },
  {
    id: "structured",
    name: "Structured Prompt",
    desc: "Provides role context and output format. Encourages organized responses.",
    example: "You are a medical expert. Answer concisely and accurately.\nQ: {question}\nA:",
    color: "text-accent2",
  },
  {
    id: "chain-of-thought",
    name: "Chain-of-Thought",
    desc: "Instructs the model to reason step-by-step before answering.",
    example: "Think step by step, then provide your final answer.\nQ: {question}\nReasoning:",
    color: "text-accent3",
  },
];

export default function ConfigurePage() {
  const router = useRouter();
  const { config, setConfig, selectedQuestions, setSelectedQuestions } = useAppStore();

  const handleStart = () => {
    if (selectedQuestions.length === 0) {
      const count = Math.min(config.sampleCount, medicalDataset.length);
      setSelectedQuestions(medicalDataset.slice(0, count));
    }
    router.push("/experiment");
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-accent text-xs font-mono mb-2">
          <Settings size={12} /> experiment configurator
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Configure Experiment
        </h1>
        <p className="text-dim text-sm">
          Set up your evaluation pipeline. Choose a model, prompting strategy, and sample size.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={15} className="text-accent" />
            <h2 className="font-display font-semibold text-white text-sm">Model Selection</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {models.map((m) => {
              const active = config.model === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setConfig({ model: m.id })}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    active
                      ? "border-accent/40 bg-accent/5 glow-cyan"
                      : "border-border bg-surface/50 hover:border-border/80"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{m.name}</div>
                      <div className="text-[10px] font-mono text-muted">{m.provider}</div>
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${m.badgeColor}`}>
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-xs text-dim leading-relaxed">{m.desc}</p>
                  {active && (
                    <div className="mt-3 flex items-center gap-1 text-accent text-xs font-mono">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={15} className="text-accent2" />
            <h2 className="font-display font-semibold text-white text-sm">Prompt Strategy</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {promptStrategies.map((p) => {
              const active = config.promptStrategy === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setConfig({ promptStrategy: p.id })}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    active
                      ? "border-accent2/40 bg-accent2/5"
                      : "border-border bg-surface/50 hover:border-border/80"
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${active ? p.color : "text-white"}`}>
                    {p.name}
                  </div>
                  <p className="text-xs text-dim leading-relaxed mb-3">{p.desc}</p>
                  <div className="p-2 rounded bg-bg border border-border text-[10px] font-mono text-muted leading-relaxed whitespace-pre-wrap">
                    {p.example}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={15} className="text-muted" />
            <h2 className="font-display font-semibold text-white text-sm">
              Custom Prompt Template{" "}
              <span className="text-muted font-normal text-xs">(optional)</span>
            </h2>
          </div>
          <textarea
            value={config.customPrompt}
            onChange={(e) => setConfig({ customPrompt: e.target.value })}
            placeholder="Enter a custom prompt template. Use {question} as placeholder..."
            rows={3}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-mono text-text placeholder:text-muted outline-none focus:border-accent/40 transition-all resize-none"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Hash size={15} className="text-accent3" />
            <h2 className="font-display font-semibold text-white text-sm">Sample Count</h2>
            <span className="ml-auto font-mono text-accent font-bold">{config.sampleCount}</span>
          </div>
          <input
            type="range"
            min={1}
            max={medicalDataset.length}
            value={config.sampleCount}
            onChange={(e) => setConfig({ sampleCount: parseInt(e.target.value) })}
            className="w-full accent-[#6ee7f7]"
          />
          <div className="flex justify-between text-[10px] font-mono text-muted mt-1">
            <span>1 (quick)</span>
            <span>10 (balanced)</span>
            <span>{`${medicalDataset.length} (full)`}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-accent/20 bg-accent/5">
          <h3 className="font-display font-semibold text-white text-sm mb-3">Experiment Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Model", value: models.find((m) => m.id === config.model)?.name ?? config.model },
              { label: "Strategy", value: promptStrategies.find((p) => p.id === config.promptStrategy)?.name ?? config.promptStrategy },
              { label: "Samples", value: config.sampleCount },
              { label: "Pre-selected", value: selectedQuestions.length > 0 ? `${selectedQuestions.length} from Dataset` : "Auto-select" },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-surface/50">
                <div className="text-[10px] font-mono text-muted mb-1">{s.label}</div>
                <div className="text-sm text-text font-medium truncate">{String(s.value)}</div>
              </div>
            ))}
          </div>

          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-bg rounded-lg font-mono font-bold text-sm hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/20"
          >
            Launch Experiment <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}