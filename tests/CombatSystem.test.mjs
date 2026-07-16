import test from "node:test";
import assert from "node:assert/strict";
import { CombatSystem } from "../src/systems/CombatSystem.js";

test("CombatSystem delega el impacto al resolver clínico sin alterar sus datos", () => {
  const combat = new CombatSystem({ activeTherapy: { antibioticIds: ["cefazolin"] }, infectionState: { bacteriaIds: ["mssa"] } });
  const impact = combat.resolveProjectileImpact({ antibioticId: "cefazolin", bacteriaId: "mssa", baseDamage: 10 });
  assert.equal(impact.effectiveness, "effective");
  assert.equal(impact.appliedDamage, 10);
});
