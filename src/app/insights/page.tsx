"use client";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { FileText, Download, TrendingUp, ArrowRight } from "lucide-react";
import { accuracyByGroup } from "@/lib/stats";

export default function InsightsPage() {
  const { results } = useAppStore();

  const total = results.length;
  const correct = results.filter((r) => r.isCorrect).length;
  const hallucinated = results.filter((r) => r.isHallucination).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const hallucinationRate = total > 0 ? Math.round((hallucinated / total) * 100) : 0;
  const overallStats = accuracyByGroup(results);
  const preciseStats = accuracyByGroup(results.filter((r) => r.ambiguityType === "precise"));
  const ambiguousStats = accuracyByGroup(results.filter((r) => r.ambiguityType === "ambiguous"));
  const judgedCount = results.filter((r) => r.semanticCorrect !== undefined).length;
  const agreementCount = results.filter((r) => r.semanticCorrect !== undefined && r.semanticCorrect === r.isCorrect).length;
  const agreementRate = judgedCount > 0 ? Math.round((agreementCount / judgedCount) * 100) : null;
  const disagreementCases = results.filter((r) => r.semanticCorrect !== undefined && r.semanticCorrect !== r.isCorrect);

  const handleDownload = () => {
    const report = `LLM RELIABILITY LAB — RESEARCH REPORT
Generated: ${new Date().toLocaleDateString()}

EXPERIMENT CONFIGURATION
Model: ${results[0]?.model ?? "N/A"}
Prompt Strategy: ${results[0]?.promptStrategy ?? "N/A"}
Total Questions: ${total}

KEY METRICS
Accuracy: ${accuracy}%
Hallucination Rate: ${hallucinationRate}%
Accuracy 95% CI: ${overallStats.lower}%-${overallStats.upper}%

HALLUCINATION BREAKDOWN
Factual Errors: ${results.filter((r) => r.hallucinationType === "factual_error").length}
Fabricated Information: ${results.filter((r) => r.hallucinationType === "fabricated").length}
Overconfident Wrong: ${results.filter((r) => r.hallucinationType === "overconfident").length}

ACCURACY BY QUESTION PHRASING
Precise phrasing: ${preciseStats.rate}% (${preciseStats.lower}-${preciseStats.upper}%), n=${preciseStats.n}
Ambiguous phrasing: ${ambiguousStats.rate}% (${ambiguousStats.lower}-${ambiguousStats.upper}%), n=${ambiguousStats.n}

SCORING METHOD VALIDITY
Judged Responses: ${judgedCount}
Agreement Count: ${agreementCount}
Agreement Rate: ${agreementRate !== null ? `${agreementRate}%` : "N/A"}
Disagreement Cases:
${disagreementCases.map((r) => `- Q: ${r.question} | Judge: ${r.judgeRationale}`).join("\n")}

DETAILED RESULTS
${results.map((r, i) => `
Q${i + 1}: ${r.question}
Ground Truth: ${r.groundTruth}
Model Response: ${r.modelResponse.substring(0, 200)}
Status: ${r.isCorrect ? "CORRECT" : r.isHallucination ? `HALLUCINATION (${r.hallucinationType})` : "INCORRECT"}
`).join("\n")}

CONCLUSION
${accuracy >= 70
  ? `The ${results[0]?.model} model demonstrated acceptable accuracy (${accuracy}%) on medical QA tasks with a ${results[0]?.promptStrategy} prompting strategy. Hallucination rate of ${hallucinationRate}% ${hallucinationRate <= 20 ? "falls within acceptable research thresholds" : "exceeds safe clinical deployment thresholds"}.`
  : `The model showed below-threshold accuracy (${accuracy}%), indicating limitations in medical knowledge recall. Additional fine-tuning or retrieval-augmented generation (RAG) should be considered before clinical deployment.`}

RECOMMENDATIONS
1. ${accuracy < 70 ? "Consider RAG architecture to ground responses in verified medical literature." : "Model shows promise; proceed to larger-scale evaluation."}
2. ${hallucinationRate > 15 ? "Implement response validation layer before clinical use." : "Hallucination rate acceptable; maintain human oversight."}
3. Chain-of-thought prompting may improve accuracy on complex multi-step medical reasoning.
4. All LLM outputs in clinical settings must be reviewed by qualified medical professionals.

LLM Reliability Lab | AI Safety Research
`;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "llm-reliability-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-accent text-xs font-mono mb-2">
          <FileText size={12} /> insights & report
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white mb-2">Research Insights</h1>
            <p className="text-dim text-sm">Summary findings from the LLM reliability evaluation study.</p>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 border border-accent/30 text-accent rounded-lg font-mono text-xs hover:bg-accent/10 transition-all shrink-0"
          >
            <Download size={13} /> Export Report
          </button>
        </div>
      </div>

      {total === 0 && (
        <div className="p-8 rounded-xl border border-border bg-surface/50 text-center mb-6">
          <p className="text-dim text-sm mb-4">No experiment data. Run an experiment first.</p>
          <Link href="/configure" className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-bg rounded-lg font-mono text-sm font-bold">
            Configure <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="space-y-6">
        <section className="p-6 rounded-xl border border-border bg-surface/50">
          <div className="text-[10px] font-mono text-accent mb-3 uppercase tracking-widest">Abstract</div>
          <p className="text-sm text-dim leading-7">
            This study evaluates the reliability and hallucination behavior of large language models (LLMs)
            on a curated medical question answering (QA) benchmark. We assess{" "}
            {results[0]?.model ?? "multiple models"} using {results[0]?.promptStrategy ?? "various"}{" "}
            prompting strategies across {total} clinically relevant questions spanning pharmacology,
            anatomy, microbiology, and clinical reasoning. Our evaluation framework measures accuracy,
            hallucination rate, and response consistency — metrics critical for safe AI deployment in
            healthcare contexts. Response correctness is assessed using both a keyword-overlap heuristic
            and an LLM-as-judge semantic comparison, with agreement between the two reported as a measure
            of scoring validity.
          </p>
        </section>

        <section className="p-6 rounded-xl border border-border bg-surface/50">
          <div className="text-[10px] font-mono text-accent mb-3 uppercase tracking-widest">Key Findings</div>
          <div className="space-y-4">
            {[
              {
                num: "01",
                title: `Accuracy: ${accuracy}%`,
                desc: accuracy >= 70
                  ? `The model correctly answered ${correct} of ${total} questions, exceeding the 70% threshold considered acceptable for informational medical AI tools.`
                  : `The model achieved ${accuracy}% accuracy, below the recommended threshold for medical AI deployment. Retrieval-augmented generation should be explored.`,
                color: accuracy >= 70 ? "text-accent3" : "text-warn",
              },
              {
                num: "02",
                title: `Hallucination Rate: ${hallucinationRate}%`,
                desc: `${hallucinated} of ${total} responses contained hallucinated content. ${hallucinationRate <= 15 ? "This falls within acceptable bounds for a research tool, though clinical deployment requires a rate below 5% with validation." : "This rate exceeds safe thresholds for clinical use. Human review of all outputs is mandatory."}`,
                color: hallucinationRate <= 15 ? "text-accent3" : "text-danger",
              },
              {
                num: "03",
                title: "Accuracy by Question Phrasing",
                desc: `Precise-phrasing questions (n=${preciseStats.n}) achieved ${preciseStats.rate}% accuracy (${preciseStats.lower}-${preciseStats.upper}% CI), while ambiguous-phrasing questions (n=${ambiguousStats.n}) achieved ${ambiguousStats.rate}% accuracy (${ambiguousStats.lower}-${ambiguousStats.upper}% CI).`,
                color: "text-accent",
              },
              {
                num: "04",
                title: "Hallucination Pattern Analysis",
                desc: `The most common failure mode was factual error (${results.filter((r) => r.hallucinationType === "factual_error").length} cases), followed by fabricated information (${results.filter((r) => r.hallucinationType === "fabricated").length} cases).`,
                color: "text-accent2",
              },
              {
                num: "05",
                title: "Measurement Validity",
                desc: agreementRate !== null
                  ? `Keyword-match scoring and the LLM-as-judge semantic comparison agreed on ${agreementRate}% of judged responses (${agreementCount}/${judgedCount}). Disagreements indicate where keyword matching would have mis-scored a response.`
                  : "No judged responses are available to assess agreement between scoring methods.",
                color: "text-accent3",
              },
            ].map((f, i) => (
              <div key={i} className="flex gap-4">
                <span className={`font-display text-2xl font-bold ${f.color} opacity-30 shrink-0`}>{f.num}</span>
                <div>
                  <h3 className={`font-display font-semibold text-sm ${f.color} mb-1`}>{f.title}</h3>
                  <p className="text-xs text-dim leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 rounded-xl border border-accent/20 bg-accent/5">
          <div className="text-[10px] font-mono text-accent mb-3 uppercase tracking-widest">Recommendations</div>
          <ul className="space-y-2">
            {[
              "Implement retrieval-augmented generation (RAG) to ground responses in verified medical literature",
              "Use chain-of-thought prompting for complex diagnostic or pharmacological questions",
              "Deploy response validation layers before any clinical-facing application",
              "Conduct larger-scale evaluation (500+ questions) covering rare diseases and edge cases",
              "All AI outputs in clinical contexts must be reviewed by qualified medical professionals",
            ].map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-dim">
                <span className="text-accent mt-0.5 shrink-0">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </section>

        <section className="p-6 rounded-xl border border-border bg-surface/50">
          <div className="text-[10px] font-mono text-accent mb-3 uppercase tracking-widest">Conclusion</div>
          <p className="text-sm text-dim leading-7">
            {accuracy >= 70
              ? `This evaluation demonstrates that ${results[0]?.model ?? "the evaluated model"} achieves promising accuracy on structured medical QA tasks. The ${results[0]?.promptStrategy ?? "applied"} prompting strategy yielded a hallucination rate of ${hallucinationRate}%, which ${hallucinationRate <= 20 ? "is within research-grade acceptable bounds." : "requires mitigation before production deployment."} These results suggest LLMs can serve as effective first-line informational tools under appropriate human oversight, but must not replace clinical judgment.`
              : `The current evaluation highlights significant reliability limitations of ${results[0]?.model ?? "this model"} on medical QA tasks. An accuracy of ${accuracy}% and hallucination rate of ${hallucinationRate}% indicate that further development — including domain-specific fine-tuning, RAG integration, and confidence calibration — is required before deployment in any clinical context.`}
          </p>
        </section>

        <section className="p-4 rounded-xl border border-border bg-surface/30">
          <div className="text-[10px] font-mono text-muted mb-2">CITATION</div>
          <p className="text-[11px] font-mono text-muted leading-relaxed">
            LLM Reliability Lab. ({new Date().getFullYear()}). Evaluating Large Language Model Reliability in Medical Question Answering. Research Prototype. Built with Next.js + Groq Cloud API.
          </p>
        </section>
      </div>
    </div>
  );
}