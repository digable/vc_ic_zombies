// --- Zombies!!! 7: Send in the Clowns — Named Tiles -------------------------
const namedTilesZ7 = [
   {
    name: "Ticket Booth",
    type: "named",
    collection: {
      [COLLECTIONS.SEND_IN_THE_CLOWNS]: 1,
    },
    isStartTile: true,
    connectors: {
      N: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.DISABLE_ON_SOLO
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.CLOWN]: 2,
    },
    hearts: 0,
    bullets: 0,
    firstDrawWhenSolo: true,
    companionDir: "N",
    companionTiles: [{ name: "4-Way (clowns)" }],
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: true, type: "grass", doors: ["S"] },
      "2,0": { walkable: false },
      "0,1": { walkable: false },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: false },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Big Top 1",
    type: "named",
    collection: {
      [COLLECTIONS.SEND_IN_THE_CLOWNS]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.ONLY,
      S: CONNECTOR_RULE.SAME
    },
    connectorOnlyTarget: { N: TILE_NAME.BIG_TOP_2 },
    companionDir: "N",
    companionTiles: [{ name: "Big Top 2", rotationOffset: 2 }],
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.CLOWN]: 2,
    },
    hearts: 2,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "grass", walls: ["S"] },
      "1,0": { walkable: true, type: "grass", doors: ["S"] },
      "2,0": { walkable: true, type: "grass", walls: ["S"] },
      "0,1": { walkable: false },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: false },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Big Top 2",
    type: "named",
    companionOnly: true,
    collection: {
      [COLLECTIONS.SEND_IN_THE_CLOWNS]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.ONLY,
      S: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.CLOWN]: 2,
    },
    hearts: 1,
    bullets: 2,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "grass", walls: ["S"] },
      "1,0": { walkable: true, type: "grass", doors: ["S"] },
      "2,0": { walkable: true, type: "grass", walls: ["S"] },
      "0,1": { walkable: false },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: false },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Fun House 1",
    type: "named",
    collection: {
      [COLLECTIONS.SEND_IN_THE_CLOWNS]: 1,
    },
    funhouse: true,
    funhouseSetupRotation: 3,
    connectors: {
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {},
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: false },
      "2,0": { walkable: false },
      "0,1": { walkable: true, type: "building" },
      "1,1": { walkable: true, type: "building" },
      "2,1": { walkable: false },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "building" },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Fun House 2",
    type: "named",
    collection: {
      [COLLECTIONS.SEND_IN_THE_CLOWNS]: 1,
    },
    funhouse: true,
    funhouseSetupRotation: 2,
    connectors: {
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {},
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: false },
      "2,0": { walkable: false },
      "0,1": { walkable: true, type: "building" },
      "1,1": { walkable: true, type: "building" },
      "2,1": { walkable: false },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "building" },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Fun House 3",
    type: "named",
    collection: {
      [COLLECTIONS.SEND_IN_THE_CLOWNS]: 1,
    },
    funhouse: true,
    funhouseSetupRotation: 3,
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {},
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: true, type: "building" },
      "2,0": { walkable: false },
      "0,1": { walkable: false },
      "1,1": { walkable: true, type: "building" },
      "2,1": { walkable: true, type: "building" },
      "0,2": { walkable: false },
      "1,2": { walkable: false },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Fun House 4",
    type: "named",
    collection: {
      [COLLECTIONS.SEND_IN_THE_CLOWNS]: 1,
    },
    funhouse: true,
    funhouseSetupRotation: 2,
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {},
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: true, type: "building" },
      "2,0": { walkable: false },
      "0,1": { walkable: false },
      "1,1": { walkable: true, type: "building" },
      "2,1": { walkable: true, type: "building" },
      "0,2": { walkable: false },
      "1,2": { walkable: false },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Fortune Teller",
    type: "named",
    collection: {
      [COLLECTIONS.SEND_IN_THE_CLOWNS]: 1,
    },
    connectors: {
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.CLOWN]: 2,
    },
    hearts: 2,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building" },
      "1,0": { walkable: true, type: "building" },
      "2,0": { walkable: true, type: "building" },
      "0,1": { walkable: true, type: "grass" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Ferris Wheel",
    type: "named",
    collection: {
      [COLLECTIONS.SEND_IN_THE_CLOWNS]: 1,
    },
    connectors: {
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.CLOWN]: 2,
    },
    hearts: 1,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building" },
      "1,0": { walkable: true, type: "building" },
      "2,0": { walkable: true, type: "building" },
      "0,1": { walkable: true, type: "grass" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "grass" },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Freak Show",
    type: "named",
    collection: {
      [COLLECTIONS.SEND_IN_THE_CLOWNS]: 1,
    },
    connectors: {
      S: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.CLOWN]: 2,
    },
    hearts: 2,
    bullets: 2,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,1": { walkable: true, type: "building", doors: ["S"] },
      "2,1": { walkable: true, type: "building", walls: ["E", "S"] },
      "0,2": { walkable: true, type: "grass", walls: ["N"] },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "grass", walls: ["N"] }
    }
  },
  {
    name: "Midway Games",
    type: "named",
    collection: {
      [COLLECTIONS.SEND_IN_THE_CLOWNS]: 1,
    },
    connectors: {
      N: CONNECTOR_RULE.SAME,
      E: CONNECTOR_RULE.SAME,
      S: CONNECTOR_RULE.SAME,
      W: CONNECTOR_RULE.SAME
    },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: {
      [ZOMBIE_TYPE.CLOWN]: 9,
    },
    hearts: 2,
    bullets: 2,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "grass" },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building" },
      "1,1": { walkable: true, type: "grass" },
      "2,1": { walkable: true, type: "building" },
      "0,2": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,2": { walkable: true, type: "grass" },
      "2,2": { walkable: true, type: "building", walls: ["E", "S"] }
    }
  }
];
