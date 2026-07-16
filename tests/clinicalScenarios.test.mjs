import test from "node:test";
import assert from "node:assert/strict";
import { clinicalScenarios } from "../src/scenarios/clinicalScenarios.js";
import { validateScenarios } from "../src/scenarios/scenarioValidation.js";
import { ClinicalLoopEngine, CLINICAL_PHASE } from "../src/scenarios/ClinicalLoopEngine.js";
import { translateFeedbackCodes } from "../src/scenarios/feedbackTranslator.js";
import { levelConfig } from "../src/data/progression.js";

test("los tres escenarios tienen integridad clínica y fuentes registradas", () => { assert.equal(clinicalScenarios.length, 3); assert.equal(validateScenarios(clinicalScenarios), true); });
test("el flujo clínico avanza por presentación, cultivo y terapia dirigida", () => { const loop = new ClinicalLoopEngine(clinicalScenarios[0]); assert.equal(loop.phase, CLINICAL_PHASE.PRESENTATION); loop.advance(); loop.advance(); loop.advance(); assert.equal(loop.phase, CLINICAL_PHASE.MICROBIOLOGY); assert.equal(loop.cultureRevealed, true); loop.advance(); loop.advance(); assert.equal(loop.phase, CLINICAL_PHASE.OUTCOME); });
test("absceso falla sin control del foco y se completa con drenaje y cobertura MRSA", () => { const loop = new ClinicalLoopEngine(clinicalScenarios[1]); loop.selectTherapy(["vancomycin"]); assert.equal(loop.evaluate().sourceControlOk, false); loop.completeSourceControl(); assert.equal(loop.evaluate().success, true); });
test("pie diabético exige combinación dirigida y control del foco", () => { const loop = new ClinicalLoopEngine(clinicalScenarios[2]); loop.selectTherapy(["ceftriaxone", "metronidazole"]); loop.completeSourceControl(); assert.equal(loop.evaluate().success, true); });
test("la traducción no expone códigos internos y entrega qué, por qué e implicación", () => { const message = translateFeedbackCodes(["cefazolin_fails_mrsa_pbp2a"])[0]; assert.ok(message.what.includes("Cefazolina")); assert.ok(message.why.length > 0 && message.implication.length > 0); assert.equal(JSON.stringify(message).includes("cefazolin_fails_mrsa_pbp2a"), false); });
test("las métricas avanzadas permanecen ocultas en progresión inicial", () => { assert.equal(levelConfig[1].showToxicity, false); assert.equal(levelConfig[1].showCulture, false); assert.equal(levelConfig[6].showCulture, true); });
