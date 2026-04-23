// --- Zombies!!! 6: Six Feet Under — Named Tiles -----------------------------
const namedTilesZ6 = [
  {
    name: "Subway Station",
    type: "named",
    collection: {
      [COLLECTIONS.SIX_FEET_UNDER]: 6,
    },
    connectors: {
      E: CONNECTOR_RULE.ANY,
      S: CONNECTOR_RULE.ANY,
      W: CONNECTOR_RULE.ANY
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 2,
    },
    hearts: 1,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "S", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["S"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
      "0,1": { walkable: true, type: "road" },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "road" },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Record Store",
    type: "named",
    collection: {
      [COLLECTIONS.SIX_FEET_UNDER]: 2,
    },
    connectors: {
      E: CONNECTOR_RULE.ANY,
      S: CONNECTOR_RULE.ANY
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 4,
    },
    hearts: 2,
    bullets: 3,
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
    name: "Bank",
    type: "named",
    collection: {
      [COLLECTIONS.SIX_FEET_UNDER]: 2,
    },
    connectors: {
      S: CONNECTOR_RULE.ANY
    },
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
      "0,2": { walkable: true, type: "parking", walls: ["N"] },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "parking", walls: ["N"] }
    }
  },
  {
    name: "Liquor Store",
    type: "named",
    collection: {
      [COLLECTIONS.SIX_FEET_UNDER]: 2,
    },
    connectors: {
      E: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 3,
    },
    hearts: 2,
    bullets: 1,
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
];
