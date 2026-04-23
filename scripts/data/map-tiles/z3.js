// --- Zombies!!! 3: Mall Walkers — Named Tiles -------------------------------
const namedTilesZ3 = [
  {
    name: "Front Door",
    type: "town",
    collection: {
      [COLLECTIONS.MALL_WALKERS]: 1,
    },
    isStartTile: true,
    connectors: { N: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.DISABLE_ON_SOLO },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3, },
    hearts: 0,
    bullets: 0,
    firstDrawWhenSolo: true,
    companionDir: "N",
    companionTiles: [{ name: "4-Way (mall)" }],
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: true, type: "mall hallway" },
      "2,0": { walkable: false },
      "0,1": { walkable: false },
      "1,1": { walkable: true, type: "mall hallway", doors: ["S"] },
      "2,1": { walkable: false },
      "0,2": { walkable: true, type: "grass" },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "grass" }
    }
  },
  {
    name: "Pet Store",
    type: "named",
    collection: {
      [COLLECTIONS.MALL_WALKERS]: 1,
    },
    connectors: { E: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 1,
    },
    hearts: 1,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "mall store", walls: ["N", "S", "W"], airDucts: ["W"] },
      "1,0": { walkable: true, type: "mall store", walls: ["N"], doors: ["S"] },
      "2,0": { walkable: true, type: "mall store", walls: ["N", "E", "S"] },
      "0,1": { walkable: true, type: "mall hallway", walls: ["N", "S"] },
      "1,1": { walkable: true, type: "mall hallway" },
      "2,1": { walkable: true, type: "mall hallway", walls: ["N", "S"] },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "mall hallway", walls: ["E", "W"] },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Lingerie Shop",
    type: "named",
    collection: {
      [COLLECTIONS.MALL_WALKERS]: 1,
    },
    connectors: { E: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 1,
    },
    hearts: 0,
    bullets: 3,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "mall store", walls: ["N", "S", "W"] },
      "1,0": { walkable: true, type: "mall store", walls: ["N"], doors: ["S"] },
      "2,0": { walkable: true, type: "mall store", walls: ["N", "E", "S"], airDucts: ["N"] },
      "0,1": { walkable: true, type: "mall hallway", walls: ["N", "S"] },
      "1,1": { walkable: true, type: "mall hallway" },
      "2,1": { walkable: true, type: "mall hallway", walls: ["N", "S"] },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "mall hallway", walls: ["E", "W"] },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Outfitter",
    type: "named",
    collection: {
      [COLLECTIONS.MALL_WALKERS]: 1,
    },
    connectors: { E: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 5,
    },
    hearts: 2,
    bullets: 3,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "mall store", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "mall store", walls: ["N"], doors: ["S"] },
      "2,0": { walkable: true, type: "mall store", walls: ["N", "E", "S"] },
      "0,1": { walkable: true, type: "mall store", walls: ["W"], doors: ["E"] },
      "1,1": { walkable: true, type: "mall hallway" },
      "2,1": { walkable: true, type: "mall hallway", walls: ["S"] },
      "0,2": { walkable: true, type: "mall store", walls: ["E", "S", "W"], airDucts: ["W"] },
      "1,2": { walkable: true, type: "mall hallway", walls: ["E"] },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Music Store",
    type: "named",
    collection: {
      [COLLECTIONS.MALL_WALKERS]: 1,
    },
    connectors: { S: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 3,
    },
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "mall store", walls: ["N", "S", "W"] },
      "1,0": { walkable: true, type: "mall store", walls: ["N"], doors: ["S"] },
      "2,0": { walkable: true, type: "mall store", walls: ["N", "E"], airDucts: ["N"] },
      "0,1": { walkable: true, type: "mall hallway", walls: ["N", "S"] },
      "1,1": { walkable: true, type: "mall hallway" },
      "2,1": { walkable: true, type: "mall store", walls: ["E"], doors: ["W"] },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "mall hallway" },
      "2,2": { walkable: true, type: "mall store", walls: ["E", "S", "W"] }
    }
  },
  {
    name: "Escalator",
    type: "named",
    // S connector is floor 1 (placement side); N/E/W connectors lead to floor 2 after placement
    floor1connectors: { S: CONNECTOR_RULE.SAME },
    floor2Connectors: ["N", "E", "W"],
    collection: {
      [COLLECTIONS.MALL_WALKERS]: 1,
    },
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {},
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: true, type: "mall hallway", walls: ["E", "W"] },
      "2,0": { walkable: false },
      "0,1": { walkable: true, type: "mall hallway", walls: ["N", "S"] },
      "1,1": { walkable: true, type: "escalator" },
      "2,1": { walkable: true, type: "mall hallway", walls: ["N", "S"] },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "escalator", walls: ["E", "W"] },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Appliance Store",
    type: "named",
    collection: {
      [COLLECTIONS.MALL_WALKERS]: 1,
    },
    connectors: { S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 4,
    },
    hearts: 0,
    bullets: 3,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "mall store", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "mall store", walls: ["N", "E", "W"] },
      "2,0": { walkable: true, type: "mall store", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "mall store", walls: ["W"], airDucts: ["W"] },
      "1,1": { walkable: true, type: "mall store", doors: ["S"] },
      "2,1": { walkable: true, type: "mall store", walls: ["E"] },
      "0,2": { walkable: true, type: "mall store", walls: ["E", "S", "W"] },
      "1,2": { walkable: true, type: "mall hallway", walls: ["E", "W"] },
      "2,2": { walkable: true, type: "mall store", walls: ["E", "S", "W"] }
    }
  },
  {
    name: "Department Store",
    type: "named",
    collection: {
      [COLLECTIONS.MALL_WALKERS]: 1,
    },
    connectors: { S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 7,
    },
    hearts: 3,
    bullets: 3,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "mall store", walls: ["N", "W"], airDucts: ["N"] },
      "1,0": { walkable: true, type: "mall store", walls: ["N"] },
      "2,0": { walkable: true, type: "mall store", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "mall store", walls: ["W"] },
      "1,1": { walkable: true, type: "mall store", doors: ["S"] },
      "2,1": { walkable: true, type: "mall store", walls: ["E"] },
      "0,2": { walkable: true, type: "mall store", walls: ["E", "S", "W"] },
      "1,2": { walkable: true, type: "mall hallway", walls: ["E", "W"] },
      "2,2": { walkable: true, type: "mall store", walls: ["E", "S", "W"] }
    }
  },
  {
    name: "Food Court",
    type: "named",
    collection: {
      [COLLECTIONS.MALL_WALKERS]: 1,
    },
    connectors: { S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 6,
    },
    hearts: 3,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "mall store", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "mall store", walls: ["N"] },
      "2,0": { walkable: true, type: "mall store", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "mall store", walls: ["W"] },
      "1,1": { walkable: true, type: "mall store", doors: ["S"] },
      "2,1": { walkable: true, type: "mall store", walls: ["E"] },
      "0,2": { walkable: true, type: "mall store", walls: ["E", "S", "W"], airDucts: ["W"] },
      "1,2": { walkable: true, type: "mall hallway", walls: ["E", "W"] },
      "2,2": { walkable: true, type: "mall store", walls: ["E", "S", "W"] }
    }
  },
  {
    name: "Consignment Shop",
    type: "named",
    collection: {
      [COLLECTIONS.MALL_WALKERS]: 1,
    },
    connectors: { N: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 2,
    },
    hearts: 0,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "mall store", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "mall hallway", walls: ["E", "W"] },
      "2,0": { walkable: false },
      "0,1": { walkable: true, type: "mall store", walls: ["W"], doors: ["E"], airDucts: ["W"] },
      "1,1": { walkable: true, type: "mall hallway", walls: ["E"] },
      "2,1": { walkable: false },
      "0,2": { walkable: true, type: "mall store", walls: ["E", "S", "W"] },
      "1,2": { walkable: true, type: "mall hallway", walls: ["E", "W"] },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Costume Shop",
    type: "named",
    collection: {
      [COLLECTIONS.MALL_WALKERS]: 1,
    },
    connectors: { N: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 3,
    },
    hearts: 0,
    bullets: 2,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "mall store", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "mall hallway", walls: ["E", "W"] },
      "2,0": { walkable: false },
      "0,1": { walkable: true, type: "mall store", walls: ["W"], doors: ["E"], airDucts: ["W"] },
      "1,1": { walkable: true, type: "mall hallway", walls: ["E"] },
      "2,1": { walkable: false },
      "0,2": { walkable: true, type: "mall store", walls: ["E", "S", "W"] },
      "1,2": { walkable: true, type: "mall hallway", walls: ["E", "W"] },
      "2,2": { walkable: false }
    }
  },
    {
    name: "Game Store",
    type: "named",
    collection: {
      [COLLECTIONS.MALL_WALKERS]: 1,
    },
    connectors: { N: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.REGULAR]: 3,
    },
    hearts: 1,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "mall store", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "mall hallway", walls: ["E", "W"] },
      "2,0": { walkable: false },
      "0,1": { walkable: true, type: "mall store", walls: ["W"], doors: ["E"], airDucts: ["W"] },
      "1,1": { walkable: true, type: "mall hallway", walls: ["E"] },
      "2,1": { walkable: false },
      "0,2": { walkable: true, type: "mall store", walls: ["E", "S", "W"] },
      "1,2": { walkable: true, type: "mall hallway", walls: ["E", "W"] },
      "2,2": { walkable: false }
    }
  },
];
