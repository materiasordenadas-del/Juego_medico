import test from "node:test";
import assert from "node:assert/strict";
import { FormationSystem } from "../src/systems/FormationSystem.js";

test("FormationSystem crea posiciones separadas y no permite doble ocupación", () => {
  const formation = new FormationSystem({ columns: 2, rows: 1 });
  const slot = formation.slotsFor("player")[0];
  assert.equal(formation.slotsFor("player").length, 2);
  assert.equal(formation.place(slot.id, "unit_1"), true);
  assert.equal(formation.place(slot.id, "unit_2"), false);
  formation.clear(slot.id);
  assert.equal(formation.get(slot.id).occupiedBy, null);
});
