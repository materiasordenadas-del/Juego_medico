import { COVERAGE_LEVEL } from "./antibiotics.js";

export const CLINICAL_EFFECTIVENESS = Object.freeze({
  EFFECTIVE: "effective",
  CONDITIONAL: "conditional",
  INEFFECTIVE: "ineffective",
  CONTRAINDICATED: "contraindicated"
});

export const SUSCEPTIBILITY = Object.freeze({
  SUSCEPTIBLE: "susceptible",
  INTERMEDIATE: "intermediate",
  RESISTANT: "resistant",
  UNKNOWN: "unknown"
});

export const SPECTRUM_KEY_BY_BACTERIUM = Object.freeze({
  strep_pyogenes: "strepPyogenes",
  mssa: "mssa",
  mrsa: "mrsa",
  ecoli: "entericGramNegative",
  mixed_anaerobes: "mixedAnaerobes"
});

export const COVERAGE_RULES = Object.freeze({
  [COVERAGE_LEVEL.STRONG]: Object.freeze({
    effectiveness: CLINICAL_EFFECTIVENESS.EFFECTIVE,
    damageMultiplier: 1,
    feedbackCode: "coverage_strong"
  }),
  [COVERAGE_LEVEL.CONDITIONAL]: Object.freeze({
    effectiveness: CLINICAL_EFFECTIVENESS.CONDITIONAL,
    damageMultiplier: 0.55,
    feedbackCode: "coverage_conditional"
  }),
  [COVERAGE_LEVEL.NONE]: Object.freeze({
    effectiveness: CLINICAL_EFFECTIVENESS.INEFFECTIVE,
    damageMultiplier: 0,
    feedbackCode: "coverage_absent"
  })
});

export function getSpectrumKeyForBacterium(bacteriaId) {
  return SPECTRUM_KEY_BY_BACTERIUM[bacteriaId] ?? null;
}

export function getCoverageRule(level) {
  return COVERAGE_RULES[level] ?? COVERAGE_RULES[COVERAGE_LEVEL.NONE];
}
