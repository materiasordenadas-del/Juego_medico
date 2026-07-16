/** Datos educativos de Fase 2. No contienen puntuaciones ni reglas de interfaz. */
const sourceRefs = ["idsa_ssti_2014"];

export const clinicalScenarios = Object.freeze([
  {
    id: "nonpurulent-cellulitis",
    title: "Celulitis no purulenta",
    learningObjectives: ["Reconocer el predominio estreptocócico probable sin revelar un microorganismo al inicio.", "Comparar cobertura empírica estrecha frente a cobertura innecesariamente amplia."],
    patient: { summary: "Adulto con eritema doloroso y progresivo en la pierna; sin pus ni absceso aparente." },
    presentation: "Cuadro compatible con celulitis no purulenta. No hay un aislamiento microbiológico inicial.",
    vitalSigns: "Sin datos de choque; gravedad no grave en este caso educativo.",
    laboratoryData: "No se muestran resultados microbiológicos al inicio.",
    infectionState: { severity: "moderate", bacteriaIds: ["strep_pyogenes"], polymicrobial: false, sourceControlRequired: false, sourceControlCompleted: false, bacterialLoad: "moderate" },
    initialKnowledge: { visible: ["La celulitis no purulenta suele requerir considerar estreptococos."], hiddenOrganisms: true },
    cultureTimeline: { availableAfterEmpiric: true, result: "El cultivo, si se obtiene y resulta interpretable, apoya Streptococcus pyogenes susceptible." },
    sourceControlOptions: [],
    availableAntibiotics: ["penicillin_g", "cefazolin", "vancomycin", "meropenem"],
    successCriteria: { requiresSourceControl: false, adequateTherapyIds: ["penicillin_g", "cefazolin"], narrowPreferred: true },
    failureCriteria: { noTherapy: true, inadequateTherapy: true },
    debriefRules: { key: "La opción empírica debe cubrir la probabilidad estreptocócica; una opción muy amplia no mejora por sí sola la adecuación." },
    sourceRefs
  },
  {
    id: "purulent-abscess-mrsa",
    title: "Absceso purulento con riesgo de MRSA",
    learningObjectives: ["Priorizar drenaje como control del foco.", "Justificar cobertura anti-MRSA mientras se espera microbiología y ajustar tras conocer MSSA o MRSA."],
    patient: { summary: "Paciente con colección purulenta cutánea y factores que elevan la preocupación por MRSA." },
    presentation: "Hay pus y una colección que requiere valoración de drenaje. El fenotipo de S. aureus no se revela al inicio.",
    vitalSigns: "Gravedad moderada para este ejercicio; reevaluar siempre según el paciente real.",
    laboratoryData: "Muestra de pus disponible si se realiza drenaje.",
    infectionState: { severity: "moderate", bacteriaIds: ["mrsa"], polymicrobial: false, sourceControlRequired: true, sourceControlCompleted: false, bacterialLoad: "moderate" },
    initialKnowledge: { visible: ["El material purulento orienta a S. aureus; el riesgo MRSA influye en la terapia empírica."], hiddenOrganisms: true },
    cultureTimeline: { availableAfterEmpiric: true, requiresSourceControl: true, result: "Cultivo: S. aureus resistente a meticilina (MRSA)." },
    sourceControlOptions: [{ id: "incision-drainage", label: "Incisión y drenaje", description: "Drenar la colección y obtener muestra cuando sea clínicamente indicado." }],
    availableAntibiotics: ["cefazolin", "vancomycin", "linezolid", "clindamycin"],
    successCriteria: { requiresSourceControl: true, adequateTherapyIds: ["vancomycin", "linezolid"], narrowPreferred: false },
    failureCriteria: { noTherapy: true, inadequateTherapy: true, missingSourceControl: true },
    debriefRules: { key: "El antibiótico no sustituye el drenaje de un absceso; el cultivo permite distinguir MSSA de MRSA y modificar el tratamiento." },
    sourceRefs
  },
  {
    id: "diabetic-foot-polymicrobial",
    title: "Infección de pie diabético polimicrobiana",
    learningObjectives: ["Reconocer la necesidad de considerar aerobios y anaerobios en una herida profunda seleccionada.", "Usar cultivo y control del foco para ajustar a cobertura adecuada y más dirigida."],
    patient: { summary: "Persona con diabetes, úlcera profunda infectada y tejido desvitalizado que requiere valoración quirúrgica." },
    presentation: "Infección compleja de pie diabético; se deben integrar profundidad, cultivo y posible desbridamiento.",
    vitalSigns: "Caso educativo de gravedad moderada; la gravedad real debe guiar urgencia, vía y amplitud inicial.",
    laboratoryData: "La muestra profunda se obtiene durante el control del foco; no se usa un resultado superficial como sustituto.",
    infectionState: { severity: "moderate", bacteriaIds: ["ecoli", "mixed_anaerobes"], polymicrobial: true, sourceControlRequired: true, sourceControlCompleted: false, bacterialLoad: "high" },
    initialKnowledge: { visible: ["Una infección profunda seleccionada puede involucrar aerobios y anaerobios; se requiere cultivo adecuado."], hiddenOrganisms: true },
    cultureTimeline: { availableAfterEmpiric: true, requiresSourceControl: true, result: "Cultivo profundo: E. coli susceptible a ceftriaxona y flora anaerobia mixta; permite terapia dirigida combinada." },
    sourceControlOptions: [{ id: "debridement", label: "Desbridamiento y muestra profunda", description: "Retirar tejido desvitalizado y obtener una muestra apropiada." }],
    availableAntibiotics: ["piperacillin_tazobactam", "ceftriaxone", "metronidazole", "vancomycin", "meropenem"],
    successCriteria: { requiresSourceControl: true, adequateTherapyIds: ["ceftriaxone", "metronidazole"], requiredCombination: ["ceftriaxone", "metronidazole"], narrowPreferred: true },
    failureCriteria: { noTherapy: true, inadequateTherapy: true, missingSourceControl: true },
    debriefRules: { key: "El control del foco y el cultivo profundo orientan la desescalada; la combinación dirigida debe cubrir los componentes aerobio y anaerobio identificados." },
    sourceRefs: ["iwgdf_idsa_dfi_2023", "idsa_ssti_2014"]
  }
]);

export const scenarioById = Object.freeze(Object.fromEntries(clinicalScenarios.map((scenario) => [scenario.id, scenario])));
