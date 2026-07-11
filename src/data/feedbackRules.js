/**
 * El motor devuelve códigos. Este catálogo transforma los códigos en mensajes.
 * No se usa dentro del resolver para mantener la lógica clínica separada del texto.
 */
export const feedbackRules = Object.freeze({
  coverage_strong: {
    severity: "info",
    message: "El antibiótico tiene cobertura basal sólida frente al blanco, si el aislamiento es susceptible.",
    cooldownSeconds: 15,
    maxPerLevel: 2
  },
  coverage_conditional: {
    severity: "warning",
    message: "La cobertura depende del antibiograma, el sitio, la gravedad o una condición clínica adicional.",
    cooldownSeconds: 15,
    maxPerLevel: 2
  },
  coverage_absent: {
    severity: "danger",
    message: "Este antibiótico no proporciona cobertura clínicamente fiable frente al blanco.",
    cooldownSeconds: 18,
    maxPerLevel: 2
  },
  therapy_contraindicated: {
    severity: "danger",
    message: "El antibiótico puede tener actividad microbiológica, pero una contraindicación de seguridad bloquea su uso en este paciente.",
    cooldownSeconds: 30,
    maxPerLevel: 1
  },
  unnecessarily_broad_empiric_therapy: {
    severity: "warning",
    message: "La infección no grave dispone de opciones más estrechas; esta cobertura empírica es innecesariamente amplia.",
    cooldownSeconds: 30,
    maxPerLevel: 2
  },
  cefazolin_effective_mssa: {
    severity: "success",
    message: "Cefazolina es una opción dirigida eficaz contra MSSA susceptible.",
    cooldownSeconds: 20,
    maxPerLevel: 2
  },
  cefazolin_fails_mrsa_pbp2a: {
    severity: "danger",
    message: "Cefazolina falla contra MRSA: la PBP2a tiene baja afinidad por los betalactámicos comunes.",
    cooldownSeconds: 20,
    maxPerLevel: 2
  },
  beta_lactam_fails_mrsa_pbp2a: {
    severity: "danger",
    message: "MRSA expresa PBP2a; los betalactámicos comunes de este prototipo no son eficaces.",
    cooldownSeconds: 20,
    maxPerLevel: 2
  },
  vancomycin_effective_mrsa: {
    severity: "success",
    message: "Vancomicina proporciona cobertura anti-MRSA, con vigilancia de exposición y función renal.",
    cooldownSeconds: 20,
    maxPerLevel: 2
  },
  vancomycin_no_gram_negative_outer_membrane: {
    severity: "danger",
    message: "Vancomicina no atraviesa la membrana externa de los gramnegativos.",
    cooldownSeconds: 20,
    maxPerLevel: 2
  },
  clinda_requires_d_test: {
    severity: "warning",
    message: "Clindamicina frente a estafilococos es condicional: puede requerir D-test cuando existe resistencia a eritromicina.",
    cooldownSeconds: 20,
    maxPerLevel: 2
  },
  clinda_d_test_positive_failure: {
    severity: "danger",
    message: "D-test positivo: existe resistencia inducible a clindamicina y la terapia no es fiable.",
    cooldownSeconds: 20,
    maxPerLevel: 2
  },
  clinda_susceptibility_confirmed: {
    severity: "success",
    message: "La sensibilidad a clindamicina está confirmada y el D-test no demuestra resistencia inducible.",
    cooldownSeconds: 20,
    maxPerLevel: 2
  },
  ceftriaxone_no_anaerobe_coverage: {
    severity: "danger",
    message: "Ceftriaxona no proporciona cobertura anaerobia suficiente.",
    cooldownSeconds: 20,
    maxPerLevel: 2
  },
  metronidazole_effective_anaerobes: {
    severity: "success",
    message: "Metronidazol es activo contra el componente anaerobio susceptible.",
    cooldownSeconds: 20,
    maxPerLevel: 2
  },
  metronidazole_no_aerobe_coverage: {
    severity: "danger",
    message: "Metronidazol no cubre los microorganismos aerobios de esta horda.",
    cooldownSeconds: 20,
    maxPerLevel: 2
  },
  complementary_ceftriaxone_metronidazole: {
    severity: "success",
    message: "La combinación es complementaria: ceftriaxona cubre el componente aerobio gramnegativo y metronidazol el anaerobio.",
    cooldownSeconds: 25,
    maxPerLevel: 2
  },
  redundant_mssa_beta_lactams: {
    severity: "warning",
    message: "Cefazolina y oxacilina duplican cobertura contra MSSA sin una ventaja habitual.",
    cooldownSeconds: 25,
    maxPerLevel: 2
  },
  nephrotoxic_vancomycin_gentamicin: {
    severity: "danger",
    message: "Vancomicina y gentamicina aumentan la carga renal; la combinación exige una indicación específica y vigilancia.",
    cooldownSeconds: 25,
    maxPerLevel: 2
  },
  susceptibility_resistant_override: {
    severity: "danger",
    message: "El antibiograma informa resistencia: la cobertura basal queda anulada.",
    cooldownSeconds: 20,
    maxPerLevel: 2
  },
  susceptibility_intermediate: {
    severity: "warning",
    message: "La sensibilidad intermedia reduce la fiabilidad de la terapia.",
    cooldownSeconds: 20,
    maxPerLevel: 2
  },
  susceptibility_confirms_conditional_agent: {
    severity: "success",
    message: "El antibiograma confirma la actividad de un antibiótico que inicialmente era condicional.",
    cooldownSeconds: 20,
    maxPerLevel: 2
  },
  invalid_susceptibility_intrinsic_mismatch: {
    severity: "danger",
    message: "El dato de sensibilidad contradice una barrera intrínseca del microorganismo y debe revisarse.",
    cooldownSeconds: 30,
    maxPerLevel: 1
  },
  deescalate_vancomycin_for_mssa: {
    severity: "warning",
    message: "El cultivo confirmó MSSA: debe considerarse desescalar vancomicina a un betalactámico antiestafilocócico apropiado.",
    cooldownSeconds: 30,
    maxPerLevel: 2
  },
  overbroad_after_culture: {
    severity: "warning",
    message: "El cultivo permite una terapia más estrecha; mantener cobertura amplia reduce la puntuación PROA.",
    cooldownSeconds: 30,
    maxPerLevel: 2
  },
  empiric_broad_justified: {
    severity: "info",
    message: "La cobertura empírica amplia puede justificarse temporalmente por la gravedad antes del resultado microbiológico.",
    cooldownSeconds: 30,
    maxPerLevel: 1
  },
  source_control_required: {
    severity: "danger",
    message: "El foco requiere drenaje o desbridamiento; el antibiótico solo no ofrece control definitivo.",
    cooldownSeconds: 25,
    maxPerLevel: 2
  },
  severe_beta_lactam_hypersensitivity: {
    severity: "danger",
    message: "Existe antecedente de hipersensibilidad inmediata grave a betalactámicos; esta opción queda bloqueada en el escenario.",
    cooldownSeconds: 30,
    maxPerLevel: 1
  },
  severe_sulfonamide_hypersensitivity: {
    severity: "danger",
    message: "Existe antecedente de hipersensibilidad grave a sulfonamidas; TMP-SMX queda bloqueado.",
    cooldownSeconds: 30,
    maxPerLevel: 1
  },
  clindamycin_cdiff_risk: {
    severity: "warning",
    message: "Clindamicina eleva especialmente el riesgo intestinal en un paciente con antecedente de C. difficile.",
    cooldownSeconds: 30,
    maxPerLevel: 1
  },
  linezolid_serotonergic_interaction: {
    severity: "warning",
    message: "Linezolid puede interactuar con fármacos serotoninérgicos; la combinación exige revisión clínica.",
    cooldownSeconds: 30,
    maxPerLevel: 1
  },
  ciprofloxacin_qt_risk: {
    severity: "warning",
    message: "Ciprofloxacina aumenta la carga de riesgo de prolongación del QT en este paciente.",
    cooldownSeconds: 30,
    maxPerLevel: 1
  },
  renal_exposure_warning: {
    severity: "warning",
    message: "La vulnerabilidad renal del paciente aumenta el riesgo por exposición a este antibiótico.",
    cooldownSeconds: 25,
    maxPerLevel: 2
  },
  resistance_pressure_rising: {
    severity: "warning",
    message: "La combinación de baja eficacia, exposición prolongada o mal control del foco aumenta la presión selectiva.",
    cooldownSeconds: 25,
    maxPerLevel: 2
  }
});

export function getFeedbackRule(code) {
  return feedbackRules[code] ?? null;
}
