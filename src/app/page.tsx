"use client";
import Link from "next/link";
import { ArrowRight, Brain, ShieldAlert, BarChart3, Microscope, Zap, GitCompare, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { medicalDataset } from "@/lib/data";

const terminalLines = [
  "$ initializing llm-reliability-lab...",
  `$ loading medical QA dataset [${medicalDataset.length} samples]`,
  "$ connecting to groq cloud api...",
  "$ prompt strategy: chain-of-thought",
  "$ running evaluation pipeline...",
  "> accuracy: 0.82 | hallucination_rate: 0.11",
  "> consistency_score: 0.91",
  "$ experiment complete. generating report...",
];

function Terminal() {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < terminalLines.length) {
        setLines((prev) => [...prev, terminalLines[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-surface/80 backdrop-blur p-5 font-mono text-xs leading-6 relative overflow-hidden">
      <div className="flex gap-1.5 mb-4">
        <div className="w-3 h-3 rounded-full bg-danger/60" />
        <div className="w-3 h-3 rounded-full bg-warn/60" />
        <div className="w-3 h-3 rounded-full bg-accent3/60" />
        <span className="ml-2 text-muted text-[10px]">llm-lab — terminal</span>
      </div>
      <div className="space-y-0.5">
      {lines.filter(Boolean).map((line, i) => (
      <div
      key={i}
      className={`${
      line.startsWith(">")
                ? "text-accent3"
                : line.startsWith("$")
                ? "text-accent"
                : "text-dim"
            }`}
          >
            {line}
          </div>
        ))}
        {lines.length < terminalLines.length && (
          <div className="text-accent cursor-blink" />
        )}
      </div>
    </div>
  );
}

const features = [
  {
    icon: <GitCompare size={20} />,
    title: "Multi-Model Comparison",
    desc: "Evaluate multiple LLM configurations side-by-side with unified metrics and statistical analysis.",
    color: "text-accent",
    border: "border-accent/20",
    bg: "bg-accent/5",
  },
  {
    icon: <AlertTriangle size={20} />,
    title: "Hallucination Detection",
    desc: "Automatically flag factual errors, fabricated information, and overconfident incorrect responses.",
    color: "text-danger",
    border: "border-danger/20",
    bg: "bg-danger/5",
  },
  {
    icon: <BarChart3 size={20} />,
    title: "Prompt Strategy Testing",
    desc: "Compare zero-shot, structured, and chain-of-thought prompting across identical question sets.",
    color: "text-accent2",
    border: "border-accent2/20",
    bg: "bg-accent2/5",
  },
  {
    icon: <CheckCircle2 size={20} />,
    title: "Accuracy Metrics",
    desc: "Track accuracy, consistency scores, and confidence calibration with exportable research reports.",
    color: "text-accent3",
    border: "border-accent3/20",
    bg: "bg-accent3/5",
  },
];

const steps = [
  {
    num: "01",
    title: "Configure Experiment",
    desc: "Select your model, prompting strategy, and the subset of medical QA samples to evaluate.",
    icon: <Microscope size={16} />,
  },
  {
    num: "02",
    title: "Run Evaluation",
    desc: "The pipeline sends questions to the LLM, collects responses, and scores them against ground truth.",
    icon: <Zap size={16} />,
  },
  {
    num: "03",
    title: "Analyze Results",
    desc: "Explore accuracy metrics, hallucination cases, and model comparison charts in a research dashboard.",
    icon: <BarChart3 size={16} />,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <section className="relative px-6 pt-20 pb-24 max-w-7xl mx-auto">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[200px] bg-accent2/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative grid md:grid-cols-2 gap-12 items-center">
          <div>  
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              LLM{" "}
              <span className="text-accent text-glow-cyan">Reliability</span>
              <br />
              Lab
            </h1>

            <p className="text-dim text-base leading-relaxed mb-8 max-w-md">
              A systematic framework for evaluating how large language models perform on
              medical question answering — measuring accuracy, hallucination behavior,
              and prompt strategy effectiveness.
            </p>

            <div className="flex items-center gap-3">
              <Link
                href="/configure"
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-bg rounded-lg font-mono text-sm font-semibold hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/20"
              >
                Start Experiment <ArrowRight size={15} />
              </Link>
              <Link
                href="/dataset"
                className="flex items-center gap-2 px-5 py-2.5 border border-border text-dim rounded-lg font-mono text-sm hover:border-accent/40 hover:text-text transition-all"
              >
                Explore Dataset
              </Link>
            </div>

            <div className="flex items-center gap-6 mt-8 text-xs font-mono text-muted">
              <span>{`${medicalDataset.length} QA samples`}</span>
              <span className="text-border">|</span>
              <span>3 prompt strategies</span>
              <span className="text-border">|</span>
              <span>Live LLM eval</span>
            </div>
          </div>

          <div>
            <Terminal />
          </div>
        </div>
      </section>

      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl font-bold text-white mb-3">
            Platform Capabilities
          </h2>
          <p className="text-dim text-sm max-w-md mx-auto">
            Built for reproducible, rigorous evaluation of LLM reliability in
            high-stakes domains.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className={`card-hover p-5 rounded-xl border ${f.border} ${f.bg} backdrop-blur`}
            >
              <div className={`${f.color} mb-3`}>{f.icon}</div>
              <h3 className="font-display font-semibold text-white text-sm mb-2">
                {f.title}
              </h3>
              <p className="text-dim text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 max-w-7xl mx-auto border-t border-border">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl font-bold text-white mb-3">
            How It Works
          </h2>
          <p className="text-dim text-sm max-w-md mx-auto">
            Three steps from configuration to publishable research insights.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(100%+0px)] w-full h-px bg-gradient-to-r from-border to-transparent z-10" />
              )}
              <div className="p-6 rounded-xl border border-border bg-surface/50 hover:border-accent/20 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-display text-3xl font-bold text-accent/20">
                    {step.num}
                  </span>
                  <div className="w-7 h-7 rounded bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    {step.icon}
                  </div>
                </div>
                <h3 className="font-display font-semibold text-white text-sm mb-2">
                  {step.title}
                </h3>
                <p className="text-dim text-xs leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 max-w-7xl mx-auto border-t border-border">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-danger/20 bg-danger/5 text-danger text-xs font-mono mb-4">
              <ShieldAlert size={12} /> AI Safety in Healthcare
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-4">
              Why Reliability Matters
            </h2>
            <p className="text-dim text-sm leading-relaxed mb-4">
              LLMs are increasingly used in clinical decision support, patient
              education, and drug information systems. A hallucinated diagnosis or
              incorrect dosage recommendation can have life-altering consequences.
            </p>
            <p className="text-dim text-sm leading-relaxed mb-6">
              This platform provides a systematic, reproducible methodology for
              measuring how reliably LLMs answer medical questions — and where they
              fail.
            </p>
            <Link
              href="/ethics"
              className="text-accent text-sm font-mono flex items-center gap-1 hover:gap-2 transition-all"
            >
              Read Ethics Statement <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Avg. Accuracy", value: "82%", color: "text-accent3" },
              { label: "Hallucination Rate", value: "11%", color: "text-danger" },
              { label: "Consistency Score", value: "0.91", color: "text-accent" },
              { label: "Questions Tested", value: medicalDataset.length.toString(), color: "text-accent2" },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-5 rounded-xl border border-border bg-surface/50 text-center"
              >
                <div className={`font-display text-3xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-dim text-xs font-mono">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent2/5 pointer-events-none" />
          <Brain size={32} className="text-accent mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-white mb-3">
            Ready to run your experiment?
          </h2>
          <p className="text-dim text-sm mb-6 max-w-md mx-auto">
            Configure your model and prompt strategy, then evaluate LLM performance
            on curated medical QA benchmarks.
          </p>
          <Link
            href="/configure"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg rounded-lg font-mono text-sm font-bold hover:bg-accent/90 transition-all"
          >
            Start Experiment <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-muted text-xs font-mono">
      <p>LLM Reliability Lab — AI Safety Research · Built with Next.js + Groq Cloud API</p>
      </footer>
    </div>
  );
}