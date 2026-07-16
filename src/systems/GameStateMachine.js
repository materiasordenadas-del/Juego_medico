export const GAME_STATE = Object.freeze({ BOOT: "BOOT", LOADING: "LOADING", PREPARATION: "PREPARATION", COMBAT: "COMBAT", WAVE_RESOLUTION: "WAVE_RESOLUTION", RESULTS: "RESULTS", PAUSED: "PAUSED" });

export const VALID_TRANSITIONS = Object.freeze({
  [GAME_STATE.BOOT]: [GAME_STATE.LOADING],
  [GAME_STATE.LOADING]: [GAME_STATE.PREPARATION],
  [GAME_STATE.PREPARATION]: [GAME_STATE.COMBAT],
  [GAME_STATE.COMBAT]: [GAME_STATE.WAVE_RESOLUTION, GAME_STATE.PAUSED],
  [GAME_STATE.WAVE_RESOLUTION]: [GAME_STATE.RESULTS],
  [GAME_STATE.RESULTS]: [GAME_STATE.LOADING],
  [GAME_STATE.PAUSED]: [GAME_STATE.COMBAT]
});

export class GameStateMachine {
  constructor() { this.state = GAME_STATE.BOOT; }
  canTransition(next) { return VALID_TRANSITIONS[this.state].includes(next); }
  transition(next) {
    if (!this.canTransition(next)) throw new Error(`Transicion invalida: ${this.state} -> ${next}`);
    this.state = next;
    return this.state;
  }
  is(...states) { return states.includes(this.state); }
}
