import {
  DEFAULT_CLINICAL_STEPS,
  createInitialResult,
  finalizeClinicalResult,
  normalizeClinicalContext,
  runClinicalPipeline,
  validateClinicalSteps
} from "./clinicalPipelineSteps.js";

/**
 * Resuelve una interacción antibiótico-bacteria sin depender de Phaser, DOM ni estado global.
 *
 * Contexto mínimo:
 * {
 *   antibioticId: "cefazolin",
 *   bacteriaId: "mssa"
 * }
 *
 * Contexto clínico ampliado:
 * {
 *   patientState: { flags: [], toxicityLoad: { kidney: 0, gut: 0, ear: 0 } },
 *   cultureState: {
 *     status: "susceptibility_available",
 *     identifiedBacteriaId: "mssa",
 *     susceptibility: { cefazolin: "susceptible" }
 *   },
 *   activeTherapy: { antibioticIds: ["cefazolin"], durationSeconds: 30 },
 *   infectionState: {
 *     severity: "moderate",
 *     bacteriaIds: ["mssa"],
 *     sourceControlRequired: false,
 *     sourceControlCompleted: false
 *   },
 *   microbiologyState: { erythromycinResistance: "unknown", dTest: "not_done" }
 * }
 *
 * @param {object} context Estado clínico serializable.
 * @param {string[]|object|null} optionsOrSteps Arreglo de pasos o { activeSteps }.
 * @returns {object} Resolución clínica pura y serializable.
 */
export function resolveAntibioticEffect(context, optionsOrSteps = null) {
  const normalizedContext = normalizeClinicalContext(context);

  const requestedSteps = Array.isArray(optionsOrSteps)
    ? optionsOrSteps
    : optionsOrSteps?.activeSteps ??
      normalizedContext.progressionConfig?.clinicalSteps ??
      DEFAULT_CLINICAL_STEPS;

  const activeSteps = validateClinicalSteps(requestedSteps);
  const initialResult = createInitialResult(normalizedContext);
  const resolved = runClinicalPipeline(normalizedContext, activeSteps, initialResult);
  const finalResult = finalizeClinicalResult(resolved);

  return {
    ...finalResult,
    activeSteps,
    contextVersion: 2,
    resolverVersion: "0.4.0"
  };
}

/**
 * Genera una matriz para varias torres y blancos. Es útil para una horda mixta,
 * pruebas o paneles de comparación. No agrega texto docente final.
 */
export function resolveTherapyMatrix(context, optionsOrSteps = null) {
  if (!context || typeof context !== "object") {
    throw new TypeError("resolveTherapyMatrix requiere un objeto context.");
  }

  const rawAntibioticIds = context.activeTherapy?.antibioticIds ?? [context.antibioticId];
  const rawBacteriaIds = context.infectionState?.bacteriaIds ?? [context.bacteriaId];

  if (!Array.isArray(rawAntibioticIds) || rawAntibioticIds.length === 0) {
    throw new TypeError("La matriz requiere al menos un antibiótico.");
  }
  if (!Array.isArray(rawBacteriaIds) || rawBacteriaIds.length === 0) {
    throw new TypeError("La matriz requiere al menos una bacteria.");
  }

  const antibioticIds = [...new Set(rawAntibioticIds)];
  const bacteriaIds = [...new Set(rawBacteriaIds)];

  return antibioticIds.flatMap((antibioticId) =>
    bacteriaIds.map((bacteriaId) =>
      resolveAntibioticEffect(
        {
          ...context,
          antibioticId,
          bacteriaId,
          activeTherapy: {
            ...(context.activeTherapy ?? {}),
            antibioticIds
          },
          infectionState: {
            ...(context.infectionState ?? {}),
            bacteriaIds
          }
        },
        optionsOrSteps
      )
    )
  );
}

export { DEFAULT_CLINICAL_STEPS } from "./clinicalPipelineSteps.js";
