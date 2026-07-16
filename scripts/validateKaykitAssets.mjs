import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { KAYKIT_ASSETS } from "../src/assets/kaykitManifest.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = resolve(projectRoot, "public");

function assetFile(relativePath, fromDirectory = publicRoot) {
  const normalized = String(relativePath).replace(/^(?:\.\/|\/)+/, "");
  const file = resolve(fromDirectory, normalized);
  assert.ok(!relative(publicRoot, file).startsWith(".."), `Ruta fuera de public/: ${relativePath}`);
  return file;
}

async function assertFile(file, description) {
  await stat(file).catch(() => assert.fail(`${description} no existe: ${file}`));
}

async function validateGltfDependencies(file) {
  const gltf = JSON.parse(await readFile(file, "utf8"));
  const references = [...(gltf.buffers ?? []), ...(gltf.images ?? [])]
    .map((entry) => entry.uri)
    .filter((uri) => uri && !uri.startsWith("data:"));

  for (const uri of references) {
    const dependency = assetFile(uri, dirname(file));
    await assertFile(dependency, `Dependencia de ${file}`);
  }
}

for (const asset of KAYKIT_ASSETS) {
  assert.ok(!asset.path.includes("/public/"), `El manifiesto no debe incluir public/: ${asset.id}`);
  const file = assetFile(asset.path);
  await assertFile(file, `Asset ${asset.id}`);
  if (extname(file).toLowerCase() === ".gltf") await validateGltfDependencies(file);
}

console.log(`KayKit: ${KAYKIT_ASSETS.length} assets registrados y sus dependencias validados.`);
