export function updateToxicityLoad(currentLoad, exposure, recovery, deltaSeconds) {
  const next = currentLoad + exposure * deltaSeconds - recovery * deltaSeconds;
  return Math.min(100, Math.max(0, next));
}
