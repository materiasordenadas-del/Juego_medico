import { antibioticsById } from "../data/antibiotics.js";
import { toxicityRules } from "../data/toxicityRules.js";
import { clamp } from "../utils/clamp.js";
import { resolveTherapyMatrix } from "./clinicalResolver.js";

const SYSTEMS = Object.freeze(["kidney", "gut", "ear", "marrow", "heartQT"]);
const EFFECTIVE = new Set(["effective"]);
const PARTIAL = new Set(["effective", "conditional"]);
const DEFAULT_CLOCK = Object.freeze({ clinicalHoursPerRealSecond: 1, maxRealDeltaSeconds: 5 });
const unique = (values) => [...new Set(values)];
const riskBand = (value) => value > toxicityRules.kidney.highRisk ? "critical" : value > toxicityRules.kidney.warning ? "high" : value > toxicityRules.kidney.safe ? "warning" : "safe";

/** Resume un regimen completo. Es puro, serializable y no usa DOM, Three.js ni proyectiles. */
export function resolveRegimenOutcome(context, optionsOrSteps = null) {
  if (!context || typeof context !== "object") throw new TypeError("resolveRegimenOutcome requiere un contexto.");
  const ids = unique(context.activeTherapy?.antibioticIds ?? []);
  const targets = unique(context.infectionState?.bacteriaIds ?? []);
  if (!ids.length || !targets.length) throw new TypeError("El regimen requiere antibioticos y blancos.");
  for (const id of ids) if (!antibioticsById[id]) throw new RangeError(`Antibiotico desconocido en activeTherapy: ${id}`);
  const completed = context.sourceControlState?.completed ?? context.infectionState?.sourceControlCompleted ?? false;
  const hours = clamp(Number(context.elapsedClinicalTime?.hours ?? context.elapsedClinicalTime ?? 0) || 0, 0, 10000);
  const intensity = clamp(Number(context.activeTherapy?.intensity ?? 1) || 0, 0, 3);
  const matrix = resolveTherapyMatrix({ ...context, antibioticId: ids[0], bacteriaId: targets[0], activeTherapy: { ...(context.activeTherapy ?? {}), antibioticIds: ids, durationSeconds: hours }, infectionState: { ...(context.infectionState ?? {}), bacteriaIds: targets, sourceControlCompleted: completed } }, optionsOrSteps);
  const targetCoverage = targets.map((targetId) => {
    const entries = matrix.filter((entry) => entry.bacteriaId === targetId);
    const status = entries.some((entry) => EFFECTIVE.has(entry.effectiveness)) ? "covered" : entries.some((entry) => PARTIAL.has(entry.effectiveness)) ? "conditional" : "uncovered";
    return { targetId, status, therapyIds: entries.filter((entry) => PARTIAL.has(entry.effectiveness)).map((entry) => entry.antibioticId) };
  });
  const uncoveredTargets = targetCoverage.filter((item) => item.status !== "covered").map((item) => item.targetId);
  const coverage = uncoveredTargets.length === 0 ? "complete" : targetCoverage.every((item) => item.status === "conditional") ? "conditional" : targetCoverage.some((item) => item.status !== "uncovered") ? "partial" : "none";
  const effects = matrix.flatMap((item) => item.combinationEffects ?? []);
  const uniqueEffects = effects.filter((item, index) => index === effects.findIndex((other) => JSON.stringify(other) === JSON.stringify(item)));
  const warnings = unique(matrix.flatMap((item) => item.warnings));
  const contraindications = matrix.filter((item) => item.effectiveness === "contraindicated").map((item) => item.antibioticId);
  const entriesPerDrug = matrix.filter((item, index, all) => all.findIndex((other) => other.antibioticId === item.antibioticId) === index);
  const toxicityExposure = Object.fromEntries(SYSTEMS.map((system) => [system, entriesPerDrug.reduce((sum, item) => sum + (item.toxicityExposure?.[system] ?? 0), 0) * intensity]));
  const baseLoad = context.patientState?.toxicityLoad ?? {};
  const toxicityLoad = Object.fromEntries(SYSTEMS.map((system) => [system, clamp((Number(baseLoad[system]) || 0) + toxicityExposure[system] * hours - (toxicityExposure[system] === 0 ? hours * 0.4 : 0), 0, 100)]));
  const toxicityRisk = Object.fromEntries(SYSTEMS.map((system) => [system, riskBand(toxicityLoad[system])]));
  const limitingToxicity = Object.values(toxicityRisk).includes("critical");
  const required = Boolean(context.sourceControlState?.required ?? context.infectionState?.sourceControlRequired);
  const sourceControlAssessment = !required ? "not_required" : completed ? "completed" : "missing";
  const pressure = clamp(matrix.reduce((sum, item) => sum + item.resistancePressure, 0) / matrix.length + (coverage === "none" ? 18 : 0), 0, 100);
  const deescalationCandidates = unique(matrix.flatMap((item) => item.deescalationCandidates ?? []));
  const stewardshipAssessment = ["susceptibility_available", "final"].includes(context.cultureState?.status) && deescalationCandidates.length ? "review_deescalation" : "empiric_or_directed_acceptable";
  const clinicalTrajectory = limitingToxicity ? "toxicity_limiting" : coverage === "none" ? "failure" : sourceControlAssessment === "missing" ? "deteriorating" : coverage === "partial" || coverage === "conditional" ? "stable" : "improving";
  const feedbackCodes = unique([...matrix.flatMap((item) => item.feedbackCodes), ...(sourceControlAssessment === "missing" ? ["source_control_required"] : []), ...(limitingToxicity ? ["toxicity_limiting"] : []), ...(pressure >= 50 ? ["resistance_pressure_rising"] : [])]);
  return { coverage, targetCoverage, uncoveredTargets, redundantTherapy: uniqueEffects.filter((item) => item.type === "redundant"), complementaryTherapy: uniqueEffects.filter((item) => item.type === "complementary"), contraindications, interactionRisks: warnings.filter((code) => /interaction|nephrotoxic|qt|serotonergic/.test(code)), toxicityExposure, toxicityLoad, toxicityRisk, stewardshipAssessment, deescalationCandidates, sourceControlAssessment, expectedClinicalEffect: clinicalTrajectory === "improving" ? "expected_improvement" : clinicalTrajectory === "toxicity_limiting" ? "treatment_limited_by_toxicity" : "expected_failure_or_partial_response", clinicalTrajectory, feedbackCodes, resistancePressure: pressure, scoreComponents: { coverage: coverage === "complete" ? 40 : coverage === "partial" ? 15 : -35, sourceControl: sourceControlAssessment === "missing" ? -30 : 20, safety: limitingToxicity ? -30 : contraindications.length ? -25 : 15, stewardship: stewardshipAssessment === "review_deescalation" ? 0 : 10, resistancePressure: -Math.round(pressure / 5) }, elapsedClinicalHours: hours, matrix };
}

/** Convierte tiempo real a horas clinicas sin depender de FPS. */
export function advanceClinicalClock(clockState = {}, realDeltaSeconds, config = {}) {
  const settings = { ...DEFAULT_CLOCK, ...config };
  const delta = clamp(Number(realDeltaSeconds) || 0, 0, settings.maxRealDeltaSeconds);
  return { elapsedClinicalHours: clamp(Number(clockState.elapsedClinicalHours) || 0, 0, 10000) + delta * settings.clinicalHoursPerRealSecond, lastRealDeltaSeconds: delta };
}
