import { antibiotics } from "./data/antibiotics.js";
import { FormationBattleScene } from "./scenes/FormationBattleScene.js";
import { HudPanel } from "./ui/HudPanel.js";

const catalogIds = ["cefazolin", "vancomycin", "metronidazole"];
const catalog = catalogIds.map((id) => antibiotics.find((antibiotic) => antibiotic.id === id)).filter(Boolean);

function bootstrap() {
  const hud = new HudPanel(document);
  const scene = new FormationBattleScene({
    canvas: document.querySelector("#battle-canvas"),
    hud,
    antibiotics: catalog
  });

  hud.bind({
    onAntibioticSelect: (id) => scene.selectAntibiotic(id),
    onStart: () => scene.startBattle(),
    onRemove: () => scene.removeSelectedUnit(),
    onResetCamera: () => scene.resetCamera(),
    onRestart: () => scene.restart()
  });

  scene.start();
}

bootstrap();
