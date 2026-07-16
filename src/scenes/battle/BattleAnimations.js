import * as THREE from "three";
import { findClipByAlias } from "../../assets/kaykitManifest.js";

export class BattleAnimations {
  constructor() { this.entries = []; }
  add(root, model, gltf, initialAlias) {
    const mixer = new THREE.AnimationMixer(model);
    const entry = { root, mixer, clips: gltf.animations, current: null };
    this.entries.push(entry); this.play(root, initialAlias); return entry;
  }
  update(delta) { this.entries.forEach((entry) => entry.mixer.update(delta)); }
  play(root, alias) {
    const entry = this.entries.find((item) => item.root === root);
    const clip = entry && findClipByAlias(entry.clips, alias);
    if (!clip) return;
    const action = entry.mixer.clipAction(clip); action.reset().fadeIn(0.08).play();
    if (entry.current && entry.current !== action) entry.current.fadeOut(0.08);
    entry.current = action;
  }
  remove(root) { const index = this.entries.findIndex((entry) => entry.root === root); if (index >= 0) this.entries.splice(index, 1)[0].mixer.stopAllAction(); }
  clear() { this.entries.forEach((entry) => entry.mixer.stopAllAction()); this.entries = []; }
}
