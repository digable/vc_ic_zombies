// --- Iowa City (custom expansion) — Named Tiles -----------------------------
const namedTilesIC = [
  {
    name: "Ped Mall",
    type: "town",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    isStartTile: true,
    connectors: { N: CONNECTOR_RULE.DISABLE_ON_SOLO, E: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "grass", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "road" },
      "2,0": { walkable: true, type: "grass", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "road" },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "road" },
      "0,2": { walkable: true, type: "grass", walls: ["S", "W"] },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "grass", walls: ["E", "S"] }
    }
  },
  {
    name: "The Deadwood",
    type: "named",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: { N: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 4 },
    hearts: 2,
    bullets: 2,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", doors: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,1": { walkable: true, type: "building", doors: ["S"] },
      "2,1": { walkable: true, type: "building", walls: ["E", "S"] },
      "0,2": { walkable: true, type: "road" },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "road" }
  }
  },
  {
    name: "Hamburg Inn",
    type: "named",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: { S: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 3,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["S"], doors: ["W"] },
      "1,1": { walkable: true, type: "building", walls: ["S"] },
      "2,1": { walkable: true, type: "building", walls: ["E"], doors: ["S"] },
      "0,2": { walkable: true, type: "road" },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "road" }
    }
  },
  {
    name: "College Street",
    type: "town",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: { N: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 2 },
    hearts: 0,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "road" },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["W"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "building", walls: ["E"] },
      "0,2": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "building", walls: ["S", "E"] }
    }
  },
  /*{
    name: "Old Capitol",
    type: "named",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 6 },
    hearts: 1,
    bullets: 3,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "road", doors: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "road", doors: ["W"] },
      "1,1": { walkable: true, type: "building" },
      "2,1": { walkable: true, type: "road", doors: ["E"] },
      "0,2": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,2": { walkable: true, type: "road", doors: ["S"] },
      "2,2": { walkable: true, type: "building", walls: ["E", "S"] }
    }
  },
  {
    name: "Kinnick Stadium",
    type: "named",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: { N: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 10 },
    hearts: 3,
    bullets: 4,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["W"], doors: ["E"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "building", walls: ["E"], doors: ["W"] },
      "0,2": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"], doors: ["S"] },
      "2,2": { walkable: true, type: "building", walls: ["E", "S"] }
    }
  },
  {
    name: "Main Library",
    type: "named",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["N", "E"],
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 4 },
    hearts: 2,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,1": { walkable: true, type: "road", walls: ["S"] },
      "2,1": { walkable: true, type: "road", walls: ["S"], doors: ["E"] },
      "0,2": { walkable: false },
      "1,2": { walkable: false },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Oakland Cemetery",
    type: "named",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: { N: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 8 },
    hearts: 1,
    bullets: 2,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["W"], doors: ["E"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "building", walls: ["E"], doors: ["W"] },
      "0,2": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"], doors: ["S"] },
      "2,2": { walkable: true, type: "building", walls: ["E", "S"] }
    }
  },*/
  {
    name: "City Park",
    type: "named",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: { N: CONNECTOR_RULE.SAME, E: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 2,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "grass" },
      "1,0": { walkable: true, type: "grass" },
      "2,0": { walkable: true, type: "grass" },
      "0,1": { walkable: true, type: "grass" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: true, type: "parking" },
      "1,2": { walkable: true, type: "parking" },
      "2,2": { walkable: true, type: "parking" }
    }
  },
  {
    name: "Sanctuary",
    type: "named",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: { S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 1,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "E", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["S", "W"], doors: ["E"] },
      "1,1": { walkable: true, type: "building", walls: ["S"] },
      "2,1": { walkable: true, type: "building", walls: ["E"], doors: ["S"] },
      "0,2": { walkable: true, type: "road" },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "road" }
  }
  },
  /*{
    name: "Prairie Lights",
    type: "named",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["N", "E"],
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 2 },
    hearts: 0,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
      "2,0": { walkable: false },
      "0,1": { walkable: false },
      "1,1": { walkable: true, type: "road", walls: ["S", "W"] },
      "2,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["E"] },
      "0,2": { walkable: false },
      "1,2": { walkable: false },
      "2,2": { walkable: false }
    }
  },*/
  {
    name: "FilmScene",
    type: "named",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: { S: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 1,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E", "W"] },
      "0,1": { walkable: true, type: "grass", walls: ["N"], doors: ["W"] },
      "1,1": { walkable: true, type: "building" },
      "2,1": { walkable: true, walls: ["E"] },
      "0,2": { walkable: true, type: "parking" },
      "1,2": { walkable: true, type: "parking", walls: ["E", "W"] },
      "2,2": { walkable: true, type: "building", walls: ["E", "S", "W"] }
    }
  },
  {
    name: "UIHC",
    type: "named",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: { N: CONNECTOR_RULE.ONLY, E: CONNECTOR_RULE.ONLY, W: CONNECTOR_RULE.ONLY, S: CONNECTOR_RULE.SAME },
    connectorOnlyTarget: { N: TILE_NAME.HELIPAD_DESIGNATED, E: TILE_NAME.HELIPAD_DESIGNATED, W: TILE_NAME.HELIPAD_DESIGNATED },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 9 },
    hearts: 6,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["W"] },
      "1,1": { walkable: true, type: "building", doors: ["S"] },
      "2,1": { walkable: true, type: "building", walls: ["E"] },
      "0,2": { walkable: true, type: "building", walls: ["E", "S", "W"] },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"], doors: ["S"] },
      "2,2": { walkable: true, type: "building", walls: ["E", "S", "W"] }
    }
  },
  /*{
    name: "IMU",
    type: "named",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: { E: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 4 },
    hearts: 2,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "S", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["S"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
      "0,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["W"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["E"] },
      "0,2": { walkable: false },
      "1,2": { walkable: false },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Hy-Vee",
    type: "named",
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["N", "E", "S"],
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 5 },
    hearts: 4,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "road", walls: ["S"], doors: ["E"] },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"], doors: ["S"] },
      "2,2": { walkable: false }
    }
  }*/
];
