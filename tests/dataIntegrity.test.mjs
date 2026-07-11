import test from "node:test";
import assert from "node:assert/strict";

import {
  antibiotics,
  COVERAGE_LEVEL
} from "../src/data/antibiotics.js";
import { bacteria } from "../src/data/bacteria.js";
import { evidenceSources } from "../src/data/evidenceSources.js";
import { feedbackRules } from "../src/data/feedbackRules.js";
import { levelConfig } from "../src/data/progression.js";
import {
  resolveAntibioticEffect,
  DEFAULT_CLINICAL_STEPS
} from "../src/engine/clinicalResolver.js";

const spectrumKeys = [
  "strepPyogenes",
  "mssa",
  "mrsa",
  "entericGramNegative",
  "mixedAnaerobes"
];
const validCoverage = new Set(Object.values(COVERAGE_LEVEL));

test("42. Todos los antibióticos tienen matriz de espectro completa y valores válidos", () => {
  const ids = new Set();
  for (const antibiotic of antibiotics) {
    assert.ok(!ids.has(antibiotic.id), `ID duplicado: ${antibiotic.id}`);
    ids.add(antibiotic.id);
    for (const key of spectrumKeys) {
      assert.ok(key in antibiotic.spectrum, `${antibiotic.id} carece de ${key}`);
      assert.ok(validCoverage.has(antibiotic.spectrum[key]), `${antibiotic.id}.${key} es inválido`);
    }
  }
});

test("43. Todos los perfiles bacterianos y farmacológicos apuntan a fuentes existentes", () => {
  for (const item of [...antibiotics, ...bacteria]) {
    for (const sourceRef of item.clinicalTruth.sourceRefs ?? []) {
      assert.ok(evidenceSources[sourceRef], `${item.id} referencia una fuente inexistente: ${sourceRef}`);
    }
  }
});

test("44. Todas las configuraciones de nivel usan pasos clínicos válidos", () => {
  const known = new Set(DEFAULT_CLINICAL_STEPS);
  for (const [level, config] of Object.entries(levelConfig)) {
    assert.ok(config.clinicalSteps.includes("baseCoverage"), `Nivel ${level} carece de baseCoverage`);
    for (const step of config.clinicalSteps) {
      assert.ok(known.has(step), `Nivel ${level} usa paso desconocido: ${step}`);
    }
  }
});

test("45. Todos los códigos docentes emitidos por el banco ampliado existen en feedbackRules", () => {
  const emitted = new Set();
  const collect = (result) => result.feedbackCodes.forEach((code) => emitted.add(code));

  for (const antibiotic of antibiotics) {
    for (const bacterium of bacteria) {
      collect(resolveAntibioticEffect({
        antibioticId: antibiotic.id,
        bacteriaId: bacterium.id
      }));

      for (const susceptibility of ["susceptible", "intermediate", "resistant"]) {
        collect(resolveAntibioticEffect({
          antibioticId: antibiotic.id,
          bacteriaId: bacterium.id,
          cultureState: {
            status: "susceptibility_available",
            identifiedBacteriaId: bacterium.id,
            susceptibility: { [antibiotic.id]: susceptibility }
          },
          microbiologyState: {
            erythromycinResistance: "resistant",
            dTest: susceptibility === "susceptible" ? "negative" : "not_done"
          }
        }));
      }
    }
  }

  const specialScenarios = [
    { antibioticId: "cefazolin", bacteriaId: "mssa", patientState: { flags: ["severeImmediateBetaLactamAllergy"] } },
    { antibioticId: "trimethoprim_sulfamethoxazole", bacteriaId: "mrsa", patientState: { flags: ["severeSulfonamideHypersensitivity"] } },
    { antibioticId: "clindamycin", bacteriaId: "strep_pyogenes", patientState: { flags: ["priorCdiff"] } },
    { antibioticId: "linezolid", bacteriaId: "mrsa", patientState: { flags: ["serotonergicDrugs"] } },
    { antibioticId: "ciprofloxacin", bacteriaId: "ecoli", patientState: { flags: ["highQtRisk"] } },
    { antibioticId: "vancomycin", bacteriaId: "mrsa", patientState: { flags: ["renalImpairment"] } },
    {
      antibioticId: "ceftriaxone",
      bacteriaId: "ecoli",
      activeTherapy: { antibioticIds: ["ceftriaxone", "metronidazole"] },
      infectionState: { bacteriaIds: ["ecoli", "mixed_anaerobes"] }
    },
    {
      antibioticId: "cefazolin",
      bacteriaId: "mssa",
      activeTherapy: { antibioticIds: ["cefazolin", "oxacillin"] }
    },
    {
      antibioticId: "vancomycin",
      bacteriaId: "mrsa",
      activeTherapy: { antibioticIds: ["vancomycin", "gentamicin"] }
    },
    {
      antibioticId: "meropenem",
      bacteriaId: "strep_pyogenes",
      infectionState: { severity: "moderate" }
    },
    {
      antibioticId: "meropenem",
      bacteriaId: "ecoli",
      infectionState: { severity: "severe" },
      cultureState: { status: "pending" }
    }
  ];
  specialScenarios.forEach((scenario) => collect(resolveAntibioticEffect(scenario)));

  const missing = [...emitted].filter((code) => !feedbackRules[code]);
  assert.deepEqual(missing, []);
});

test("46. Las 455 resoluciones por nivel se mantienen dentro del contrato", () => {
  let count = 0;
  for (const config of Object.values(levelConfig)) {
    for (const antibiotic of antibiotics) {
      for (const bacterium of bacteria) {
        const result = resolveAntibioticEffect(
          { antibioticId: antibiotic.id, bacteriaId: bacterium.id },
          { activeSteps: config.clinicalSteps }
        );
        count += 1;
        assert.ok(Number.isFinite(result.damageMultiplier));
        assert.ok(result.damageMultiplier >= 0 && result.damageMultiplier <= 1.25);
        assert.ok(result.effectiveness);
      }
    }
  }
  assert.equal(count, 455);
});
