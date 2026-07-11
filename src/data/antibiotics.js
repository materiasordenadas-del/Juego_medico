/**
 * ATB Tower Defense — Datos mínimos de antibióticos
 *
 * Los valores de spectrum son etiquetas educativas basales:
 * - strong: cobertura útil y coherente con el blanco, si el aislamiento es susceptible;
 * - conditional: depende de sensibilidad, sitio, gravedad, combinación o contexto;
 * - none: no ofrece cobertura clínicamente fiable para ese grupo.
 *
 * No son probabilidades, MIC ni sustituyen antibiograma.
 */

export const ANTIBIOTIC_DATA_VERSION = "0.4.0";

export const COVERAGE_LEVEL = Object.freeze({
  STRONG: "strong",
  CONDITIONAL: "conditional",
  NONE: "none"
});

export const STEWARDSHIP_BREADTH = Object.freeze({
  NARROW: "narrow",
  MODERATE: "moderate",
  BROAD: "broad",
  VERY_BROAD: "very_broad"
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

const rawAntibiotics = [
  {
    id: "penicillin_g",
    name: "Penicilina G",
    pharmacology: {
      family: "beta_lactam",
      subclass: "natural_penicillin",
      mechanismCategory: "cell_wall",
      target: "penicillin_binding_proteins",
      effect: "bactericidal"
    },
    spectrum: {
      strepPyogenes: COVERAGE_LEVEL.STRONG,
      mssa: COVERAGE_LEVEL.NONE,
      mrsa: COVERAGE_LEVEL.NONE,
      entericGramNegative: COVERAGE_LEVEL.NONE,
      mixedAnaerobes: COVERAGE_LEVEL.CONDITIONAL
    },
    clinicalTruth: {
      keyUses: ["documented_streptococcal_infection", "documented_gas_necrotizing_infection_with_clindamycin"],
      keyLimitations: [
        "No es fiable contra S. aureus productor de penicilinasa.",
        "No cubre MRSA ni bacilos gramnegativos entéricos.",
        "No debe representar cobertura completa de una infección anaerobia mixta."
      ],
      susceptibilityRequirements: ["organism_identified_or_highly_likely", "local_and_isolate_susceptibility_when_relevant"],
      sourceRefs: ["idsa_ssti_2014"]
    },
    safety: {
      primaryToxicityTags: ["hypersensitivity"],
      kidneyExposure: 0.1,
      gutExposure: 0.15,
      earExposure: 0,
      marrowExposure: 0.05,
      qtRisk: false
    },
    stewardship: {
      breadth: STEWARDSHIP_BREADTH.NARROW,
      reserveTier: 0,
      deescalationValue: "high_when_streptococcus_documented"
    },
    gameBalance: {
      status: "prototype",
      cost: 35,
      power: 2.2,
      fireRate: 1.25,
      range: 125,
      projectileSpeed: 390,
      upgradeCost: 28
    },
    visual: {
      asset: "assets/towers/penicillin_g.png",
      colorToken: "tower_beta_lactam_blue",
      attackStyle: "cell_wall_hammer"
    }
  },

  {
    id: "oxacillin",
    name: "Oxacilina",
    pharmacology: {
      family: "beta_lactam",
      subclass: "antistaphylococcal_penicillin",
      mechanismCategory: "cell_wall",
      target: "penicillin_binding_proteins",
      effect: "bactericidal"
    },
    spectrum: {
      strepPyogenes: COVERAGE_LEVEL.STRONG,
      mssa: COVERAGE_LEVEL.STRONG,
      mrsa: COVERAGE_LEVEL.NONE,
      entericGramNegative: COVERAGE_LEVEL.NONE,
      mixedAnaerobes: COVERAGE_LEVEL.NONE
    },
    clinicalTruth: {
      keyUses: ["mssa_directed_therapy", "selected_streptococcal_infections"],
      keyLimitations: [
        "PBP2a impide cobertura de MRSA.",
        "No proporciona cobertura útil de gramnegativos entéricos ni anaerobios mixtos."
      ],
      susceptibilityRequirements: ["mssa_phenotype_or_susceptible_isolate"],
      sourceRefs: ["idsa_ssti_2014"]
    },
    safety: {
      primaryToxicityTags: ["hypersensitivity", "hepatic_injury_possible", "interstitial_nephritis_possible"],
      kidneyExposure: 0.2,
      gutExposure: 0.2,
      earExposure: 0,
      marrowExposure: 0.08,
      qtRisk: false
    },
    stewardship: {
      breadth: STEWARDSHIP_BREADTH.NARROW,
      reserveTier: 0,
      deescalationValue: "high_for_confirmed_mssa"
    },
    gameBalance: {
      status: "prototype",
      cost: 48,
      power: 2.8,
      fireRate: 1.1,
      range: 132,
      projectileSpeed: 420,
      upgradeCost: 36
    },
    visual: {
      asset: "assets/towers/oxacillin.png",
      colorToken: "tower_antistaph_blue",
      attackStyle: "precision_lance"
    }
  },

  {
    id: "cefazolin",
    name: "Cefazolina",
    pharmacology: {
      family: "beta_lactam",
      subclass: "first_generation_cephalosporin",
      mechanismCategory: "cell_wall",
      target: "penicillin_binding_proteins",
      effect: "bactericidal"
    },
    spectrum: {
      strepPyogenes: COVERAGE_LEVEL.STRONG,
      mssa: COVERAGE_LEVEL.STRONG,
      mrsa: COVERAGE_LEVEL.NONE,
      entericGramNegative: COVERAGE_LEVEL.CONDITIONAL,
      mixedAnaerobes: COVERAGE_LEVEL.NONE
    },
    clinicalTruth: {
      keyUses: ["mssa_ssti", "streptococcal_ssti", "surgical_contexts_when_appropriate"],
      keyLimitations: [
        "No cubre MRSA.",
        "La actividad frente a E. coli depende de sensibilidad y no debe generalizarse.",
        "No es cobertura fiable para anaerobios profundos."
      ],
      susceptibilityRequirements: ["mssa_or_streptococcal_target", "antibiogram_for_enteric_gram_negative_use"],
      sourceRefs: ["idsa_ssti_2014"]
    },
    safety: {
      primaryToxicityTags: ["hypersensitivity", "c_difficile_risk"],
      kidneyExposure: 0.15,
      gutExposure: 0.25,
      earExposure: 0,
      marrowExposure: 0.05,
      qtRisk: false
    },
    stewardship: {
      breadth: STEWARDSHIP_BREADTH.NARROW,
      reserveTier: 0,
      deescalationValue: "high_for_confirmed_mssa_or_streptococcus"
    },
    gameBalance: {
      status: "prototype",
      cost: 52,
      power: 3.0,
      fireRate: 1.0,
      range: 142,
      projectileSpeed: 430,
      upgradeCost: 39
    },
    visual: {
      asset: "assets/towers/cefazolin.png",
      colorToken: "tower_cephalosporin_light_blue",
      attackStyle: "defensive_bolt"
    }
  },

  {
    id: "ceftriaxone",
    name: "Ceftriaxona",
    pharmacology: {
      family: "beta_lactam",
      subclass: "third_generation_cephalosporin",
      mechanismCategory: "cell_wall",
      target: "penicillin_binding_proteins",
      effect: "bactericidal"
    },
    spectrum: {
      strepPyogenes: COVERAGE_LEVEL.STRONG,
      mssa: COVERAGE_LEVEL.CONDITIONAL,
      mrsa: COVERAGE_LEVEL.NONE,
      entericGramNegative: COVERAGE_LEVEL.STRONG,
      mixedAnaerobes: COVERAGE_LEVEL.NONE
    },
    clinicalTruth: {
      keyUses: ["selected_streptococcal_infection", "susceptible_enteric_gram_negative", "component_of_polymicrobial_regimen"],
      keyLimitations: [
        "No cubre MRSA.",
        "No cubre de forma suficiente anaerobios mixtos.",
        "Aunque puede tener actividad frente a MSSA, no representa la opción dirigida preferente del prototipo."
      ],
      susceptibilityRequirements: ["antibiogram_for_enteric_gram_negative_use", "combine_with_anaerobic_agent_when_needed"],
      sourceRefs: ["idsa_ssti_2014"]
    },
    safety: {
      primaryToxicityTags: ["hypersensitivity", "biliary_sludge", "c_difficile_risk"],
      kidneyExposure: 0.1,
      gutExposure: 0.35,
      earExposure: 0,
      marrowExposure: 0.06,
      qtRisk: false
    },
    stewardship: {
      breadth: STEWARDSHIP_BREADTH.MODERATE,
      reserveTier: 0,
      deescalationValue: "context_dependent"
    },
    gameBalance: {
      status: "prototype",
      cost: 64,
      power: 3.25,
      fireRate: 0.85,
      range: 165,
      projectileSpeed: 470,
      upgradeCost: 45
    },
    visual: {
      asset: "assets/towers/ceftriaxone.png",
      colorToken: "tower_cephalosporin_deep_blue",
      attackStyle: "long_range_bolt"
    }
  },

  {
    id: "piperacillin_tazobactam",
    name: "Piperacilina-tazobactam",
    pharmacology: {
      family: "beta_lactam_beta_lactamase_inhibitor",
      subclass: "antipseudomonal_penicillin_combination",
      mechanismCategory: "cell_wall",
      target: "penicillin_binding_proteins_plus_beta_lactamase_inhibition",
      effect: "bactericidal"
    },
    spectrum: {
      strepPyogenes: COVERAGE_LEVEL.STRONG,
      mssa: COVERAGE_LEVEL.STRONG,
      mrsa: COVERAGE_LEVEL.NONE,
      entericGramNegative: COVERAGE_LEVEL.STRONG,
      mixedAnaerobes: COVERAGE_LEVEL.STRONG
    },
    clinicalTruth: {
      keyUses: ["severe_polymicrobial_ssti", "mixed_aerobic_anaerobic_infection", "broad_empiric_component"],
      keyLimitations: [
        "No cubre MRSA.",
        "La actividad frente a organismos con mecanismos avanzados de resistencia no está garantizada.",
        "Debe desescalarse cuando cultivo y evolución permiten una opción más estrecha."
      ],
      susceptibilityRequirements: ["local_epidemiology", "antibiogram_when_available"],
      sourceRefs: ["idsa_ssti_2014", "iwgdf_idsa_dfi_2023"]
    },
    safety: {
      primaryToxicityTags: ["hypersensitivity", "c_difficile_risk", "sodium_load", "kidney_risk_contextual"],
      kidneyExposure: 0.35,
      gutExposure: 0.65,
      earExposure: 0,
      marrowExposure: 0.1,
      qtRisk: false
    },
    stewardship: {
      breadth: STEWARDSHIP_BREADTH.BROAD,
      reserveTier: 1,
      deescalationValue: "high_after_microbiology"
    },
    gameBalance: {
      status: "prototype",
      cost: 92,
      power: 3.6,
      fireRate: 0.8,
      range: 155,
      projectileSpeed: 410,
      upgradeCost: 68
    },
    visual: {
      asset: "assets/towers/piperacillin_tazobactam.png",
      colorToken: "tower_broad_blue",
      attackStyle: "wide_spectrum_blast"
    }
  },

  {
    id: "meropenem",
    name: "Meropenem",
    pharmacology: {
      family: "beta_lactam",
      subclass: "carbapenem",
      mechanismCategory: "cell_wall",
      target: "penicillin_binding_proteins",
      effect: "bactericidal"
    },
    spectrum: {
      strepPyogenes: COVERAGE_LEVEL.STRONG,
      mssa: COVERAGE_LEVEL.STRONG,
      mrsa: COVERAGE_LEVEL.NONE,
      entericGramNegative: COVERAGE_LEVEL.STRONG,
      mixedAnaerobes: COVERAGE_LEVEL.STRONG
    },
    clinicalTruth: {
      keyUses: ["selected_severe_polymicrobial_infection", "selected_resistant_gram_negative_context", "broad_empiric_component_when_justified"],
      keyLimitations: [
        "No cubre MRSA.",
        "Su amplitud no lo convierte en la mejor elección para una infección estrecha y susceptible.",
        "Debe reservarse y desescalarse cuando sea posible."
      ],
      susceptibilityRequirements: ["clinical_severity_or_resistance_risk_justifies_use", "antibiogram_when_available"],
      sourceRefs: ["idsa_ssti_2014", "iwgdf_idsa_dfi_2023"]
    },
    safety: {
      primaryToxicityTags: ["hypersensitivity", "c_difficile_risk", "seizure_risk_contextual"],
      kidneyExposure: 0.2,
      gutExposure: 0.8,
      earExposure: 0,
      marrowExposure: 0.08,
      qtRisk: false
    },
    stewardship: {
      breadth: STEWARDSHIP_BREADTH.VERY_BROAD,
      reserveTier: 2,
      deescalationValue: "very_high_after_microbiology"
    },
    gameBalance: {
      status: "prototype",
      cost: 125,
      power: 4.2,
      fireRate: 0.72,
      range: 172,
      projectileSpeed: 445,
      upgradeCost: 92
    },
    visual: {
      asset: "assets/towers/meropenem.png",
      colorToken: "tower_reserve_gold",
      attackStyle: "reserve_heavy_blast"
    }
  },

  {
    id: "vancomycin",
    name: "Vancomicina",
    pharmacology: {
      family: "glycopeptide",
      subclass: "glycopeptide",
      mechanismCategory: "cell_wall",
      target: "d_ala_d_ala_cell_wall_precursors",
      effect: "bactericidal_against_most_susceptible_staphylococci"
    },
    spectrum: {
      strepPyogenes: COVERAGE_LEVEL.STRONG,
      mssa: COVERAGE_LEVEL.STRONG,
      mrsa: COVERAGE_LEVEL.STRONG,
      entericGramNegative: COVERAGE_LEVEL.NONE,
      mixedAnaerobes: COVERAGE_LEVEL.CONDITIONAL
    },
    clinicalTruth: {
      keyUses: ["severe_mrsa_ssti", "empiric_mrsa_coverage_when_indicated", "serious_gram_positive_infection"],
      keyLimitations: [
        "La membrana externa de los gramnegativos impide cobertura útil.",
        "Tras confirmar MSSA, suele existir una opción betalactámica dirigida preferible.",
        "No debe interpretarse como cobertura completa de anaerobios mixtos."
      ],
      susceptibilityRequirements: ["susceptible_gram_positive_target", "exposure_monitoring_for_serious_infection"],
      sourceRefs: ["idsa_ssti_2014", "vancomycin_monitoring_2020"]
    },
    safety: {
      primaryToxicityTags: ["nephrotoxicity", "infusion_reaction", "therapeutic_monitoring"],
      kidneyExposure: 0.72,
      gutExposure: 0.2,
      earExposure: 0.1,
      marrowExposure: 0.08,
      qtRisk: false
    },
    stewardship: {
      breadth: STEWARDSHIP_BREADTH.MODERATE,
      reserveTier: 1,
      deescalationValue: "high_when_mrsa_excluded"
    },
    gameBalance: {
      status: "prototype",
      cost: 98,
      power: 4.0,
      fireRate: 0.66,
      range: 150,
      projectileSpeed: 330,
      upgradeCost: 72
    },
    visual: {
      asset: "assets/towers/vancomycin.png",
      colorToken: "tower_glycopeptide_purple",
      attackStyle: "heavy_wall_lock"
    }
  },

  {
    id: "clindamycin",
    name: "Clindamicina",
    pharmacology: {
      family: "lincosamide",
      subclass: "lincosamide",
      mechanismCategory: "protein_synthesis",
      target: "50s_ribosomal_subunit",
      effect: "primarily_bacteriostatic"
    },
    spectrum: {
      strepPyogenes: COVERAGE_LEVEL.STRONG,
      mssa: COVERAGE_LEVEL.CONDITIONAL,
      mrsa: COVERAGE_LEVEL.CONDITIONAL,
      entericGramNegative: COVERAGE_LEVEL.NONE,
      mixedAnaerobes: COVERAGE_LEVEL.CONDITIONAL
    },
    clinicalTruth: {
      keyUses: ["toxin_suppression_in_selected_invasive_gram_positive_infection", "susceptible_gram_positive_ssti", "selected_anaerobic_context"],
      keyLimitations: [
        "MRSA y MSSA requieren sensibilidad; un D-test puede ser necesario cuando existe resistencia a eritromicina.",
        "No cubre bacilos gramnegativos aerobios entéricos.",
        "La resistencia de anaerobios es variable; no debe asumirse cobertura universal.",
        "Tiene una asociación clínicamente importante con infección por C. difficile."
      ],
      susceptibilityRequirements: ["susceptibility_confirmed_for_staphylococci", "d_test_negative_when_indicated"],
      sourceRefs: ["idsa_ssti_2014", "dailymed_clindamycin"]
    },
    safety: {
      primaryToxicityTags: ["c_difficile_high_risk", "diarrhea", "hepatic_injury_possible"],
      kidneyExposure: 0.05,
      gutExposure: 0.95,
      earExposure: 0,
      marrowExposure: 0.08,
      qtRisk: false
    },
    stewardship: {
      breadth: STEWARDSHIP_BREADTH.MODERATE,
      reserveTier: 0,
      deescalationValue: "context_dependent"
    },
    gameBalance: {
      status: "prototype",
      cost: 66,
      power: 2.65,
      fireRate: 1.05,
      range: 145,
      projectileSpeed: 395,
      upgradeCost: 49
    },
    visual: {
      asset: "assets/towers/clindamycin.png",
      colorToken: "tower_protein_orange",
      attackStyle: "protein_suppression_wave"
    }
  },

  {
    id: "gentamicin",
    name: "Gentamicina",
    pharmacology: {
      family: "aminoglycoside",
      subclass: "aminoglycoside",
      mechanismCategory: "protein_synthesis",
      target: "30s_ribosomal_subunit",
      effect: "bactericidal"
    },
    spectrum: {
      strepPyogenes: COVERAGE_LEVEL.NONE,
      mssa: COVERAGE_LEVEL.NONE,
      mrsa: COVERAGE_LEVEL.NONE,
      entericGramNegative: COVERAGE_LEVEL.STRONG,
      mixedAnaerobes: COVERAGE_LEVEL.NONE
    },
    clinicalTruth: {
      keyUses: ["susceptible_aerobic_gram_negative_component", "selected_synergy_contexts"],
      keyLimitations: [
        "No actúa contra anaerobios porque su entrada bacteriana depende de transporte relacionado con oxígeno.",
        "No debe presentarse como monoterapia estándar de una SSTI grampositiva.",
        "La utilidad frente a E. coli depende del antibiograma."
      ],
      susceptibilityRequirements: ["antibiogram", "renal_function_and_exposure_monitoring"],
      sourceRefs: ["idsa_ssti_2014", "dailymed_gentamicin"]
    },
    safety: {
      primaryToxicityTags: ["nephrotoxicity", "cochlear_ototoxicity", "vestibular_ototoxicity", "therapeutic_monitoring"],
      kidneyExposure: 0.9,
      gutExposure: 0.08,
      earExposure: 0.95,
      marrowExposure: 0.02,
      qtRisk: false
    },
    stewardship: {
      breadth: STEWARDSHIP_BREADTH.MODERATE,
      reserveTier: 1,
      deescalationValue: "remove_when_no_specific_indication"
    },
    gameBalance: {
      status: "prototype",
      cost: 76,
      power: 2.15,
      fireRate: 1.8,
      range: 138,
      projectileSpeed: 560,
      upgradeCost: 58
    },
    visual: {
      asset: "assets/towers/gentamicin.png",
      colorToken: "tower_aminoglycoside_green",
      attackStyle: "rapid_artillery"
    }
  },

  {
    id: "linezolid",
    name: "Linezolid",
    pharmacology: {
      family: "oxazolidinone",
      subclass: "oxazolidinone",
      mechanismCategory: "protein_synthesis",
      target: "50s_initiation_complex",
      effect: "primarily_bacteriostatic_against_staphylococci"
    },
    spectrum: {
      strepPyogenes: COVERAGE_LEVEL.STRONG,
      mssa: COVERAGE_LEVEL.STRONG,
      mrsa: COVERAGE_LEVEL.STRONG,
      entericGramNegative: COVERAGE_LEVEL.NONE,
      mixedAnaerobes: COVERAGE_LEVEL.CONDITIONAL
    },
    clinicalTruth: {
      keyUses: ["mrsa_ssti", "selected_resistant_gram_positive_infection", "alternative_when_vancomycin_unsuitable"],
      keyLimitations: [
        "No cubre bacilos gramnegativos.",
        "No representa cobertura completa de una flora anaerobia mixta.",
        "La exposición prolongada aumenta el riesgo hematológico y neurológico.",
        "Debe revisarse el riesgo de interacción serotoninérgica."
      ],
      susceptibilityRequirements: ["susceptible_gram_positive_target", "cbc_monitoring_when_exposure_is_prolonged_or_high_risk"],
      sourceRefs: ["idsa_ssti_2014", "dailymed_linezolid"]
    },
    safety: {
      primaryToxicityTags: ["myelosuppression", "thrombocytopenia", "serotonin_syndrome_interaction", "neuropathy_with_prolonged_use"],
      kidneyExposure: 0.08,
      gutExposure: 0.35,
      earExposure: 0,
      marrowExposure: 0.82,
      qtRisk: false
    },
    stewardship: {
      breadth: STEWARDSHIP_BREADTH.MODERATE,
      reserveTier: 1,
      deescalationValue: "context_dependent"
    },
    gameBalance: {
      status: "prototype",
      cost: 104,
      power: 3.8,
      fireRate: 0.9,
      range: 158,
      projectileSpeed: 400,
      upgradeCost: 78
    },
    visual: {
      asset: "assets/towers/linezolid.png",
      colorToken: "tower_oxazolidinone_orange_red",
      attackStyle: "initiation_block"
    }
  },

  {
    id: "ciprofloxacin",
    name: "Ciprofloxacina",
    pharmacology: {
      family: "fluoroquinolone",
      subclass: "fluoroquinolone",
      mechanismCategory: "nucleic_acids",
      target: "dna_gyrase_and_topoisomerase_iv",
      effect: "bactericidal"
    },
    spectrum: {
      strepPyogenes: COVERAGE_LEVEL.NONE,
      mssa: COVERAGE_LEVEL.CONDITIONAL,
      mrsa: COVERAGE_LEVEL.NONE,
      entericGramNegative: COVERAGE_LEVEL.STRONG,
      mixedAnaerobes: COVERAGE_LEVEL.NONE
    },
    clinicalTruth: {
      keyUses: ["susceptible_aerobic_gram_negative_infection", "selected_pseudomonal_contexts"],
      keyLimitations: [
        "No es una opción fiable para estreptococos ni MRSA.",
        "No cubre anaerobios.",
        "La resistencia de E. coli puede ser elevada y exige epidemiología local o antibiograma."
      ],
      susceptibilityRequirements: ["antibiogram_or_strong_local_epidemiologic_support"],
      sourceRefs: ["idsa_ssti_2014", "dailymed_ciprofloxacin"]
    },
    safety: {
      primaryToxicityTags: ["tendinopathy", "peripheral_neuropathy", "cns_effects", "dysglycemia", "qt_prolongation"],
      kidneyExposure: 0.18,
      gutExposure: 0.55,
      earExposure: 0,
      marrowExposure: 0.04,
      qtRisk: true
    },
    stewardship: {
      breadth: STEWARDSHIP_BREADTH.MODERATE,
      reserveTier: 1,
      deescalationValue: "high_when_gram_negative_target_not_confirmed"
    },
    gameBalance: {
      status: "prototype",
      cost: 82,
      power: 3.25,
      fireRate: 1.15,
      range: 168,
      projectileSpeed: 520,
      upgradeCost: 61
    },
    visual: {
      asset: "assets/towers/ciprofloxacin.png",
      colorToken: "tower_nucleic_acid_cyan",
      attackStyle: "dna_break_beam"
    }
  },

  {
    id: "metronidazole",
    name: "Metronidazol",
    pharmacology: {
      family: "nitroimidazole",
      subclass: "nitroimidazole",
      mechanismCategory: "nucleic_acids",
      target: "reduced_nitro_radicals_damage_dna",
      effect: "bactericidal_against_susceptible_anaerobes"
    },
    spectrum: {
      strepPyogenes: COVERAGE_LEVEL.NONE,
      mssa: COVERAGE_LEVEL.NONE,
      mrsa: COVERAGE_LEVEL.NONE,
      entericGramNegative: COVERAGE_LEVEL.NONE,
      mixedAnaerobes: COVERAGE_LEVEL.STRONG
    },
    clinicalTruth: {
      keyUses: ["anaerobic_component_of_polymicrobial_infection", "combination_with_aerobic_gram_negative_agent"],
      keyLimitations: [
        "Es inútil contra los aerobios representados en este escenario.",
        "En una infección mixta necesita otra torre que cubra aerobios."
      ],
      susceptibilityRequirements: ["anaerobic_target_suspected_or_documented"],
      sourceRefs: ["idsa_ssti_2014"]
    },
    safety: {
      primaryToxicityTags: ["gastrointestinal_effects", "metallic_taste", "neuropathy_with_prolonged_use"],
      kidneyExposure: 0.03,
      gutExposure: 0.3,
      earExposure: 0,
      marrowExposure: 0.03,
      qtRisk: false
    },
    stewardship: {
      breadth: STEWARDSHIP_BREADTH.NARROW,
      reserveTier: 0,
      deescalationValue: "remove_when_anaerobic_component_excluded"
    },
    gameBalance: {
      status: "prototype",
      cost: 54,
      power: 3.45,
      fireRate: 0.92,
      range: 136,
      projectileSpeed: 370,
      upgradeCost: 41
    },
    visual: {
      asset: "assets/towers/metronidazole.png",
      colorToken: "tower_anaerobe_violet",
      attackStyle: "anaerobic_dna_burst"
    }
  },

  {
    id: "trimethoprim_sulfamethoxazole",
    name: "TMP-SMX",
    pharmacology: {
      family: "antifolate_combination",
      subclass: "trimethoprim_sulfamethoxazole",
      mechanismCategory: "folate",
      target: "sequential_folate_synthesis_blockade",
      effect: "bactericidal_combination_for_many_susceptible_organisms"
    },
    spectrum: {
      strepPyogenes: COVERAGE_LEVEL.CONDITIONAL,
      mssa: COVERAGE_LEVEL.STRONG,
      mrsa: COVERAGE_LEVEL.CONDITIONAL,
      entericGramNegative: COVERAGE_LEVEL.CONDITIONAL,
      mixedAnaerobes: COVERAGE_LEVEL.NONE
    },
    clinicalTruth: {
      keyUses: ["susceptible_community_mrsa_purulent_ssti", "susceptible_enteric_gram_negative"],
      keyLimitations: [
        "La cobertura de estreptococos no debe asumirse como suficiente para monoterapia de celulitis no purulenta.",
        "MRSA y E. coli requieren sensibilidad y adecuación al sitio y gravedad.",
        "No cubre anaerobios."
      ],
      susceptibilityRequirements: ["antibiogram_when_available", "clinical_context_supports_oral_or_targeted_use"],
      sourceRefs: ["idsa_ssti_2014", "dailymed_tmp_smx"]
    },
    safety: {
      primaryToxicityTags: ["hypersensitivity", "hyperkalemia", "kidney_effects", "bone_marrow_suppression", "drug_interactions"],
      kidneyExposure: 0.42,
      gutExposure: 0.3,
      earExposure: 0,
      marrowExposure: 0.45,
      qtRisk: false
    },
    stewardship: {
      breadth: STEWARDSHIP_BREADTH.MODERATE,
      reserveTier: 0,
      deescalationValue: "context_dependent"
    },
    gameBalance: {
      status: "prototype",
      cost: 68,
      power: 2.4,
      fireRate: 1.0,
      range: 148,
      projectileSpeed: 405,
      upgradeCost: 51
    },
    visual: {
      asset: "assets/towers/tmp_smx.png",
      colorToken: "tower_folate_yellow",
      attackStyle: "dual_pathway_lock"
    }
  }
];

const seenIds = new Set();
for (const antibiotic of rawAntibiotics) {
  if (seenIds.has(antibiotic.id)) {
    throw new Error(`ID de antibiótico duplicado: ${antibiotic.id}`);
  }
  seenIds.add(antibiotic.id);
}

export const antibiotics = deepFreeze(rawAntibiotics);

export const antibioticsById = deepFreeze(
  Object.fromEntries(antibiotics.map((antibiotic) => [antibiotic.id, antibiotic]))
);

export function getAntibioticById(id) {
  return antibioticsById[id] ?? null;
}
