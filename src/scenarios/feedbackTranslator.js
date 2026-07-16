import { getFeedbackRule } from "../data/feedbackRules.js";

const implication = { success: "La elección es compatible con la información disponible.", warning: "Hace falta revisar el contexto antes de mantener esta decisión.", danger: "La decisión no ofrece un control clínico suficiente en este escenario.", info: "Es un dato para integrar con la evolución y el cultivo." };

export function translateFeedbackCodes(codes = []) {
  return codes.map((code) => {
    const rule = getFeedbackRule(code);
    return rule ? { what: rule.message, why: "El motor clínico aplicó una regla respaldada por las fuentes del proyecto.", implication: implication[rule.severity] ?? implication.info, severity: rule.severity } : { what: "Se detectó una situación clínica que requiere revisión.", why: "El código interno no se muestra al estudiante.", implication: implication.warning, severity: "warning" };
  });
}
