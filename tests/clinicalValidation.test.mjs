import test from "node:test";
import assert from "node:assert/strict";

import { antibiotics } from "../src/data/antibiotics.js";
import { bacteria } from "../src/data/bacteria.js";
import { levelConfig } from "../src/data/progression.js";
import {
  resolveAntibioticEffect,
  resolveTherapyMatrix,
  DEFAULT_CLINICAL_STEPS
} from "../src/engine/clinicalResolver.js";

const fullSteps = [...DEFAULT_CLINICAL_STEPS];

function resolve(context, steps = fullSteps) {
  return resolveAntibioticEffect(context, steps);
}

const genericCoverageCodes = ["coverage_strong", "coverage_conditional", "coverage_absent", "therapy_contraindicated"];

function assertSingleFinalCoverageCode(result) {
  const present = genericCoverageCodes.filter((code) => result.feedbackCodes.includes(code));
  assert.equal(present.length, 1, `Se esperaba un único código final; se recibió ${present.join(", ")}`);
}

test("15. La matriz basal completa produce 65 resoluciones válidas y finitas", () => {
  let count = 0;
  for (const antibiotic of antibiotics) {
    for (const bacterium of bacteria) {
      const result = resolve({ antibioticId: antibiotic.id, bacteriaId: bacterium.id });
      count += 1;
      assert.ok(["effective", "conditional", "ineffective", "contraindicated"].includes(result.effectiveness));
      assert.ok(Number.isFinite(result.damageMultiplier));
      assert.ok(result.damageMultiplier >= 0 && result.damageMultiplier <= 1.25);
      assert.ok(Number.isFinite(result.proaEffect));
      assert.ok(Number.isFinite(result.resistancePressure));
      assertSingleFinalCoverageCode(result);
    }
  }
  assert.equal(count, 65);
});

test("16. Un antibiograma resistente elimina mensajes positivos obsoletos", () => {
  const result = resolve({
    antibioticId: "cefazolin",
    bacteriaId: "mssa",
    cultureState: {
      status: "susceptibility_available",
      identifiedBacteriaId: "mssa",
      susceptibility: { cefazolin: "resistant" }
    }
  });

  assert.equal(result.effectiveness, "ineffective");
  assert.ok(result.feedbackCodes.includes("susceptibility_resistant_override"));
  assert.ok(!result.feedbackCodes.includes("coverage_strong"));
  assert.ok(!result.feedbackCodes.includes("cefazolin_effective_mssa"));
  assertSingleFinalCoverageCode(result);
});

test("17. Datos de sensibilidad no disponibles aún no modifican la cobertura", () => {
  const result = resolve({
    antibioticId: "cefazolin",
    bacteriaId: "ecoli",
    cultureState: {
      status: "pending",
      identifiedBacteriaId: null,
      susceptibility: { cefazolin: "susceptible" }
    }
  });

  assert.equal(result.effectiveness, "conditional");
  assert.ok(result.warnings.includes("susceptibility_data_not_yet_available"));
});

test("18. La sensibilidad de una bacteria identificada no se aplica a otro blanco", () => {
  const result = resolve({
    antibioticId: "clindamycin",
    bacteriaId: "mrsa",
    cultureState: {
      status: "susceptibility_available",
      identifiedBacteriaId: "mssa",
      susceptibility: { clindamycin: "susceptible" }
    },
    microbiologyState: {
      erythromycinResistance: "susceptible",
      dTest: "not_required"
    }
  });

  assert.equal(result.effectiveness, "conditional");
  assert.ok(result.warnings.includes("culture_target_mismatch"));
});

test("19. Todos los betalactámicos comunes permanecen inefectivos frente a MRSA", () => {
  const betaLactams = antibiotics.filter((item) => item.pharmacology.family.includes("beta_lactam"));
  assert.ok(betaLactams.length > 0);

  for (const antibiotic of betaLactams) {
    const result = resolve({
      antibioticId: antibiotic.id,
      bacteriaId: "mrsa",
      cultureState: {
        status: "susceptibility_available",
        identifiedBacteriaId: "mrsa",
        susceptibility: { [antibiotic.id]: "susceptible" }
      }
    });
    assert.equal(result.effectiveness, "ineffective", antibiotic.id);
    assert.equal(result.damageMultiplier, 0, antibiotic.id);
  }
});

test("20. D-test positivo bloquea clindamicina aunque figure susceptible", () => {
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
      dTest: "positive"
    }
  });

  assert.equal(result.effectiveness, "ineffective");
  assert.equal(result.damageMultiplier, 0);
  assert.ok(result.feedbackCodes.includes("clinda_d_test_positive_failure"));
});

test("21. El control del foco incompleto limita, pero no inventa, resistencia", () => {
  const complete = resolve({
    antibioticId: "vancomycin",
    bacteriaId: "mrsa",
    infectionState: { sourceControlRequired: true, sourceControlCompleted: true }
  });
  const incomplete = resolve({
    antibioticId: "vancomycin",
    bacteriaId: "mrsa",
    infectionState: { sourceControlRequired: true, sourceControlCompleted: false }
  });

  assert.equal(complete.effectiveness, "effective");
  assert.equal(incomplete.effectiveness, "effective");
  assert.ok(incomplete.damageMultiplier < complete.damageMultiplier);
  assert.ok(incomplete.feedbackCodes.includes("source_control_required"));
  assert.ok(incomplete.resistancePressure > complete.resistancePressure);
});

test("22. Alergia inmediata grave bloquea betalactámico sin decir que carece de espectro", () => {
  const result = resolve({
    antibioticId: "cefazolin",
    bacteriaId: "mssa",
    patientState: { flags: ["severeImmediateBetaLactamAllergy"] }
  });

  assert.equal(result.effectiveness, "contraindicated");
  assert.equal(result.damageMultiplier, 0);
  assert.ok(result.feedbackCodes.includes("therapy_contraindicated"));
  assert.ok(!result.feedbackCodes.includes("coverage_absent"));
});

test("23. Modificadores de seguridad generan advertencias específicas", () => {
  const clinda = resolve({ antibioticId: "clindamycin", bacteriaId: "strep_pyogenes", patientState: { flags: ["priorCdiff"] } });
  const linezolid = resolve({ antibioticId: "linezolid", bacteriaId: "mrsa", patientState: { flags: ["serotonergicDrugs"] } });
  const cipro = resolve({ antibioticId: "ciprofloxacin", bacteriaId: "ecoli", patientState: { flags: ["highQtRisk"] } });

  assert.ok(clinda.feedbackCodes.includes("clindamycin_cdiff_risk"));
  assert.ok(linezolid.feedbackCodes.includes("linezolid_serotonergic_interaction"));
  assert.ok(cipro.feedbackCodes.includes("ciprofloxacin_qt_risk"));
});

test("24. La combinación complementaria no elogia el impacto contra el blanco equivocado", () => {
  const common = {
    activeTherapy: { antibioticIds: ["ceftriaxone", "metronidazole"] },
    infectionState: { bacteriaIds: ["ecoli", "mixed_anaerobes"], polymicrobial: true }
  };

  const correctAerobe = resolve({ ...common, antibioticId: "ceftriaxone", bacteriaId: "ecoli" });
  const wrongAnaerobe = resolve({ ...common, antibioticId: "ceftriaxone", bacteriaId: "mixed_anaerobes" });
  const correctAnaerobe = resolve({ ...common, antibioticId: "metronidazole", bacteriaId: "mixed_anaerobes" });
  const wrongAerobe = resolve({ ...common, antibioticId: "metronidazole", bacteriaId: "ecoli" });

  assert.ok(correctAerobe.feedbackCodes.includes("complementary_ceftriaxone_metronidazole"));
  assert.ok(correctAnaerobe.feedbackCodes.includes("complementary_ceftriaxone_metronidazole"));
  assert.ok(!wrongAnaerobe.feedbackCodes.includes("complementary_ceftriaxone_metronidazole"));
  assert.ok(!wrongAerobe.feedbackCodes.includes("complementary_ceftriaxone_metronidazole"));
  assert.equal(wrongAnaerobe.effectiveness, "ineffective");
  assert.equal(wrongAerobe.effectiveness, "ineffective");
});

test("25. Cefazolina + oxacilina contra MSSA se marca como redundante", () => {
  const result = resolve({
    antibioticId: "cefazolin",
    bacteriaId: "mssa",
    activeTherapy: { antibioticIds: ["cefazolin", "oxacillin"] }
  });

  assert.ok(result.combinationEffects.some((effect) => effect.type === "redundant"));
  assert.ok(result.proaEffect < 0);
});

test("26. Vancomicina + gentamicina eleva exposición renal y auditiva", () => {
  const vancomycinAlone = resolve({ antibioticId: "vancomycin", bacteriaId: "mrsa" });
  const vancomycinCombined = resolve({
    antibioticId: "vancomycin",
    bacteriaId: "mrsa",
    activeTherapy: { antibioticIds: ["vancomycin", "gentamicin"] }
  });
  const gentamicinAlone = resolve({ antibioticId: "gentamicin", bacteriaId: "ecoli" });
  const gentamicinCombined = resolve({
    antibioticId: "gentamicin",
    bacteriaId: "ecoli",
    activeTherapy: { antibioticIds: ["vancomycin", "gentamicin"] }
  });

  assert.ok(vancomycinCombined.toxicityExposure.kidney > vancomycinAlone.toxicityExposure.kidney);
  assert.ok(gentamicinCombined.toxicityExposure.kidney > gentamicinAlone.toxicityExposure.kidney);
  assert.ok(gentamicinCombined.toxicityExposure.ear > gentamicinAlone.toxicityExposure.ear);
});

test("27. Insuficiencia renal aumenta la exposición normalizada", () => {
  const normal = resolve({ antibioticId: "vancomycin", bacteriaId: "mrsa" });
  const impaired = resolve({
    antibioticId: "vancomycin",
    bacteriaId: "mrsa",
    patientState: { flags: ["renalImpairment"] }
  });

  assert.ok(impaired.toxicityExposure.kidney > normal.toxicityExposure.kidney);
  assert.ok(impaired.feedbackCodes.includes("renal_exposure_warning"));
});

test("28. Meropenem innecesario en infección estreptocócica no grave reduce PROA", () => {
  const narrow = resolve({
    antibioticId: "penicillin_g",
    bacteriaId: "strep_pyogenes",
    infectionState: { severity: "moderate" }
  });
  const excessive = resolve({
    antibioticId: "meropenem",
    bacteriaId: "strep_pyogenes",
    infectionState: { severity: "moderate" }
  });

  assert.ok(narrow.proaEffect > excessive.proaEffect);
  assert.ok(excessive.proaEffect < 0);
  assert.ok(excessive.feedbackCodes.includes("unnecessarily_broad_empiric_therapy"));
});

test("29. Cobertura amplia empírica grave se tolera temporalmente", () => {
  const result = resolve({
    antibioticId: "meropenem",
    bacteriaId: "ecoli",
    infectionState: { severity: "severe" },
    cultureState: { status: "pending" }
  });

  assert.ok(result.feedbackCodes.includes("empiric_broad_justified"));
  assert.ok(!result.feedbackCodes.includes("unnecessarily_broad_empiric_therapy"));
});

test("30. Vancomicina tras confirmar MSSA exige desescalada", () => {
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
    }
  });

  assert.ok(result.proaEffect < 0);
  assert.ok(result.deescalationCandidates.includes("cefazolin"));
  assert.ok(result.deescalationCandidates.includes("oxacillin"));
});

test("31. Presión de resistencia aumenta con ineficacia, duración y foco no controlado", () => {
  const effective = resolve({ antibioticId: "cefazolin", bacteriaId: "mssa" });
  const poor = resolve({
    antibioticId: "cefazolin",
    bacteriaId: "mrsa",
    activeTherapy: { durationSeconds: 120 },
    infectionState: {
      bacterialLoad: "high",
      sourceControlRequired: true,
      sourceControlCompleted: false
    }
  });

  assert.ok(poor.resistancePressure > effective.resistancePressure);
  assert.ok(poor.feedbackCodes.includes("resistance_pressure_rising"));
});

test("32. La progresión activa caveats solo desde el nivel correspondiente", () => {
  const context = {
    antibioticId: "clindamycin",
    bacteriaId: "mrsa",
    microbiologyState: { erythromycinResistance: "resistant", dTest: "not_done" }
  };
  const level1 = resolveAntibioticEffect(context, { activeSteps: levelConfig[1].clinicalSteps });
  const level2 = resolveAntibioticEffect(context, { activeSteps: levelConfig[2].clinicalSteps });

  assert.equal(level1.effectiveness, "conditional");
  assert.ok(!level1.feedbackCodes.includes("clinda_requires_d_test"));
  assert.ok(level2.feedbackCodes.includes("clinda_requires_d_test"));
});

test("33. El orden suministrado de pasos no cambia la semántica clínica", () => {
  const context = {
    antibioticId: "vancomycin",
    bacteriaId: "mssa",
    cultureState: {
      status: "susceptibility_available",
      identifiedBacteriaId: "mssa",
      susceptibility: { vancomycin: "susceptible", cefazolin: "susceptible" }
    }
  };
  const shuffled = [...fullSteps].reverse();
  const normal = resolveAntibioticEffect(context, fullSteps);
  const reordered = resolveAntibioticEffect(context, shuffled);

  assert.deepEqual(
    { effectiveness: reordered.effectiveness, proaEffect: reordered.proaEffect, candidates: reordered.deescalationCandidates },
    { effectiveness: normal.effectiveness, proaEffect: normal.proaEffect, candidates: normal.deescalationCandidates }
  );
  assert.deepEqual(reordered.activeSteps, fullSteps);
});

test("34. IDs desconocidos dentro de la terapia activa se rechazan", () => {
  assert.throws(
    () => resolve({
      antibioticId: "cefazolin",
      bacteriaId: "mssa",
      activeTherapy: { antibioticIds: ["cefazolin", "ghost_antibiotic"] }
    }),
    /Antibiótico desconocido en activeTherapy/
  );
});

test("35. Valores numéricos no finitos se rechazan y negativos se normalizan", () => {
  assert.throws(
    () => resolve({
      antibioticId: "vancomycin",
      bacteriaId: "mrsa",
      patientState: { toxicityLoad: { kidney: Number.NaN } }
    }),
    /toxicityLoad.kidney debe ser finito/
  );

  const negative = resolve({
    antibioticId: "vancomycin",
    bacteriaId: "mrsa",
    activeTherapy: { durationSeconds: -50 },
    patientState: { toxicityLoad: { kidney: -20 } }
  });
  const zero = resolve({
    antibioticId: "vancomycin",
    bacteriaId: "mrsa",
    activeTherapy: { durationSeconds: 0 },
    patientState: { toxicityLoad: { kidney: 0 } }
  });
  assert.equal(negative.resistancePressure, zero.resistancePressure);
  assert.equal(negative.toxicityRisk.kidney, zero.toxicityRisk.kidney);
});

test("36. El resolver es determinista y no muta la entrada", () => {
  const input = {
    antibioticId: "clindamycin",
    bacteriaId: "mrsa",
    cultureState: {
      status: "susceptibility_available",
      identifiedBacteriaId: "mrsa",
      susceptibility: { clindamycin: "susceptible" }
    },
    microbiologyState: { erythromycinResistance: "resistant", dTest: "negative" },
    activeTherapy: { antibioticIds: ["clindamycin"] }
  };
  const snapshot = structuredClone(input);
  const first = resolve(input);
  const second = resolve(input);

  assert.deepEqual(input, snapshot);
  assert.deepEqual(first, second);
});

test("37. La matriz elimina duplicados de antibióticos y bacterias", () => {
  const matrix = resolveTherapyMatrix({
    activeTherapy: { antibioticIds: ["ceftriaxone", "ceftriaxone", "metronidazole"] },
    infectionState: { bacteriaIds: ["ecoli", "ecoli", "mixed_anaerobes"] }
  }, fullSteps);

  assert.equal(matrix.length, 4);
});

test("38. Un paso desconocido y un pipeline sin cobertura basal producen error", () => {
  assert.throws(
    () => resolveAntibioticEffect({ antibioticId: "cefazolin", bacteriaId: "mssa" }, ["baseCoverage", "ghost"]),
    /Pasos clínicos desconocidos/
  );
  assert.throws(
    () => resolveAntibioticEffect({ antibioticId: "cefazolin", bacteriaId: "mssa" }, ["feedback"]),
    /debe incluir baseCoverage/
  );
});

test("39. Gentamicina no se presenta como monoterapia antiestafilocócica en SSTI", () => {
  for (const target of ["mssa", "mrsa"]) {
    const result = resolve({
      antibioticId: "gentamicin",
      bacteriaId: target,
      cultureState: {
        status: "susceptibility_available",
        identifiedBacteriaId: target,
        susceptibility: { gentamicin: "susceptible" }
      }
    });
    assert.equal(result.effectiveness, "ineffective", target);
    assert.equal(result.damageMultiplier, 0, target);
  }
});

test("40. Los umbrales de toxicidad respetan 0–30, 31–60, 61–80 y 81–100", () => {
  const classify = (kidney) => resolve({
    antibioticId: "vancomycin",
    bacteriaId: "mrsa",
    patientState: { toxicityLoad: { kidney } }
  }).toxicityRisk.kidney;

  assert.equal(classify(0), "safe");
  assert.equal(classify(30), "safe");
  assert.equal(classify(31), "warning");
  assert.equal(classify(60), "warning");
  assert.equal(classify(61), "high");
  assert.equal(classify(80), "high");
  assert.equal(classify(81), "critical");
  assert.equal(classify(100), "critical");
});

test("41. E. coli identificada sin antibiograma no autoriza desescalada automática", () => {
  const identifiedOnly = resolve({
    antibioticId: "meropenem",
    bacteriaId: "ecoli",
    cultureState: {
      status: "identified",
      identifiedBacteriaId: "ecoli"
    }
  });
  assert.deepEqual(identifiedOnly.deescalationCandidates, []);

  const susceptible = resolve({
    antibioticId: "meropenem",
    bacteriaId: "ecoli",
    cultureState: {
      status: "susceptibility_available",
      identifiedBacteriaId: "ecoli",
      susceptibility: {
        ceftriaxone: "susceptible",
        cefazolin: "resistant",
        ciprofloxacin: "resistant",
        gentamicin: "resistant"
      }
    }
  });
  assert.ok(susceptible.deescalationCandidates.includes("ceftriaxone"));
  assert.ok(!susceptible.deescalationCandidates.includes("cefazolin"));
});
