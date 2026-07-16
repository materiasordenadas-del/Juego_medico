import test from "node:test";
import assert from "node:assert/strict";
import { publicAssetUrl } from "../src/assets/publicAssetUrl.js";

test("publicAssetUrl resuelve assets para raiz y subdirectorios", () => {
  assert.equal(publicAssetUrl("assets/kaykit/knight.glb", "/"), "/assets/kaykit/knight.glb");
  assert.equal(publicAssetUrl("/assets/kaykit/knight.glb", "/Juego_medico/"), "/Juego_medico/assets/kaykit/knight.glb");
  assert.equal(publicAssetUrl("./assets/kaykit/knight.glb", "./"), "./assets/kaykit/knight.glb");
});
