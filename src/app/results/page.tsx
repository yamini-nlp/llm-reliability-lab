"use client";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { BarChart3, AlertTriangle, CheckCircle, TrendingUp, ArrowRight } from "lucide-react";
import { accuracyByGroup } from "@/lib/stats";

const COLORS = ["#6ee7f7", "#f87171", "#a78bfa", "#34d399", "#f59e0b"];

export default function ResultsPage() {
  const { results } = useAppStore();

  if (results.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <BarChart3 size={40} className="text-muted mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-white mb-2">No Results Yet</h2>
        <p className="text-dim text-sm mb-6">Run an experiment first to see your results here.</p>
        <Link href="/configure" className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-bg rounded-lg font-mono text-sm font-bold">
          Configure Experiment <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const total = results.length;
  const correct = results.filter((r) => r.isCorrect).length;
  const hallucinated = results.filter((r) => r.isHallucination).length;
  const accuracy = Math.round((correct / total) * 100);
  const hallucinationRate = Math.round((hallucinated / total) * 100);
  const overallStats = accuracyByGroup(results);

  const halTypes = ["factual_error", "fabricated", "overconfident"].map((t) => ({
    name: t.replace("_", " "),
    value: results.filter((r) => r.hallucinationType === t).length,
  })).filter((d) => d.value > 0);

  const byPrompt = results.reduce((acc: Record<string, { correct: number; total: number }>, r) => {
    if (!acc[r.promptStrategy]) acc[r.promptStrategy] = { correct: 0, total: 0 };
    acc[r.promptStrategy].total++;
    if (r.isCorrect) acc[r.promptStrategy].correct++;
    return acc;
  }, {});
  const promptData = Object.entries(byPrompt).map(([k, v]) => ({
    name: k,
    accuracy: Math.round((v.correct / v.total) * 100),
    hallucination: Math.round(((v.total - v.correct) / v.total) * 100),
  }));

  const radarData = [
    { metric: "Accuracy", value: accuracy },
    { metric: "Low Halluc.", value: 100 - hallucinationRate },
    { metric: "Consistency", value: overallStats.rate },
    { metric: "Coverage", value: Math.round((total / 20) * 100) },
    { metric: "Confidence", value: 75 },
  ];

  const preciseStats = accuracyByGroup(results.filter((r) => r.ambiguityType === "precise"));
  const ambiguousStats = accuracyByGroup(results.filter((r) => r.ambiguityType === "ambiguous"));

  const judgedCount = results.filter((r) => r.semanticCorrect !== undefined).length;
  const agreementCount = results.filter((r) => r.semanticCorrect !== undefined && r.semanticCorrect === r.isCorrect).length;
  const agreementRate = judgedCount > 0 ? Math.round((agreementCount / judgedCount) * 100) : null;
  const disagreementCases = results.filter((r) => r.semanticCorrect !== undefined && r.semanticCorrect !== r.isCorrect).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-accent text-xs font-mono mb-2">
          <BarChart3 size={12} /> results dashboard
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Results Dashboard</h1>
        <p className="text-dim text-sm">{total} questions evaluated · {results[0]?.model} · {results[0]?.promptStrategy}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Accuracy", value: `${accuracy}%`, icon: <CheckCircle size={16} />, color: "text-accent3", border: "border-accent3/20", bg: "bg-accent3/5" },
          { label: "Hallucination Rate", value: `${hallucinationRate}%`, icon: <AlertTriangle size={16} />, color: "text-danger", border: "border-danger/20", bg: "bg-danger/5" },
          { label: "Accuracy (95% CI)", value: `${overallStats.rate}% (${overallStats.lower}-${overallStats.upper}%)`, icon: <TrendingUp size={16} />, color: "text-accent", border: "border-accent/20", bg: "bg-accent/5" },
          { label: "Questions Tested", value: total, icon: <BarChart3 size={16} />, color: "text-accent2", border: "border-accent2/20", bg: "bg-accent2/5" },
        ].map((m, i) => (
          <div key={i} className={`p-5 rounded-xl border ${m.border} ${m.bg}`}>
            <div className={`flex items-center gap-2 mb-2 ${m.color}`}>
              {m.icon}
              <span className="text-xs font-mono text-muted">{m.label}</span>
            </div>
            <div className={`font-display text-3xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="p-5 rounded-xl border border-border bg-surface/50">
          <h3 className="font-display font-semibold text-white text-sm mb-4">Accuracy by Prompt Strategy</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={promptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="name" tick={{ fill: "#4a4a6a", fontSize: 11, fontFamily: "monospace" }} />
              <YAxis tick={{ fill: "#4a4a6a", fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px", fontSize: 12 }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="accuracy" fill="#6ee7f7" radius={[4, 4, 0, 0]} name="Accuracy %" />
              <Bar dataKey="hallucination" fill="#f87171" radius={[4, 4, 0, 0]} name="Error %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-5 rounded-xl border border-border bg-surface/50">
          <h3 className="font-display font-semibold text-white text-sm mb-4">Hallucination Type Distribution</h3>
          {halTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={halTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name">
                  {halTypes.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace", color: "#4a4a6a" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-accent3 text-sm font-mono">
              ✓ No hallucinations detected!
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl border border-border bg-surface/50">
          <h3 className="font-display font-semibold text-white text-sm mb-4">Performance Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e1e2e" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#4a4a6a", fontSize: 11 }} />
              <Radar name="Model" dataKey="value" stroke="#6ee7f7" fill="#6ee7f7" fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-5 rounded-xl border border-border bg-surface/50">
          <h3 className="font-display font-semibold text-white text-sm mb-4">Answer Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: "Correct answers", count: correct, total, color: "bg-accent3" },
              { label: "Incorrect (no hallucination)", count: total - correct - hallucinated, total, color: "bg-warn" },
              { label: "Hallucinated answers", count: hallucinated, total, color: "bg-danger" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-mono text-muted mb-1">
                  <span>{item.label}</span>
                  <span>{item.count} / {item.total}</span>
                </div>
                <div className="h-2 rounded-full bg-surface border border-border overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all`}
                    style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-xs font-mono text-muted mb-2">KEY INSIGHTS</h4>
            <ul className="space-y-1">
              {accuracy >= 70 && <li className="text-xs text-accent3 font-mono">✓ Accuracy above 70% threshold</li>}
              {hallucinationRate <= 20 && <li className="text-xs text-accent3 font-mono">✓ Hallucination rate within acceptable range</li>}
              {hallucinationRate > 20 && <li className="text-xs text-danger font-mono">⚠ High hallucination rate detected</li>}
              <li className="text-xs text-dim font-mono">→ Best for: {accuracy > 70 ? "clinical decision support (with oversight)" : "research reference only"}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-8 p-5 rounded-xl border border-border bg-surface/50">
        <h3 className="font-display font-semibold text-white text-sm mb-4">Accuracy by Question Phrasing</h3>
        <div className="space-y-3">
          {[
            { label: "Precise phrasing", stats: preciseStats },
            { label: "Ambiguous phrasing", stats: ambiguousStats },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs font-mono">
              <span className="text-dim">{item.label}</span>
              <span className="text-text">
                {item.stats.rate}% ({item.stats.lower}-{item.stats.upper}%) · n={item.stats.n}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 p-5 rounded-xl border border-border bg-surface/50">
        <h3 className="font-display font-semibold text-white text-sm mb-4">Scoring Method Agreement</h3>
        <div className="text-sm font-mono mb-2">
          <span className="text-text">
            {agreementRate !== null ? `${agreementRate}%` : "N/A"}
          </span>
          <span className="text-muted"> agreement between keyword-match and semantic judge ({agreementCount}/{judgedCount})</span>
        </div>
        <p className="text-xs text-dim mb-4">
          Cases where keyword-match and semantic judge disagree indicate where surface-level scoring would have misclassified the response.
        </p>
        {disagreementCases.length > 0 && (
          <div className="space-y-3">
            {disagreementCases.map((r, i) => (
              <div key={i} className="p-3 rounded-lg bg-bg border border-border">
                <p className="text-xs text-text font-medium mb-1">{r.question}</p>
                <div className="text-[10px] font-mono text-muted mb-1">
                  <span className="text-muted">GT: </span>
                  <span className="text-text">{r.groundTruth}</span>
                </div>
                <div className="text-[10px] font-mono text-muted mb-1">
                  <span className="text-muted">Response: </span>
                  <span className="text-text">{r.modelResponse.substring(0, 150)}</span>
                </div>
                <div className="text-[10px] font-mono text-warn">
                  <span className="text-muted">Judge: </span>
                  {r.judgeRationale}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link href="/hallucination" className="flex items-center gap-2 px-5 py-2.5 border border-danger/30 text-danger rounded-lg font-mono text-sm hover:bg-danger/10 transition-all">
          Hallucination Analysis <ArrowRight size={14} />
        </Link>
        <Link href="/insights" className="flex items-center gap-2 px-5 py-2.5 bg-accent text-bg rounded-lg font-mono text-sm font-bold hover:bg-accent/90 transition-all">
          View Insights & Report <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}