import * as THREE from "three";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { getTeamFacingRotation } from "../../assets/kaykitManifest.js";

export const ANTIBIOTIC_MODEL = Object.freeze({ cefazolin: "adventurer-knight", vancomycin: "adventurer-barbarian", metronidazole: "adventurer-mage" });

export function createUnitView({ assets, animations, assetId, team }) {
  const asset = assets.getDefinition(assetId);
  const gltf = assets.cache.get(assetId);
  if (!asset || !gltf) throw new Error(`Modelo no precargado: ${assetId}.`);
  const group = new THREE.Group(); group.userData.assetId = assetId;
  gltf.then((loaded) => {
    const model = SkeletonUtils.clone(loaded.scene); model.scale.setScalar(asset.defaultScale); model.rotation.y = getTeamFacingRotation(team);
    model.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; child.userData.sharedAsset = true; } });
    group.add(model); animations.add(group, model, loaded, team === "bacteria" ? "ready" : "idle");
  });
  return group;
}
