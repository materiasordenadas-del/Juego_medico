import { levelConfig } from "../data/progression.js";
import { resolveAntibioticEffect } from "../engine/clinicalResolver.js";

export class CombatSystem {
  constructor(context = {}) {
    this.level = context.level ?? 1;
    this.patientState = context.patientState ?? {
      flags: [],
      toxicityLoad: {
        kidney: 0,
        gut: 0,
        ear: 0,
        marrow: 0,
        heartQT: 0
      }
    };
    this.cultureState = context.cultureState ?? { status: "none" };
    this.microbiologyState = context.microbiologyState ?? {
      erythromycinResistance: "unknown",
      dTest: "not_done"
    };
    this.infectionState = context.infectionState ?? {
      severity: "moderate",
      polymicrobial: false,
      sourceControlRequired: false,
      sourceControlCompleted: false
    };
    this.activeTherapy = context.activeTherapy ?? { antibioticIds: [] };
  }

  resolveProjectileImpact({ antibioticId, bacteriaId, baseDamage }) {
    const activeTherapyIds = new Set(this.activeTherapy.antibioticIds);
    activeTherapyIds.add(antibioticId);

    const bacteriaIds = new Set(this.infectionState.bacteriaIds ?? []);
    bacteriaIds.add(bacteriaId);

    const clinicalContext = {
      antibioticId,
      bacteriaId,
      patientState: this.patientState,
      cultureState: this.cultureState,
      microbiologyState: this.microbiologyState,
      activeTherapy: {
        ...this.activeTherapy,
        antibioticIds: [...activeTherapyIds]
      },
      infectionState: {
        ...this.infectionState,
        bacteriaIds: [...bacteriaIds]
      }
    };

    const resolution = resolveAntibioticEffect(clinicalContext, {
      activeSteps: levelConfig[this.level]?.clinicalSteps
    });

    return {
      resolution,
      appliedDamage: baseDamage * resolution.damageMultiplier,
      effectiveness: resolution.effectiveness,
      damageMultiplier: resolution.damageMultiplier,
      feedbackCodes: resolution.feedbackCodes,
      toxicityExposure: resolution.toxicityExposure,
      proaEffect: resolution.proaEffect,
      resistancePressure: resolution.resistancePressure
    };
  }
}
