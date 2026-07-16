import { antibiotics } from "../data/antibiotics.js";
import { bacteriaById } from "../data/bacteria.js";
import { evidenceSources } from "../data/evidenceSources.js";

export function validateScenarios(scenarios) {
  const ids = new Set();
  for (const scenario of scenarios) {
    if (!scenario.id || ids.has(scenario.id)) throw new Error("Cada escenario necesita un id único.");
    ids.add(scenario.id);
    for (const field of ["title", "learningObjectives", "patient", "presentation", "vitalSigns", "laboratoryData", "infectionState", "initialKnowledge", "cultureTimeline", "sourceControlOptions", "availableAntibiotics", "successCriteria", "failureCriteria", "debriefRules", "sourceRefs"]) if (scenario[field] == null) throw new Error(`Falta ${field} en ${scenario.id}.`);
    scenario.availableAntibiotics.forEach((id) => { if (!antibiotics.some((item) => item.id === id)) throw new Error(`Antibiótico inválido: ${id}`); });
    scenario.infectionState.bacteriaIds.forEach((id) => { if (!bacteriaById[id]) throw new Error(`Bacteria inválida: ${id}`); });
    scenario.sourceRefs.forEach((id) => { if (!evidenceSources[id]) throw new Error(`Fuente inválida: ${id}`); });
  }
  return true;
}
