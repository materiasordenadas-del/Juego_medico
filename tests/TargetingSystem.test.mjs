import test from "node:test";
import assert from "node:assert/strict";
import { selectTarget } from "../src/systems/TargetingSystem.js";

test("TargetingSystem prioriza distancia, salud e identificador de forma estable", () => {
  const target = selectTarget([
    { id: "b", isAlive: true, centerDistance: 1, health: 9 },
    { id: "a", isAlive: true, centerDistance: 1, health: 9 },
    { id: "dead", isAlive: false, centerDistance: 0, health: 0 }
  ]);
  assert.equal(target.id, "a");
  assert.equal(selectTarget([]), null);
});
