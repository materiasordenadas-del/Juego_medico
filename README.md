# ATB Tower Defense

Juego educativo de farmacología antimicrobiana tipo **tower defense**.

## Estado actual

Esta entrega contiene la **estructura base** y los **datos clínicos mínimos y el resolver clínico v0.4.0**:

- separación entre datos clínicos, motor clínico y Phaser;
- archivos mínimos y documentación;
- interfaz provisional para comprobar que la carpeta abre correctamente;
- 5 perfiles bacterianos y 13 antibióticos cargados;
- `clinicalResolver` puro, pipeline clínico y matriz terapéutica;
- 46 pruebas automatizadas;
- validación determinista de 5715 resoluciones sin Phaser;
- sin combate, sprites ni oleadas.

## Cómo abrir

### Windows

1. Descomprime la carpeta.
2. Ejecuta `ABRIR_JUEGO.bat`.
3. Se abrirá `http://localhost:8000` en el navegador.
4. Cierra la ventana del servidor cuando termines.

### Alternativa manual

Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Luego abre:

```text
http://localhost:8000
```

## Arquitectura

```text
src/data/      Verdad clínica y configuración.
src/engine/    Lógica clínica pura, sin Phaser ni interfaz.
src/systems/   Puente entre el motor clínico y el juego.
src/entities/  Torres, bacterias y proyectiles.
src/scenes/    Escenas de Phaser.
src/ui/        Paneles y HUD.
src/utils/     Event bus, hash y utilidades.
styles/        Apariencia de la interfaz.
assets/        Mapas, bacterias, torres, iconos y audio.
docs/          Validación clínica y guías de mantenimiento.
```

## Regla principal

> Phaser no decide medicina. Phaser representa y ejecuta el juego.  
> La lógica clínica vive en funciones puras dentro de `src/engine/`.

## Siguiente etapa

1. Conectar `CombatSystem.js` con `clinicalResolver.js`.
2. Implementar `clinicalResolutionCache.js`.
3. Hacer que `FeedbackSystem.js` traduzca los códigos docentes.
4. Integrar exposición temporal en `ToxicitySystem.js`.
5. Después, construir el mapa, las oleadas y las torres mínimas.

## Advertencia educativa

Este proyecto es una herramienta de aprendizaje. No debe utilizarse como guía de prescripción ni sustituye guías clínicas, antibiogramas locales o juicio médico.


## Probar y validar el motor clínico

Con Node.js instalado:

```bash
npm test
npm run validate:clinical
```

Para ejecutar ambas comprobaciones:

```bash
npm run check
```

En Windows puede abrirse `PROBAR_MOTOR.bat`.

Resultados y documentación:

```text
docs/clinical_resolver_contract.md
docs/clinical_validation_report.md
CLINICAL_VALIDATION_RESULTS.json
```
