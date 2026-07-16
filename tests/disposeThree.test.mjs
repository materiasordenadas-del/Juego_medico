import test from "node:test";
import assert from "node:assert/strict";
import { disposeSceneResources } from "../src/scenes/battle/disposeThree.js";

test("La limpieza libera recursos propios y conserva los compartidos", () => {
  const calls = { geometry: 0, material: 0, texture: 0 };
  const own = { geometry: { dispose: () => calls.geometry++ }, material: { dispose: () => calls.material++, map: { isTexture: true, dispose: () => calls.texture++ } } };
  const shared = { userData: { sharedAsset: true }, geometry: { dispose: () => calls.geometry++ }, material: { dispose: () => calls.material++ } };
  disposeSceneResources({ traverse: (callback) => [own, shared].forEach(callback) });
  assert.deepEqual(calls, { geometry: 1, material: 1, texture: 1 });
});
