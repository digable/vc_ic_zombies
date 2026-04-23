// --- Zombies!!! 2: Zombie Corps(e) — Named Tiles ----------------------------
const namedTilesZ2 = [
  {
    name: "Front Gate",
    type: "town",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 1 },
    isStartTile: true,
    connectors: { N: CONNECTOR_RULE.ANY, S: CONNECTOR_RULE.DISABLE_ON_SOLO },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 0,
    bullets: 0,
    // First tile drawn when Zombie Corps(e) is played solo.
    firstDrawWhenSolo: true,
    // Companions chain from the S side (compound interior).
    // Front Gate [N connects to map] → [S] Straight [N] → [S] 4-Way
    companionDir: "N",
    companionTiles: [
      { name: "Straight" },
      { name: "4-Way" }
    ],
    subTilesTemplate: {
      "0,0": { walkable: true, type: "parking", walls: ["W"] },
      "1,0": { walkable: true, type: "road" },
      "2,0": { walkable: true, type: "building", walls: ["E"] },
      "0,1": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,1": { walkable: true, type: "road", doors: ["S"] },
      "2,1": { walkable: true, type: "grass", walls: ["E", "S"] },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "grass" }
    }
  },
  {
    name: "Top Secret Lab",
    type: "named",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 1 },
    connectors: { S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.ENHANCED]: 6 },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,1": { walkable: true, type: "building", doors: ["S"] },
      "2,1": { walkable: true, type: "building", walls: ["E"] },
      "0,2": { walkable: true, type: "parking", walls: ["N", "S", "W"] },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
      "2,2": { walkable: true, type: "building", walls: ["E", "S", "W"] }
    }
  },
  {
    name: "Mess Hall",
    type: "named",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 1 },
    connectors: { E: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 2,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "S", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["S"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
      "0,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "1,1": { walkable: true, type: "road", walls: ["S"] },
      "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "0,2": { walkable: false },
      "1,2": { walkable: false },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Barracks",
    type: "named",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 1 },
    connectors: { N: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 1,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"], doors: ["E"] },
      "1,0": { walkable: true, type: "road" },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"], doors: ["W"] },
      "0,1": { walkable: true, type: "building", walls: ["E", "W"] },
      "1,1": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,1": { walkable: true, type: "building", walls: ["E", "W"] },
      "0,2": { walkable: true, type: "building", walls: ["S", "W"], doors: ["E"] },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "building", walls: ["E", "S"], doors: ["W"] }
    }
  },
  {
    name: "Armory",
    type: "named",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 1 },
    connectors: { S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 6 },
    hearts: 0,
    bullets: 6,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["W"] },
      "1,1": { walkable: true, type: "building", doors: ["S"] },
      "2,1": { walkable: true, type: "building", walls: ["E"] },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Motor Pool",
    type: "named",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 1 },
    connectors: { S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 8 },
    hearts: 1,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: true, type: "building", walls: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["W"] },
      "1,1": { walkable: true, type: "building", doors: ["S"], jeepDoor: true },
      "2,1": { walkable: true, type: "building", walls: ["E"] },
      "0,2": { walkable: true, type: "building", walls: ["E", "S", "W"] },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,2": { walkable: true, type: "building", walls: ["E", "S", "W"] }
    }
  },
];
