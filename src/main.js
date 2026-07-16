import { antibiotics } from "./data/antibiotics.js";
import { FormationBattleScene } from "./scenes/FormationBattleScene.js";
import { HudPanel } from "./ui/HudPanel.js";

const catalog = ["cefazolin", "vancomycin", "metronidazole"].map((id) => antibiotics.find((item) => item.id === id)).filter(Boolean);

function showBootstrapError(error) {
  const panel = document.querySelector("#file-open-warning");
  panel.hidden = false;
  panel.textContent = `No se pudo iniciar: ${error.message}`;
  console.error(error);
}

try {
  const hud = new HudPanel(document);
  const scene = new FormationBattleScene({ canvas: document.querySelector("#battle-canvas"), hud, antibiotics: catalog });
  hud.bind({ onAntibioticSelect: (id) => scene.selectAntibiotic(id), onStart: () => scene.startBattle(), onRemove: () => scene.removeSelectedUnit(), onResetCamera: () => scene.resetCamera(), onRestart: () => scene.restart(), onPause: () => scene.togglePause(), onSpeed: (speed) => scene.setSpeed(speed), onResetFormation: () => scene.resetFormation() });
  scene.start().catch(showBootstrapError);
} catch (error) { const panel = document.querySelector("#file-open-warning"); panel.hidden = false; panel.textContent = `No se pudo iniciar: ${error.message}`; console.error(error); }
