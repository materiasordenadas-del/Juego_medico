/**
 * Fuentes utilizadas para la primera versión de los datos.
 *
 * Regla:
 * - sourceRefs dentro de bacteria.js y antibiotics.js deben apuntar a una clave de este objeto.
 * - Las fuentes de etiquetas regulatorias se usan para alertas de seguridad, no para decidir
 *   por sí solas la terapia de un caso.
 */

export const EVIDENCE_DATA_VERSION = "0.2.0";
export const EVIDENCE_ACCESSED_AT = "2026-07-10";

export const evidenceSources = Object.freeze({
  idsa_ssti_2014: {
    type: "clinical_guideline",
    organization: "Infectious Diseases Society of America",
    citation:
      "Stevens DL, Bisno AL, Chambers HF, et al. Practice Guidelines for the Diagnosis and Management of Skin and Soft Tissue Infections: 2014 Update by the IDSA. Clin Infect Dis. 2014;59(2):e10-e52.",
    doi: "10.1093/cid/ciu296",
    url: "https://www.idsociety.org/practice-guideline/skin-and-soft-tissue-infections/",
    status: "current_on_idsa_site_as_of_access_date",
    supports: [
      "streptococcal_and_staphylococcal_ssti_targets",
      "mssa_vs_mrsa_directed_therapy",
      "broad_empiric_regimens_for_severe_infection",
      "aerobic_anaerobic_combination_logic",
      "drainage_and_source_control"
    ]
  },

  iwgdf_idsa_dfi_2023: {
    type: "clinical_guideline",
    organization: "IWGDF and Infectious Diseases Society of America",
    citation:
      "Senneville É, Albalawi Z, van Asten SA, et al. IWGDF/IDSA Guidelines on the Diagnosis and Treatment of Diabetes-related Foot Infections. Clin Infect Dis. 2023:ciad527.",
    doi: "10.1093/cid/ciad527",
    url: "https://www.idsociety.org/practice-guideline/diabetic-foot-infections/",
    supports: [
      "complex_wound_microbiology",
      "culture_directed_therapy",
      "collateral_damage_and_stewardship",
      "surgery_and_source_control"
    ]
  },

  vancomycin_monitoring_2020: {
    type: "consensus_guideline",
    organizations: ["ASHP", "IDSA", "PIDS", "SIDP"],
    citation:
      "Rybak MJ, Le J, Lodise TP, et al. Therapeutic monitoring of vancomycin for serious MRSA infections: A revised consensus guideline. Am J Health Syst Pharm. 2020;77(11):835-864.",
    doi: "10.1093/ajhp/zxaa036",
    pubmed: "https://pubmed.ncbi.nlm.nih.gov/32191793/",
    supports: [
      "vancomycin_exposure_monitoring",
      "efficacy_safety_balance",
      "nephrotoxicity_risk"
    ]
  },

  dailymed_clindamycin: {
    type: "regulatory_drug_label_search",
    organization: "U.S. National Library of Medicine — DailyMed",
    citation: "Clindamycin systemic product labeling.",
    url: "https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=clindamycin",
    supports: ["c_difficile_warning", "drug_safety"]
  },

  dailymed_gentamicin: {
    type: "regulatory_drug_label_search",
    organization: "U.S. National Library of Medicine — DailyMed",
    citation: "Gentamicin systemic product labeling.",
    url: "https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=gentamicin",
    supports: ["nephrotoxicity", "ototoxicity", "therapeutic_monitoring"]
  },

  dailymed_linezolid: {
    type: "regulatory_drug_label_search",
    organization: "U.S. National Library of Medicine — DailyMed",
    citation: "Linezolid systemic product labeling.",
    url: "https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=linezolid",
    supports: ["myelosuppression", "serotonergic_interactions", "neuropathy"]
  },

  dailymed_ciprofloxacin: {
    type: "regulatory_drug_label_search",
    organization: "U.S. National Library of Medicine — DailyMed",
    citation: "Ciprofloxacin systemic product labeling.",
    url: "https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=ciprofloxacin",
    supports: ["tendon_risk", "neurologic_risk", "qt_risk", "dysglycemia"]
  },

  dailymed_tmp_smx: {
    type: "regulatory_drug_label_search",
    organization: "U.S. National Library of Medicine — DailyMed",
    citation: "Trimethoprim-sulfamethoxazole systemic product labeling.",
    url: "https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=trimethoprim%20sulfamethoxazole",
    supports: ["hyperkalemia", "hypersensitivity", "marrow_and_kidney_risk"]
  }
});

export function getEvidenceSource(id) {
  return evidenceSources[id] ?? null;
}
