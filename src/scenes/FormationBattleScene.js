import * as THREE from "three";
import { getBacteriumById } from "../data/bacteria.js";
import { CombatSystem } from "../systems/CombatSystem.js";
import { FormationSystem } from "../systems/FormationSystem.js";
import { GAME_STATE, GameStateMachine } from "../systems/GameStateMachine.js";
import { selectTarget } from "../systems/TargetingSystem.js";

const UNIT_COLORS = { cefazolin: 0x62b9ea, vancomycin: 0xa278e6, metronidazole: 0xd56bd3 };
const BACTERIUM_COLOR = 0xd65b50;

function valueFrom(object) {
  if (typeof object === "number") return object;
  if (!object || typeof object !== "object") return 0;
  return Object.values(object).reduce((total, value) => total + valueFrom(value), 0);
}

function createAntibioticView(unit) {
  const group = new THREE.Group();
  const color = UNIT_COLORS[unit.definitionId] ?? 0x62b9ea;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.85, 5, 10), new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0.12 }));
  body.position.y = 0.82;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf4e8d2, roughness: 0.8 }));
  head.position.y = 1.55;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 0.18, 16), new THREE.MeshStandardMaterial({ color: 0x34485a, roughness: 0.7 }));
  base.position.y = 0.09;
  group.add(base, body, head); group.userData.unitId = unit.id; return group;
}

function createBacteriaView(unit) {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.53, 2), new THREE.MeshStandardMaterial({ color: BACTERIUM_COLOR, roughness: 0.4, metalness: 0.14, emissive: 0x2d0906 }));
  shell.position.y = 0.62;
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffc25c, emissive: 0x7d3100 }));
  core.position.set(0.17, 0.72, 0.35);
  group.add(shell, core); group.userData.unitId = unit.id; return group;
}

export class FormationBattleScene {
  constructor({ canvas, hud, antibiotics }) {
    this.canvas = canvas; this.hud = hud; this.antibiotics = antibiotics; this.machine = new GameStateMachine();
    this.formation = new FormationSystem({}); this.units = []; this.projectiles = []; this.clock = new THREE.Clock();
    this.health = 100; this.credits = 150; this.wave = 1; this.toxicity = 0; this.resistance = 0; this.proa = 0;
    this.feedback = "Preparacion: coloca una unidad para comenzar."; this.selectedAntibioticId = null; this.selectedUnitId = null; this.result = null;
    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2(); this.createRenderer(); this.createWorld(); this.createEnemyFormation(); this.hud.renderCatalog(antibiotics);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x83b8dc); this.scene.fog = new THREE.Fog(0x83b8dc, 20, 42);
    this.camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100); this.resetCamera();
    window.addEventListener("resize", () => this.resize()); this.canvas.addEventListener("pointerdown", (event) => this.onPointerDown(event));
  }

  createWorld() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(27, 22), new THREE.MeshStandardMaterial({ color: 0x6ca656, roughness: 0.92 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; this.scene.add(ground);
    const playerGround = new THREE.Mesh(new THREE.PlaneGeometry(15, 5.7), new THREE.MeshStandardMaterial({ color: 0x4b8250, transparent: true, opacity: 0.52 }));
    playerGround.rotation.x = -Math.PI / 2; playerGround.position.z = 4.8; this.scene.add(playerGround);
    const enemyGround = playerGround.clone(); enemyGround.position.z = -5.2; enemyGround.material = enemyGround.material.clone(); enemyGround.material.color.setHex(0x8a6045); this.scene.add(enemyGround);
    this.scene.add(new THREE.HemisphereLight(0xe7f2ff, 0x304b2b, 2.3));
    const sun = new THREE.DirectionalLight(0xfff0c6, 3.2); sun.position.set(-8, 14, 7); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); this.scene.add(sun);
    const divider = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.18, 0.18), new THREE.MeshStandardMaterial({ color: 0xc8a565, emissive: 0x392713 })); divider.position.set(0, 0.12, -0.4); this.scene.add(divider);
    this.slotMeshes = this.formation.slotsFor("player").map((slot) => this.createSlotMesh(slot));
  }

  createSlotMesh(slot) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 20), new THREE.MeshStandardMaterial({ color: 0x9fd79a, transparent: true, opacity: 0.42, emissive: 0x1d4b31 }));
    mesh.position.set(slot.position.x, 0.04, slot.position.z); mesh.userData.slotId = slot.id; this.scene.add(mesh); return mesh;
  }

  createEnemyFormation() {
    const definition = getBacteriumById("mssa");
    this.formation.slotsFor("enemy").slice(0, 10).forEach((slot, index) => {
      const unit = { id: `bacteria_${index + 1}`, definitionId: definition.id, health: definition.gameBalance.baseHealth, maxHealth: definition.gameBalance.baseHealth, patientDamage: definition.gameBalance.patientDamage, isAlive: true, centerDistance: Math.abs(slot.column - 2) + Math.abs(slot.row - 1), cooldown: 2.8 + index * 0.05, slotId: slot.id };
      this.formation.place(slot.id, unit.id); unit.view = createBacteriaView(unit); unit.view.position.set(slot.position.x, 0, slot.position.z); unit.view.traverse((child) => { child.castShadow = true; }); this.scene.add(unit.view); this.units.push(unit);
    });
  }

  start() { this.machine.transition(GAME_STATE.PREPARATION); this.resize(); this.renderHud(); this.animate(); }
  resetCamera() { this.camera?.position.set(0, 12.8, 16); this.camera?.lookAt(0, 0, -0.2); }
  resize() { const rect = this.canvas.getBoundingClientRect(); const width = Math.max(1, rect.width); const height = Math.max(1, rect.height); this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); }

  selectAntibiotic(id) {
    if (!this.machine.is(GAME_STATE.PREPARATION)) return;
    this.selectedAntibioticId = id; this.selectedUnitId = null; const antibiotic = this.antibiotics.find((item) => item.id === id);
    this.feedback = `${antibiotic.name} seleccionado. Elige una posicion verde.`; this.renderHud();
  }

  onPointerDown(event) {
    if (!this.machine.is(GAME_STATE.PREPARATION)) return;
    const rect = this.canvas.getBoundingClientRect(); this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects([...this.slotMeshes, ...this.units.map((unit) => unit.view)], true);
    const root = hits[0] && this.getInteractiveRoot(hits[0].object); if (!root) return;
    if (root.userData.slotId) this.placeUnit(root.userData.slotId); else if (root.userData.unitId) this.selectPlacedUnit(root.userData.unitId);
  }

  getInteractiveRoot(object) { let current = object; while (current && !current.userData.slotId && !current.userData.unitId) current = current.parent; return current; }
  placeUnit(slotId) {
    const slot = this.formation.get(slotId); if (!this.selectedAntibioticId || !slot || slot.occupiedBy) return;
    const placedUnit = this.units.find((item) => item.id === this.selectedUnitId && item.definition);
    if (placedUnit) {
      this.formation.clear(placedUnit.slotId);
      this.formation.place(slotId, placedUnit.id);
      placedUnit.slotId = slotId;
      placedUnit.view.position.set(slot.position.x, 0, slot.position.z);
      this.feedback = `${placedUnit.definition.name} movido a ${slotId.replace("player_", "")}.`;
      this.renderHud();
      return;
    }
    const definition = this.antibiotics.find((item) => item.id === this.selectedAntibioticId); if (this.credits < definition.gameBalance.cost) { this.feedback = "No hay creditos suficientes para esa unidad."; this.renderHud(); return; }
    const unit = { id: `${definition.id}_${Date.now()}`, definitionId: definition.id, definition, slotId, cooldown: 0.4, isAlive: true, health: 1, maxHealth: 1 };
    if (!this.formation.place(slotId, unit.id)) return;
    this.credits -= definition.gameBalance.cost; unit.view = createAntibioticView(unit); unit.view.position.set(slot.position.x, 0, slot.position.z); unit.view.rotation.y = Math.PI; unit.view.traverse((child) => { child.castShadow = true; }); this.scene.add(unit.view); this.units.push(unit); this.selectedUnitId = unit.id; this.feedback = `${definition.name} colocado en la formacion.`; this.renderHud();
  }
  selectPlacedUnit(id) { const unit = this.units.find((item) => item.id === id && item.definition); if (!unit) return; this.selectedUnitId = id; this.selectedAntibioticId = unit.definitionId; this.feedback = `${unit.definition.name} seleccionado. Puedes retirarlo.`; this.renderHud(); }
  removeSelectedUnit() { if (!this.machine.is(GAME_STATE.PREPARATION)) return; const unit = this.units.find((item) => item.id === this.selectedUnitId && item.definition); if (!unit) return; this.credits += unit.definition.gameBalance.cost; this.formation.clear(unit.slotId); this.scene.remove(unit.view); this.units = this.units.filter((item) => item !== unit); this.feedback = `${unit.definition.name} devuelto al catalogo.`; this.selectedUnitId = null; this.renderHud(); }

  startBattle() {
    if (!this.machine.is(GAME_STATE.PREPARATION) || !this.allies.length) return;
    this.machine.transition(GAME_STATE.COMBAT); this.selectedUnitId = null; this.feedback = "Combate automatico iniciado. La formacion esta bloqueada."; this.slotMeshes.forEach((mesh) => { mesh.visible = false; });
    this.combat = new CombatSystem({ level: 1, activeTherapy: { antibioticIds: this.allies.map((unit) => unit.definitionId), durationSeconds: 0 }, infectionState: { severity: "moderate", bacteriaIds: ["mssa"], polymicrobial: false, sourceControlRequired: false, sourceControlCompleted: false, bacterialLoad: "moderate" } }); this.renderHud();
  }

  update(delta) {
    this.units.filter((unit) => unit.isAlive).forEach((unit, index) => { if (unit.view) unit.view.position.y = Math.sin(performance.now() * 0.002 + index) * 0.035; });
    if (!this.machine.is(GAME_STATE.COMBAT)) return;
    for (const ally of this.allies) { ally.cooldown -= delta; if (ally.cooldown <= 0) this.fire(ally); }
    for (const enemy of this.enemies) { enemy.cooldown -= delta; if (enemy.cooldown <= 0) { enemy.cooldown = 3.8; this.health = Math.max(0, this.health - enemy.patientDamage); this.feedback = "La horda mantiene la presion sobre el paciente."; } }
    this.projectiles = this.projectiles.filter((projectile) => this.updateProjectile(projectile, delta));
    if (!this.enemies.length || this.health <= 0) this.resolveWave();
  }
  fire(ally) { const target = selectTarget(this.enemies); if (!target) return; ally.cooldown = 1 / ally.definition.gameBalance.fireRate; ally.view.lookAt(target.view.position.x, ally.view.position.y, target.view.position.z); const orb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ color: UNIT_COLORS[ally.definitionId] ?? 0x62b9ea })); orb.position.copy(ally.view.position).add(new THREE.Vector3(0, 1.25, 0)); this.scene.add(orb); this.projectiles.push({ mesh: orb, attacker: ally, target, speed: 13 }); }
  updateProjectile(projectile, delta) { if (!projectile.target.isAlive) { this.scene.remove(projectile.mesh); return false; } const direction = projectile.target.view.position.clone().add(new THREE.Vector3(0, 0.65, 0)).sub(projectile.mesh.position); if (direction.length() < 0.35) { this.impact(projectile); this.scene.remove(projectile.mesh); return false; } projectile.mesh.position.add(direction.normalize().multiplyScalar(projectile.speed * delta)); return true; }
  impact(projectile) { const impact = this.combat.resolveProjectileImpact({ antibioticId: projectile.attacker.definitionId, bacteriaId: projectile.target.definitionId, baseDamage: projectile.attacker.definition.gameBalance.power * 18 }); projectile.target.health = Math.max(0, projectile.target.health - impact.appliedDamage); this.toxicity += valueFrom(impact.toxicityExposure); this.resistance += valueFrom(impact.resistancePressure); this.proa += valueFrom(impact.proaEffect); this.feedback = impact.feedbackCodes?.[0] ?? `Resolver: ${impact.effectiveness}`; projectile.target.view.scale.setScalar(impact.damageMultiplier > 0 ? 0.84 : 1.08); if (projectile.target.health === 0) { projectile.target.isAlive = false; this.scene.remove(projectile.target.view); this.formation.clear(projectile.target.slotId); this.credits += 10; } }
  resolveWave() { if (!this.machine.is(GAME_STATE.COMBAT)) return; this.machine.transition(GAME_STATE.WAVE_RESOLUTION); const won = this.enemies.length === 0; this.result = { title: won ? "VICTORIA" : "DERROTA", summary: won ? "La horda fue controlada. Puedes preparar otra oleada." : "La salud del paciente llego a cero." }; this.feedback = won ? "Oleada resuelta por el motor clinico." : "La horda supero las defensas."; this.machine.transition(GAME_STATE.RESULTS); this.renderHud(); }
  restart() { window.location.reload(); }
  animate() { requestAnimationFrame(() => this.animate()); const delta = Math.min(this.clock.getDelta(), 0.05); this.update(delta); this.renderer.render(this.scene, this.camera); this.renderHud(); }
  get allies() { return this.units.filter((unit) => unit.definition && unit.isAlive); }
  get enemies() { return this.units.filter((unit) => !unit.definition && unit.isAlive); }
  renderHud() { const selected = this.units.find((unit) => unit.id === this.selectedUnitId); const selectedDefinition = selected?.definition ?? this.antibiotics.find((item) => item.id === this.selectedAntibioticId); this.hud.render({ wave: this.wave, health: this.health, toxicity: this.toxicity, resistance: this.resistance, proa: this.proa, credits: this.credits, enemyAlive: this.enemies.length, enemyTotal: 10, formationCount: this.allies.length, formationTotal: this.formation.slotsFor("player").length, feedback: this.feedback, phase: this.machine.state, selectedAntibioticId: this.selectedAntibioticId, contextName: selectedDefinition?.name ?? "Elige un antibiotico", contextClass: selectedDefinition ? selectedDefinition.pharmacology.subclass.replaceAll("_", " ") : "Selecciona una unidad del catalogo y luego una posicion iluminada.", contextCost: selectedDefinition ? `Costo: ${selectedDefinition.gameBalance.cost}` : "Costo: -", contextSlot: selected ? `Posicion: ${selected.slotId.replace("player_", "")}` : "Posicion: -", canStart: this.machine.is(GAME_STATE.PREPARATION) && this.allies.length > 0, canRemove: this.machine.is(GAME_STATE.PREPARATION) && Boolean(selected?.definition), result: this.result }); }
}
