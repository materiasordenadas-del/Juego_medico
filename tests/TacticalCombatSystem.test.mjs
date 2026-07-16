import test from "node:test";
import assert from "node:assert/strict";
import { FormationSystem } from "../src/systems/FormationSystem.js";
import { canAttack, enemyAttackTarget, tacticalDamage, tacticalProfile } from "../src/systems/TacticalCombatSystem.js";
import { explainTargetPriority, selectTarget } from "../src/systems/TargetingSystem.js";
import { CombatSystem } from "../src/systems/CombatSystem.js";

const definition = { gameBalance: { range: 100, power: 2, fireRate: 1, projectileSpeed: 300 } };
const view = (x, z = 0) => ({ position: { x, z } });

test("Fase 4: las filas son deterministas y separan protección de respuesta", () => {
  const formation = new FormationSystem({ columns: 3, rows: 1 });
  const rear = { slotId: "player_r1_c1", definition, view: view(-16) };
  const front = { slotId: "player_r1_c3", definition, view: view(-11.2) };
  assert.equal(tacticalProfile(rear, formation).line, "rear");
  assert.equal(tacticalProfile(front, formation).line, "front");
  assert.ok(tacticalDamage(10, rear, formation) > tacticalDamage(10, front, formation));
});

test("Fase 4: alcance, prioridades y distribución no dependen del azar", () => {
  const attacker = { definition, view: view(0) };
  const near = { id: "near", isAlive: true, view: view(5), health: 10, bacterialLoad: 10, isCovered: true, incomingDamage: 0, centerDistance: 1 };
  const far = { id: "far", isAlive: true, view: view(14), health: 100, bacterialLoad: 100, isCovered: false, incomingDamage: 0, centerDistance: 2 };
  assert.equal(canAttack(attacker, near), true);
  assert.equal(canAttack(attacker, far), false);
  assert.equal(selectTarget([near, far], { attacker, range: 10 }).id, "near");
  assert.match(explainTargetPriority({ ...near, isCovered: false }), /no cubierto/);
});

test("Fase 4: primera línea intercepta y su pérdida expone al paciente", () => {
  const formation = new FormationSystem({ columns: 3, rows: 1 });
  const front = { id: "front", isAlive: true, slotId: "player_r1_c3", definition };
  const rear = { id: "rear", isAlive: true, slotId: "player_r1_c1", definition };
  assert.equal(enemyAttackTarget([], [rear, front], formation).id, "front");
  front.isAlive = false;
  assert.equal(enemyAttackTarget([], [rear, front], formation).id, "rear");
});

test("Fase 4: la táctica no cambia el espectro ni la resolución clínica", () => {
  const combat = new CombatSystem({ activeTherapy: { antibioticIds: ["cefazolin"] }, infectionState: { bacteriaIds: ["mrsa"] } });
  const first = combat.resolveProjectileImpact({ antibioticId: "cefazolin", bacteriaId: "mrsa", baseDamage: 10 });
  const second = combat.resolveProjectileImpact({ antibioticId: "cefazolin", bacteriaId: "mrsa", baseDamage: 10 });
  assert.equal(first.effectiveness, "ineffective");
  assert.deepEqual(first, second);
});
