export function wilsonInterval(successes: number, total: number, z = 1.96): { lower: number; upper: number } {
    if (total === 0) {
      return { lower: 0, upper: 0 };
    }
  
    const p = successes / total;
    const z2 = z * z;
    const denominator = 1 + z2 / total;
    const center = p + z2 / (2 * total);
    const margin = z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total));
  
    const lower = (center - margin) / denominator;
    const upper = (center + margin) / denominator;
  
    return {
      lower: Math.round(Math.max(0, lower) * 1000) / 10,
      upper: Math.round(Math.min(1, upper) * 1000) / 10,
    };
  }
  
  export function accuracyByGroup(results: { isCorrect: boolean }[]): { rate: number; lower: number; upper: number; n: number } {
    if (results.length === 0) {
      return { rate: 0, lower: 0, upper: 0, n: 0 };
    }
  
    const n = results.length;
    const successes = results.filter((r) => r.isCorrect).length;
    const rate = Math.round((successes / n) * 1000) / 10;
    const { lower, upper } = wilsonInterval(successes, n);
  
    return { rate, lower, upper, n };
  }
  
  export function consistencyScore(resultsByQuestionId: Record<number, boolean[]>): number {
    const agreementRates: number[] = [];
  
    for (const runs of Object.values(resultsByQuestionId)) {
      if (runs.length < 2) {
        continue;
      }
  
      let agreeing = 0;
      let pairs = 0;
  
      for (let i = 0; i < runs.length; i++) {
        for (let j = i + 1; j < runs.length; j++) {
          pairs++;
          if (runs[i] === runs[j]) {
            agreeing++;
          }
        }
      }
  
      agreementRates.push(agreeing / pairs);
    }
  
    if (agreementRates.length === 0) {
      return 0;
    }
  
    const average = agreementRates.reduce((sum, rate) => sum + rate, 0) / agreementRates.length;
  
    return Math.round(average * 100) / 100;
  }