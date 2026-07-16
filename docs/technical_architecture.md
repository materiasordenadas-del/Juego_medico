# Arquitectura técnica de la fase 1

## Límites de responsabilidad

El contenido clínico continúa en `src/data` y `src/engine`. La capa 3D no determina cobertura, resistencia, toxicidad ni decisiones terapéuticas: `CombatSystem` consulta al resolver y solo convierte el resultado en daño y retroalimentación del juego.

La escena de batalla se divide en módulos bajo `src/scenes/battle`:

- `BattleAssets`: manifiesto, carga y caché de GLB.
- `BattleAnimations`: mezcladores y cambio de clips.
- `BattleUnits`: clonación y preparación visual de unidades.
- `ProjectileSystem`: creación, desplazamiento y retirada de proyectiles/VFX.
- `disposeThree`: liberación comprobable de recursos 3D propios; ignora modelos marcados como compartidos.

## Flujo y seguridad

`GameStateMachine` posee la tabla de transiciones válidas. Una transición incorrecta produce un error visible para desarrollo en vez de dejar una pantalla en estado ambiguo.

El HUD recibe estados completos, pero descarta estados idénticos antes de tocar el DOM. El ciclo de Three.js no vuelve a renderizar el HUD en cada fotograma.

## Distribución

Vite usa el puerto 8027 para desarrollo, vista previa y el lanzador de Windows. Los recursos en `public/assets` se publican como `/assets/...`; no dependen de una ruta de desarrollo ni de CDN. GitHub Actions ejecuta `npm ci` y `npm run check` en cada push o pull request.

## Limitaciones actuales

La comprobación automatizada cubre la lógica, el estado y la limpieza de recursos con dobles de prueba. La compatibilidad visual final con GPU/WebGL debe verificarse manualmente en un navegador compatible.
