export function publicAssetUrl(relativePath, baseUrl = import.meta.env?.BASE_URL || "/") {
  const base = String(baseUrl).endsWith("/") ? String(baseUrl) : `${baseUrl}/`;
  const path = String(relativePath).replace(/^(?:\.\/|\/)+/, "");
  return `${base}${path}`;
}
