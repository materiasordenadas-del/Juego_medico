export function disposeSceneResources(root, { disposeShared = false } = {}) {
  const disposed = { geometries: 0, materials: 0, textures: 0 };
  root.traverse((object) => {
    if (object.userData?.sharedAsset && !disposeShared) return;
    if (object.geometry) { object.geometry.dispose(); disposed.geometries += 1; }
    if (object.material) for (const material of [].concat(object.material)) {
      material.dispose(); disposed.materials += 1;
      Object.values(material).forEach((value) => { if (value?.isTexture) { value.dispose(); disposed.textures += 1; } });
    }
  });
  return disposed;
}
