/**
 * ATB Tower Defense — Datos bacterianos mínimos
 *
 * Alcance:
 * - Primer escenario: piel y partes blandas.
 * - Estos perfiles representan blancos educativos del juego.
 * - "mixed_anaerobes" es un grupo clínico compuesto, no una especie única.
 *
 * No contiene:
 * - sensibilidad local;
 * - MIC;
 * - antibiograma individual;
 * - decisiones terapéuticas definitivas.
 */

export const BACTERIA_DATA_VERSION = "0.2.0";

export const BACTERIA_ENTITY_TYPE = Object.freeze({
  SPECIES_PHENOTYPE: "species_phenotype",
  CLINICAL_GROUP: "clinical_group"
});

export const GRAM = Object.freeze({
  POSITIVE: "positive",
  NEGATIVE: "negative",
  MIXED: "mixed"
});

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nestedValue of Object.values(value)) {
      deepFreeze(nestedValue);
    }
    Object.freeze(value);
  }
  return value;
}

const rawBacteria = [
  {
    id: "strep_pyogenes",
    entityType: BACTERIA_ENTITY_TYPE.SPECIES_PHENOTYPE,
    displayName: "Streptococcus pyogenes",
    shortName: "S. pyogenes",
    phenotypeLabel: "Estreptococo del grupo A",
    taxonomy: {
      genus: "Streptococcus",
      species: "pyogenes"
    },
    microbiology: {
      gram: GRAM.POSITIVE,
      shape: "coccus",
      arrangement: "chains",
      oxygenUse: "facultative_anaerobe",
      keyStructureTags: ["thick_peptidoglycan", "no_outer_membrane"]
    },
    clinicalTruth: {
      roleInSkinInfection: [
        "cellulitis_nonpurulent",
        "erysipelas",
        "necrotizing_fasciitis",
        "wound_infection"
      ],
      usualContext:
        "Patógeno central de celulitis no purulenta y erisipela; puede producir infección invasiva y necrosante.",
      resistanceMechanisms: [
        "macrolide_lincosamide_resistance_can_occur"
      ],
      keyVulnerabilities: [
        "beta_lactams",
        "cell_wall_active_agents"
      ],
      importantCaveats: [
        "La penicilina continúa siendo el fármaco de referencia para infección documentada susceptible.",
        "En infección invasiva toxigénica, la supresión de toxinas y el control quirúrgico pueden ser determinantes."
      ],
      sourceRefs: ["idsa_ssti_2014"]
    },
    visual: {
      asset: "assets/bacteria/strep_pyogenes.png",
      colorToken: "bacteria_strep_red",
      silhouette: "small_cocci_chain",
      description: "Cocos pequeños rojos conectados en cadenas."
    },
    gameBalance: {
      status: "prototype",
      baseHealth: 58,
      speed: 58,
      armor: 8,
      patientDamage: 7,
      rewardCredits: 8,
      specialTags: ["chain_formation", "toxin_risk"]
    }
  },

  {
    id: "mssa",
    entityType: BACTERIA_ENTITY_TYPE.SPECIES_PHENOTYPE,
    displayName: "Staphylococcus aureus MSSA",
    shortName: "MSSA",
    phenotypeLabel: "S. aureus sensible a meticilina",
    taxonomy: {
      genus: "Staphylococcus",
      species: "aureus"
    },
    microbiology: {
      gram: GRAM.POSITIVE,
      shape: "coccus",
      arrangement: "clusters",
      oxygenUse: "facultative_anaerobe",
      keyStructureTags: ["thick_peptidoglycan", "no_outer_membrane"]
    },
    clinicalTruth: {
      roleInSkinInfection: [
        "purulent_ssti",
        "abscess",
        "surgical_site_infection",
        "pyomyositis",
        "wound_infection"
      ],
      usualContext:
        "Causa frecuente de infección purulenta, absceso, infección de herida y piomiositis.",
      resistanceMechanisms: [
        "penicillinase_common",
        "mecA_or_mecC_not_expressed_as_mrsa_phenotype"
      ],
      keyVulnerabilities: [
        "antistaphylococcal_penicillins",
        "first_generation_cephalosporins"
      ],
      importantCaveats: [
        "La penicilina G suele ser poco fiable por producción de penicilinasa.",
        "Tras confirmar MSSA, un betalactámico antiestafilocócico suele ser preferible a vancomicina cuando no existe contraindicación."
      ],
      sourceRefs: ["idsa_ssti_2014"]
    },
    visual: {
      asset: "assets/bacteria/mssa.png",
      colorToken: "bacteria_mssa_gold",
      silhouette: "cocci_cluster",
      description: "Cocos dorados agrupados en racimos."
    },
    gameBalance: {
      status: "prototype",
      baseHealth: 72,
      speed: 48,
      armor: 18,
      patientDamage: 9,
      rewardCredits: 11,
      specialTags: ["cluster_formation", "abscess_former"]
    }
  },

  {
    id: "mrsa",
    entityType: BACTERIA_ENTITY_TYPE.SPECIES_PHENOTYPE,
    displayName: "Staphylococcus aureus MRSA",
    shortName: "MRSA",
    phenotypeLabel: "S. aureus resistente a meticilina",
    taxonomy: {
      genus: "Staphylococcus",
      species: "aureus"
    },
    microbiology: {
      gram: GRAM.POSITIVE,
      shape: "coccus",
      arrangement: "clusters",
      oxygenUse: "facultative_anaerobe",
      keyStructureTags: ["thick_peptidoglycan", "altered_pbp2a"]
    },
    clinicalTruth: {
      roleInSkinInfection: [
        "purulent_ssti",
        "abscess",
        "severe_cellulitis_with_mrsa_risk",
        "surgical_site_infection",
        "necrotizing_infection"
      ],
      usualContext:
        "Debe considerarse en infección purulenta y en cuadros con factores de riesgo específicos o gravedad sistémica.",
      resistanceMechanisms: [
        "mecA_or_mecC",
        "pbp2a_low_beta_lactam_affinity"
      ],
      keyVulnerabilities: [
        "glycopeptides",
        "oxazolidinones",
        "selected_non_beta_lactam_agents_if_susceptible"
      ],
      importantCaveats: [
        "Es resistente a oxacilina y a los betalactámicos comunes usados en este prototipo.",
        "Clindamicina y TMP-SMX son opciones condicionadas por el sitio, la gravedad y la sensibilidad.",
        "El drenaje sigue siendo una intervención principal en abscesos."
      ],
      sourceRefs: ["idsa_ssti_2014"]
    },
    visual: {
      asset: "assets/bacteria/mrsa.png",
      colorToken: "bacteria_mrsa_purple",
      silhouette: "armored_cocci_cluster",
      description: "Cocos morados o negros con armadura PBP2a."
    },
    gameBalance: {
      status: "prototype",
      baseHealth: 94,
      speed: 42,
      armor: 42,
      patientDamage: 12,
      rewardCredits: 17,
      specialTags: ["pbp2a_armor", "abscess_former", "resistant_clone"]
    }
  },

  {
    id: "ecoli",
    entityType: BACTERIA_ENTITY_TYPE.SPECIES_PHENOTYPE,
    displayName: "Escherichia coli",
    shortName: "E. coli",
    phenotypeLabel: "Bacilo gramnegativo entérico",
    taxonomy: {
      genus: "Escherichia",
      species: "coli"
    },
    microbiology: {
      gram: GRAM.NEGATIVE,
      shape: "bacillus",
      arrangement: "single_or_pairs",
      oxygenUse: "facultative_anaerobe",
      keyStructureTags: ["outer_membrane", "lipopolysaccharide", "thin_peptidoglycan"]
    },
    clinicalTruth: {
      roleInSkinInfection: [
        "polymicrobial_deep_wound",
        "perineal_infection",
        "diabetes_related_foot_infection",
        "open_trauma_or_healthcare_associated_infection"
      ],
      usualContext:
        "No es el blanco principal de la celulitis simple; cobra importancia en heridas profundas, perineales, crónicas o polimicrobianas.",
      resistanceMechanisms: [
        "outer_membrane_permeability_barrier",
        "beta_lactamases_variable",
        "esbl_possible",
        "fluoroquinolone_resistance_variable"
      ],
      keyVulnerabilities: [
        "selected_cephalosporins_if_susceptible",
        "beta_lactam_beta_lactamase_inhibitors_if_susceptible",
        "carbapenems_for_selected_resistant_or_severe_contexts",
        "aminoglycosides_if_susceptible"
      ],
      importantCaveats: [
        "La cobertura debe depender del contexto clínico, epidemiología local y antibiograma.",
        "Vancomicina, oxacilina, penicilina G y clindamicina no proporcionan cobertura fiable.",
        "La presencia de ESBL u otros mecanismos puede invalidar la cobertura basal."
      ],
      sourceRefs: ["idsa_ssti_2014", "iwgdf_idsa_dfi_2023"]
    },
    visual: {
      asset: "assets/bacteria/ecoli.png",
      colorToken: "bacteria_ecoli_green",
      silhouette: "shielded_bacillus",
      description: "Bacilos verdes con un escudo que representa la membrana externa."
    },
    gameBalance: {
      status: "prototype",
      baseHealth: 78,
      speed: 55,
      armor: 30,
      patientDamage: 10,
      rewardCredits: 14,
      specialTags: ["outer_membrane_shield", "variable_resistance"]
    }
  },

  {
    id: "mixed_anaerobes",
    entityType: BACTERIA_ENTITY_TYPE.CLINICAL_GROUP,
    displayName: "Anaerobios mixtos",
    shortName: "Anaerobios",
    phenotypeLabel: "Grupo clínico anaerobio polimicrobiano",
    taxonomy: {
      representativeGroups: [
        "Bacteroides_fragilis_group",
        "Prevotella_species",
        "Fusobacterium_species",
        "anaerobic_gram_positive_cocci"
      ]
    },
    microbiology: {
      gram: GRAM.MIXED,
      shape: "mixed",
      arrangement: "mixed",
      oxygenUse: "obligate_anaerobes",
      keyStructureTags: ["polymicrobial_group", "necrotic_tissue_affinity"]
    },
    clinicalTruth: {
      roleInSkinInfection: [
        "necrotic_wound",
        "deep_abscess",
        "perineal_infection",
        "diabetes_related_foot_infection",
        "polymicrobial_necrotizing_infection"
      ],
      usualContext:
        "Representa flora anaerobia mixta de heridas profundas, necróticas, perineales o polimicrobianas.",
      resistanceMechanisms: [
        "beta_lactamases_variable",
        "clindamycin_resistance_variable",
        "species_level_variability"
      ],
      keyVulnerabilities: [
        "metronidazole_for_many_anaerobes",
        "beta_lactam_beta_lactamase_inhibitors",
        "carbapenems"
      ],
      importantCaveats: [
        "No debe interpretarse como una especie única.",
        "Metronidazol necesita un acompañante cuando también existen aerobios.",
        "El drenaje y el desbridamiento pueden ser indispensables; el antibiótico solo no resuelve el foco."
      ],
      sourceRefs: ["idsa_ssti_2014", "iwgdf_idsa_dfi_2023"]
    },
    visual: {
      asset: "assets/bacteria/anaerobes.png",
      colorToken: "bacteria_anaerobes_gray",
      silhouette: "mixed_dark_creatures",
      description: "Grupo heterogéneo oscuro rodeado de humo gris o violeta."
    },
    gameBalance: {
      status: "prototype",
      baseHealth: 84,
      speed: 38,
      armor: 25,
      patientDamage: 13,
      rewardCredits: 16,
      specialTags: ["mixed_horde", "necrosis_affinity", "source_control_required"]
    }
  }
];

const seenIds = new Set();
for (const bacterium of rawBacteria) {
  if (seenIds.has(bacterium.id)) {
    throw new Error(`ID bacteriano duplicado: ${bacterium.id}`);
  }
  seenIds.add(bacterium.id);
}

export const bacteria = deepFreeze(rawBacteria);

export const bacteriaById = deepFreeze(
  Object.fromEntries(bacteria.map((bacterium) => [bacterium.id, bacterium]))
);

export function getBacteriumById(id) {
  return bacteriaById[id] ?? null;
}
