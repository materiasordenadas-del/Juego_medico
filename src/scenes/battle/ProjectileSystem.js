import * as THREE from "three";

const COLORS = Object.freeze({ cefazolin: 0x62b9ea, vancomycin: 0xa278e6, metronidazole: 0xd56bd3 });

export class ProjectileSystem {
  constructor(scene) { this.scene = scene; this.items = []; }
  fire(attacker, target) {
    const color = COLORS[attacker.definitionId] ?? 0x62b9ea;
    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4, roughness: 0.35 }));
    mesh.position.copy(attacker.view.position).add(new THREE.Vector3(0.38, 1.05, 0)); this.scene.add(mesh);
    this.items.push({ mesh, attacker, target, speed: Math.max(6, attacker.definition.gameBalance.projectileSpeed / 42) });
  }
  update(delta, onImpact) {
    this.items = this.items.filter((item) => {
      if (!item.target.isAlive) return this.remove(item, false);
      const direction = item.target.view.position.clone().add(new THREE.Vector3(0, 0.9, 0)).sub(item.mesh.position);
      item.mesh.rotation.x += delta * 10; item.mesh.rotation.y += delta * 14;
      if (direction.length() < 0.35) { onImpact(item); return this.remove(item, false); }
      item.mesh.position.add(direction.normalize().multiplyScalar(item.speed * delta)); return true;
    });
  }
  remove(item, keep) { this.scene.remove(item.mesh); disposeObject(item.mesh); return keep; }
  clear() { this.items.forEach((item) => this.remove(item, false)); this.items = []; }
}

export function disposeObject(root) {
  root.traverse((child) => { if (child.geometry) child.geometry.dispose(); if (child.material) [].concat(child.material).forEach((material) => material.dispose()); });
}
