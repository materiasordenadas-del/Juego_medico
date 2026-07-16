# Fase 3: motor de regimen clinico

`resolveAntibioticEffect()` sigue siendo la unidad minima: un antibiotico frente a un blanco. `resolveRegimenOutcome(context)` combina esas resoluciones en un resultado puro y serializable de todo el regimen. No depende del DOM, Three.js ni proyectiles.

El contexto recibe `patientState`, `infectionState`, `microbiologyState`, `cultureState`, `sourceControlState`, `activeTherapy`, `elapsedClinicalTime` y `progressionConfig`. El resultado contiene cobertura, blancos no cubiertos, redundancia/complemento, contraindicaciones, riesgos de interaccion, exposicion/carga/riesgo de toxicidad, PROA, desescalada, control del foco, efecto esperado, trayectoria, codigos docentes y componentes de puntuacion.

Ejemplos: cefazolina para MSSA logra cobertura completa; vancomicina mantenida tras MSSA susceptible propone desescalada; ceftriaxona y metronidazol son complementarios para los blancos mixtos. No prescribe ni predice resultados individuales: aplica solo reglas educativas registradas.

`advanceClinicalClock(state, segundosReales, config)` convierte segundos reales en horas clinicas con `clinicalHoursPerRealSecond` (1 por defecto). Usa tiempo real transcurrido y no fotogramas, asi que el mismo total es determinista aunque cambie FPS. La toxicidad se calcula por sistema (0-100), intensidad, duracion, funcion renal/hepatica declarada e interacciones existentes. Sin exposicion, recupera carga de forma abstracta. Umbrales: 0-30 seguro, 31-60 vigilancia, 61-80 alto y 81-100 critico. Los proyectiles no generan toxicidad ni deciden la clinica.

Para agregar una regla: registrar primero fuente y dato basal en `src/data/`, conservar la regla par-a-par en `resolveAntibioticEffect()` y agregar al regimen solo una interpretacion mecanica comprobable. La presion de resistencia es educativa y poblacional, no una prediccion individual.

Limitaciones pendientes de Fase 4: no hay dosis reales, farmacocinetica, vias, prediccion individual ni tactica avanzada de combate. No es una herramienta para tratar pacientes.
