import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KAYKIT_ASSETS } from "../../assets/kaykitManifest.js";
import { publicAssetUrl } from "../../assets/publicAssetUrl.js";

export class BattleAssets {
  constructor() { this.loader = new GLTFLoader(); this.cache = new Map(); }
  getDefinition(id) { return KAYKIT_ASSETS.find((asset) => asset.id === id) ?? null; }
  async load(id) {
    const asset = this.getDefinition(id);
    if (!asset) throw new Error(`El manifiesto no contiene el recurso: ${id}.`);
    const assetUrl = publicAssetUrl(asset.path);
    if (!this.cache.has(id)) this.cache.set(id, this.loader.loadAsync(assetUrl));
    try { return await this.cache.get(id); }
    catch (error) { throw new Error(`No se pudo cargar ${asset.label}. URL solicitada: ${assetUrl}. Error: ${error.message}`); }
  }
  preload(ids) { return Promise.all(ids.map((id) => this.load(id))); }
}
