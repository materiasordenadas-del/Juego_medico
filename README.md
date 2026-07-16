# ATB Formations

Juego educativo sobre farmacología antimicrobiana. Representa un combate automático en 3D: la selección y posición de las unidades ocurren antes de iniciar la oleada, y el resultado usa el motor clínico separado del aspecto visual.

> Aviso educativo: no es una herramienta de prescripción. No sustituye guías clínicas, antibiogramas locales, evaluación de pacientes ni juicio profesional.

## Requisitos e instalación

Se necesita Node.js 20 o posterior.

```bash
npm install
npm run dev
```

El juego queda disponible en `http://127.0.0.1:8027`. En Windows también puede usarse `ABRIR_JUEGO.bat`.

## Comandos

```bash
npm run dev                 # desarrollo, puerto 8027
npm run test                # pruebas técnicas y clínicas
npm run validate:clinical   # comprobación determinista del resolver
npm run build               # crea la versión distribuible en dist/
npm run preview             # muestra dist/ en el puerto 8027
npm run check               # test + validación clínica + build
```

## Fase 3: motor global de rÃ©gimen

La Fase 3 agrega un resultado clÃ­nico global, puro y serializable para un rÃ©gimen completo y un reloj clÃ­nico independiente de los fotogramas. Mantiene `resolveAntibioticEffect()` como unidad bÃ¡sica y deja Three.js/proyectiles como representaciÃ³n visual. El contrato, ejemplos, toxicidad, reloj y lÃ­mites educativos estÃ¡n en [FASE_3_MOTOR_CLINICO.md](docs/FASE_3_MOTOR_CLINICO.md).

## Arquitectura

```text
src/data/       Datos y reglas clínicas.
src/engine/     Resolver clínico puro; no depende de Three.js ni del DOM.
src/systems/    Reglas de formación, objetivo, combate y estados.
src/scenes/     Orquestación de la batalla.
src/scenes/battle/
                Carga/caché de GLB, animaciones, unidades, proyectiles y limpieza 3D.
src/ui/         HUD y controles reactivos.
src/scenarios/  Casos educativos, flujo clínico y traducción docente de Fase 2.
public/assets/  Modelos y licencias KayKit incluidos localmente.
tests/          Pruebas automatizadas.
docs/           Contratos clínicos y decisiones técnicas.
```

Three.js y Vite se instalan localmente mediante `package.json`; no se carga código desde CDN. Los modelos GLB se sirven desde `public/assets`, usando rutas `/assets/...`, válidas tanto durante el desarrollo como en la versión compilada.

## Fase 2: bucle educativo clínico

Incluye tres escenarios independientes: celulitis no purulenta, absceso purulento con riesgo de MRSA e infección de pie diabético polimicrobiana. Cada uno sigue presentación, preparación terapéutica, inicio empírico, evento microbiológico, terapia dirigida modificable y debrief.

Para añadir un escenario, cree un objeto con todos los campos requeridos en `src/scenarios/clinicalScenarios.js` y agréguelo al arreglo `clinicalScenarios`. Ejecute `npm run test`: `validateScenarios` verifica los identificadores de antibióticos, bacterias y fuentes. Las decisiones específicas pertenecen a los escenarios; `ClinicalLoopEngine` solo orquesta el flujo y consulta el resolver clínico existente. No se deben añadir datos clínicos para equilibrar el juego.

## Comportamiento técnico

- La máquina de estados solo permite transiciones definidas entre carga, preparación, combate, resolución y resultados.
- El HUD solo actualiza el DOM si cambió su estado; el renderizado 3D sigue usando su propio ciclo.
- Los modelos GLB se almacenan en caché y se clonan para las unidades. La limpieza de la escena libera geometrías, materiales y texturas propias sin destruir recursos compartidos.
- Los errores de inicio, lienzo, manifiesto, carga de modelos y catálogo muestran un aviso visible, además de quedar registrados en la consola del navegador.

Para información sobre assets, consulta [ASSET_SOURCES.md](ASSET_SOURCES.md). Las reglas y su validación están documentadas en `docs/`.
