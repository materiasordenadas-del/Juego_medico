export const APP_NAME = "ATB Tower Defense";
export const APP_STAGE = "clinicalResolver v0.4";

export const levelConfig = Object.freeze({
  1: {
    clinicalSteps: ["baseCoverage", "feedback"],
    showToxicity: false,
    showProa: false,
    showCulture: false
  },

  2: {
    clinicalSteps: ["baseCoverage", "caveats", "feedback"],
    showToxicity: false,
    showProa: false,
    showCulture: false
  },

  3: {
    clinicalSteps: [
      "baseCoverage",
      "caveats",
      "contraindications",
      "toxicity",
      "feedback"
    ],
    showToxicity: true,
    showProa: false,
    showCulture: false
  },

  4: {
    clinicalSteps: [
      "baseCoverage",
      "caveats",
      "contraindications",
      "interactions",
      "toxicity",
      "feedback"
    ],
    showToxicity: true,
    showProa: false,
    showCulture: false
  },

  5: {
    clinicalSteps: [
      "baseCoverage",
      "caveats",
      "contraindications",
      "interactions",
      "toxicity",
      "proa",
      "feedback"
    ],
    showToxicity: true,
    showProa: true,
    showCulture: false
  },

  6: {
    clinicalSteps: [
      "baseCoverage",
      "caveats",
      "contraindications",
      "interactions",
      "cultureKnowledge",
      "empiricDirected",
      "toxicity",
      "proa",
      "resistance",
      "feedback"
    ],
    showToxicity: true,
    showProa: true,
    showCulture: true
  },

  7: {
    clinicalSteps: [
      "baseCoverage",
      "caveats",
      "contraindications",
      "interactions",
      "cultureKnowledge",
      "empiricDirected",
      "toxicity",
      "proa",
      "resistance",
      "feedback"
    ],
    showToxicity: true,
    showProa: true,
    showCulture: true,
    showResistance: true
  }
});
