import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { KAYKIT_ASSETS, findClipByAlias, getTeamFacingRotation } from "../assets/kaykitManifest.js";

const dom = {
  canvas: document.querySelector("#asset-lab-canvas"),
  assetSelect: document.querySelector("#asset-select"),
  clipSelect: document.querySelector("#clip-select"),
  clipList: document.querySelector("#clip-list"),
  assetPack: document.querySelector("#asset-pack"),
  assetFormat: document.querySelector("#asset-format"),
  clipCount: document.querySelector("#clip-count"),
  triangleCount: document.querySelector("#triangle-count"),
  drawCalls: document.querySelector("#draw-calls"),
  fps: document.querySelector("#fps-value"),
  bounds: document.querySelector("#bounds-value"),
  status: document.querySelector("#lab-status"),
  pause: document.querySelector("#pause-animation"),
  cloneOne: document.querySelector("#clone-one"),
  clearClones: document.querySelector("#clear-clones"),
  speed: document.querySelector("#speed-range"),
  speedValue: document.querySelector("#speed-value"),
  scale: document.querySelector("#scale-range"),
  scaleValue: document.querySelector("#scale-value"),
  skeleton: document.querySelector("#toggle-skeleton"),
  shadows: document.querySelector("#toggle-shadows"),
  boundsToggle: document.querySelector("#toggle-bounds")
};

class AssetLabApp {
  constructor() {
    this.clock = new THREE.Clock();
    this.loader = new GLTFLoader();
    this.cache = new Map();
    this.mixers = [];
    this.clones = [];
    this.current = null;
    this.currentAction = null;
    this.paused = false;
    this.frameCount = 0;
    this.fpsElapsed = 0;
    this.pointer = { active: false, x: 0, y: 0, yaw: Math.PI / 4, pitch: 0.48, distance: 7 };

    this.renderer = new THREE.WebGLRenderer({ canvas: dom.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x17251e);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.cameraTarget = new THREE.Vector3(0, 1, 0);

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.setupLights();
    this.setupGuides();
    this.bindUi();
    this.populateAssets();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  setupLights() {
    this.scene.add(new THREE.HemisphereLight(0xe8f5ff, 0x405044, 1.6));
    this.keyLight = new THREE.DirectionalLight(0xfff0cf, 2.4);
    this.keyLight.position.set(-3, 8, 5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 30;
    this.scene.add(this.keyLight);
  }

  setupGuides() {
    const grid = new THREE.GridHelper(10, 10, 0xd4b15f, 0x395044);
    this.scene.add(grid);
    this.scene.add(new THREE.AxesHelper(2));

    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ color: 0x263b31, roughness: 0.95 })
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    this.boxHelper = new THREE.BoxHelper(this.root, 0xf3cc5d);
    this.scene.add(this.boxHelper);
  }

  bindUi() {
    dom.assetSelect.addEventListener("change", () => this.loadSelectedAsset());
    dom.clipSelect.addEventListener("change", () => this.playClipByName(dom.clipSelect.value));
    dom.pause.addEventListener("click", () => this.togglePause());
    dom.cloneOne.addEventListener("click", () => this.addClone());
    dom.clearClones.addEventListener("click", () => this.clearClones());
    dom.speed.addEventListener("input", () => this.updateSpeed());
    dom.scale.addEventListener("input", () => this.updateScale());
    dom.skeleton.addEventListener("change", () => this.updateSkeletonHelper());
    dom.shadows.addEventListener("change", () => this.applyShadowState());
    dom.boundsToggle.addEventListener("change", () => this.boxHelper.visible = dom.boundsToggle.checked);

    document.querySelectorAll("[data-play-state]").forEach((button) => {
      button.addEventListener("click", () => this.playAlias(button.dataset.playState));
    });

    dom.canvas.addEventListener("pointerdown", (event) => {
      this.pointer.active = true;
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      dom.canvas.setPointerCapture(event.pointerId);
    });

    dom.canvas.addEventListener("pointermove", (event) => {
      if (!this.pointer.active) return;
      const dx = event.clientX - this.pointer.x;
      const dy = event.clientY - this.pointer.y;
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      this.pointer.yaw -= dx * 0.006;
      this.pointer.pitch = THREE.MathUtils.clamp(this.pointer.pitch + dy * 0.004, 0.18, 1.15);
      this.updateCamera();
    });

    dom.canvas.addEventListener("pointerup", (event) => {
      this.pointer.active = false;
      dom.canvas.releasePointerCapture(event.pointerId);
    });

    dom.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.pointer.distance = THREE.MathUtils.clamp(this.pointer.distance + event.deltaY * 0.006, 3, 14);
      this.updateCamera();
    }, { passive: false });
  }

  populateAssets() {
    dom.assetSelect.innerHTML = KAYKIT_ASSETS.map((asset) => (
      `<option value="${asset.id}">${asset.label}</option>`
    )).join("");
  }

  async start() {
    await this.loadSelectedAsset();
    this.renderer.setAnimationLoop(() => this.tick());
  }

  async loadSelectedAsset() {
    const asset = KAYKIT_ASSETS.find((item) => item.id === dom.assetSelect.value) || KAYKIT_ASSETS[0];
    dom.status.textContent = `Cargando ${asset.label}...`;
    this.disposeCurrent();

    try {
      const gltf = await this.loadGltf(asset.path);
      this.current = {
        asset,
        gltf,
        object: SkeletonUtils.clone(gltf.scene),
        mixer: null,
        skeletonHelper: null
      };

      this.current.object.name = asset.id;
      this.current.object.scale.setScalar(asset.defaultScale);
      this.current.object.rotation.y = getTeamFacingRotation(asset.team);
      this.root.add(this.current.object);
      this.current.mixer = new THREE.AnimationMixer(this.current.object);
      this.mixers.push(this.current.mixer);

      this.applyShadowState();
      this.updateScaleControl(asset.defaultScale);
      this.populateClips(gltf.animations);
      this.updateSkeletonHelper();
      this.updateStats();
      this.playAlias("idle");
      dom.status.textContent = `${asset.label} cargado. Arrastra para girar camara; rueda para zoom.`;
    } catch (error) {
      console.error(error);
      dom.status.textContent = `No se pudo cargar ${asset.label}: ${error.message}`;
    }
  }

  loadGltf(path) {
    if (!this.cache.has(path)) {
      this.cache.set(path, this.loader.loadAsync(path));
    }
    return this.cache.get(path);
  }

  disposeCurrent() {
    this.clearClones();
    this.mixers = [];
    this.currentAction = null;
    if (this.current?.skeletonHelper) this.scene.remove(this.current.skeletonHelper);
    if (this.current?.object) this.root.remove(this.current.object);
    this.current = null;
  }

  populateClips(clips) {
    dom.clipSelect.innerHTML = clips.length
      ? clips.map((clip) => `<option value="${clip.name}">${clip.name}</option>`).join("")
      : `<option value="">Sin clips</option>`;
    dom.clipList.innerHTML = clips.map((clip) => `<li>${clip.name}</li>`).join("");
    dom.clipCount.textContent = String(clips.length);
  }

  playAlias(aliasName) {
    if (!this.current) return;
    const clip = findClipByAlias(this.current.gltf.animations, aliasName);
    if (clip) this.playClip(clip);
  }

  playClipByName(name) {
    if (!this.current || !name) return;
    const clip = this.current.gltf.animations.find((item) => item.name === name);
    if (clip) this.playClip(clip);
  }

  playClip(clip) {
    const action = this.current.mixer.clipAction(clip);
    action.reset();
    action.enabled = true;
    action.timeScale = Number(dom.speed.value);
    action.fadeIn(0.12);
    action.play();
    if (this.currentAction && this.currentAction !== action) this.currentAction.fadeOut(0.12);
    this.currentAction = action;
    dom.clipSelect.value = clip.name;
  }

  togglePause() {
    this.paused = !this.paused;
    dom.pause.textContent = this.paused ? "Reanudar" : "Pausar";
  }

  addClone() {
    if (!this.current) return;
    const source = this.current.gltf.scene;
    const clone = SkeletonUtils.clone(source);
    const index = this.clones.length + 1;
    clone.position.set((index % 4) * 1.2 - 2.4, 0, Math.floor(index / 4) * 1.2 + 1.5);
    clone.rotation.y = getTeamFacingRotation(this.current.asset.team);
    clone.scale.copy(this.current.object.scale);
    this.setShadowFlags(clone, dom.shadows.checked);
    this.root.add(clone);

    const mixer = new THREE.AnimationMixer(clone);
    const idle = findClipByAlias(this.current.gltf.animations, "idle");
    if (idle) mixer.clipAction(idle).play();
    this.mixers.push(mixer);
    this.clones.push({ object: clone, mixer });
    this.updateStats();
  }

  clearClones() {
    this.clones.forEach((clone) => this.root.remove(clone.object));
    this.clones = [];
    if (this.current?.mixer) this.mixers = [this.current.mixer];
    else this.mixers = [];
    this.updateStats();
  }

  updateSpeed() {
    const speed = Number(dom.speed.value);
    dom.speedValue.textContent = `${speed.toFixed(1)}x`;
    this.mixers.forEach((mixer) => {
      mixer.timeScale = speed;
    });
    if (this.currentAction) this.currentAction.timeScale = speed;
  }

  updateScaleControl(value) {
    dom.scale.value = String(value);
    dom.scaleValue.textContent = Number(value).toFixed(1);
  }

  updateScale() {
    const scale = Number(dom.scale.value);
    dom.scaleValue.textContent = scale.toFixed(1);
    if (this.current?.object) this.current.object.scale.setScalar(scale);
    this.clones.forEach((clone) => clone.object.scale.setScalar(scale));
    this.updateStats();
  }

  updateSkeletonHelper() {
    if (!this.current) return;
    if (this.current.skeletonHelper) {
      this.scene.remove(this.current.skeletonHelper);
      this.current.skeletonHelper = null;
    }
    if (dom.skeleton.checked) {
      this.current.skeletonHelper = new THREE.SkeletonHelper(this.current.object);
      this.current.skeletonHelper.visible = true;
      this.scene.add(this.current.skeletonHelper);
    }
  }

  applyShadowState() {
    if (this.current?.object) this.setShadowFlags(this.current.object, dom.shadows.checked);
    this.clones.forEach((clone) => this.setShadowFlags(clone.object, dom.shadows.checked));
    this.ground.receiveShadow = dom.shadows.checked;
  }

  setShadowFlags(object, enabled) {
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = enabled;
        child.receiveShadow = enabled;
      }
    });
  }

  updateStats() {
    if (!this.current) return;
    const box = new THREE.Box3().setFromObject(this.root);
    const size = box.getSize(new THREE.Vector3());
    this.boxHelper.setFromObject(this.root);
    dom.bounds.textContent = `${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`;

    let triangles = 0;
    this.root.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const geometry = child.geometry;
      const instanceCount = child.count || 1;
      if (geometry.index) triangles += geometry.index.count / 3 * instanceCount;
      else if (geometry.attributes.position) triangles += geometry.attributes.position.count / 3 * instanceCount;
    });

    dom.triangleCount.textContent = Math.round(triangles).toLocaleString("es-ES");
    dom.assetPack.textContent = this.current.asset.sourcePack;
    dom.assetFormat.textContent = this.current.asset.path.endsWith(".glb") ? "GLB" : "glTF";
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.updateCamera();
  }

  updateCamera() {
    const radius = this.pointer.distance;
    const x = Math.sin(this.pointer.yaw) * Math.cos(this.pointer.pitch) * radius;
    const z = Math.cos(this.pointer.yaw) * Math.cos(this.pointer.pitch) * radius;
    const y = Math.sin(this.pointer.pitch) * radius + 0.8;
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  tick() {
    const delta = this.clock.getDelta();
    if (!this.paused) this.mixers.forEach((mixer) => mixer.update(delta));
    this.boxHelper.visible = dom.boundsToggle.checked;
    this.renderer.render(this.scene, this.camera);

    this.frameCount += 1;
    this.fpsElapsed += delta;
    if (this.fpsElapsed >= 0.5) {
      dom.fps.textContent = String(Math.round(this.frameCount / this.fpsElapsed));
      dom.drawCalls.textContent = String(this.renderer.info.render.calls);
      this.frameCount = 0;
      this.fpsElapsed = 0;
    }
  }
}

const app = new AssetLabApp();
app.start();
