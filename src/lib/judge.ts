export async function judgeResponse(
    question: string,
    groundTruth: string,
    modelResponse: string,
    judgeModel = "llama-3.3-70b-versatile"
  ): Promise<{ semanticCorrect: boolean; judgeConfidence: number; judgeRationale: string }> {
    try {
      const prompt = `You are grading a medical question answer for semantic correctness.
  
  Question: ${question}
  
  Ground truth answer: ${groundTruth}
  
  Model response: ${modelResponse}
  
  Decide whether the model response is semantically correct compared to the ground truth answer. Synonyms, rephrasing, or extra correct detail should be counted as correct. Wrong facts, fabricated specifics, or non-answers should be counted as incorrect.
  
  Respond ONLY with JSON of this exact shape, with no other text:
  { "correct": boolean, "confidence": number between 0 and 1, "rationale": string under 200 characters }`;
  
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: judgeModel,
          messages: [
            { role: "system", content: "You are a strict, careful grading assistant. Output only valid JSON." },
            { role: "user", content: prompt },
          ],
          max_tokens: 200,
        }),
      });
  
      const data = await response.json();
      const raw = data.content as string;
  
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        const cleaned = raw.replace(/```json|```/g, "").trim();
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          return { semanticCorrect: false, judgeConfidence: 0, judgeRationale: "judge_parse_error" };
        }
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