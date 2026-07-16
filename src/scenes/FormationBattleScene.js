import * as THREE from "three";
import { getBacteriumById } from "../data/bacteria.js";
import { CombatSystem } from "../systems/CombatSystem.js";
import { FormationSystem } from "../systems/FormationSystem.js";
import { GAME_STATE, GameStateMachine } from "../systems/GameStateMachine.js";
import { selectTarget } from "../systems/TargetingSystem.js";
import { canAttack, enemyAttackTarget, tacticalDamage, tacticalProfile, tacticalRisk } from "../systems/TacticalCombatSystem.js";
import { BattleAssets } from "./battle/BattleAssets.js";
import { BattleAnimations } from "./battle/BattleAnimations.js";
import { ANTIBIOTIC_MODEL, createUnitView } from "./battle/BattleUnits.js";
import { ProjectileSystem } from "./battle/ProjectileSystem.js";
import { disposeSceneResources } from "./battle/disposeThree.js";

const CAMERA = { fov: 36, position: new THREE.Vector3(0, 39, 44), target: new THREE.Vector3(0, 0, 0) };
const valueFrom = (value) => typeof value === "number" ? value : value && typeof value === "object" ? Object.values(value).reduce((total, item) => total + valueFrom(item), 0) : 0;

export class FormationBattleScene {
  constructor({ canvas, hud, antibiotics }) {
    if (!canvas?.getContext) throw new Error("El lienzo de batalla no es válido.");
    this.canvas = canvas; this.hud = hud; this.antibiotics = antibiotics; this.machine = new GameStateMachine();
    this.formation = new FormationSystem({}); this.assets = new BattleAssets(); this.animations = new BattleAnimations();
    this.units = []; this.health = 100; this.credits = 150; this.wave = 1; this.toxicity = 0; this.resistance = 0; this.proa = 0; this.paused = false; this.speed = 1; this.reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.feedback = "Cargando modelos KayKit..."; this.selectedAntibioticId = null; this.selectedUnitId = null; this.result = null; this.enemyTotal = 10;
    this.clock = new THREE.Clock(); this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2(); this.running = false;
    this.createRenderer(); this.createWorld(); this.projectiles = new ProjectileSystem(this.scene); this.hud.renderCatalog(antibiotics);
  }

  async start() {
    this.machine.transition(GAME_STATE.LOADING); this.resize(); this.renderHud();
    this.running = true; this.animate();
    try {
    await this.assets.preload(["adventurer-knight", "adventurer-barbarian", "adventurer-mage", "skeleton-minion", "skeleton-warrior"]);
    this.createEnemyFormation(); this.machine.transition(GAME_STATE.PREPARATION); this.feedback = "Preparación: coloca una unidad para comenzar.";
    } catch (error) {
      this.showFatalLoadingError(error);
    }
    this.renderHud();
  }

  showFatalLoadingError(error) {
    this.feedback = `No se pudieron cargar los modelos KayKit. ${error.message} Revisa la consola o la red.`;
    console.error(error);
  }

  createRenderer() {
    try { this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false }); }
    catch (error) { throw new Error(`No se pudo preparar la vista 3D: ${error.message}`); }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x8ab7ce); this.scene.fog = new THREE.Fog(0x8ab7ce, 46, 86);
    this.camera = new THREE.PerspectiveCamera(CAMERA.fov, 16 / 9, 0.1, 120); this.resetCamera();
    this.onResize = () => this.resize(); this.onPointer = (event) => this.onPointerDown(event); this.onKey = (event) => this.onKeyDown(event); window.addEventListener("resize", this.onResize); window.addEventListener("keydown", this.onKey); this.canvas.addEventListener("pointerdown", this.onPointer);
  }

  createWorld() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(48, 30), new THREE.MeshStandardMaterial({ color: 0x6da85b, roughness: 0.92 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; this.scene.add(ground);
    this.scene.add(this.createZone(0x4f8b62, -11, 0.38), this.createZone(0x8b6a4d, 11, 0.4));
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 22), new THREE.MeshStandardMaterial({ color: 0xd4b465, emissive: 0x2b200d })); line.position.y = 0.08; this.scene.add(line);
    this.scene.add(new THREE.HemisphereLight(0xf1fbff, 0x31422e, 2)); const sun = new THREE.DirectionalLight(0xfff0c6, 3); sun.position.set(-7, 14, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -25; sun.shadow.camera.right = 25; sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -18; this.scene.add(sun);
    this.slotMeshes = this.formation.slotsFor("player").map((slot) => { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.045, 20), new THREE.MeshStandardMaterial({ color: 0x9fd79a, transparent: true, opacity: 0.44, emissive: 0x173f2b })); mesh.position.set(slot.position.x, 0.04, slot.position.z); mesh.userData.slotId = slot.id; this.scene.add(mesh); return mesh; });
  }
  createZone(color, x, opacity) { const mesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.9 })); mesh.rotation.x = -Math.PI / 2; mesh.position.x = x; mesh.position.y = 0.012; return mesh; }
  createEnemyFormation() { const definition = getBacteriumById("mssa"); this.formation.slotsFor("enemy").slice(0, this.enemyTotal).forEach((slot, index) => { const unit = { id: `bacteria_${index + 1}`, definitionId: definition.id, health: definition.gameBalance.baseHealth, maxHealth: definition.gameBalance.baseHealth, bacterialLoad: definition.gameBalance.baseHealth, patientDamage: definition.gameBalance.patientDamage, isAlive: true, isCovered: index % 3 !== 0, isResistant: index % 4 === 0, scenarioPriority: index === 0, incomingDamage: 0, centerDistance: Math.abs(slot.column - 2) + Math.abs(slot.row - 1), cooldown: 2.8 + index * 0.05, slotId: slot.id, modelId: index % 3 === 0 ? "skeleton-warrior" : "skeleton-minion", visualVariant: index % 3 }; this.formation.place(slot.id, unit.id); this.addView(unit, "bacteria"); this.units.push(unit); }); }
  addView(unit, team) { const slot = this.formation.get(unit.slotId); unit.view = createUnitView({ assets: this.assets, animations: this.animations, assetId: unit.modelId, team }); unit.view.userData.unitId = unit.id; unit.view.position.set(slot.position.x, 0, slot.position.z); this.scene.add(unit.view); }
  resetCamera() { this.camera?.position.copy(CAMERA.position); this.camera?.lookAt(CAMERA.target); }
  resize() { const rect = this.canvas.getBoundingClientRect(); const width = Math.max(1, rect.width); const height = Math.max(1, rect.height); this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); }
  onPointerDown(event) { if (!this.machine.is(GAME_STATE.PREPARATION)) return; const rect = this.canvas.getBoundingClientRect(); this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); this.raycaster.setFromCamera(this.pointer, this.camera); const hit = this.raycaster.intersectObjects([...this.slotMeshes, ...this.units.map((unit) => unit.view)], true)[0]?.object; let root = hit; while (root && !root.userData.slotId && !root.userData.unitId) root = root.parent; if (root?.userData.slotId) this.placeUnit(root.userData.slotId); else if (root?.userData.unitId) this.selectPlacedUnit(root.userData.unitId); }
  onKeyDown(event) { if (this.machine.is(GAME_STATE.COMBAT) && event.key.toLowerCase() === "p") return this.togglePause(); if (!this.machine.is(GAME_STATE.PREPARATION) || !/^[1-9]$/.test(event.key)) return; const slot = this.formation.slotsFor("player")[Number(event.key) - 1]; if (slot) { event.preventDefault(); this.placeUnit(slot.id); } }
  selectAntibiotic(id) { if (!this.machine.is(GAME_STATE.PREPARATION)) return; const antibiotic = this.antibiotics.find((item) => item.id === id); if (!antibiotic) { this.feedback = "El antibiótico seleccionado no existe en el catálogo."; return this.renderHud(); } this.selectedAntibioticId = id; this.selectedUnitId = null; this.feedback = `${antibiotic.name} seleccionado. Elige una posición verde.`; this.renderHud(); }
  placeUnit(slotId) { const slot = this.formation.get(slotId); if (!this.selectedAntibioticId || !slot || slot.occupiedBy) return; const moved = this.units.find((item) => item.id === this.selectedUnitId && item.definition); if (moved) { this.formation.clear(moved.slotId); this.formation.place(slotId, moved.id); moved.slotId = slotId; moved.view.position.set(slot.position.x, 0, slot.position.z); this.feedback = `${moved.definition.name} movido.`; return this.renderHud(); } const definition = this.antibiotics.find((item) => item.id === this.selectedAntibioticId); if (!definition) return; if (this.credits < definition.gameBalance.cost) { this.feedback = "No hay créditos suficientes para esa unidad."; return this.renderHud(); } const unit = { id: `${definition.id}_${Date.now()}`, definitionId: definition.id, definition, slotId, cooldown: 0.4, isAlive: true, health: 1, maxHealth: 1, modelId: ANTIBIOTIC_MODEL[definition.id] || "adventurer-knight" }; if (!this.formation.place(slotId, unit.id)) return; this.credits -= definition.gameBalance.cost; this.addView(unit, "antimicrobial"); this.units.push(unit); this.selectedUnitId = unit.id; this.feedback = `${definition.name} colocado en la formación.`; this.renderHud(); }
  selectPlacedUnit(id) { const unit = this.units.find((item) => item.id === id && item.definition); if (!unit) return; this.selectedUnitId = id; this.selectedAntibioticId = unit.definitionId; this.feedback = `${unit.definition.name} seleccionado. Puedes retirarlo.`; this.renderHud(); }
  removeSelectedUnit() { if (!this.machine.is(GAME_STATE.PREPARATION)) return; const unit = this.units.find((item) => item.id === this.selectedUnitId && item.definition); if (!unit) return; this.credits += unit.definition.gameBalance.cost; this.formation.clear(unit.slotId); this.scene.remove(unit.view); this.animations.remove(unit.view); this.units = this.units.filter((item) => item !== unit); this.feedback = `${unit.definition.name} devuelto al catálogo.`; this.selectedUnitId = null; this.renderHud(); }
  startBattle() { if (!this.machine.is(GAME_STATE.PREPARATION) || !this.allies.length) return; this.machine.transition(GAME_STATE.COMBAT); this.selectedUnitId = null; this.feedback = "Combate automático iniciado. La formación está bloqueada."; this.slotMeshes.forEach((mesh) => { mesh.visible = false; }); this.allies.forEach((unit) => this.animations.play(unit.view, "ready")); this.enemies.forEach((unit) => this.animations.play(unit.view, "ready")); this.combat = new CombatSystem({ level: 1, activeTherapy: { antibioticIds: this.allies.map((unit) => unit.definitionId), durationSeconds: 0 }, infectionState: { severity: "moderate", bacteriaIds: ["mssa"], polymicrobial: false, sourceControlRequired: false, sourceControlCompleted: false, bacterialLoad: "moderate" } }); this.renderHud(); }
  update(delta) { this.animations.update(delta); this.units.filter((unit) => unit.isAlive).forEach((unit, index) => { if (unit.view) unit.view.position.y = Math.sin(performance.now() * 0.002 + index) * 0.025; }); if (!this.machine.is(GAME_STATE.COMBAT)) return; this.allies.forEach((unit) => { unit.cooldown -= delta; if (unit.cooldown <= 0) this.fire(unit); }); this.enemies.forEach((unit) => { unit.cooldown -= delta; if (unit.cooldown <= 0) { unit.cooldown = 3.8; this.health = Math.max(0, this.health - unit.patientDamage); this.feedback = "La horda mantiene la presión sobre el paciente."; } }); this.projectiles.update(delta, (item) => this.impact(item)); if (!this.enemies.length || this.health <= 0) this.resolveWave(); }
  fire(ally) { const target = selectTarget(this.enemies, { attacker: ally, range: ally.definition.gameBalance.range / 10, scenarioPriorityId: "bacteria_1" }); if (!target || !canAttack(ally, target)) { this.feedback = "Sin blanco dentro de alcance."; return; } ally.cooldown = 1 / ally.definition.gameBalance.fireRate; target.incomingDamage = (target.incomingDamage ?? 0) + ally.definition.gameBalance.power; this.animations.play(ally.view, "cast"); this.projectiles.fire(ally, target); }
  impact(projectile) { const impact = this.combat.resolveProjectileImpact({ antibioticId: projectile.attacker.definitionId, bacteriaId: projectile.target.definitionId, baseDamage: projectile.attacker.definition.gameBalance.power * 18 }); const target = projectile.target; target.health = Math.max(0, target.health - impact.appliedDamage); this.toxicity += valueFrom(impact.toxicityExposure); this.resistance += valueFrom(impact.resistancePressure); this.proa += valueFrom(impact.proaEffect); this.feedback = impact.feedbackCodes?.[0] ?? `Resolver: ${impact.effectiveness}`; this.animations.play(target.view, impact.damageMultiplier > 0 ? "hit" : "ready"); if (!target.health) { target.isAlive = false; this.animations.play(target.view, "death"); window.setTimeout(() => { this.scene.remove(target.view); this.formation.clear(target.slotId); }, 420); this.credits += 10; } this.renderHud(); }
  resolveWave() { if (!this.machine.is(GAME_STATE.COMBAT)) return; this.machine.transition(GAME_STATE.WAVE_RESOLUTION); const won = this.enemies.length === 0; this.result = { title: won ? "VICTORIA" : "DERROTA", summary: won ? "La horda fue controlada. Puedes preparar otra oleada." : "La salud del paciente llegó a cero." }; this.feedback = won ? "Oleada resuelta por el motor clínico." : "La horda superó las defensas."; this.machine.transition(GAME_STATE.RESULTS); this.renderHud(); }
  restart() { this.dispose(); window.location.reload(); }
  animate() { if (!this.running) return; requestAnimationFrame(() => this.animate()); const delta = Math.min(this.clock.getDelta(), 0.05); if (!this.paused) this.update(delta * this.speed); this.renderer.render(this.scene, this.camera); }
  dispose() { this.running = false; window.removeEventListener("resize", this.onResize); window.removeEventListener("keydown", this.onKey); this.canvas.removeEventListener("pointerdown", this.onPointer); this.projectiles.clear(); this.animations.clear(); disposeSceneResources(this.scene); this.renderer.dispose(); }
  get allies() { return this.units.filter((unit) => unit.definition && unit.isAlive); }
  togglePause() { if (!this.machine.is(GAME_STATE.COMBAT)) return; this.paused = !this.paused; this.feedback = this.paused ? "Combate en pausa." : "Combate reanudado."; this.renderHud(); }
  setSpeed(speed) { this.speed = [1, 1.5, 2].includes(speed) ? speed : 1; this.renderHud(); }
  resetFormation() { if (!this.machine.is(GAME_STATE.PREPARATION)) return; this.units.filter((unit) => unit.definition).forEach((unit) => { this.formation.clear(unit.slotId); this.scene.remove(unit.view); this.animations.remove(unit.view); this.credits += unit.definition.gameBalance.cost; }); this.units = this.units.filter((unit) => !unit.definition); this.selectedUnitId = null; this.feedback = "Formación restablecida antes de iniciar."; this.renderHud(); }
  get enemies() { return this.units.filter((unit) => !unit.definition && unit.isAlive); }
  renderHud() { const selected = this.units.find((unit) => unit.id === this.selectedUnitId); const definition = selected?.definition ?? this.antibiotics.find((item) => item.id === this.selectedAntibioticId); this.hud.render({ wave: this.wave, health: this.health, toxicity: this.toxicity, resistance: this.resistance, proa: this.proa, credits: this.credits, enemyAlive: this.enemies.length, enemyTotal: this.enemyTotal, formationCount: this.allies.length, formationTotal: this.formation.slotsFor("player").length, feedback: this.feedback, phase: this.machine.state, selectedAntibioticId: this.selectedAntibioticId, contextName: definition?.name ?? "Elige un antibiótico", contextClass: definition ? definition.pharmacology.subclass.replaceAll("_", " ") : "Selecciona una unidad del catálogo y luego una posición iluminada.", contextCost: definition ? `Costo: ${definition.gameBalance.cost}` : "Costo: -", contextSlot: selected ? `Posición: ${selected.slotId.replace("player_", "")}` : "Posición: -", canStart: this.machine.is(GAME_STATE.PREPARATION) && this.allies.length > 0, canRemove: this.machine.is(GAME_STATE.PREPARATION) && Boolean(selected?.definition), result: this.result }); }
}
