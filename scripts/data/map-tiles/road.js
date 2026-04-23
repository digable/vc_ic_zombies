// --- Road Tiles -------------------------------------------------------------
// Pure intersections — no loot, no building subtiles.
// zombieSpawnMode "by_exits" means one zombie per connector direction.
const roadTiles = [
  // Straight (N-S or E-W)
  {
    name: "Straight",
    type: "road",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 4, [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    connectors: ["N", "S"],
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_EXITS,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 1 },
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
      "2,0": { walkable: false },
      "0,1": { walkable: false },
      "1,1": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,1": { walkable: false },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"], doors: ["S"] },
      "2,2": { walkable: false },
    }
  },
  // Corner (N-E, E-S, S-W, N-W) - only one needed, can rotate
  {
    name: "Corner",
    type: "road",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 4, [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    connectors: ["N", "E"],
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_EXITS,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 1 },
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
      "2,0": { walkable: false },
      "0,1": { walkable: false },
      "1,1": { walkable: true, type: "road", walls: ["S", "W"] },
      "2,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["E"] },
      "0,2": { walkable: false },
      "1,2": { walkable: false },
      "2,2": { walkable: false },
    }
  },
  // T-Junction (N-E-W, N-E-S, E-S-W, N-S-W) - only one needed, can rotate
  {
    name: "T-Junction",
    type: "road",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 4, [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    connectors: ["N", "E", "W"],
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_EXITS,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 1 },
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
      "2,0": { walkable: false },
      "0,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["W"] },
      "1,1": { walkable: true, type: "road", walls: ["S"] },
      "2,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["E"] },
      "0,2": { walkable: false },
      "1,2": { walkable: false },
      "2,2": { walkable: false },
    }
  },
  {
    name: "T-Junction (six feet under)",
    type: "road",
    collection: { [COLLECTIONS.SIX_FEET_UNDER]: 4 },
    connectors: { N: CONNECTOR_RULE.ANY, E: CONNECTOR_RULE.ANY, W: CONNECTOR_RULE.ANY },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_EXITS,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 1 },
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
      "2,0": { walkable: false },
      "0,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["W"] },
      "1,1": { walkable: true, type: "road", walls: ["S"] },
      "2,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["E"] },
      "0,2": { walkable: false },
      "1,2": { walkable: false },
      "2,2": { walkable: false },
    }
  },
  {
    name: "4-Way",
    type: "road",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_EXITS,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 1 },
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,0": { walkable: false },
      "0,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,2": { walkable: false }
    }
  },
  {
    name: "4-Way (mall)",
    type: "road",
    collection: { [COLLECTIONS.MALL_WALKERS]: 3 },
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_EXITS,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 1 },
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: true, type: "mall hallway", walls: ["E", "W"] },
      "2,0": { walkable: false },
      "0,1": { walkable: true, type: "mall hallway", walls: ["N", "S"] },
      "1,1": { walkable: true, type: "mall hallway" },
      "2,1": { walkable: true, type: "mall hallway", walls: ["N", "S"] },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "mall hallway", walls: ["E", "W"] },
      "2,2": { walkable: false }
    }
  },
  {
    name: "4-Way (school)",
    type: "road",
    collection: { [COLLECTIONS.SCHOOLS_OUT_FOREVER]: 5 },
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_EXITS,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 1 },
    subTilesTemplate: {
      "0,0": { walkable: false, type: "grass", walls: ["N", "E", "S", "W"] },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,0": { walkable: false, type: "grass", walls: ["N", "E", "S", "W"] },
      "0,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "0,2": { walkable: false, type: "grass", walls: ["N", "E", "S", "W"] },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,2": { walkable: false, type: "grass", walls: ["N", "E", "S", "W"] },
    }
  },
  {
    name: "4-Way (clowns)",
    type: "road",
    collection: { [COLLECTIONS.SEND_IN_THE_CLOWNS]: 4 },
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.NONE,
    zombies: { [ZOMBIE_TYPE.CLOWN]: 0 },
    subTilesTemplate: {
      "0,0": { walkable: false, type: "grass", walls: ["N", "E", "S", "W"] },
      "1,0": { walkable: true, type: "grass", walls: ["E", "W"] },
      "2,0": { walkable: false, type: "grass", walls: ["N", "E", "S", "W"] },
      "0,1": { walkable: true, type: "grass", walls: ["N", "S"] },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "grass", walls: ["N", "S"] },
      "0,2": { walkable: false, type: "grass", walls: ["N", "E", "S", "W"] },
      "1,2": { walkable: true, type: "grass", walls: ["E", "W"] },
      "2,2": { walkable: false, type: "grass", walls: ["N", "E", "S", "W"] },
    }
  },
  // 4-way (Parking Lot)
  {
    name: "Parking Lot",
    type: "road",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1, [COLLECTIONS.SCHOOLS_OUT_FOREVER]: 2 },
    connectors: ["N", "S", "E", "W"],
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_EXITS,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 1 },
    subTilesTemplate: {
      "0,0": { walkable: true, type: "parking", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "parking", doors: ["N"] },
      "2,0": { walkable: true, type: "parking", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "parking", doors: ["W"] },
      "1,1": { walkable: true, type: "parking" },
      "2,1": { walkable: true, type: "parking", doors: ["E"] },
      "0,2": { walkable: true, type: "parking", walls: ["S", "W"] },
      "1,2": { walkable: true, type: "parking", doors: ["S"] },
      "2,2": { walkable: true, type: "parking", walls: ["S", "E"] }
    }
  }
];
