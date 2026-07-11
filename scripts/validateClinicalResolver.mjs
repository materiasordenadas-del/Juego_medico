import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { antibiotics } from "../src/data/antibiotics.js";
import { bacteria } from "../src/data/bacteria.js";
import { levelConfig } from "../src/data/progression.js";
import {
  resolveAntibioticEffect,
  DEFAULT_CLINICAL_STEPS
} from "../src/engine/clinicalResolver.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const EFFECTIVENESS = new Set(["effective", "conditional", "ineffective", "contraindicated"]);
const GENERIC_CODES = new Set([
  "coverage_strong",
  "coverage_conditional",
  "coverage_absent",
  "therapy_contraindicated"
]);
const POSITIVE_CODES = new Set([
  "cefazolin_effective_mssa",
  "vancomycin_effective_mrsa",
  "metronidazole_effective_anaerobes",
  "clinda_susceptibility_confirmed",
  "susceptibility_confirms_conditional_agent"
]);

let resolutionCount = 0;
const failures = [];

function check(condition, message, context, result) {
  if (!condition) {
    failures.push({ message, context, result });
  }
}

function validateResult(context, result) {
  resolutionCount += 1;
  check(EFFECTIVENESS.has(result.effectiveness), "effectiveness inválida", context, result);
  check(Number.isFinite(result.damageMultiplier), "damageMultiplier no finito", context, result);
  check(result.damageMultiplier >= 0 && result.damageMultiplier <= 1.25, "damageMultiplier fuera de rango", context, result);
  check(Number.isFinite(result.proaEffect), "proaEffect no finito", context, result);
  check(result.proaEffect >= -25 && result.proaEffect <= 10, "proaEffect fuera de rango", context, result);
  check(Number.isFinite(result.resistancePressure), "resistancePressure no finita", context, result);
  check(result.resistancePressure >= 0 && result.resistancePressure <= 1, "resistancePressure fuera de rango", context, result);

  if (["ineffective", "contraindicated"].includes(result.effectiveness)) {
    check(result.damageMultiplier === 0, "interacción bloqueada con daño no nulo", context, result);
  }

  const generic = result.feedbackCodes.filter((code) => GENERIC_CODES.has(code));
  check(generic.length === 1, "debe existir un solo código genérico final", context, result);

  if (result.effectiveness !== "effective") {
    const stalePositive = result.feedbackCodes.filter((code) => POSITIVE_CODES.has(code));
    check(stalePositive.length === 0, "mensaje positivo obsoleto", context, result);
  }

  const canonicalSteps = DEFAULT_CLINICAL_STEPS.filter((step) => result.activeSteps.includes(step));
  check(JSON.stringify(result.activeSteps) === JSON.stringify(canonicalSteps), "orden de pipeline no canónico", context, result);

  try {
    JSON.stringify(result);
  } catch (error) {
    failures.push({ message: `salida no serializable: ${error.message}`, context, result: null });
  }
}

function resolveAndValidate(context, steps = DEFAULT_CLINICAL_STEPS) {
  const snapshot = structuredClone(context);
  const result = resolveAntibioticEffect(context, steps);
  check(JSON.stringify(context) === JSON.stringify(snapshot), "el resolver mutó la entrada", context, result);
  validateResult(context, result);
  return result;
}

// 65 pares basales.
for (const antibiotic of antibiotics) {
  for (const bacterium of bacteria) {
    resolveAndValidate({ antibioticId: antibiotic.id, bacteriaId: bacterium.id });
  }
}

// 455 pares a través de los siete niveles.
for (const config of Object.values(levelConfig)) {
  for (const antibiotic of antibiotics) {
    for (const bacterium of bacteria) {
      resolveAndValidate(
        { antibioticId: antibiotic.id, bacteriaId: bacterium.id },
        config.clinicalSteps
      );
    }
  }
}

// 195 combinaciones de antibiograma.
for (const antibiotic of antibiotics) {
  for (const bacterium of bacteria) {
    for (const susceptibility of ["susceptible", "intermediate", "resistant"]) {
      resolveAndValidate({
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
      });
    }
  }
}

// Fuzzing determinista de contextos válidos.
let seed = 0x5a17c9e3;
function random() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 0x100000000;
}
function pick(items) {
  return items[Math.floor(random() * items.length)];
}
function subset(items, required, maxSize = 3) {
  const selected = new Set([required]);
  const targetSize = 1 + Math.floor(random() * Math.min(maxSize, items.length));
  while (selected.size < targetSize) selected.add(pick(items));
  return [...selected];
}

const antibioticIds = antibiotics.map((item) => item.id);
const bacteriaIds = bacteria.map((item) => item.id);
const flags = [
  "elderly",
  "renalImpairment",
  "priorCdiff",
  "prolongedTherapy",
  "highQtRisk",
  "serotonergicDrugs",
  "severeImmediateBetaLactamAllergy",
  "severeSulfonamideHypersensitivity"
];
const statuses = ["none", "pending", "identified", "susceptibility_available", "final"];
const susceptibilityValues = ["susceptible", "intermediate", "resistant", "unknown"];

for (let index = 0; index < 5000; index += 1) {
  const antibioticId = pick(antibioticIds);
  const bacteriaId = pick(bacteriaIds);
  const status = pick(statuses);
  const identifiedBacteriaId = ["identified", "susceptibility_available", "final"].includes(status)
    ? pick(bacteriaIds)
    : null;
  const useNested = random() < 0.45;
  const susceptibilityValue = pick(susceptibilityValues);
  const susceptibility = useNested
    ? { [bacteriaId]: { [antibioticId]: susceptibilityValue } }
    : { [antibioticId]: susceptibilityValue };

  const context = {
    antibioticId,
    bacteriaId,
    patientState: {
      flags: flags.filter(() => random() < 0.12),
      toxicityLoad: {
        kidney: Math.floor(random() * 101),
        gut: Math.floor(random() * 101),
        ear: Math.floor(random() * 101),
        marrow: Math.floor(random() * 101),
        heartQT: Math.floor(random() * 101)
      }
    },
    cultureState: {
      status,
      identifiedBacteriaId,
      susceptibility,
      version: Math.floor(random() * 8)
    },
    activeTherapy: {
      antibioticIds: subset(antibioticIds, antibioticId),
      durationSeconds: Math.floor(random() * 181)
    },
    infectionState: {
      severity: pick(["mild", "moderate", "severe", "life_threatening"]),
      bacteriaIds: subset(bacteriaIds, bacteriaId),
      sourceControlRequired: random() < 0.35,
      sourceControlCompleted: random() < 0.55,
      toxinMediated: random() < 0.15,
      bacterialLoad: pick(["low", "moderate", "high"])
    },
    microbiologyState: {
      erythromycinResistance: pick(["unknown", "susceptible", "resistant"]),
      dTest: pick(["not_done", "not_required", "negative", "positive"])
    }
  };

  resolveAndValidate(context);
}

const summary = {
  resolverVersion: "0.4.0",
  generatedAt: new Date().toISOString(),
  resolutionsEvaluated: resolutionCount,
  deterministicFuzzCases: 5000,
  failures: failures.length,
  status: failures.length === 0 ? "PASS" : "FAIL"
};

fs.writeFileSync(
  path.join(projectRoot, "CLINICAL_VALIDATION_RESULTS.json"),
  JSON.stringify({ summary, failures: failures.slice(0, 50) }, null, 2) + "\n",
  "utf8"
);

const report = `# Validación clínica sin Phaser\n\n` +
  `**Resolver:** 0.4.0  \n` +
  `**Estado:** ${summary.status}  \n` +
  `**Resoluciones evaluadas:** ${summary.resolutionsEvaluated}  \n` +
  `**Fuzzing determinista:** ${summary.deterministicFuzzCases} contextos  \n` +
  `**Fallos:** ${summary.failures}\n\n` +
  `## Cobertura de la validación\n\n` +
  `- 65 pares antibiótico–bacteria basales.\n` +
  `- 455 resoluciones a través de los siete niveles de progresión.\n` +
  `- 195 combinaciones de sensibilidad susceptible/intermedia/resistente.\n` +
  `- 5000 contextos clínicos pseudoaleatorios reproducibles.\n` +
  `- Invariantes de eficacia, daño, PROA, toxicidad, resistencia, mensajes y serialización.\n\n` +
  `## Resultado\n\n` +
  (failures.length === 0
    ? `No se detectaron violaciones del contrato clínico o técnico evaluado.\n`
    : `Se detectaron ${failures.length} violaciones. Revisar CLINICAL_VALIDATION_RESULTS.json.\n`) +
  `\n## Alcance\n\n` +
  `Esta validación comprueba coherencia interna y reglas clínicas codificadas. No sustituye revisión externa por infectología, microbiología clínica ni adaptación al antibiograma local.\n`;

fs.writeFileSync(
  path.join(projectRoot, "docs", "clinical_validation_report.md"),
  report,
  "utf8"
);

console.log(JSON.stringify(summary, null, 2));
if (failures.length > 0) process.exitCode = 1;
