import test from "node:test";
import assert from "node:assert/strict";
import { advanceClinicalClock, resolveRegimenOutcome } from "../src/engine/clinicalResolver.js";

const base = (antibioticIds, bacteriaIds, extra = {}) => ({ ...extra, activeTherapy: { antibioticIds, ...(extra.activeTherapy ?? {}) }, infectionState: { bacteriaIds, ...(extra.infectionState ?? {}) } });

test("Fase 3: cefazolina/MSSA, vancomicina/MRSA y combinado mixto", () => {
  assert.equal(resolveRegimenOutcome(base(["cefazolin"], ["mssa"])).coverage, "complete");
  assert.equal(resolveRegimenOutcome(base(["vancomycin"], ["mrsa"])).coverage, "complete");
  const mixed = resolveRegimenOutcome(base(["ceftriaxone", "metronidazole"], ["ecoli", "mixed_anaerobes"]));
  assert.equal(mixed.coverage, "complete"); assert.ok(mixed.complementaryTherapy.length);
});
test("Fase 3: desescalada, redundancia, foco y toxicidad", () => {
  const mssa = resolveRegimenOutcome(base(["vancomycin"], ["mssa"], { cultureState: { status: "susceptibility_available", identifiedBacteriaId: "mssa", susceptibility: { vancomycin: "susceptible", cefazolin: "susceptible" } } }));
  const redundant = resolveRegimenOutcome(base(["cefazolin", "oxacillin"], ["mssa"]));
  const risky = resolveRegimenOutcome(base(["vancomycin", "gentamicin"], ["mrsa"], { elapsedClinicalTime: { hours: 80 }, patientState: { flags: ["renalImpairment"] } }));
  const noFocus = resolveRegimenOutcome(base(["vancomycin"], ["mrsa"], { infectionState: { sourceControlRequired: true } }));
  assert.ok(mssa.deescalationCandidates.includes("cefazolin")); assert.ok(redundant.redundantTherapy.length); assert.ok(risky.toxicityLoad.kidney > 80); assert.equal(risky.clinicalTrajectory, "toxicity_limiting"); assert.equal(noFocus.sourceControlAssessment, "missing");
});
test("Fase 3: reloj determinista, sin FPS, serializable e inmutable", () => {
  const once = advanceClinicalClock({}, 2, { clinicalHoursPerRealSecond: 3 });
  const twice = advanceClinicalClock(advanceClinicalClock({}, 1, { clinicalHoursPerRealSecond: 3 }), 1, { clinicalHoursPerRealSecond: 3 });
  const input = base(["cefazolin"], ["mrsa"], { elapsedClinicalTime: { hours: 10 } }); const snapshot = structuredClone(input);
  const first = resolveRegimenOutcome(input); const second = resolveRegimenOutcome(input);
  assert.equal(once.elapsedClinicalHours, twice.elapsedClinicalHours); assert.deepEqual(input, snapshot); assert.deepEqual(first, second); assert.doesNotThrow(() => JSON.stringify(first)); assert.ok(first.resistancePressure > 0);
});
