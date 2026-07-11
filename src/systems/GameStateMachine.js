export const GAME_STATE = Object.freeze({ BOOT: "BOOT", LOADING: "LOADING", PREPARATION: "PREPARATION", COMBAT: "COMBAT", WAVE_RESOLUTION: "WAVE_RESOLUTION", RESULTS: "RESULTS", PAUSED: "PAUSED" });

export class GameStateMachine {
  constructor() { this.state = GAME_STATE.BOOT; }
  transition(next) { this.state = next; return this.state; }
  is(...states) { return states.includes(this.state); }
}
