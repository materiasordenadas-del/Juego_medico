export function stableKey(parts) {
  return parts.map((part) => String(part ?? "")).join("|");
}
