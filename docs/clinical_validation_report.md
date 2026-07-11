# Validación clínica sin Phaser

**Resolver:** 0.4.0  
**Estado:** PASS  
**Resoluciones evaluadas:** 5715  
**Fuzzing determinista:** 5000 contextos  
**Fallos:** 0

## Cobertura de la validación

- 65 pares antibiótico–bacteria basales.
- 455 resoluciones a través de los siete niveles de progresión.
- 195 combinaciones de sensibilidad susceptible/intermedia/resistente.
- 5000 contextos clínicos pseudoaleatorios reproducibles.
- Invariantes de eficacia, daño, PROA, toxicidad, resistencia, mensajes y serialización.

## Resultado

No se detectaron violaciones del contrato clínico o técnico evaluado.

## Alcance

Esta validación comprueba coherencia interna y reglas clínicas codificadas. No sustituye revisión externa por infectología, microbiología clínica ni adaptación al antibiograma local.
