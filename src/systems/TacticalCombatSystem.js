import { distance } from "./TargetingSystem.js";

export const TACTICAL_ROLES = Object.freeze({
  front: Object.freeze({ exposure: 1.25, protection: 0.65, response: 0.9, support: 0.8, label: "Primera línea: intercepta, pero recibe más presión." }),
  second: Object.freeze({ exposure: 1, protection: 0.35, response: 1, support: 1, label: "Segunda línea: equilibrio entre respuesta y protección." }),
  rear: Object.freeze({ exposure: 0.72, protection: 0, response: 1.08, support: 1.16, label: "Retaguardia: más apoyo, menos exposición directa." })
});

export function tacticalProfile(unit, formation) {
  const line = formation.get(unit.slotId)?.line ?? "second";
  return { line, ...TACTICAL_ROLES[line] };
}

export function canAttack(attacker, target) { return distance(attacker, target) <= attacker.definition.gameBalance.range / 10; }

export function tacticalDamage(baseDamage, attacker, formation) {
  const profile = tacticalProfile(attacker, formation);
  return baseDamage * profile.response;
}

export function protectedTarget(enemies, formation) {
  const front = enemies.filter((unit) => unit.isAlive && tacticalProfile(unit, formation).line === "front");
  return front.sort((a, b) => a.health - b.health || a.id.localeCompare(b.id))[0] ?? null;
}

export function enemyAttackTarget(enemies, allies, formation) {
  const interceptor = protectedTarget(allies, formation);
  return interceptor ?? allies.filter((unit) => unit.isAlive).sort((a, b) => a.id.localeCompare(b.id))[0] ?? null;
}

export function tacticalRisk(unit, formation) { return tacticalProfile(unit, formation).exposure; }
