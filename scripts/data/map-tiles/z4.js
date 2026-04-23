// --- Zombies!!! 4: The End… — Named Tiles -----------------------------------
// Mixed-play tile: shuffled into the base deck when playing alongside another collection.
// In solo Z4 this tile is pre-placed as the start tile instead of drawn.
const namedTilesZ4 = [
  {
    name: "Bridge",
    type: "town",
    collection: { [COLLECTIONS.THE_END]: 1 },
    isStartTile: true,
    connectors: { N: CONNECTOR_RULE.ANY, S: CONNECTOR_RULE.DISABLE_ON_SOLO },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
    "0,0": { walkable: true, type: "grass", walls: ["N", "E", "S", "W"] },
    "1,0": { walkable: true, type: "road" },
    "2,0": { walkable: true, type: "grass", walls: ["N", "E", "S", "W"] },
    "0,1": { walkable: true, type: "water", walls: ["N", "E", "S", "W"] },
    "1,1": { walkable: true, type: "road" },
    "2,1": { walkable: true, type: "water", walls: ["N", "E", "S", "W"] },
    "0,2": { walkable: true, type: "grass", walls: ["N", "E", "S", "W"] },
    "1,2": { walkable: true, type: "road" },
    "2,2": { walkable: true, type: "grass", walls: ["N", "E", "S", "W"] }
    }
  },
  {
    name: "Cabin",
    type: "named",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.DOG]: 9,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "2,0": { walkable: true, type: "wooded" },
      "0,1": { walkable: true, type: "building", walls: ["W"], doors: ["S"] },
      "1,1": { walkable: true, type: "building", walls: ["E", "S"] },
      "2,1": { walkable: true, type: "wooded" },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "wooded" }
    }
  },
  {
    name: "Altar",
    type: "named",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.DOG]: 3,
    },
    hearts: 2,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "altar" },
      "1,0": { walkable: true, type: "altar" },
      "2,0": { walkable: true, type: "grass" },
      "0,1": { walkable: true, type: "altar" },
      "1,1": { walkable: true, type: "altar" },
      "2,1": { walkable: true, type: "wooded" },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "wooded" }
    }
  },
  {
    name: "Boathouse",
    type: "named",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.DOG]: 3,
    },
    hearts: 1,
    bullets: 2,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "wooded" },
      "1,0": { walkable: true, type: "wooded" },
      "2,0": { walkable: true, type: "grass" },
      "0,1": { walkable: true, type: "building", walls: ["N", "S", "W"] },
      "1,1": { walkable: true, type: "building", walls: ["N", "S"], doors: ["E"] },
      "2,1": { walkable: true, type: "building" },
      "0,2": { walkable: true, type: "water", walls: ["N", "E", "S", "W"] },
      "1,2": { walkable: true, type: "water", walls: ["N", "E", "S", "W"] },
      "2,2": { walkable: true, type: "water", walls: ["N", "E", "S", "W"] }
    }
  },
  {
    name: "Burnt Cabin",
    type: "named",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.DOG]: 4,
    },
    hearts: 1,
    bullets: 2,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "2,0": { walkable: true, type: "grass" },
      "0,1": { walkable: true, type: "building", walls: ["S", "W"], doors: ["S"] },
      "1,1": { walkable: true, type: "building" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "grass" }
    }
  },
  {
    name: "Campground",
    type: "named",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.DOG]: 6,
    },
    hearts: 2,
    bullets: 3,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "wooded" },
      "1,0": { walkable: true, type: "grass" },
      "2,0": { walkable: true, type: "wooded" },
      "0,1": { walkable: true, type: "grass" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: true, type: "wooded" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "wooded" }
    }
  },
  {
    name: "Abandoned Cars",
    type: "named",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.DOG]: 3,
    },
    hearts: 2,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "parking" },
      "1,0": { walkable: true, type: "parking" },
      "2,0": { walkable: true, type: "parking" },
      "0,1": { walkable: true, type: "wooded" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "wooded" },
      "0,2": { walkable: true, type: "wooded" },
      "1,2": { walkable: true, type: "wooded" },
      "2,2": { walkable: true, type: "grass" }
    }
  },
  {
    name: "Shed",
    type: "named",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.DOG]: 3,
    },
    hearts: 1,
    bullets: 3,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "2,0": { walkable: true, type: "wooded" },
      "0,1": { walkable: true, type: "building", walls: ["W"], doors: ["S"] },
      "1,1": { walkable: true, type: "building", walls: ["E", "S"] },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "wooded" },
      "2,2": { walkable: true, type: "wooded" }
    }
  },
  {
    name: "Ranger Post",
    type: "named",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {},
    hearts: 3,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "E", "W"] },
      "1,0": { walkable: true, type: "grass" },
      "2,0": { walkable: true, type: "wooded" },
      "0,1": { walkable: true, type: "building", walls: ["W"], doors: ["E"] },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: true, type: "building", walls: ["E", "S", "W"] },
      "1,2": { walkable: true, type: "wooded" },
      "2,2": { walkable: true, type: "wooded" }
    }
  },
  {
    name: "Pet Cemetery",
    type: "named",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.DOG]: 3,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "grass" },
      "1,0": { walkable: true, type: "grass" },
      "2,0": { walkable: true, type: "grass" },
      "0,1": { walkable: true, type: "grass" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "grass" }
    }
  },
  {
    name: "Outhouse",
    type: "named",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.DOG]: 3,
    },
    hearts: 1,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "wooded" },
      "1,0": { walkable: true, type: "grass" },
      "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"], doors: ["W"] },
      "0,1": { walkable: true, type: "grass" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "building", walls: ["N", "E", "S"], doors: ["W"] },
      "0,2": { walkable: true, type: "wooded" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "wooded" }
    }
  },
  {
    name: "Cave",
    type: "named",
    collection: {
      [COLLECTIONS.THE_END]: 2,
    },
    connectors: {
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.DOG]: 6,
    },
    hearts: 3,
    bullets: 3,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "cave", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "cave", walls: ["N"] },
      "2,0": { walkable: true, type: "cave", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "cave", walls: ["S", "W"] },
      "1,1": { walkable: true, type: "cave", doors: ["S"] },
      "2,1": { walkable: true, type: "cave", walls: ["E", "S"] },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "grass" }
    }
  },
  {
    name: "Woods 01",
    type: "woods",
    collection: {
      [COLLECTIONS.THE_END]: 2,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.D6_ROLL,
    zombies: {
      [ZOMBIE_TYPE.DOG]: -1,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "wooded" },
      "1,0": { walkable: true, type: "wooded" },
      "2,0": { walkable: true, type: "wooded" },
      "0,1": { walkable: true, type: "grass" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "grass" }
    }
  },
  {
    name: "Woods 02",
    type: "woods",
    collection: {
      [COLLECTIONS.THE_END]: 2,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.D6_ROLL,
    zombies: {
      [ZOMBIE_TYPE.DOG]: -1,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "wooded" },
      "1,0": { walkable: true, type: "wooded" },
      "2,0": { walkable: true, type: "grass" },
      "0,1": { walkable: true, type: "wooded" },
      "1,1": { walkable: true, type: "wooded" },
      "2,1": { walkable: true, type: "wooded" },
      "0,2": { walkable: true, type: "wooded" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "wooded" }
    }
  },
  {
    name: "Woods 03",
    type: "woods",
    collection: {
      [COLLECTIONS.THE_END]: 2,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.D6_ROLL,
    zombies: {
      [ZOMBIE_TYPE.DOG]: -1,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "wooded" },
      "1,0": { walkable: true, type: "wooded" },
      "2,0": { walkable: true, type: "wooded" },
      "0,1": { walkable: true, type: "wooded" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "wooded" },
      "0,2": { walkable: true, type: "wooded" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "grass" }
    }
  },
  {
    name: "Woods 04",
    type: "woods",
    collection: {
      [COLLECTIONS.THE_END]: 2,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.D6_ROLL,
    zombies: {
      [ZOMBIE_TYPE.DOG]: -1,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "wooded" },
      "1,0": { walkable: true, type: "wooded" },
      "2,0": { walkable: true, type: "wooded" },
      "0,1": { walkable: true, type: "wooded" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "grass" }
    }
  },
  {
    name: "Woods 05",
    type: "woods",
    collection: {
      [COLLECTIONS.THE_END]: 2,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.D6_ROLL,
    zombies: {
      [ZOMBIE_TYPE.DOG]: -1,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "wooded" },
      "1,0": { walkable: true, type: "wooded" },
      "2,0": { walkable: true, type: "wooded" },
      "0,1": { walkable: true, type: "wooded" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: true, type: "wooded" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "grass" }
    }
  },
  {
    name: "Woods 06",
    type: "woods",
    collection: {
      [COLLECTIONS.THE_END]: 2,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.D6_ROLL,
    zombies: {
      [ZOMBIE_TYPE.DOG]: -1,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "wooded" },
      "1,0": { walkable: true, type: "grass" },
      "2,0": { walkable: true, type: "wooded" },
      "0,1": { walkable: true, type: "grass" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: true, type: "wooded" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "wooded" }
    }
  },
  {
    name: "Woods 07",
    type: "woods",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.D6_ROLL,
    zombies: {
      [ZOMBIE_TYPE.DOG]: -1,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "wooded" },
      "1,0": { walkable: true, type: "grass" },
      "2,0": { walkable: true, type: "grass" },
      "0,1": { walkable: true, type: "wooded" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "wooded" },
      "0,2": { walkable: true, type: "wooded" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "wooded" }
    }
  },
  {
    name: "Woods 08",
    type: "woods",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.D6_ROLL,
    zombies: {
      [ZOMBIE_TYPE.DOG]: -1,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "grass" },
      "1,0": { walkable: true, type: "grass" },
      "2,0": { walkable: true, type: "grass" },
      "0,1": { walkable: true, type: "grass" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: true, type: "wooded" },
      "1,2": { walkable: true, type: "wooded" },
      "2,2": { walkable: true, type: "grass" }
    }
  },
  {
    name: "Woods 09",
    type: "woods",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.D6_ROLL,
    zombies: {
      [ZOMBIE_TYPE.DOG]: -1,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "grass" },
      "1,0": { walkable: true, type: "grass" },
      "2,0": { walkable: true, type: "grass" },
      "0,1": { walkable: true, type: "grass" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "grass" }
    }
  },
  {
    name: "Woods 10",
    type: "woods",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.D6_ROLL,
    zombies: {
      [ZOMBIE_TYPE.DOG]: -1,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "grass" },
      "1,0": { walkable: true, type: "grass" },
      "2,0": { walkable: true, type: "grass" },
      "0,1": { walkable: true, type: "grass" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "grass" }
    }
  },
  {
    name: "Woods 11",
    type: "woods",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.D6_ROLL,
    zombies: {
      [ZOMBIE_TYPE.DOG]: -1,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "wooded" },
      "1,0": { walkable: true, type: "wooded" },
      "2,0": { walkable: true, type: "grass" },
      "0,1": { walkable: true, type: "grass" },
      "1,1": { walkable: true, type: "wooded" },
      "2,1": { walkable: true, type: "wooded" },
      "0,2": { walkable: true, type: "wooded" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "wooded" }
    }
  },
  {
    name: "Woods 12",
    type: "woods",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.D6_ROLL,
    zombies: {
      [ZOMBIE_TYPE.DOG]: -1,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "wooded" },
      "1,0": { walkable: true, type: "wooded" },
      "2,0": { walkable: true, type: "grass" },
      "0,1": { walkable: true, type: "wooded" },
      "1,1": { walkable: true, type: "wooded" },
      "2,1": { walkable: true, type: "wooded" },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "wooded" }
    }
  },
  {
    name: "Woods 13",
    type: "woods",
    collection: {
      [COLLECTIONS.THE_END]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.D6_ROLL,
    zombies: {
      [ZOMBIE_TYPE.DOG]: -1,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "wooded" },
      "1,0": { walkable: true, type: "grass" },
      "2,0": { walkable: true, type: "grass" },
      "0,1": { walkable: true, type: "grass" },
      "1,1": { walkable: true, type: "wooded" },
      "2,1": { walkable: true, type: "wooded" },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "wooded" },
      "2,2": { walkable: true, type: "wooded" }
    }
  },
];
