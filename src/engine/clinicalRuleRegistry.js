export const clinicalRuleRegistry = new Map();

export function registerClinicalRule(id, resolver) {
  if (typeof resolver !== "function") {
    throw new TypeError(`La regla ${id} debe ser una función.`);
  }
  clinicalRuleRegistry.set(id, resolver);
}
