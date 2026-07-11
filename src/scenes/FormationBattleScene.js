import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { getBacteriumById } from "../data/bacteria.js";
import { KAYKIT_ASSETS, findClipByAlias, getTeamFacingRotation } from "../assets/kaykitManifest.js";
import { CombatSystem } from "../systems/CombatSystem.js";
import { FormationSystem } from "../systems/FormationSystem.js";
import { GAME_STATE, GameStateMachine } from "../systems/GameStateMachine.js";
import { selectTarget } from "../systems/TargetingSystem.js";

const ANTIBIOTIC_MODEL = {
  cefazolin: "adventurer-knight",
  vancomycin: "adventurer-barbarian",
  metronidazole: "adventurer-mage"
};

const PROJECTILE_COLORS = {
  cefazolin: 0x62b9ea,
  vancomycin: 0xa278e6,
  metronidazole: 0xd56bd3
};

function valueFrom(object) {
  if (typeof object === "number") return object;
  if (!object || typeof object !== "object") return 0;
  return Object.values(object).reduce((total, value) => total + valueFrom(value), 0);
}

function assetById(id) {
  return KAYKIT_ASSETS.find((asset) => asset.id === id);
}

export class FormationBattleScene {
  constructor({ canvas, hud, antibiotics }) {
    this.canvas = canvas;
    this.hud = hud;
    this.antibiotics = antibiotics;
    this.machine = new GameStateMachine();
    this.formation = new FormationSystem({});
    this.units = [];
    this.projectiles = [];
    this.mixers = [];
    this.assetCache = new Map();
    this.loader = new GLTFLoader();
    this.clock = new THREE.Clock();
    this.health = 100;
    this.credits = 150;
    this.wave = 1;
    this.toxicity = 0;
    this.resistance = 0;
    this.proa = 0;
    this.feedback = "Cargando modelos KayKit...";
    this.selectedAntibioticId = null;
    this.selectedUnitId = null;
    this.result = null;
    this.enemyTotal = 10;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.createRenderer();
    this.createWorld();
    this.hud.renderCatalog(antibiotics);
  }

  async start() {
    this.machine.transition(GAME_STATE.LOADING);
    this.resize();
    this.renderHud();
    await this.preloadAssets();
    this.createEnemyFormation();
    this.machine.transition(GAME_STATE.PREPARATION);
    this.feedback = "Preparacion: coloca una unidad para comenzar.";
    this.renderHud();
    this.animate();
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8ab7ce);
    this.scene.fog = new THREE.Fog(0x8ab7ce, 24, 46);
    this.camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 100);
    this.resetCamera();
    window.addEventListener("resize", () => this.resize());
    this.canvas.addEventListener("pointerdown", (event) => this.onPointerDown(event));
  }

  createWorld() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 14),
      new THREE.MeshStandardMaterial({ color: 0x6da85b, roughness: 0.92 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const allyZone = this.createZone(0x4f8b62, -4.2, 0.44);
    const enemyZone = this.createZone(0x8b6a4d, 4.2, 0.46);
    this.scene.add(allyZone, enemyZone);

    const centerLine = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.12, 10.5),
      new THREE.MeshStandardMaterial({ color: 0xd4b465, emissive: 0x2b200d })
    );
    centerLine.position.set(0, 0.08, 0);
    this.scene.add(centerLine);

    this.scene.add(new THREE.HemisphereLight(0xf1fbff, 0x31422e, 2.0));
    const sun = new THREE.DirectionalLight(0xfff0c6, 3.0);
    sun.position.set(-7, 14, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -13;
    sun.shadow.camera.right = 13;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    this.scene.add(sun);

    this.slotMeshes = this.formation.slotsFor("player").map((slot) => this.createSlotMesh(slot));
  }

  createZone(color, x, opacity) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8.8, 7.2),
      new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.9 })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.x = x;
    mesh.position.y = 0.012;
    return mesh;
  }

  createSlotMesh(slot) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.44, 0.045, 20),
      new THREE.MeshStandardMaterial({ color: 0x9fd79a, transparent: true, opacity: 0.44, emissive: 0x173f2b })
    );
    mesh.position.set(slot.position.x, 0.04, slot.position.z);
    mesh.userData.slotId = slot.id;
    this.scene.add(mesh);
    return mesh;
  }

  async preloadAssets() {
    const ids = ["adventurer-knight", "adventurer-barbarian", "adventurer-mage", "skeleton-minion", "skeleton-warrior"];
    await Promise.all(ids.map((id) => this.loadAsset(assetById(id))));
  }

  async loadAsset(asset) {
    if (!asset) throw new Error("Asset KayKit no encontrado.");
    if (!this.assetCache.has(asset.id)) {
      this.assetCache.set(asset.id, this.loader.loadAsync(asset.path));
    }
    return this.assetCache.get(asset.id);
  }

  createUnitView(assetId, team) {
    const asset = assetById(assetId);
    const gltfPromise = this.assetCache.get(assetId);
    if (!asset || !gltfPromise) throw new Error(`Asset no precargado: ${assetId}`);
    const group = new THREE.Group();
    group.userData.assetId = assetId;
    gltfPromise.then((gltf) => {
      const model = SkeletonUtils.clone(gltf.scene);
      model.scale.setScalar(asset.defaultScale);
      model.rotation.y = getTeamFacingRotation(team);
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      group.add(model);
      const mixer = new THREE.AnimationMixer(model);
      const idle = findClipByAlias(gltf.animations, team === "bacteria" ? "ready" : "idle");
      if (idle) mixer.clipAction(idle).play();
      this.mixers.push({ mixer, gltf, current: null, root: group });
    });
    return group;
  }

  createEnemyFormation() {
    const definition = getBacteriumById("mssa");
    this.formation.slotsFor("enemy").slice(0, this.enemyTotal).forEach((slot, index) => {
      const unit = {
        id: `bacteria_${index + 1}`,
        definitionId: definition.id,
        health: definition.gameBalance.baseHealth,
        maxHealth: definition.gameBalance.baseHealth,
        patientDamage: definition.gameBalance.patientDamage,
        isAlive: true,
        centerDistance: Math.abs(slot.column - 2) + Math.abs(slot.row - 1),
        cooldown: 2.8 + index * 0.05,
        slotId: slot.id,
        modelId: index % 3 === 0 ? "skeleton-warrior" : "skeleton-minion"
      };
      this.formation.place(slot.id, unit.id);
      unit.view = this.createUnitView(unit.modelId, "bacteria");
      unit.view.userData.unitId = unit.id;
      unit.view.position.set(slot.position.x, 0, slot.position.z);
      this.scene.add(unit.view);
      this.units.push(unit);
    });
  }

  resetCamera() {
    this.camera?.position.set(0, 9.8, 13.5);
    this.camera?.lookAt(0, 0.8, 0);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  selectAntibiotic(id) {
    if (!this.machine.is(GAME_STATE.PREPARATION)) return;
    this.selectedAntibioticId = id;
    this.selectedUnitId = null;
    const antibiotic = this.antibiotics.find((item) => item.id === id);
    this.feedback = `${antibiotic.name} seleccionado. Elige una posicion verde.`;
    this.renderHud();
  }

  onPointerDown(event) {
    if (!this.machine.is(GAME_STATE.PREPARATION)) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const objects = [...this.slotMeshes, ...this.units.map((unit) => unit.view)];
    const hits = this.raycaster.intersectObjects(objects, true);
    const root = hits[0] && this.getInteractiveRoot(hits[0].object);
    if (!root) return;
    if (root.userData.slotId) this.placeUnit(root.userData.slotId);
    else if (root.userData.unitId) this.selectPlacedUnit(root.userData.unitId);
  }

  getInteractiveRoot(object) {
    let current = object;
    while (current && !current.userData.slotId && !current.userData.unitId) current = current.parent;
    return current;
  }

  placeUnit(slotId) {
    const slot = this.formation.get(slotId);
    if (!this.selectedAntibioticId || !slot || slot.occupiedBy) return;
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

    const definition = this.antibiotics.find((item) => item.id === this.selectedAntibioticId);
    if (this.credits < definition.gameBalance.cost) {
      this.feedback = "No hay creditos suficientes para esa unidad.";
      this.renderHud();
      return;
    }

    const unit = {
      id: `${definition.id}_${Date.now()}`,
      definitionId: definition.id,
      definition,
      slotId,
      cooldown: 0.4,
      isAlive: true,
      health: 1,
      maxHealth: 1,
      modelId: ANTIBIOTIC_MODEL[definition.id] || "adventurer-knight"
    };
    if (!this.formation.place(slotId, unit.id)) return;
    this.credits -= definition.gameBalance.cost;
    unit.view = this.createUnitView(unit.modelId, "antimicrobial");
    unit.view.userData.unitId = unit.id;
    unit.view.position.set(slot.position.x, 0, slot.position.z);
    this.scene.add(unit.view);
    this.units.push(unit);
    this.selectedUnitId = unit.id;
    this.feedback = `${definition.name} colocado en la formacion.`;
    this.renderHud();
  }

  selectPlacedUnit(id) {
    const unit = this.units.find((item) => item.id === id && item.definition);
    if (!unit) return;
    this.selectedUnitId = id;
    this.selectedAntibioticId = unit.definitionId;
    this.feedback = `${unit.definition.name} seleccionado. Puedes retirarlo.`;
    this.renderHud();
  }

  removeSelectedUnit() {
    if (!this.machine.is(GAME_STATE.PREPARATION)) return;
    const unit = this.units.find((item) => item.id === this.selectedUnitId && item.definition);
    if (!unit) return;
    this.credits += unit.definition.gameBalance.cost;
    this.formation.clear(unit.slotId);
    this.scene.remove(unit.view);
    this.units = this.units.filter((item) => item !== unit);
    this.feedback = `${unit.definition.name} devuelto al catalogo.`;
    this.selectedUnitId = null;
    this.renderHud();
  }

  startBattle() {
    if (!this.machine.is(GAME_STATE.PREPARATION) || !this.allies.length) return;
    this.machine.transition(GAME_STATE.COMBAT);
    this.selectedUnitId = null;
    this.feedback = "Combate automatico iniciado. La formacion esta bloqueada.";
    this.slotMeshes.forEach((mesh) => { mesh.visible = false; });
    this.playAllies("ready");
    this.playEnemies("ready");
    this.combat = new CombatSystem({
      level: 1,
      activeTherapy: { antibioticIds: this.allies.map((unit) => unit.definitionId), durationSeconds: 0 },
      infectionState: {
        severity: "moderate",
        bacteriaIds: ["mssa"],
        polymicrobial: false,
        sourceControlRequired: false,
        sourceControlCompleted: false,
        bacterialLoad: "moderate"
      }
    });
    this.renderHud();
  }

  update(delta) {
    this.mixers.forEach((entry) => entry.mixer.update(delta));
    this.units.filter((unit) => unit.isAlive).forEach((unit, index) => {
      if (unit.view) unit.view.position.y = Math.sin(performance.now() * 0.002 + index) * 0.025;
    });
    if (!this.machine.is(GAME_STATE.COMBAT)) return;
    for (const ally of this.allies) {
      ally.cooldown -= delta;
      if (ally.cooldown <= 0) this.fire(ally);
    }
    for (const enemy of this.enemies) {
      enemy.cooldown -= delta;
      if (enemy.cooldown <= 0) {
        enemy.cooldown = 3.8;
        this.health = Math.max(0, this.health - enemy.patientDamage);
        this.feedback = "La horda mantiene la presion sobre el paciente.";
      }
    }
    this.projectiles = this.projectiles.filter((projectile) => this.updateProjectile(projectile, delta));
    if (!this.enemies.length || this.health <= 0) this.resolveWave();
  }

  fire(ally) {
    const target = selectTarget(this.enemies);
    if (!target) return;
    ally.cooldown = 1 / ally.definition.gameBalance.fireRate;
    this.playUnit(ally, "cast");
    const bolt = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshStandardMaterial({
        color: PROJECTILE_COLORS[ally.definitionId] ?? 0x62b9ea,
        emissive: PROJECTILE_COLORS[ally.definitionId] ?? 0x62b9ea,
        emissiveIntensity: 1.4,
        roughness: 0.35
      })
    );
    bolt.position.copy(ally.view.position).add(new THREE.Vector3(0.38, 1.05, 0));
    this.scene.add(bolt);
    this.projectiles.push({ mesh: bolt, attacker: ally, target, speed: 10 });
  }

  updateProjectile(projectile, delta) {
    if (!projectile.target.isAlive) {
      this.scene.remove(projectile.mesh);
      return false;
    }
    const targetPosition = projectile.target.view.position.clone().add(new THREE.Vector3(0, 0.9, 0));
    const direction = targetPosition.sub(projectile.mesh.position);
    projectile.mesh.rotation.x += delta * 10;
    projectile.mesh.rotation.y += delta * 14;
    if (direction.length() < 0.35) {
      this.impact(projectile);
      this.scene.remove(projectile.mesh);
      return false;
    }
    projectile.mesh.position.add(direction.normalize().multiplyScalar(projectile.speed * delta));
    return true;
  }

  impact(projectile) {
    const impact = this.combat.resolveProjectileImpact({
      antibioticId: projectile.attacker.definitionId,
      bacteriaId: projectile.target.definitionId,
      baseDamage: projectile.attacker.definition.gameBalance.power * 18
    });
    projectile.target.health = Math.max(0, projectile.target.health - impact.appliedDamage);
    this.toxicity += valueFrom(impact.toxicityExposure);
    this.resistance += valueFrom(impact.resistancePressure);
    this.proa += valueFrom(impact.proaEffect);
    this.feedback = impact.feedbackCodes?.[0] ?? `Resolver: ${impact.effectiveness}`;
    this.playUnit(projectile.target, impact.damageMultiplier > 0 ? "hit" : "ready");
    projectile.target.view.scale.setScalar(impact.damageMultiplier > 0 ? 0.94 : 1.04);
    if (projectile.target.health === 0) {
      projectile.target.isAlive = false;
      this.playUnit(projectile.target, "death");
      window.setTimeout(() => {
        this.scene.remove(projectile.target.view);
        this.formation.clear(projectile.target.slotId);
      }, 420);
      this.credits += 10;
    }
  }

  resolveWave() {
    if (!this.machine.is(GAME_STATE.COMBAT)) return;
    this.machine.transition(GAME_STATE.WAVE_RESOLUTION);
    const won = this.enemies.length === 0;
    this.result = {
      title: won ? "VICTORIA" : "DERROTA",
      summary: won ? "La horda fue controlada. Puedes preparar otra oleada." : "La salud del paciente llego a cero."
    };
    this.feedback = won ? "Oleada resuelta por el motor clinico." : "La horda supero las defensas.";
    this.machine.transition(GAME_STATE.RESULTS);
    this.renderHud();
  }

  playAllies(alias) {
    this.allies.forEach((unit) => this.playUnit(unit, alias));
  }

  playEnemies(alias) {
    this.enemies.forEach((unit) => this.playUnit(unit, alias));
  }

  playUnit(unit, alias) {
    const entry = this.mixers.find((item) => item.root === unit.view);
    if (!entry) return;
    const clip = findClipByAlias(entry.gltf.animations, alias);
    if (!clip) return;
    const action = entry.mixer.clipAction(clip);
    action.reset().fadeIn(0.08).play();
    if (entry.current && entry.current !== action) entry.current.fadeOut(0.08);
    entry.current = action;
  }

  restart() {
    window.location.reload();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
    this.renderHud();
  }

  get allies() {
    return this.units.filter((unit) => unit.definition && unit.isAlive);
  }

  get enemies() {
    return this.units.filter((unit) => !unit.definition && unit.isAlive);
  }

  renderHud() {
    const selected = this.units.find((unit) => unit.id === this.selectedUnitId);
    const selectedDefinition = selected?.definition ?? this.antibiotics.find((item) => item.id === this.selectedAntibioticId);
    this.hud.render({
      wave: this.wave,
      health: this.health,
      toxicity: this.toxicity,
      resistance: this.resistance,
      proa: this.proa,
      credits: this.credits,
      enemyAlive: this.enemies.length,
      enemyTotal: this.enemyTotal,
      formationCount: this.allies.length,
      formationTotal: this.formation.slotsFor("player").length,
      feedback: this.feedback,
      phase: this.machine.state,
      selectedAntibioticId: this.selectedAntibioticId,
      contextName: selectedDefinition?.name ?? "Elige un antibiotico",
      contextClass: selectedDefinition ? selectedDefinition.pharmacology.subclass.replaceAll("_", " ") : "Selecciona una unidad del catalogo y luego una posicion iluminada.",
      contextCost: selectedDefinition ? `Costo: ${selectedDefinition.gameBalance.cost}` : "Costo: -",
      contextSlot: selected ? `Posicion: ${selected.slotId.replace("player_", "")}` : "Posicion: -",
      canStart: this.machine.is(GAME_STATE.PREPARATION) && this.allies.length > 0,
      canRemove: this.machine.is(GAME_STATE.PREPARATION) && Boolean(selected?.definition),
      result: this.result
    });
  }
}
