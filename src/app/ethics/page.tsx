"use client";
import { ShieldAlert, Brain, Scale, Users, Heart, AlertTriangle } from "lucide-react";

const risks = [
  {
    icon: <AlertTriangle size={18} />,
    title: "Hallucination in Clinical Contexts",
    desc: "LLMs can generate medically plausible but factually incorrect information with high confidence. In clinical settings, this can lead to misdiagnosis, incorrect treatment recommendations, or drug interactions being missed.",
    severity: "CRITICAL",
    color: "text-danger",
    border: "border-danger/20",
    bg: "bg-danger/5",
  },
  {
    icon: <Scale size={18} />,
    title: "Bias and Fairness",
    desc: "Medical LLMs trained on biased datasets may underperform for underrepresented populations — including racial minorities, women, elderly patients, and those with rare diseases — perpetuating healthcare disparities.",
    severity: "HIGH",
    color: "text-warn",
    border: "border-warn/20",
    bg: "bg-warn/5",
  },
  {
    icon: <Brain size={18} />,
    title: "Reliability and Consistency",
    desc: "LLMs are non-deterministic. The same question may receive different answers across sessions, making it difficult to establish clinical reliability standards or regulatory approval pathways.",
    severity: "HIGH",
    color: "text-accent2",
    border: "border-accent2/20",
    bg: "bg-accent2/5",
  },
  {
    icon: <Users size={18} />,
    title: "Patient Autonomy and Consent",
    desc: "Patients may not realize they are receiving AI-generated medical information. Transparency about AI involvement in care decisions is an ethical imperative under principles of informed consent.",
    severity: "MEDIUM",
    color: "text-accent",
    border: "border-accent/20",
    bg: "bg-accent/5",
  },
];

const principles = [
  "All LLM outputs in clinical contexts must be reviewed and validated by qualified medical professionals.",
  "AI should augment — never replace — clinical judgment. It is a decision-support tool, not a decision-maker.",
  "Models must be evaluated on diverse demographic and linguistic datasets before deployment.",
  "Confidence scores and uncertainty estimates must be communicated to end users.",
  "Patients must be informed when AI plays a role in their care and have the right to opt out.",
  "Evaluation pipelines (like this one) must be reproducible, transparent, and open to peer review.",
];

export default function EthicsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-accent text-xs font-mono mb-2">
          <ShieldAlert size={12} /> ethics & about
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-3">
          Ethics Statement & Project Overview
        </h1>
        <p className="text-dim text-sm leading-relaxed max-w-2xl">
          Responsible AI development requires rigorous critical thinking about risks, failure modes, and societal impact.
          This page documents our ethical considerations for deploying LLMs in medical contexts.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="font-display text-xl font-bold text-white mb-5 flex items-center gap-2">
          <AlertTriangle size={18} className="text-danger" /> Risk Analysis
        </h2>
        <div className="space-y-4">
          {risks.map((risk, i) => (
            <div key={i} className={`p-5 rounded-xl border ${risk.border} ${risk.bg}`}>
              <div className="flex items-start gap-3">
                <div className={`${risk.color} mt-0.5 shrink-0`}>{risk.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display font-semibold text-white text-sm">{risk.title}</h3>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${risk.border} ${risk.color}`}>
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-xs text-dim leading-relaxed">{risk.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl font-bold text-white mb-5 flex items-center gap-2">
          <Heart size={18} className="text-accent" /> Ethical Principles
        </h2>
        <div className="p-6 rounded-xl border border-accent/20 bg-accent/5">
          <ul className="space-y-3">
            {principles.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-accent font-mono text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}.</span>
                <p className="text-sm text-dim leading-relaxed">{p}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-10">
        <div className="p-5 rounded-xl border border-danger/20 bg-danger/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-danger" />
            <span className="font-mono text-xs text-danger font-bold">IMPORTANT DISCLAIMER</span>
          </div>
          <p className="text-xs text-dim leading-relaxed">
            This platform is a <strong className="text-text">research prototype</strong> intended for academic evaluation only.
            It is NOT a clinical decision support system. Results generated here should NOT be used to inform real medical
            decisions. Always consult qualified healthcare professionals for medical advice.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl font-bold text-white mb-5 flex items-center gap-2">
          <Brain size={18} className="text-accent2" /> About This Project
        </h2>
        <div className="p-6 rounded-xl border border-border bg-surface/50">
          <h3 className="font-semibold text-white text-sm mb-3">Project Motivation</h3>
          <p className="text-xs text-dim leading-relaxed mb-4">
            As LLMs become increasingly integrated into healthcare workflows — from clinical decision support to patient
            chatbots — rigorous evaluation of their reliability becomes an AI safety imperative. This project provides
            a systematic, reproducible framework for benchmarking LLM performance on medical QA tasks.
          </p>

          <h3 className="font-semibold text-white text-sm mb-3">Research Goals</h3>
          <ul className="space-y-1 text-xs text-dim">
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">→</span> Quantify hallucination rates across different prompting strategies</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">→</span> Compare open and closed-source model reliability on medical benchmarks</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">→</span> Develop reproducible evaluation methodology for medical AI systems</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">→</span> Contribute to responsible AI deployment guidelines in healthcare</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-white mb-4">Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "Next.js 15", role: "Frontend Framework" },
            { name: "Groq Cloud API", role: "LLM Backend" },
            { name: "Recharts", role: "Data Visualization" },
            { name: "Zustand", role: "State Management" },
            { name: "Tailwind CSS", role: "UI Styling" },
            { name: "TypeScript", role: "Type Safety" },
            { name: "JetBrains Mono", role: "Terminal Aesthetic" },
            { name: "Syne + DM Sans", role: "Typography" },
          ].map((t, i) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-surface/50">
              <div className="text-sm text-text font-medium">{t.name}</div>
              <div className="text-[10px] font-mono text-muted">{t.role}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}