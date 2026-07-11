# ATB Tower Defense - Asset Sources

Fecha de integracion: 2026-07-11

Esta primera ingesta usa copias locales ubicadas en:

```text
D:\medicina\Medicina interna\juego\graficos
```

La carpeta fuente se trato como biblioteca de solo lectura. No se descargaron assets nuevos y no se agregaron dependencias externas de runtime.

## Auditoria de packs locales

| Pack local | Estado encontrado | Formatos disponibles | Licencia encontrada |
| --- | --- | --- | --- |
| `KayKit-Character-Pack-Adventures-1.0-main.zip` | Archivo ZIP local | `.glb`, `.gltf`, `.bin`, `.png`, `.txt` | Creative Commons Zero, CC0 |
| `KayKit-Character-Pack-Skeletons-1.0-main.zip` | Archivo ZIP local | `.glb`, `.gltf`, `.bin`, `.png`, `.txt` | Creative Commons Zero, CC0 |
| `KayKit-Medieval-Hexagon-Pack-1.0-main.zip` | Archivo ZIP local | `.gltf`, `.bin`, `.obj`, `.mtl`, `.png`, `.txt` | Creative Commons Zero, CC0 |
| `KayKit-Dungeon-Remastered-1.0-main.zip` | Archivo ZIP local, inspeccionado pero no incorporado en esta etapa | `.glb`, `.obj`, `.mtl`, `.png`, `.txt` | Creative Commons Zero, CC0 |

Autor de los packs: Kay Lousberg, `www.kaylousberg.com`.

## Criterio de seleccion

Se copio solo una seleccion minima para la primera version 3D:

- Personajes antimicrobianos: 3 modelos base del pack Adventurers.
- Horda bacteriana provisional: 2 modelos base del pack Skeletons.
- Equipo visual inicial: espada, escudo, baston y escudo de esqueleto.
- Entorno: una loseta de pasto, dos banderas, una roca y un arbol cortado.
- Dungeon Remastered queda disponible para una etapa posterior, pero no se copio porque todavia no es necesario.

## Archivos incorporados

| Uso previsto | Pack de origen | Ruta original | Ruta de destino | Formato | Modificaciones realizadas | Licencia |
| --- | --- | --- | --- | --- | --- | --- |
| Antimicrobiano defensivo/base | KayKit Character Pack Adventures | `KayKit-Character-Pack-Adventures-1.0-main/addons/kaykit_character_pack_adventures/Characters/gltf/Knight.glb` | `public/assets/kaykit/characters/adventurers/knight.glb` | GLB | Copia directa; nombre normalizado a minusculas | CC0 |
| Antimicrobiano pesado/base | KayKit Character Pack Adventures | `KayKit-Character-Pack-Adventures-1.0-main/addons/kaykit_character_pack_adventures/Characters/gltf/Barbarian.glb` | `public/assets/kaykit/characters/adventurers/barbarian.glb` | GLB | Copia directa; nombre normalizado a minusculas | CC0 |
| Antimicrobiano lanzador/base | KayKit Character Pack Adventures | `KayKit-Character-Pack-Adventures-1.0-main/addons/kaykit_character_pack_adventures/Characters/gltf/Mage.glb` | `public/assets/kaykit/characters/adventurers/mage.glb` | GLB | Copia directa; nombre normalizado a minusculas | CC0 |
| Enemigo provisional comun | KayKit Character Pack Skeletons | `KayKit-Character-Pack-Skeletons-1.0-main/addons/kaykit_character_pack_skeletons/Characters/gltf/Skeleton_Minion.glb` | `public/assets/kaykit/characters/skeletons/skeleton_minion.glb` | GLB | Copia directa; nombre normalizado a minusculas | CC0 |
| Enemigo provisional resistente/elite visual | KayKit Character Pack Skeletons | `KayKit-Character-Pack-Skeletons-1.0-main/addons/kaykit_character_pack_skeletons/Characters/gltf/Skeleton_Warrior.glb` | `public/assets/kaykit/characters/skeletons/skeleton_warrior.glb` | GLB | Copia directa; nombre normalizado a minusculas | CC0 |
| Escudo aliado | KayKit Character Pack Adventures | `KayKit-Character-Pack-Adventures-1.0-main/addons/kaykit_character_pack_adventures/Assets/gltf/shield_round_color.gltf` | `public/assets/kaykit/equipment/shields/shield_round_color.gltf` | glTF + BIN + PNG | URI de buffer y textura ajustadas a la nueva estructura | CC0 |
| Baston aliado | KayKit Character Pack Adventures | `KayKit-Character-Pack-Adventures-1.0-main/addons/kaykit_character_pack_adventures/Assets/gltf/staff.gltf` | `public/assets/kaykit/equipment/staffs/staff.gltf` | glTF + BIN + PNG | URI de buffer y textura ajustadas a la nueva estructura | CC0 |
| Espada aliada | KayKit Character Pack Adventures | `KayKit-Character-Pack-Adventures-1.0-main/addons/kaykit_character_pack_adventures/Assets/gltf/sword_1handed.gltf` | `public/assets/kaykit/equipment/weapons/sword_1handed.gltf` | glTF + BIN + PNG | URI de buffer y textura ajustadas a la nueva estructura | CC0 |
| Escudo enemigo provisional | KayKit Character Pack Skeletons | `KayKit-Character-Pack-Skeletons-1.0-main/addons/kaykit_character_pack_skeletons/Assets/gltf/Skeleton_Shield_Small_A.gltf` | `public/assets/kaykit/equipment/shields/skeleton_shield_small_a.gltf` | glTF + BIN + PNG | URI de buffer y textura ajustadas a la nueva estructura | CC0 |
| Terreno base | KayKit Medieval Hexagon Pack | `KayKit-Medieval-Hexagon-Pack-1.0-main/addons/kaykit_medieval_hexagon_pack/Assets/gltf/tiles/base/hex_grass.gltf` | `public/assets/kaykit/environment/terrain/hex_grass.gltf` | glTF + BIN + PNG | URI de buffer y textura ajustadas a la nueva estructura | CC0 |
| Bandera aliada | KayKit Medieval Hexagon Pack | `KayKit-Medieval-Hexagon-Pack-1.0-main/addons/kaykit_medieval_hexagon_pack/Assets/gltf/decoration/props/flag_blue.gltf` | `public/assets/kaykit/environment/flags/flag_blue.gltf` | glTF + BIN + PNG | URI de buffer y textura ajustadas a la nueva estructura | CC0 |
| Bandera enemiga provisional | KayKit Medieval Hexagon Pack | `KayKit-Medieval-Hexagon-Pack-1.0-main/addons/kaykit_medieval_hexagon_pack/Assets/gltf/decoration/props/flag_red.gltf` | `public/assets/kaykit/environment/flags/flag_red.gltf` | glTF + BIN + PNG | URI de buffer y textura ajustadas a la nueva estructura | CC0 |
| Roca baja de borde | KayKit Medieval Hexagon Pack | `KayKit-Medieval-Hexagon-Pack-1.0-main/addons/kaykit_medieval_hexagon_pack/Assets/gltf/decoration/nature/rock_single_A.gltf` | `public/assets/kaykit/environment/rocks/rock_single_a.gltf` | glTF + BIN + PNG | URI de buffer y textura ajustadas a la nueva estructura | CC0 |
| Vegetacion baja de borde | KayKit Medieval Hexagon Pack | `KayKit-Medieval-Hexagon-Pack-1.0-main/addons/kaykit_medieval_hexagon_pack/Assets/gltf/decoration/nature/tree_single_A_cut.gltf` | `public/assets/kaykit/environment/vegetation/tree_single_a_cut.gltf` | glTF + BIN + PNG | URI de buffer y textura ajustadas a la nueva estructura | CC0 |
| Textura de equipo aliado | KayKit Character Pack Adventures | `KayKit-Character-Pack-Adventures-1.0-main/addons/kaykit_character_pack_adventures/Assets/gltf/knight_texture.png` | `public/assets/kaykit/textures/adventurers/knight_texture.png` | PNG | Copia directa | CC0 |
| Textura de equipo lanzador | KayKit Character Pack Adventures | `KayKit-Character-Pack-Adventures-1.0-main/addons/kaykit_character_pack_adventures/Assets/gltf/mage_texture.png` | `public/assets/kaykit/textures/adventurers/mage_texture.png` | PNG | Copia directa | CC0 |
| Textura de equipo enemigo | KayKit Character Pack Skeletons | `KayKit-Character-Pack-Skeletons-1.0-main/addons/kaykit_character_pack_skeletons/Assets/gltf/skeleton_texture.png` | `public/assets/kaykit/textures/skeletons/skeleton_texture.png` | PNG | Copia directa | CC0 |
| Textura de entorno medieval | KayKit Medieval Hexagon Pack | `KayKit-Medieval-Hexagon-Pack-1.0-main/addons/kaykit_medieval_hexagon_pack/Assets/gltf/tiles/base/hexagons_medieval.png` | `public/assets/kaykit/textures/environment/hexagons_medieval.png` | PNG | Copia directa; se reutiliza para terreno, banderas, roca y vegetacion | CC0 |

## Licencias copiadas

| Pack | Ruta original | Ruta de destino |
| --- | --- | --- |
| KayKit Character Pack Adventures | `KayKit-Character-Pack-Adventures-1.0-main/addons/kaykit_character_pack_adventures/LICENSE.txt` | `public/assets/kaykit/licenses/kaykit_character_pack_adventures_LICENSE.txt` |
| KayKit Character Pack Skeletons | `KayKit-Character-Pack-Skeletons-1.0-main/addons/kaykit_character_pack_skeletons/LICENSE.txt` | `public/assets/kaykit/licenses/kaykit_character_pack_skeletons_LICENSE.txt` |
| KayKit Medieval Hexagon Pack | `KayKit-Medieval-Hexagon-Pack-1.0-main/addons/kaykit_medieval_hexagon_pack/LICENSE.txt` | `public/assets/kaykit/licenses/kaykit_medieval_hexagon_pack_LICENSE.txt` |

## Clips de animacion reales inspeccionados

Los modelos `Knight.glb`, `Barbarian.glb` y `Mage.glb` del pack Adventurers comparten estos 76 clips:

```text
1H_Melee_Attack_Chop
1H_Melee_Attack_Slice_Diagonal
1H_Melee_Attack_Slice_Horizontal
1H_Melee_Attack_Stab
1H_Ranged_Aiming
1H_Ranged_Reload
1H_Ranged_Shoot
1H_Ranged_Shooting
2H_Melee_Attack_Chop
2H_Melee_Attack_Slice
2H_Melee_Attack_Spin
2H_Melee_Attack_Spinning
2H_Melee_Attack_Stab
2H_Melee_Idle
2H_Ranged_Aiming
2H_Ranged_Reload
2H_Ranged_Shoot
2H_Ranged_Shooting
Block
Block_Attack
Block_Hit
Blocking
Cheer
Death_A
Death_A_Pose
Death_B
Death_B_Pose
Dodge_Backward
Dodge_Forward
Dodge_Left
Dodge_Right
Dualwield_Melee_Attack_Chop
Dualwield_Melee_Attack_Slice
Dualwield_Melee_Attack_Stab
Hit_A
Hit_B
Idle
Interact
Jump_Full_Long
Jump_Full_Short
Jump_Idle
Jump_Land
Jump_Start
Lie_Down
Lie_Idle
Lie_Pose
Lie_StandUp
PickUp
Running_A
Running_B
Running_Strafe_Left
Running_Strafe_Right
Sit_Chair_Down
Sit_Chair_Idle
Sit_Chair_Pose
Sit_Chair_StandUp
Sit_Floor_Down
Sit_Floor_Idle
Sit_Floor_Pose
Sit_Floor_StandUp
Spellcast_Long
Spellcast_Raise
Spellcast_Shoot
Spellcasting
T-Pose
Throw
Unarmed_Idle
Unarmed_Melee_Attack_Kick
Unarmed_Melee_Attack_Punch_A
Unarmed_Melee_Attack_Punch_B
Unarmed_Pose
Use_Item
Walking_A
Walking_B
Walking_Backwards
Walking_C
```

Los modelos `Skeleton_Minion.glb` y `Skeleton_Warrior.glb` del pack Skeletons comparten estos 95 clips:

```text
1H_Melee_Attack_Chop
1H_Melee_Attack_Jump_Chop
1H_Melee_Attack_Slice_Diagonal
1H_Melee_Attack_Slice_Horizontal
1H_Melee_Attack_Stab
1H_Ranged_Aiming
1H_Ranged_Reload
1H_Ranged_Shoot
1H_Ranged_Shooting
2H_Melee_Attack_Chop
2H_Melee_Attack_Slice
2H_Melee_Attack_Spin
2H_Melee_Attack_Spinning
2H_Melee_Attack_Stab
2H_Melee_Idle
2H_Ranged_Aiming
2H_Ranged_Reload
2H_Ranged_Shoot
2H_Ranged_Shooting
Block
Block_Attack
Block_Hit
Blocking
Cheer
Death_A
Death_A_Pose
Death_B
Death_B_Pose
Death_C_Pose
Death_C_Skeletons
Death_C_Skeletons_Resurrect
Dodge_Backward
Dodge_Forward
Dodge_Left
Dodge_Right
Dualwield_Melee_Attack_Chop
Dualwield_Melee_Attack_Slice
Dualwield_Melee_Attack_Stab
Hit_A
Hit_B
Idle
Idle_B
Idle_Combat
Interact
Jump_Full_Long
Jump_Full_Short
Jump_Idle
Jump_Land
Jump_Start
Lie_Down
Lie_Idle
Lie_Pose
Lie_StandUp
PickUp
Running_A
Running_B
Running_C
Running_Strafe_Left
Running_Strafe_Right
Sit_Chair_Down
Sit_Chair_Idle
Sit_Chair_Pose
Sit_Chair_StandUp
Sit_Floor_Down
Sit_Floor_Idle
Sit_Floor_Pose
Sit_Floor_StandUp
Skeleton_Inactive_Standing_Pose
Skeletons_Awaken_Floor
Skeletons_Awaken_Floor_Long
Skeletons_Awaken_Standing
Skeletons_Inactive_Floor_Pose
Spawn_Air
Spawn_Ground
Spawn_Ground_Skeletons
Spellcast_Long
Spellcast_Raise
Spellcast_Shoot
Spellcast_Summon
Spellcasting
T-Pose
Taunt
Taunt_Longer
Throw
Unarmed_Idle
Unarmed_Melee_Attack_Kick
Unarmed_Melee_Attack_Punch_A
Unarmed_Melee_Attack_Punch_B
Unarmed_Pose
Use_Item
Walking_A
Walking_B
Walking_Backwards
Walking_C
Walking_D_Skeletons
```

Los assets de equipo y entorno incorporados no contienen clips de animacion.

## Notas para la siguiente etapa

- Validar escala, pivote y orientacion en `asset-lab` antes de reemplazar primitivas en batalla.
- Mantener la carga desde `public/assets/kaykit/`; no cargar desde `graficos` ni desde internet.
- Si se agregan nuevos glTF con texturas compartidas, actualizar los URI de imagen para apuntar a `public/assets/kaykit/textures/...` y documentarlo aqui.

## Asset Lab

Ruta local:

```text
http://localhost:8017/asset-lab/
```

Archivos del laboratorio:

| Archivo | Uso |
| --- | --- |
| `asset-lab/index.html` | Entrada independiente del laboratorio visual. |
| `src/assetLab/AssetLabApp.js` | Carga GLB/glTF, reproduce clips, muestra bounding box, skeleton helper, clones y metricas. |
| `src/assets/kaykitManifest.js` | Manifest central de assets KayKit, rutas, escala inicial, equipo y alias de animacion. |
| `styles/asset-lab.css` | Estilos del panel de control del laboratorio. |

Controles disponibles:

- Selector de modelo KayKit.
- Selector de clip real.
- Botones de alias de animacion: `Idle`, `Ready`, `Melee`, `Cast`, `Hit`, `Death`.
- Pausa/reanudacion.
- Velocidad de animacion.
- Escala del modelo.
- Bounding box.
- Skeleton helper.
- Sombras.
- Clonado de unidades para probar independencia de mixers.
- Lectura de poligonos, draw calls y FPS aproximados.

Restricciones:

- El laboratorio no modifica la logica clinica.
- El laboratorio no decide farmacologia.
- El laboratorio no reemplaza aun las primitivas de la batalla.
- Los modelos se cargan desde `public/assets/kaykit/`.
