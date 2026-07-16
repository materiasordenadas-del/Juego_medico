const reason = (target, priority) => priority === "scenario" && target.scenarioPriority ? "objetivo prioritario del escenario" : priority === "resistant" && target.isResistant ? "blanco resistente" : priority === "uncovered" && !target.isCovered ? "blanco no cubierto" : priority === "load" ? "mayor carga restante" : priority === "distribution" ? "reparte el fuego" : "blanco más cercano";

export function selectTarget(units, { attacker = null, range = Infinity, scenarioPriorityId = null } = {}) {
  const candidates = units.filter((unit) => unit.isAlive && (attacker ? distance(attacker, unit) <= range : true));
  const ordered = [...candidates].sort((a, b) => score(b, scenarioPriorityId) - score(a, scenarioPriorityId) || (a.centerDistance - b.centerDistance) || a.id.localeCompare(b.id));
  const target = ordered[0] ?? null;
  return target;
}

export function explainTargetPriority(target, { scenarioPriorityId = null } = {}) {
  if (!target) return "Sin blanco dentro de alcance.";
  const priority = target.id === scenarioPriorityId && target.scenarioPriority ? "scenario" : target.isResistant ? "resistant" : !target.isCovered ? "uncovered" : target.incomingDamage > 0 ? "distribution" : target.bacterialLoad > 1 ? "load" : "near";
  return reason(target, priority);
}

export function distance(a, b) { return Math.hypot((a.view?.position.x ?? a.position?.x ?? 0) - (b.view?.position.x ?? b.position?.x ?? 0), (a.view?.position.z ?? a.position?.z ?? 0) - (b.view?.position.z ?? b.position?.z ?? 0)); }
function score(unit, scenarioPriorityId) { return (unit.id === scenarioPriorityId && unit.scenarioPriority ? 1000 : 0) + (unit.isResistant ? 250 : 0) + (!unit.isCovered ? 180 : 0) + (unit.bacterialLoad ?? unit.maxHealth ?? unit.health ?? 0) * 3 - (unit.incomingDamage ?? 0) * 4 - (unit.centerDistance ?? 0) * 2; }
