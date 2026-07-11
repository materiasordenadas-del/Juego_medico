import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveAntibioticEffect,
  resolveTherapyMatrix
} from "../src/engine/clinicalResolver.js";

const fullSteps = [
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
];

function resolve(context) {
  return resolveAntibioticEffect(context, fullSteps);
}

test("1. Cefazolina + MSSA es efectiva", () => {
  const result = resolve({
    antibioticId: "cefazolin",
    bacteriaId: "mssa"
  });

  assert.equal(result.effectiveness, "effective");
  assert.equal(result.damageMultiplier, 1);
  assert.ok(result.feedbackCodes.includes("cefazolin_effective_mssa"));
});

test("2. Cefazolina + MRSA falla por PBP2a", () => {
  const result = resolve({
    antibioticId: "cefazolin",
    bacteriaId: "mrsa"
  });

  assert.equal(result.effectiveness, "ineffective");
  assert.equal(result.damageMultiplier, 0);
  assert.ok(result.feedbackCodes.includes("cefazolin_fails_mrsa_pbp2a"));
});

test("3. Vancomicina + MRSA es efectiva y genera exposición renal", () => {
  const result = resolve({
    antibioticId: "vancomycin",
    bacteriaId: "mrsa"
  });

  assert.equal(result.effectiveness, "effective");
  assert.ok(result.toxicityExposure.kidney > 0);
  assert.ok(result.feedbackCodes.includes("vancomycin_effective_mrsa"));
});

test("4. Clindamicina + MRSA sin antibiograma/D-test permanece condicional", () => {
  const result = resolve({
    antibioticId: "clindamycin",
    bacteriaId: "mrsa",
    microbiologyState: {
      erythromycinResistance: "unknown",
      dTest: "not_done"
    }
  });

  assert.equal(result.effectiveness, "conditional");
  assert.ok(result.feedbackCodes.includes("clinda_requires_d_test"));
});

test("5. Ceftriaxona + anaerobios mixtos es inefectiva", () => {
  const result = resolve({
    antibioticId: "ceftriaxone",
    bacteriaId: "mixed_anaerobes"
  });

  assert.equal(result.effectiveness, "ineffective");
  assert.equal(result.damageMultiplier, 0);
  assert.ok(result.feedbackCodes.includes("ceftriaxone_no_anaerobe_coverage"));
});

test("6. Metronidazol + anaerobios mixtos es efectivo", () => {
  const result = resolve({
    antibioticId: "metronidazole",
    bacteriaId: "mixed_anaerobes"
  });

  assert.equal(result.effectiveness, "effective");
  assert.ok(result.feedbackCodes.includes("metronidazole_effective_anaerobes"));
});

test("7. Ceftriaxona + metronidazol es una combinación complementaria en infección mixta", () => {
  const result = resolve({
    antibioticId: "ceftriaxone",
    bacteriaId: "ecoli",
    activeTherapy: {
      antibioticIds: ["ceftriaxone", "metronidazole"]
    },
    infectionState: {
      polymicrobial: true,
      bacteriaIds: ["ecoli", "mixed_anaerobes"]
    }
  });

  assert.ok(result.combinationEffects.some((effect) => effect.type === "complementary"));
  assert.ok(result.feedbackCodes.includes("complementary_ceftriaxone_metronidazole"));
});

test("8. Vancomicina mantenida tras cultivo MSSA penaliza PROA y propone desescalada", () => {
  const result = resolve({
    antibioticId: "vancomycin",
    bacteriaId: "mssa",
    cultureState: {
      status: "susceptibility_available",
      identifiedBacteriaId: "mssa",
      susceptibility: {
        vancomycin: "susceptible",
        cefazolin: "susceptible",
        oxacillin: "susceptible"
      }
    },
    activeTherapy: {
      antibioticIds: ["vancomycin"],
      durationSeconds: 90
    }
  });

  assert.equal(result.effectiveness, "effective");
  assert.ok(result.proaEffect < 0);
  assert.ok(result.feedbackCodes.includes("deescalate_vancomycin_for_mssa"));
  assert.ok(result.deescalationCandidates.includes("cefazolin") || result.deescalationCandidates.includes("oxacillin"));
});

test("9. Un antibiograma resistente anula cobertura basal fuerte", () => {
  const result = resolve({
    antibioticId: "ceftriaxone",
    bacteriaId: "ecoli",
    cultureState: {
      status: "susceptibility_available",
      identifiedBacteriaId: "ecoli",
      susceptibility: { ceftriaxone: "resistant" }
    }
  });

  assert.equal(result.effectiveness, "ineffective");
  assert.equal(result.damageMultiplier, 0);
  assert.ok(result.feedbackCodes.includes("susceptibility_resistant_override"));
});

test("10. La sensibilidad informada no vence una incompatibilidad intrínseca", () => {
  const result = resolve({
    antibioticId: "vancomycin",
    bacteriaId: "ecoli",
    cultureState: {
      status: "susceptibility_available",
      identifiedBacteriaId: "ecoli",
      susceptibility: { vancomycin: "susceptible" }
    }
  });

  assert.equal(result.effectiveness, "ineffective");
  assert.equal(result.damageMultiplier, 0);
  assert.ok(result.feedbackCodes.includes("invalid_susceptibility_intrinsic_mismatch"));
});

test("11. La matriz resuelve todos los pares de una infección mixta", () => {
  const matrix = resolveTherapyMatrix(
    {
      activeTherapy: {
        antibioticIds: ["ceftriaxone", "metronidazole"]
      },
      infectionState: {
        bacteriaIds: ["ecoli", "mixed_anaerobes"],
        polymicrobial: true
      }
    },
    fullSteps
  );

  assert.equal(matrix.length, 4);
  assert.ok(matrix.some((entry) => entry.antibioticId === "ceftriaxone" && entry.bacteriaId === "ecoli"));
  assert.ok(matrix.some((entry) => entry.antibioticId === "metronidazole" && entry.bacteriaId === "mixed_anaerobes"));
});

test("12. El contexto desconocido produce un error explícito", () => {
  assert.throws(
    () => resolve({ antibioticId: "unknown", bacteriaId: "mssa" }),
    /Antibiótico desconocido/
  );
});

test("13. Clindamicina susceptible no vence un D-test pendiente cuando hay resistencia a eritromicina", () => {
  const result = resolve({
    antibioticId: "clindamycin",
    bacteriaId: "mrsa",
    cultureState: {
      status: "susceptibility_available",
      identifiedBacteriaId: "mrsa",
      susceptibility: { clindamycin: "susceptible" }
    },
    microbiologyState: {
      erythromycinResistance: "resistant",
      dTest: "not_done"
    }
  });

  assert.equal(result.effectiveness, "conditional");
  assert.ok(result.feedbackCodes.includes("clinda_requires_d_test"));
});

test("14. Clindamicina susceptible con D-test negativo se vuelve efectiva", () => {
  const result = resolve({
    antibioticId: "clindamycin",
    bacteriaId: "mrsa",
    cultureState: {
      status: "susceptibility_available",
      identifiedBacteriaId: "mrsa",
      susceptibility: { clindamycin: "susceptible" }
    },
    microbiologyState: {
      erythromycinResistance: "resistant",
      dTest: "negative"
    }
  });

  assert.equal(result.effectiveness, "effective");
  assert.ok(result.feedbackCodes.includes("clinda_susceptibility_confirmed"));
});
