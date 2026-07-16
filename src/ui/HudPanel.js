export class HudPanel {
  constructor(root) {
    this.root = root;
    this.lastState = null;
    this.nodes = Object.fromEntries([
      "hud-wave", "hud-health", "hud-toxicity", "hud-resistance", "hud-proa", "hud-credits",
      "enemy-count", "formation-count", "combat-feedback", "battle-state", "context-name",
      "context-class", "context-cost", "context-slot", "start-battle", "remove-unit", "reset-formation", "pause-battle", "battle-speed", "result-panel",
      "result-title", "result-summary", "antibiotic-catalog"
    ].map((id) => [id, root.querySelector(`#${id}`)]));
  }

  bind(actions) {
    this.actions = actions;
    this.root.querySelector("#start-battle").addEventListener("click", actions.onStart);
    this.root.querySelector("#remove-unit").addEventListener("click", actions.onRemove);
    this.root.querySelector("#camera-reset").addEventListener("click", actions.onResetCamera);
    this.root.querySelector("#restart-battle").addEventListener("click", actions.onRestart);
    this.root.querySelector("#pause-battle").addEventListener("click", actions.onPause);
    this.root.querySelector("#battle-speed").addEventListener("change", (event) => actions.onSpeed(Number(event.target.value)));
    this.root.querySelector("#reset-formation").addEventListener("click", actions.onResetFormation);
  }

  renderCatalog(antibiotics) {
    this.nodes["antibiotic-catalog"].innerHTML = antibiotics.map((antibiotic) => `
      <button class="antibiotic-card" type="button" data-antibiotic-id="${antibiotic.id}">
        <span class="unit-glyph">+</span><span><b>${antibiotic.name}</b><small>${antibiotic.pharmacology.subclass.replaceAll("_", " ")}</small></span>
        <em>${antibiotic.gameBalance.cost}</em>
      </button>`).join("");
    this.nodes["antibiotic-catalog"].querySelectorAll("[data-antibiotic-id]").forEach((button) => {
      button.addEventListener("click", () => this.actions.onAntibioticSelect(button.dataset.antibioticId));
    });
  }

  render(state) {
    const fingerprint = JSON.stringify(state);
    if (fingerprint === this.lastState) return;
    this.lastState = fingerprint;
    this.text("hud-wave", state.wave);
    this.text("hud-health", Math.round(state.health));
    this.text("hud-toxicity", Math.round(state.toxicity));
    this.text("hud-resistance", Math.round(state.resistance));
    this.text("hud-proa", Math.round(state.proa));
    this.text("hud-credits", `${state.credits} creditos`);
    this.text("enemy-count", `${state.enemyAlive} / ${state.enemyTotal}`);
    this.text("formation-count", `${state.formationCount} / ${state.formationTotal}`);
    this.text("combat-feedback", state.feedback);
    this.text("battle-state", state.phase);
    this.text("context-name", state.contextName);
    this.text("context-class", state.contextClass);
    this.text("context-cost", state.contextCost);
    this.text("context-slot", state.contextSlot);
    this.nodes["start-battle"].disabled = !state.canStart;
    this.nodes["remove-unit"].disabled = !state.canRemove;
    this.nodes["reset-formation"].disabled = !(state.canResetFormation ?? state.canRemove);
    this.nodes["pause-battle"].disabled = state.phase !== "COMBAT";
    this.nodes["pause-battle"].textContent = state.paused ? "Reanudar" : "Pausa";
    this.nodes["battle-speed"].value = String(state.speed ?? 1);
    this.nodes["result-panel"].hidden = !state.result;
    if (state.result) {
      this.text("result-title", state.result.title);
      this.text("result-summary", state.result.summary);
    }
    this.root.querySelectorAll(".antibiotic-card").forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.antibioticId === state.selectedAntibioticId);
      card.disabled = state.phase !== "PREPARATION";
    });
  }

  text(id, value) { if (this.nodes[id]) this.nodes[id].textContent = value; }
}
