import { resolveRegimenOutcome } from "../engine/clinicalResolver.js";
import { levelConfig } from "../data/progression.js";
import { translateFeedbackCodes } from "./feedbackTranslator.js";

export const CLINICAL_PHASE = Object.freeze({ PRESENTATION: "PRESENTACIÓN", PREPARATION: "PREPARACIÓN TERAPÉUTICA", EMPIRIC: "INICIO EMPÍRICO", MICROBIOLOGY: "EVENTO MICROBIOLÓGICO", DIRECTED: "TERAPIA DIRIGIDA", OUTCOME: "RESULTADO Y DEBRIEF" });

export class ClinicalLoopEngine {
  constructor(scenario) { this.scenario = scenario; this.phase = CLINICAL_PHASE.PRESENTATION; this.therapyIds = []; this.sourceControlCompleted = false; this.cultureRevealed = false; this.elapsedClinicalHours = 0; }
  selectTherapy(ids) { this.therapyIds = [...new Set(ids)]; }
  completeSourceControl() { if (this.scenario.sourceControlOptions.length) this.sourceControlCompleted = true; }
  advance() {
    const order = Object.values(CLINICAL_PHASE); const index = order.indexOf(this.phase);
    if (this.phase === CLINICAL_PHASE.PRESENTATION) this.phase = CLINICAL_PHASE.PREPARATION;
    else if (this.phase === CLINICAL_PHASE.PREPARATION) this.phase = CLINICAL_PHASE.EMPIRIC;
    else if (this.phase === CLINICAL_PHASE.EMPIRIC) { this.cultureRevealed = true; this.phase = CLINICAL_PHASE.MICROBIOLOGY; }
    else if (this.phase === CLINICAL_PHASE.MICROBIOLOGY) this.phase = CLINICAL_PHASE.DIRECTED;
    else if (this.phase === CLINICAL_PHASE.DIRECTED) this.phase = CLINICAL_PHASE.OUTCOME;
    return order[index + 1] ?? this.phase;
  }
  evaluate() {
    const outcome = this.therapyIds.length ? resolveRegimenOutcome({ activeTherapy: { antibioticIds: this.therapyIds }, infectionState: this.scenario.infectionState, sourceControlState: { required: this.scenario.successCriteria.requiresSourceControl, completed: this.sourceControlCompleted }, cultureState: this.cultureRevealed ? { status: "susceptibility_available", identifiedBacteriaId: this.scenario.infectionState.bacteriaIds[0], susceptibility: {} } : { status: "pending" }, elapsedClinicalTime: { hours: this.elapsedClinicalHours } }, levelConfig[6].clinicalSteps) : null;
    const coverageComplete = outcome?.coverage === "complete";
    const required = this.scenario.successCriteria.requiredCombination ?? this.scenario.successCriteria.adequateTherapyIds;
    const requiredSelected = required.every((id) => this.therapyIds.includes(id)) || (!this.scenario.successCriteria.requiredCombination && this.therapyIds.some((id) => required.includes(id)));
    const sourceControlOk = !this.scenario.successCriteria.requiresSourceControl || this.sourceControlCompleted;
    const success = coverageComplete && requiredSelected && sourceControlOk;
    const feedback = translateFeedbackCodes(outcome?.feedbackCodes ?? []);
    if (!sourceControlOk) feedback.unshift({ what: "Falta control del foco.", why: "Este escenario incluye una colección o tejido desvitalizado que exige drenaje o desbridamiento.", implication: "El antibiótico por sí solo no completa el manejo del foco.", severity: "danger" });
    return { success, coverageComplete, sourceControlOk, feedback, outcome };
  }
}
