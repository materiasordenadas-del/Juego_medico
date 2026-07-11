# Contrato de `clinicalResolver`

**Versión:** 0.4.0

El resolver es una función pura. No usa Phaser, DOM, temporizadores, audio ni estado global.

## Entrada mínima

```js
{
  antibioticId: "cefazolin",
  bacteriaId: "mssa"
}
```

## Entrada ampliada

```js
{
  antibioticId: "clindamycin",
  bacteriaId: "mrsa",

  patientState: {
    flags: ["renalImpairment", "priorCdiff"],
    toxicityLoad: {
      kidney: 20,
      gut: 10,
      ear: 0,
      marrow: 0,
      heartQT: 0
    }
  },

  cultureState: {
    status: "susceptibility_available",
    identifiedBacteriaId: "mrsa",
    susceptibility: {
      clindamycin: "susceptible"
    },
    version: 2
  },

  microbiologyState: {
    erythromycinResistance: "resistant",
    dTest: "negative"
  },

  activeTherapy: {
    antibioticIds: ["clindamycin"],
    durationSeconds: 45
  },

  infectionState: {
    severity: "moderate",
    bacteriaIds: ["mrsa"],
    polymicrobial: false,
    sourceControlRequired: true,
    sourceControlCompleted: false,
    bacterialLoad: "high"
  }
}
```

## Estados válidos de cultivo

```text
none
pending
identified
susceptibility_available
final
```

Solo `susceptibility_available` y `final` permiten que el antibiograma modifique la cobertura.

## Estados de sensibilidad

```text
susceptible
intermediate
resistant
unknown
```

La sensibilidad puede escribirse de dos formas.

Forma plana, válida para la bacteria identificada:

```js
susceptibility: {
  cefazolin: "susceptible"
}
```

Forma anidada, preferible para matrices polimicrobianas:

```js
susceptibility: {
  mssa: {
    cefazolin: "susceptible"
  }
}
```

## Salida principal

```js
{
  antibioticId,
  bacteriaId,
  effectiveness,
  coverageLevel,
  damageMultiplier,
  warnings,
  feedbackCodes,
  reasonCodes,
  proaEffect,
  toxicityTags,
  toxicityExposure,
  toxicityRisk,
  resistancePressure,
  combinationEffects,
  deescalationCandidates,
  sourceRefs,
  trace,
  activeSteps,
  contextVersion,
  resolverVersion
}
```

## Significado de `effectiveness`

```text
effective       Cobertura activa y clínicamente coherente.
conditional     Requiere sensibilidad, D-test, combinación o contexto.
ineffective     No existe cobertura fiable o el antibiograma informa resistencia.
contraindicated La seguridad del paciente bloquea la opción en el escenario.
```

## Significado de `damageMultiplier`

```text
1.00  Cobertura fuerte.
0.85  Cobertura condicional confirmada.
0.55  Cobertura condicional no resuelta.
0.00  Sin cobertura o contraindicación.
```

El valor puede reducirse por falta de control del foco o por una interacción. No representa MIC, dosis, probabilidad de curación ni potencia farmacológica real.

## Pipeline canónico

```text
baseCoverage
caveats
contraindications
interactions
cultureKnowledge
empiricDirected
toxicity
proa
resistance
feedback
```

Aunque el llamador entregue los pasos en otro orden, el resolver los ejecuta en este orden canónico. `progression.js` decide qué subconjunto está activo por nivel.

## Matriz terapéutica

```js
resolveTherapyMatrix({
  activeTherapy: {
    antibioticIds: ["ceftriaxone", "metronidazole"]
  },
  infectionState: {
    bacteriaIds: ["ecoli", "mixed_anaerobes"]
  }
});
```

Devuelve una resolución por cada par único antibiótico–bacteria. Los duplicados de entrada se eliminan.

## Reglas de seguridad

1. Un antibiograma resistente anula la cobertura basal.
2. Una supuesta sensibilidad no vence incompatibilidades intrínsecas.
3. MRSA mantiene resistencia frente a los betalactámicos comunes del prototipo.
4. Clindamicina frente a estafilococos conserva el requisito de D-test cuando corresponde.
5. El antibiograma pendiente no modifica la cobertura.
6. Un resultado plano no se aplica a otra bacteria distinta de la identificada.
7. La falta de drenaje o desbridamiento limita el daño, pero no inventa resistencia.
8. Gentamicina no se interpreta como monoterapia antiestafilocócica en el mapa SSTI.
9. E. coli no genera candidatos de desescalada sin sensibilidad documentada.
10. Toxicidad es exposición normalizada; no se acumula por proyectil.
11. PROA distingue cobertura empírica grave justificada de amplitud innecesaria.
12. El resolver devuelve códigos, no texto docente final.
13. IDs desconocidos y números no finitos producen errores explícitos.
14. La función no modifica el objeto de entrada.

## Umbrales de toxicidad

```text
0–30    safe
31–60   warning
61–80   high
81–100  critical
```

## Pruebas

```bash
npm test
npm run validate:clinical
npm run check
```

En Windows también puede ejecutarse:

```text
PROBAR_MOTOR.bat
```
