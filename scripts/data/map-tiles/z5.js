// --- Zombies!!! 5: School's Out Forever! — Named Tiles ----------------------
const namedTilesZ5 = [
  {
    name: "School Entrance",
    type: "town",
    collection: {
      [COLLECTIONS.SCHOOLS_OUT_FOREVER]: 1,
    },
    isStartTile: true,
    connectors: {
      N: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.DISABLE_ON_SOLO
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 3,
    },
    hearts: 0,
    bullets: 0,
    firstDrawWhenSolo: true,
    companionDir: "N",
    companionTiles: [{ name: "4-Way (school)" }],
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: true, type: "mall hallway", doors: ["S"] },
      "2,0": { walkable: false },
      "0,1": { walkable: true, type: "grass" },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "grass" }
    }
  },
  {
    name: "Hospital",
    type: "named",
    collection: { [COLLECTIONS.SCHOOLS_OUT_FOREVER]: 1 },
    connectors: { S: CONNECTOR_RULE.SAME, N: CONNECTOR_RULE.ONLY },
    connectorOnlyTarget: { N: TILE_NAME.HELIPAD_DESIGNATED },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 8 },
    hearts: 4,
    bullets: 4,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["W"] },
      "1,1": { walkable: true, type: "building", doors: ["S"] },
      "2,1": { walkable: true, type: "building", walls: ["E"] },
      "0,2": { walkable: true, type: "building", walls: ["E", "S", "W"] },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,2": { walkable: true, type: "building", walls: ["E", "S", "W"] }
    }
  },
  {
    name: "Science Center",
    type: "named",
    collection: {
      [COLLECTIONS.SCHOOLS_OUT_FOREVER]: 1,
    },
    connectors: {
      S: CONNECTOR_RULE.SAME,
      N: CONNECTOR_RULE.ONLY,
    },
    connectorOnlyTarget: { N: TILE_NAME.HELIPAD_DESIGNATED },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 6,
    },
    hearts: 3,
    bullets: 2,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,1": { walkable: true, type: "building", doors: ["S"] },
      "2,1": { walkable: true, type: "building", walls: ["E", "S"] },
      "0,2": { walkable: true, type: "grass", walls: ["N"] },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "grass", walls: ["N"] }
    }
  },
  {
    name: "Dormatory",
    type: "named",
    collection: {
      [COLLECTIONS.SCHOOLS_OUT_FOREVER]: 1,
    },
    connectors: {
      S: CONNECTOR_RULE.SAME,
      N: CONNECTOR_RULE.ONLY,
    },
    connectorOnlyTarget: { N: TILE_NAME.HELIPAD_DESIGNATED },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 6,
    },
    hearts: 1,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,1": { walkable: true, type: "building", doors: ["S"] },
      "2,1": { walkable: true, type: "building", walls: ["E", "S"] },
      "0,2": { walkable: true, type: "grass", walls: ["N"] },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "grass", walls: ["N"] }
    }
  },
  {
    name: "Medical School",
    type: "named",
    collection: {
      [COLLECTIONS.SCHOOLS_OUT_FOREVER]: 1,
    },
    connectors: {
      S: CONNECTOR_RULE.SAME,
      N: CONNECTOR_RULE.ONLY,
    },
    connectorOnlyTarget: { N: TILE_NAME.HELIPAD_DESIGNATED },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 6,
    },
    hearts: 5,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,1": { walkable: true, type: "building", doors: ["S"] },
      "2,1": { walkable: true, type: "building", walls: ["E", "S"] },
      "0,2": { walkable: true, type: "grass", walls: ["N"] },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "grass", walls: ["N"] }
    }
  },
  {
    name: "Admin Bldg.",
    type: "named",
    collection: {
      [COLLECTIONS.SCHOOLS_OUT_FOREVER]: 1,
    },
    connectors: {
      S: CONNECTOR_RULE.SAME,
      N: CONNECTOR_RULE.ONLY,
    },
    connectorOnlyTarget: { N: TILE_NAME.HELIPAD_DESIGNATED },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 6,
    },
    hearts: 1,
    bullets: 3,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,1": { walkable: true, type: "building", doors: ["S"] },
      "2,1": { walkable: true, type: "building", walls: ["E", "S"] },
      "0,2": { walkable: true, type: "grass", walls: ["N"] },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "grass", walls: ["N"] }
    }
  },
  {
    name: "Phys Ed Bidg.",
    type: "named",
    collection: {
      [COLLECTIONS.SCHOOLS_OUT_FOREVER]: 1,
    },
    connectors: {
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      N: CONNECTOR_RULE.ONLY,
    },
    connectorOnlyTarget: { N: TILE_NAME.HELIPAD_DESIGNATED },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 5,
    },
    hearts: 2,
    bullets: 2,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["S"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
      "0,1": { walkable: true, type: "building", walls: ["W"], doors: ["E"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "0,2": { walkable: true, type: "building", walls: ["E", "S", "W"] },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Rec Hall",
    type: "named",
    collection: {
      [COLLECTIONS.SCHOOLS_OUT_FOREVER]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.ONLY,
    },
    connectorOnlyTarget: { W: TILE_NAME.HELIPAD_DESIGNATED },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 3,
    },
    hearts: 1,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,0": { walkable: false },
      "0,1": { walkable: true, type: "building", walls: ["W"], doors: ["E"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "grass", walls: ["N"] },
      "0,2": { walkable: true, type: "building", walls: ["E", "S", "W"] },
      "1,2": { walkable: true, type: "road", walls: ["W"] },
      "2,2": { walkable: true, type: "grass" }
    }
  },
];
