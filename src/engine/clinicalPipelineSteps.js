import {
  antibiotics,
  antibioticsById,
  COVERAGE_LEVEL,
  STEWARDSHIP_BREADTH
} from "../data/antibiotics.js";
import { bacteriaById } from "../data/bacteria.js";
import {
  CLINICAL_EFFECTIVENESS,
  SUSCEPTIBILITY,
  getCoverageRule,
  getSpectrumKeyForBacterium
} from "../data/coverageRules.js";
import { toxicityRules } from "../data/toxicityRules.js";
import { clamp } from "../utils/clamp.js";

export const DEFAULT_CLINICAL_STEPS = Object.freeze([
  "baseCoverage",
  "caveats",
  "contraindications",
  "interactions",
  "cultureKnowledge",
  "empiricDirected",
  "toxicity",
  "proa",
  "resistance",
  "feedback"
]);

const BREADTH_SCORE = Object.freeze({
  [STEWARDSHIP_BREADTH.NARROW]: 0,
  [STEWARDSHIP_BREADTH.MODERATE]: 1,
  [STEWARDSHIP_BREADTH.BROAD]: 2,
  [STEWARDSHIP_BREADTH.VERY_BROAD]: 3
});

const SUSCEPTIBILITY_VALUES = new Set(Object.values(SUSCEPTIBILITY));
const CULTURE_STATUSES = new Set([
  "none",
  "pending",
  "identified",
  "susceptibility_available",
  "final"
]);
const SUSCEPTIBILITY_READY_STATUSES = new Set(["susceptibility_available", "final"]);
const SEVERE_INFECTION = new Set(["severe", "life_threatening"]);
const POSITIVE_FEEDBACK_CODES = new Set([
  "cefazolin_effective_mssa",
  "vancomycin_effective_mrsa",
  "metronidazole_effective_anaerobes",
  "clinda_susceptibility_confirmed",
  "susceptibility_confirms_conditional_agent"
]);
const GENERIC_COVERAGE_CODES = new Set([
  "coverage_strong",
  "coverage_conditional",
  "coverage_absent",
  "therapy_contraindicated"
]);
const INTRINSIC_MISMATCHES = new Set([
  "vancomycin|ecoli",
  "metronidazole|strep_pyogenes",
  "metronidazole|mssa",
  "metronidazole|mrsa",
  "metronidazole|ecoli",
  "gentamicin|mixed_anaerobes",
  "clindamycin|ecoli",
  "linezolid|ecoli"
]);

function appendUnique(list, value) {
  if (value && !list.includes(value)) list.push(value);
}

function finiteNonNegative(value, label, fallback = 0, maximum = Number.POSITIVE_INFINITY) {
  const normalized = value === undefined || value === null ? fallback : Number(value);
  if (!Number.isFinite(normalized)) {
    throw new TypeError(`${label} debe ser finito.`);
  }
  return clamp(normalized, 0, maximum);
}

function hasOwnEntries(value) {
  return Boolean(value && typeof value === "object" && Object.keys(value).length > 0);
}

function isSusceptibilityReady(context) {
  return SUSCEPTIBILITY_READY_STATUSES.has(context.cultureState.status);
}

function hasExplicitNestedSusceptibility(context, bacteriaId = context.bacteriaId) {
  return Boolean(
    context.cultureState.susceptibility?.[bacteriaId] &&
    typeof context.cultureState.susceptibility[bacteriaId] === "object"
  );
}

function isIntrinsicMismatch(context) {
  if (
    context.bacteriaId === "mrsa" &&
    context.antibiotic.pharmacology.family.includes("beta_lactam")
  ) {
    return true;
  }
  return INTRINSIC_MISMATCHES.has(`${context.antibioticId}|${context.bacteriaId}`);
}

function addWarning(result, code) {
  appendUnique(result.warnings, code);
}

function addFeedback(result, code) {
  appendUnique(result.feedbackCodes, code);
}

function addTrace(result, step, detail) {
  result.trace.push({ step, detail });
}

function setEffectiveness(result, effectiveness, multiplier, reason) {
  if (result.effectiveness === CLINICAL_EFFECTIVENESS.CONTRAINDICATED) return;
  result.effectiveness = effectiveness;
  result.damageMultiplier = clamp(multiplier, 0, 1.25);
  if (reason) appendUnique(result.reasonCodes, reason);
}

function getPatientFlag(context, flag) {
  return context.patientState.flags.includes(flag) || context.patientState[flag] === true;
}

function getSusceptibility(context, antibioticId = context.antibioticId, bacteriaId = context.bacteriaId) {
  if (!isSusceptibilityReady(context)) return SUSCEPTIBILITY.UNKNOWN;

  const susceptibility = context.cultureState.susceptibility;
  const nested = susceptibility?.[bacteriaId]?.[antibioticId];

  // La forma anidada identifica explícitamente el microorganismo al que pertenece el resultado.
  if (nested !== undefined) {
    return SUSCEPTIBILITY_VALUES.has(nested) ? nested : SUSCEPTIBILITY.UNKNOWN;
  }

  // Un resultado plano solo puede aplicarse al microorganismo identificado.
  if (
    context.cultureState.identifiedBacteriaId &&
    context.cultureState.identifiedBacteriaId !== bacteriaId
  ) {
    return SUSCEPTIBILITY.UNKNOWN;
  }

  const flat = susceptibility?.[antibioticId];
  return SUSCEPTIBILITY_VALUES.has(flat) ? flat : SUSCEPTIBILITY.UNKNOWN;
}

function hasTherapy(context, antibioticId) {
  return context.activeTherapy.antibioticIds.includes(antibioticId);
}

function hasAllTargets(context, targetIds) {
  return targetIds.every((targetId) => context.infectionState.bacteriaIds.includes(targetId));
}

function isCultureKnown(context) {
  return ["identified", "susceptibility_available", "final"].includes(context.cultureState.status);
}

function isTargetIdentified(context) {
  if (!isCultureKnown(context)) return false;
  if (context.cultureState.identifiedBacteriaId) {
    return context.cultureState.identifiedBacteriaId === context.bacteriaId;
  }
  return hasExplicitNestedSusceptibility(context);
}

function getRiskBand(value, thresholds) {
  // Convención del proyecto: 0–30 seguro, 31–60 vigilancia,
  // 61–80 riesgo alto y 81–100 toxicidad crítica.
  if (value > thresholds.highRisk) return "critical";
  if (value > thresholds.warning) return "high";
  if (value > thresholds.safe) return "warning";
  return "safe";
}

function getSpectrumLevel(antibiotic, bacteriaId) {
  const key = getSpectrumKeyForBacterium(bacteriaId);
  return key ? antibiotic.spectrum[key] ?? COVERAGE_LEVEL.NONE : COVERAGE_LEVEL.NONE;
}

function findNarrowerAlternatives(context) {
  const current = context.antibiotic;
  const currentBreadth = BREADTH_SCORE[current.stewardship.breadth] ?? 3;

  return antibiotics
    .filter((candidate) => candidate.id !== current.id)
    .filter((candidate) => {
      const candidateBreadth = BREADTH_SCORE[candidate.stewardship.breadth] ?? 3;
      if (candidateBreadth >= currentBreadth) return false;

      const level = getSpectrumLevel(candidate, context.bacteriaId);
      if (level === COVERAGE_LEVEL.NONE) return false;

      const susceptibility = getSusceptibility(context, candidate.id, context.bacteriaId);
      if (susceptibility === SUSCEPTIBILITY.RESISTANT) return false;

      // Para E. coli, identificar la especie no basta para asumir actividad:
      // ESBL y otros mecanismos pueden invalidar cefalosporinas o quinolonas.
      if (context.bacteriaId === "ecoli" && susceptibility !== SUSCEPTIBILITY.SUSCEPTIBLE) {
        return false;
      }

      if (level === COVERAGE_LEVEL.CONDITIONAL) {
        return susceptibility === SUSCEPTIBILITY.SUSCEPTIBLE;
      }
      return true;
    })
    .sort((a, b) => {
      const breadthDifference =
        (BREADTH_SCORE[a.stewardship.breadth] ?? 3) -
        (BREADTH_SCORE[b.stewardship.breadth] ?? 3);
      if (breadthDifference !== 0) return breadthDifference;
      return a.gameBalance.cost - b.gameBalance.cost;
    })
    .slice(0, 4)
    .map((candidate) => candidate.id);
}

export function normalizeClinicalContext(rawContext) {
  if (!rawContext || typeof rawContext !== "object") {
    throw new TypeError("clinicalResolver requiere un objeto context.");
  }

  const antibioticId = rawContext.antibioticId;
  const bacteriaId = rawContext.bacteriaId;

  if (!antibioticId || typeof antibioticId !== "string") {
    throw new TypeError("context.antibioticId es obligatorio.");
  }
  if (!bacteriaId || typeof bacteriaId !== "string") {
    throw new TypeError("context.bacteriaId es obligatorio.");
  }

  const antibiotic = antibioticsById[antibioticId];
  const bacterium = bacteriaById[bacteriaId];

  if (!antibiotic) throw new RangeError(`Antibiótico desconocido: ${antibioticId}`);
  if (!bacterium) throw new RangeError(`Bacteria desconocida: ${bacteriaId}`);

  const rawPatient = rawContext.patientState ?? {};
  const rawCulture = rawContext.cultureState ?? {};
  const rawTherapy = rawContext.activeTherapy ?? {};
  const rawInfection = rawContext.infectionState ?? {};
  const rawMicrobiology = rawContext.microbiologyState ?? {};

  const therapyIds = Array.isArray(rawTherapy)
    ? rawTherapy
    : Array.isArray(rawTherapy.antibioticIds)
      ? rawTherapy.antibioticIds
      : [];

  for (const therapyId of therapyIds) {
    if (!antibioticsById[therapyId]) {
      throw new RangeError(`Antibiótico desconocido en activeTherapy: ${therapyId}`);
    }
  }

  const requestedBacteriaIds = Array.isArray(rawInfection.bacteriaIds)
    ? rawInfection.bacteriaIds
    : [];
  for (const requestedBacteriaId of requestedBacteriaIds) {
    if (!bacteriaById[requestedBacteriaId]) {
      throw new RangeError(`Bacteria desconocida en infectionState: ${requestedBacteriaId}`);
    }
  }

  const cultureStatus = rawCulture.status ?? "none";
  if (!CULTURE_STATUSES.has(cultureStatus)) {
    throw new RangeError(`Estado de cultivo desconocido: ${cultureStatus}`);
  }
  if (
    rawCulture.identifiedBacteriaId &&
    !bacteriaById[rawCulture.identifiedBacteriaId]
  ) {
    throw new RangeError(
      `Bacteria desconocida en cultureState.identifiedBacteriaId: ${rawCulture.identifiedBacteriaId}`
    );
  }

  const antibioticIds = [...new Set([antibioticId, ...therapyIds])];
  const bacteriaIds = [...new Set([bacteriaId, ...requestedBacteriaIds])];

  return {
    antibioticId,
    bacteriaId,
    antibiotic,
    bacterium,

    patientState: {
      ...rawPatient,
      flags: Array.isArray(rawPatient.flags) ? [...new Set(rawPatient.flags)] : [],
      toxicityLoad: {
        kidney: finiteNonNegative(rawPatient.toxicityLoad?.kidney, "toxicityLoad.kidney", 0, 100),
        gut: finiteNonNegative(rawPatient.toxicityLoad?.gut, "toxicityLoad.gut", 0, 100),
        ear: finiteNonNegative(rawPatient.toxicityLoad?.ear, "toxicityLoad.ear", 0, 100),
        marrow: finiteNonNegative(rawPatient.toxicityLoad?.marrow, "toxicityLoad.marrow", 0, 100),
        heartQT: finiteNonNegative(rawPatient.toxicityLoad?.heartQT, "toxicityLoad.heartQT", 0, 100)
      }
    },

    cultureState: {
      status: cultureStatus,
      identifiedBacteriaId: rawCulture.identifiedBacteriaId ?? null,
      susceptibility:
        rawCulture.susceptibility && typeof rawCulture.susceptibility === "object"
          ? structuredClone(rawCulture.susceptibility)
          : {},
      version: finiteNonNegative(rawCulture.version, "cultureState.version", 0)
    },

    activeTherapy: {
      antibioticIds,
      durationSeconds: finiteNonNegative(
        Array.isArray(rawTherapy) ? 0 : rawTherapy.durationSeconds,
        "activeTherapy.durationSeconds",
        0
      ),
      signature: rawTherapy.signature ?? antibioticIds.slice().sort().join("+")
    },

    infectionState: {
      severity: rawInfection.severity ?? "moderate",
      bacteriaIds,
      polymicrobial: rawInfection.polymicrobial ?? bacteriaIds.length > 1,
      sourceControlRequired: rawInfection.sourceControlRequired ?? false,
      sourceControlCompleted: rawInfection.sourceControlCompleted ?? false,
      toxinMediated: rawInfection.toxinMediated ?? false,
      bacterialLoad: rawInfection.bacterialLoad ?? "moderate"
    },

    microbiologyState: {
      erythromycinResistance: rawMicrobiology.erythromycinResistance ?? "unknown",
      dTest: rawMicrobiology.dTest ?? "not_done"
    },

    progressionConfig: rawContext.progressionConfig ?? null,
    metadata: rawContext.metadata ?? {}
  };
}

export function createInitialResult(context) {
  return {
    antibioticId: context.antibioticId,
    bacteriaId: context.bacteriaId,
    effectiveness: null,
    coverageLevel: null,
    damageMultiplier: 1,
    warnings: [],
    feedbackCodes: [],
    reasonCodes: [],
    proaEffect: 0,
    toxicityTags: [],
    toxicityExposure: {
      kidney: 0,
      gut: 0,
      ear: 0,
      marrow: 0,
      heartQT: 0
    },
    toxicityRisk: {},
    resistancePressure: 0,
    combinationEffects: [],
    deescalationCandidates: [],
    sourceRefs: [...new Set([
      ...(context.antibiotic.clinicalTruth.sourceRefs ?? []),
      ...(context.bacterium.clinicalTruth.sourceRefs ?? [])
    ])],
    trace: []
  };
}

export function applyBaseCoverage(result, context) {
  const spectrumKey = getSpectrumKeyForBacterium(context.bacteriaId);
  const level = spectrumKey
    ? context.antibiotic.spectrum[spectrumKey] ?? COVERAGE_LEVEL.NONE
    : COVERAGE_LEVEL.NONE;
  const rule = getCoverageRule(level);

  result.coverageLevel = level;
  setEffectiveness(result, rule.effectiveness, rule.damageMultiplier, `base_${level}`);
  addFeedback(result, rule.feedbackCode);
  addTrace(result, "baseCoverage", `${context.antibioticId} → ${context.bacteriaId}: ${level}`);

  if (context.antibioticId === "cefazolin" && context.bacteriaId === "mssa") {
    addFeedback(result, "cefazolin_effective_mssa");
  }
  if (context.antibioticId === "vancomycin" && context.bacteriaId === "mrsa") {
    addFeedback(result, "vancomycin_effective_mrsa");
  }
  if (context.antibioticId === "metronidazole" && context.bacteriaId === "mixed_anaerobes") {
    addFeedback(result, "metronidazole_effective_anaerobes");
  }

  return result;
}

export function applyCaveats(result, context) {
  const { antibioticId, bacteriaId } = context;
  const susceptibility = getSusceptibility(context);

  if (bacteriaId === "mrsa" && context.antibiotic.pharmacology.family.includes("beta_lactam")) {
    setEffectiveness(result, CLINICAL_EFFECTIVENESS.INEFFECTIVE, 0, "mrsa_pbp2a");
    addWarning(result, "mrsa_pbp2a_beta_lactam_failure");
    addFeedback(
      result,
      antibioticId === "cefazolin"
        ? "cefazolin_fails_mrsa_pbp2a"
        : "beta_lactam_fails_mrsa_pbp2a"
    );
  }

  if (antibioticId === "vancomycin" && bacteriaId === "ecoli") {
    addWarning(result, "gram_negative_outer_membrane_excludes_vancomycin");
    addFeedback(result, "vancomycin_no_gram_negative_outer_membrane");
  }

  if (antibioticId === "ceftriaxone" && bacteriaId === "mixed_anaerobes") {
    addWarning(result, "ceftriaxone_inadequate_anaerobic_coverage");
    addFeedback(result, "ceftriaxone_no_anaerobe_coverage");
  }

  if (antibioticId === "metronidazole" && bacteriaId !== "mixed_anaerobes") {
    addWarning(result, "metronidazole_no_aerobic_coverage");
    addFeedback(result, "metronidazole_no_aerobe_coverage");
  }

  if (antibioticId === "gentamicin" && bacteriaId === "mixed_anaerobes") {
    addWarning(result, "aminoglycoside_oxygen_dependent_uptake");
  }

  if (antibioticId === "clindamycin" && ["mssa", "mrsa"].includes(bacteriaId)) {
    const dTest = context.microbiologyState.dTest;
    const erythromycinResistance = context.microbiologyState.erythromycinResistance;

    if (susceptibility === SUSCEPTIBILITY.RESISTANT || dTest === "positive") {
      setEffectiveness(result, CLINICAL_EFFECTIVENESS.INEFFECTIVE, 0, "clindamycin_inducible_or_reported_resistance");
      addWarning(result, "clindamycin_not_reliable_for_staphylococcus");
      addFeedback(result, "clinda_d_test_positive_failure");
    } else if (
      susceptibility === SUSCEPTIBILITY.SUSCEPTIBLE &&
      (dTest === "negative" || dTest === "not_required" || erythromycinResistance === "susceptible")
    ) {
      setEffectiveness(result, CLINICAL_EFFECTIVENESS.EFFECTIVE, 0.9, "clindamycin_susceptibility_confirmed");
      addFeedback(result, "clinda_susceptibility_confirmed");
    } else {
      setEffectiveness(result, CLINICAL_EFFECTIVENESS.CONDITIONAL, 0.55, "clindamycin_requires_susceptibility_and_d_test");
      addWarning(result, "clindamycin_d_test_or_susceptibility_required");
      addFeedback(result, "clinda_requires_d_test");
    }
  }

  if (
    ["cefazolin", "trimethoprim_sulfamethoxazole", "ciprofloxacin", "gentamicin"].includes(antibioticId) &&
    ["ecoli", "mrsa"].includes(bacteriaId) &&
    result.coverageLevel === COVERAGE_LEVEL.CONDITIONAL
  ) {
    if (susceptibility === SUSCEPTIBILITY.SUSCEPTIBLE) {
      setEffectiveness(result, CLINICAL_EFFECTIVENESS.EFFECTIVE, 0.85, "conditional_agent_susceptibility_confirmed");
    } else if (susceptibility === SUSCEPTIBILITY.RESISTANT) {
      setEffectiveness(result, CLINICAL_EFFECTIVENESS.INEFFECTIVE, 0, "conditional_agent_resistant");
    }
  }

  if (bacteriaId === "mixed_anaerobes" && result.coverageLevel === COVERAGE_LEVEL.CONDITIONAL) {
    result.damageMultiplier = Math.min(result.damageMultiplier, 0.5);
    addWarning(result, "mixed_anaerobes_not_single_susceptibility_target");
  }

  if (
    context.infectionState.sourceControlRequired &&
    !context.infectionState.sourceControlCompleted
  ) {
    result.damageMultiplier = Math.min(result.damageMultiplier, 0.65);
    addWarning(result, "source_control_missing");
    addFeedback(result, "source_control_required");
    appendUnique(result.reasonCodes, "antibiotic_cannot_replace_source_control");
  }

  addTrace(result, "caveats", `Caveats evaluados para ${antibioticId}/${bacteriaId}`);
  return result;
}

export function applyContraindications(result, context) {
  const betaLactamFamily = context.antibiotic.pharmacology.family.includes("beta_lactam");

  if (betaLactamFamily && getPatientFlag(context, "severeImmediateBetaLactamAllergy")) {
    result.effectiveness = CLINICAL_EFFECTIVENESS.CONTRAINDICATED;
    result.damageMultiplier = 0;
    addWarning(result, "severe_immediate_beta_lactam_hypersensitivity");
    addFeedback(result, "severe_beta_lactam_hypersensitivity");
  }

  if (
    context.antibioticId === "trimethoprim_sulfamethoxazole" &&
    getPatientFlag(context, "severeSulfonamideHypersensitivity")
  ) {
    result.effectiveness = CLINICAL_EFFECTIVENESS.CONTRAINDICATED;
    result.damageMultiplier = 0;
    addWarning(result, "severe_sulfonamide_hypersensitivity");
    addFeedback(result, "severe_sulfonamide_hypersensitivity");
  }

  if (context.antibioticId === "clindamycin" && getPatientFlag(context, "priorCdiff")) {
    addWarning(result, "prior_cdiff_high_gut_risk");
    addFeedback(result, "clindamycin_cdiff_risk");
  }

  if (context.antibioticId === "linezolid" && getPatientFlag(context, "serotonergicDrugs")) {
    addWarning(result, "linezolid_serotonergic_interaction");
    addFeedback(result, "linezolid_serotonergic_interaction");
  }

  if (context.antibioticId === "ciprofloxacin" && getPatientFlag(context, "highQtRisk")) {
    addWarning(result, "fluoroquinolone_qt_risk");
    addFeedback(result, "ciprofloxacin_qt_risk");
  }

  addTrace(result, "contraindications", "Modificadores de seguridad del paciente evaluados");
  return result;
}

export function applyInteractions(result, context) {
  const currentTherapy = context.activeTherapy.antibioticIds;

  if (
    currentTherapy.includes("ceftriaxone") &&
    currentTherapy.includes("metronidazole") &&
    hasAllTargets(context, ["ecoli", "mixed_anaerobes"])
  ) {
    const activeForCurrentPair =
      (context.antibioticId === "ceftriaxone" && context.bacteriaId === "ecoli") ||
      (context.antibioticId === "metronidazole" && context.bacteriaId === "mixed_anaerobes");

    result.combinationEffects.push({
      type: "complementary",
      antibiotics: ["ceftriaxone", "metronidazole"],
      targets: ["ecoli", "mixed_anaerobes"],
      activeForCurrentPair
    });

    if (activeForCurrentPair) {
      addFeedback(result, "complementary_ceftriaxone_metronidazole");
    }
  }

  if (
    currentTherapy.includes("cefazolin") &&
    currentTherapy.includes("oxacillin") &&
    context.bacteriaId === "mssa"
  ) {
    result.combinationEffects.push({
      type: "redundant",
      antibiotics: ["cefazolin", "oxacillin"],
      targets: ["mssa"]
    });
    addWarning(result, "redundant_mssa_beta_lactam_coverage");
    addFeedback(result, "redundant_mssa_beta_lactams");
  }

  if (currentTherapy.includes("vancomycin") && currentTherapy.includes("gentamicin")) {
    result.combinationEffects.push({
      type: "additive_toxicity",
      antibiotics: ["vancomycin", "gentamicin"],
      organs: ["kidney", "ear"]
    });
    addWarning(result, "vancomycin_gentamicin_additive_toxicity");
    addFeedback(result, "nephrotoxic_vancomycin_gentamicin");
  }

  if (
    currentTherapy.includes("clindamycin") &&
    (currentTherapy.includes("azithromycin") || currentTherapy.includes("chloramphenicol"))
  ) {
    result.combinationEffects.push({
      type: "potential_antagonism",
      antibiotics: currentTherapy.filter((id) =>
        ["clindamycin", "azithromycin", "chloramphenicol"].includes(id)
      ),
      mechanism: "overlapping_50s_binding_site"
    });
    result.damageMultiplier *= 0.8;
    addWarning(result, "overlapping_50s_binding_antagonism");
  }

  addTrace(result, "interactions", `${result.combinationEffects.length} interacciones relevantes`);
  return result;
}

export function applyCultureKnowledge(result, context) {
  const susceptibilityDataPresent = hasOwnEntries(context.cultureState.susceptibility);
  const explicitNestedForTarget = hasExplicitNestedSusceptibility(context);
  const targetMismatch = Boolean(
    context.cultureState.identifiedBacteriaId &&
    context.cultureState.identifiedBacteriaId !== context.bacteriaId &&
    !explicitNestedForTarget
  );

  if (susceptibilityDataPresent && !isSusceptibilityReady(context)) {
    addWarning(result, "susceptibility_data_not_yet_available");
  }
  if (targetMismatch) {
    addWarning(result, "culture_target_mismatch");
  }

  const susceptibility = getSusceptibility(context);

  if (susceptibility === SUSCEPTIBILITY.RESISTANT) {
    setEffectiveness(result, CLINICAL_EFFECTIVENESS.INEFFECTIVE, 0, "antibiogram_resistant");
    addWarning(result, "antibiogram_resistant");
    addFeedback(result, "susceptibility_resistant_override");
  } else if (susceptibility === SUSCEPTIBILITY.INTERMEDIATE) {
    setEffectiveness(result, CLINICAL_EFFECTIVENESS.CONDITIONAL, 0.4, "antibiogram_intermediate");
    addWarning(result, "antibiogram_intermediate");
    addFeedback(result, "susceptibility_intermediate");
  } else if (susceptibility === SUSCEPTIBILITY.SUSCEPTIBLE) {
    if (isIntrinsicMismatch(context)) {
      setEffectiveness(result, CLINICAL_EFFECTIVENESS.INEFFECTIVE, 0, "intrinsic_mismatch_cannot_be_overridden");
      addWarning(result, "invalid_susceptibility_for_intrinsic_mismatch");
      addFeedback(result, "invalid_susceptibility_intrinsic_mismatch");
    } else if (result.effectiveness === CLINICAL_EFFECTIVENESS.CONDITIONAL) {
      const clindamycinDTestGate =
        context.antibioticId === "clindamycin" &&
        ["mssa", "mrsa"].includes(context.bacteriaId) &&
        !["negative", "not_required"].includes(context.microbiologyState.dTest) &&
        context.microbiologyState.erythromycinResistance !== "susceptible";

      const mixedGroupCannotBeUpgraded = context.bacteriaId === "mixed_anaerobes";

      if (!clindamycinDTestGate && !mixedGroupCannotBeUpgraded) {
        setEffectiveness(result, CLINICAL_EFFECTIVENESS.EFFECTIVE, 0.85, "antibiogram_confirms_conditional_agent");
        addFeedback(result, "susceptibility_confirms_conditional_agent");
      }
    }
  }

  if (
    isTargetIdentified(context) &&
    result.effectiveness === CLINICAL_EFFECTIVENESS.EFFECTIVE &&
    context.bacteriaId === "mssa" &&
    context.antibioticId === "vancomycin"
  ) {
    addWarning(result, "vancomycin_not_preferred_directed_mssa_agent");
    addFeedback(result, "deescalate_vancomycin_for_mssa");
  }

  addTrace(result, "cultureKnowledge", `Susceptibilidad: ${susceptibility}`);
  return result;
}

export function applyEmpiricOrDirected(result, context) {
  const cultureKnown = isCultureKnown(context);
  const severe = SEVERE_INFECTION.has(context.infectionState.severity);
  const breadthScore = BREADTH_SCORE[context.antibiotic.stewardship.breadth] ?? 3;

  if (!cultureKnown && severe && breadthScore >= 2) {
    appendUnique(result.reasonCodes, "broad_empiric_coverage_temporarily_justified");
    addFeedback(result, "empiric_broad_justified");
  }

  if (
    !cultureKnown &&
    !severe &&
    breadthScore >= 2 &&
    result.effectiveness === CLINICAL_EFFECTIVENESS.EFFECTIVE
  ) {
    const narrowerOptions = findNarrowerAlternatives(context);
    if (narrowerOptions.length > 0) {
      appendUnique(result.reasonCodes, "broad_empiric_coverage_not_justified_by_severity");
      addWarning(result, "unnecessarily_broad_empiric_therapy");
      addFeedback(result, "unnecessarily_broad_empiric_therapy");
    }
  }

  if (cultureKnown && isTargetIdentified(context) && breadthScore >= 1) {
    result.deescalationCandidates = findNarrowerAlternatives(context);
    if (result.deescalationCandidates.length > 0) {
      addWarning(result, "narrower_directed_therapy_available");
      addFeedback(result, "overbroad_after_culture");
    }
  }

  addTrace(result, "empiricDirected", cultureKnown ? "Terapia dirigida evaluada" : "Terapia empírica evaluada");
  return result;
}

export function computeToxicity(result, context) {
  const safety = context.antibiotic.safety;
  const elderlyModifier = getPatientFlag(context, "elderly") ? 1.15 : 1;
  const renalModifier = getPatientFlag(context, "renalImpairment") ? 1.55 : 1;
  const priorCdiffModifier = getPatientFlag(context, "priorCdiff") ? 1.6 : 1;
  const prolongedModifier = getPatientFlag(context, "prolongedTherapy") ? 1.35 : 1;
  const toxicPair = hasTherapy(context, "vancomycin") && hasTherapy(context, "gentamicin");

  result.toxicityExposure = {
    kidney: Number((safety.kidneyExposure * elderlyModifier * renalModifier * (toxicPair ? 1.4 : 1)).toFixed(3)),
    gut: Number((safety.gutExposure * elderlyModifier * priorCdiffModifier).toFixed(3)),
    ear: Number((safety.earExposure * elderlyModifier * (toxicPair ? 1.4 : 1)).toFixed(3)),
    marrow: Number((safety.marrowExposure * elderlyModifier * prolongedModifier).toFixed(3)),
    heartQT: safety.qtRisk ? Number((0.45 * (getPatientFlag(context, "highQtRisk") ? 1.6 : 1)).toFixed(3)) : 0
  };

  result.toxicityTags = [...new Set(safety.primaryToxicityTags ?? [])];

  result.toxicityRisk = {
    kidney: getRiskBand(context.patientState.toxicityLoad.kidney, toxicityRules.kidney),
    gut: getRiskBand(context.patientState.toxicityLoad.gut, toxicityRules.gut),
    ear: getRiskBand(context.patientState.toxicityLoad.ear, toxicityRules.ear),
    marrow: getRiskBand(
      context.patientState.toxicityLoad.marrow,
      toxicityRules.marrow ?? toxicityRules.kidney
    ),
    heartQT: getRiskBand(
      context.patientState.toxicityLoad.heartQT,
      toxicityRules.heartQT ?? toxicityRules.kidney
    )
  };

  if (getPatientFlag(context, "renalImpairment") && result.toxicityExposure.kidney >= 0.3) {
    addWarning(result, "renal_vulnerability_increases_exposure_risk");
    addFeedback(result, "renal_exposure_warning");
  }

  addTrace(result, "toxicity", `Exposición renal normalizada: ${result.toxicityExposure.kidney}`);
  return result;
}

export function computeProaEffect(result, context) {
  const cultureKnown = isCultureKnown(context);
  const breadthScore = BREADTH_SCORE[context.antibiotic.stewardship.breadth] ?? 3;
  const severe = SEVERE_INFECTION.has(context.infectionState.severity);
  let score = result.proaEffect;

  if (result.effectiveness === CLINICAL_EFFECTIVENESS.EFFECTIVE) score += 2;
  if (result.effectiveness === CLINICAL_EFFECTIVENESS.CONDITIONAL) score -= 2;
  if (result.effectiveness === CLINICAL_EFFECTIVENESS.INEFFECTIVE) score -= 8;
  if (result.effectiveness === CLINICAL_EFFECTIVENESS.CONTRAINDICATED) score -= 12;

  if (!cultureKnown && severe && breadthScore >= 2) {
    score += 2;
  }

  if (
    !cultureKnown &&
    !severe &&
    result.reasonCodes.includes("broad_empiric_coverage_not_justified_by_severity")
  ) {
    score -= breadthScore === 3 ? 7 : 4;
  }

  if (cultureKnown && result.deescalationCandidates.length > 0) {
    score -= breadthScore === 3 ? 12 : 7;
  }

  if (
    cultureKnown &&
    context.bacteriaId === "mssa" &&
    context.antibioticId === "vancomycin"
  ) {
    score -= 10;
  }

  for (const effect of result.combinationEffects) {
    if (effect.type === "complementary" && effect.activeForCurrentPair) score += 3;
    if (effect.type === "redundant") score -= 8;
    if (effect.type === "potential_antagonism") score -= 8;
  }

  if (
    context.activeTherapy.durationSeconds > 30 &&
    result.effectiveness === CLINICAL_EFFECTIVENESS.INEFFECTIVE
  ) {
    score -= 5;
  }

  result.proaEffect = clamp(score, -25, 10);
  addTrace(result, "proa", `Efecto PROA: ${result.proaEffect}`);
  return result;
}

export function computeResistancePressure(result, context) {
  const breadthScore = BREADTH_SCORE[context.antibiotic.stewardship.breadth] ?? 3;
  let pressure = 0;

  if (result.effectiveness === CLINICAL_EFFECTIVENESS.EFFECTIVE) pressure += 0.04;
  if (result.effectiveness === CLINICAL_EFFECTIVENESS.CONDITIONAL) pressure += 0.18;
  if (result.effectiveness === CLINICAL_EFFECTIVENESS.INEFFECTIVE) pressure += 0.35;
  if (result.effectiveness === CLINICAL_EFFECTIVENESS.CONTRAINDICATED) pressure += 0.3;

  pressure += breadthScore * 0.045;

  if (context.activeTherapy.durationSeconds > 60 && result.damageMultiplier < 0.6) {
    pressure += 0.2;
  }
  if (context.infectionState.bacterialLoad === "high") pressure += 0.08;
  if (
    context.infectionState.sourceControlRequired &&
    !context.infectionState.sourceControlCompleted
  ) {
    pressure += 0.15;
  }

  result.resistancePressure = Number(clamp(pressure, 0, 1).toFixed(3));

  if (result.resistancePressure >= 0.35) {
    addWarning(result, "resistance_pressure_rising");
    addFeedback(result, "resistance_pressure_rising");
  }

  addTrace(result, "resistance", `Presión selectiva: ${result.resistancePressure}`);
  return result;
}

export function computeFeedbackCodes(result) {
  // La salida docente debe reflejar el estado FINAL, no el estado basal previo a
  // antibiograma, contraindicaciones o caveats.
  result.feedbackCodes = result.feedbackCodes.filter(
    (code) => !GENERIC_COVERAGE_CODES.has(code)
  );

  if (result.effectiveness !== CLINICAL_EFFECTIVENESS.EFFECTIVE) {
    result.feedbackCodes = result.feedbackCodes.filter(
      (code) => !POSITIVE_FEEDBACK_CODES.has(code)
    );
  }

  if (result.effectiveness === CLINICAL_EFFECTIVENESS.EFFECTIVE) {
    addFeedback(result, "coverage_strong");
  } else if (result.effectiveness === CLINICAL_EFFECTIVENESS.CONDITIONAL) {
    addFeedback(result, "coverage_conditional");
  } else if (result.effectiveness === CLINICAL_EFFECTIVENESS.CONTRAINDICATED) {
    addFeedback(result, "therapy_contraindicated");
  } else {
    addFeedback(result, "coverage_absent");
  }

  addTrace(result, "feedback", `${result.feedbackCodes.length} códigos docentes`);
  return result;
}

export const STEP_REGISTRY = Object.freeze({
  baseCoverage: applyBaseCoverage,
  caveats: applyCaveats,
  contraindications: applyContraindications,
  interactions: applyInteractions,
  cultureKnowledge: applyCultureKnowledge,
  empiricDirected: applyEmpiricOrDirected,
  toxicity: computeToxicity,
  proa: computeProaEffect,
  resistance: computeResistancePressure,
  feedback: computeFeedbackCodes
});

export function validateClinicalSteps(activeSteps) {
  if (!Array.isArray(activeSteps)) {
    throw new TypeError("activeSteps debe ser un arreglo de nombres de pasos clínicos.");
  }

  const unknown = activeSteps.filter((stepName) => !STEP_REGISTRY[stepName]);
  if (unknown.length > 0) {
    throw new RangeError(`Pasos clínicos desconocidos: ${unknown.join(", ")}`);
  }

  if (!activeSteps.includes("baseCoverage")) {
    throw new RangeError("El pipeline debe incluir baseCoverage.");
  }

  const requested = new Set(activeSteps);
  return DEFAULT_CLINICAL_STEPS.filter((stepName) => requested.has(stepName));
}

export function runClinicalPipeline(context, activeSteps, initialResult = createInitialResult(context)) {
  return activeSteps.reduce((result, stepName) => {
    const step = STEP_REGISTRY[stepName];
    return step(result, context);
  }, initialResult);
}

export function finalizeClinicalResult(result) {
  result.damageMultiplier = Number(clamp(result.damageMultiplier, 0, 1.25).toFixed(3));
  result.proaEffect = Number(clamp(result.proaEffect, -25, 10).toFixed(3));
  result.resistancePressure = Number(clamp(result.resistancePressure, 0, 1).toFixed(3));
  result.warnings = [...new Set(result.warnings)];
  result.feedbackCodes = [...new Set(result.feedbackCodes)];
  result.reasonCodes = [...new Set(result.reasonCodes)];
  result.deescalationCandidates = [...new Set(result.deescalationCandidates)];

  if (result.effectiveness === CLINICAL_EFFECTIVENESS.CONTRAINDICATED) {
    result.damageMultiplier = 0;
  }

  return result;
}
