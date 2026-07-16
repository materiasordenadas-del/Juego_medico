export const KAYKIT_ASSETS = [
  {
    id: "adventurer-knight",
    label: "Adventurer Knight",
    team: "antimicrobial",
    kind: "animated-character",
    path: "assets/kaykit/characters/adventurers/knight.glb",
    sourcePack: "KayKit Character Pack Adventures",
    defaultScale: 1,
    facingRotation: -Math.PI / 2,
    expectedClips: ["Idle", "1H_Melee_Attack_Chop", "Block", "Hit_A", "Death_A", "Cheer"]
  },
  {
    id: "adventurer-barbarian",
    label: "Adventurer Barbarian",
    team: "antimicrobial",
    kind: "animated-character",
    path: "assets/kaykit/characters/adventurers/barbarian.glb",
    sourcePack: "KayKit Character Pack Adventures",
    defaultScale: 1,
    facingRotation: -Math.PI / 2,
    expectedClips: ["Idle", "2H_Melee_Attack_Chop", "Hit_A", "Death_A", "Cheer"]
  },
  {
    id: "adventurer-mage",
    label: "Adventurer Mage",
    team: "antimicrobial",
    kind: "animated-character",
    path: "assets/kaykit/characters/adventurers/mage.glb",
    sourcePack: "KayKit Character Pack Adventures",
    defaultScale: 1,
    facingRotation: -Math.PI / 2,
    expectedClips: ["Idle", "Spellcast_Shoot", "Spellcast_Raise", "Hit_A", "Death_A", "Cheer"]
  },
  {
    id: "skeleton-minion",
    label: "Skeleton Minion",
    team: "bacteria",
    kind: "animated-character",
    path: "assets/kaykit/characters/skeletons/skeleton_minion.glb",
    sourcePack: "KayKit Character Pack Skeletons",
    defaultScale: 1,
    facingRotation: Math.PI / 2,
    expectedClips: ["Idle", "Idle_Combat", "1H_Melee_Attack_Chop", "Hit_A", "Death_C_Skeletons"]
  },
  {
    id: "skeleton-warrior",
    label: "Skeleton Warrior",
    team: "bacteria",
    kind: "animated-character",
    path: "assets/kaykit/characters/skeletons/skeleton_warrior.glb",
    sourcePack: "KayKit Character Pack Skeletons",
    defaultScale: 1,
    facingRotation: Math.PI / 2,
    expectedClips: ["Idle", "Idle_Combat", "Block", "1H_Melee_Attack_Chop", "Hit_A", "Death_C_Skeletons"]
  },
  {
    id: "terrain-hex-grass",
    label: "Hex Grass",
    team: "environment",
    kind: "environment",
    path: "assets/kaykit/environment/terrain/hex_grass.gltf",
    sourcePack: "KayKit Medieval Hexagon Pack",
    defaultScale: 1,
    facingRotation: 0,
    expectedClips: []
  },
  {
    id: "flag-blue",
    label: "Flag Blue",
    team: "environment",
    kind: "prop",
    path: "assets/kaykit/environment/flags/flag_blue.gltf",
    sourcePack: "KayKit Medieval Hexagon Pack",
    defaultScale: 1,
    facingRotation: 0,
    expectedClips: []
  },
  {
    id: "flag-red",
    label: "Flag Red",
    team: "environment",
    kind: "prop",
    path: "assets/kaykit/environment/flags/flag_red.gltf",
    sourcePack: "KayKit Medieval Hexagon Pack",
    defaultScale: 1,
    facingRotation: 0,
    expectedClips: []
  },
  {
    id: "rock-single-a",
    label: "Rock Single A",
    team: "environment",
    kind: "prop",
    path: "assets/kaykit/environment/rocks/rock_single_a.gltf",
    sourcePack: "KayKit Medieval Hexagon Pack",
    defaultScale: 1,
    facingRotation: 0,
    expectedClips: []
  },
  {
    id: "tree-single-a-cut",
    label: "Tree Single A Cut",
    team: "environment",
    kind: "prop",
    path: "assets/kaykit/environment/vegetation/tree_single_a_cut.gltf",
    sourcePack: "KayKit Medieval Hexagon Pack",
    defaultScale: 1,
    facingRotation: 0,
    expectedClips: []
  }
];

export const ANIMATION_ALIASES = {
  idle: ["Idle", "Idle_B", "Unarmed_Idle"],
  ready: ["Idle_Combat", "2H_Melee_Idle", "Idle"],
  attackMelee: ["1H_Melee_Attack_Chop", "1H_Melee_Attack_Slice_Horizontal", "2H_Melee_Attack_Chop"],
  attackRanged: ["1H_Ranged_Shoot", "2H_Ranged_Shoot", "Throw"],
  cast: ["Spellcast_Shoot", "Spellcast_Raise", "Spellcast_Long"],
  hit: ["Hit_A", "Hit_B", "Block_Hit"],
  death: ["Death_C_Skeletons", "Death_A", "Death_B"],
  victory: ["Cheer", "Taunt"]
};

export function getTeamFacingRotation(team) {
  if (team === "antimicrobial") return -Math.PI / 2;
  if (team === "bacteria") return Math.PI / 2;
  return 0;
}

export function findClipByAlias(clips, aliasName) {
  const aliases = ANIMATION_ALIASES[aliasName] || [aliasName];
  return aliases.map((name) => clips.find((clip) => clip.name === name)).find(Boolean) || null;
}
