import test from "node:test";
import assert from "node:assert/strict";
import { GAME_STATE, GameStateMachine } from "../src/systems/GameStateMachine.js";

test("GameStateMachine solo permite transiciones declaradas", () => {
  const machine = new GameStateMachine();
  assert.equal(machine.canTransition(GAME_STATE.LOADING), true);
  assert.throws(() => machine.transition(GAME_STATE.COMBAT), /Transicion invalida/);
  machine.transition(GAME_STATE.LOADING);
  machine.transition(GAME_STATE.PREPARATION);
  machine.transition(GAME_STATE.COMBAT);
  assert.equal(machine.state, GAME_STATE.COMBAT);
});
