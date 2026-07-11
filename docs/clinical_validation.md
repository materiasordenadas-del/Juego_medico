# Validación clínica

## Estado de esta versión

**Versión de datos antibióticos:** 0.4.0  
**Versión de bacterias:** 0.2.0  
**Versión del resolver:** 0.4.0  
**Fecha:** 2026-07-10

El motor se validó sin Phaser mediante pruebas unitarias, matrices exhaustivas y fuzzing determinista.

## Alcance ejecutado

- 5 blancos bacterianos.
- 13 antibióticos.
- 65 pares antibiótico–bacteria basales.
- 455 resoluciones a través de los siete niveles de progresión.
- 195 combinaciones de antibiograma susceptible/intermedio/resistente.
- 5000 contextos clínicos pseudoaleatorios reproducibles.
- 46 pruebas automatizadas.
- 5715 resoluciones adicionales en el validador independiente.

Resultado actual:

```text
PASS
Fallos detectados: 0
```

## Interacciones clínicas verificadas

```text
Cefazolina + MSSA → efectiva.
Cefazolina + MRSA → inefectiva por PBP2a.
Vancomicina + MRSA → efectiva con exposición renal.
Vancomicina + E. coli → inefectiva por barrera gramnegativa.
Clindamicina + MRSA sin D-test → condicional.
Clindamicina + MRSA + D-test positivo → inefectiva.
Clindamicina + MRSA susceptible + D-test negativo → efectiva.
Ceftriaxona + anaerobios mixtos → inefectiva.
Metronidazol + anaerobios mixtos → efectiva.
Ceftriaxona + metronidazol → combinación complementaria para infección mixta.
Cefazolina + oxacilina contra MSSA → duplicación innecesaria.
Vancomicina + gentamicina → toxicidad renal y auditiva aditiva.
Vancomicina mantenida tras confirmar MSSA → desescalada y penalización PROA.
Meropenem en infección estreptocócica no grave → penalización por amplitud innecesaria.
Cobertura amplia antes del cultivo en infección grave → tolerancia empírica temporal.
Gentamicina contra MSSA/MRSA → no se presenta como monoterapia válida de SSTI.
E. coli identificada sin antibiograma → no autoriza desescalada automática.
```

## Defectos corregidos durante la validación

1. Se eliminan mensajes positivos obsoletos después de un antibiograma resistente.
2. La sensibilidad no se aplica mientras el cultivo está pendiente.
3. La sensibilidad de una bacteria identificada no contamina otro blanco de la matriz.
4. Una contraindicación ya no se comunica falsamente como ausencia de espectro.
5. La combinación ceftriaxona–metronidazol solo elogia el impacto contra el blanco correcto.
6. PROA penaliza cobertura innecesariamente amplia en infección no grave.
7. El pipeline se reordena de forma canónica aunque el llamador entregue pasos desordenados.
8. Se rechazan IDs desconocidos dentro de la terapia activa.
9. Se normalizan duraciones y cargas negativas; se rechazan números no finitos.
10. La matriz elimina IDs duplicados.
11. Los umbrales de toxicidad respetan 0–30, 31–60, 61–80 y 81–100.
12. Gentamicina dejó de figurar como cobertura antiestafilocócica autónoma.

## Invariantes técnicas

- El resolver no importa Phaser ni accede al DOM.
- La entrada no se modifica.
- La salida es serializable.
- `ineffective` y `contraindicated` siempre producen `damageMultiplier = 0`.
- Solo existe un código genérico final de cobertura.
- El resultado permanece dentro de los límites numéricos documentados.
- Todos los códigos docentes emitidos existen en `feedbackRules.js`.
- Todas las referencias internas apuntan a entradas existentes de `evidenceSources.js`.

## Archivos de comprobación

```text
tests/clinicalResolver.test.mjs
tests/clinicalValidation.test.mjs
tests/dataIntegrity.test.mjs
scripts/validateClinicalResolver.mjs
docs/clinical_validation_report.md
CLINICAL_VALIDATION_RESULTS.json
```

## Limitaciones vigentes

- La matriz resuelve pares antibiótico–bacteria; todavía no existe un agregador terapéutico global del régimen.
- La exposición tóxica devuelta es una contribución normalizada. La acumulación temporal pertenece a `toxicityEngine.js`.
- Los patrones locales de resistencia todavía no están modelados.
- Las interacciones con azitromicina y cloranfenicol quedan diferidas hasta registrar esos antibióticos en `antibiotics.js`.
- Esta validación no sustituye revisión externa por infectología, microbiología clínica ni adaptación institucional.
