export function selectTarget(units) {
  return units.filter((unit) => unit.isAlive).sort((a, b) => (a.centerDistance - b.centerDistance) || (a.health - b.health) || a.id.localeCompare(b.id))[0] ?? null;
}
