// --- Special Tiles ----------------------------------------------------------
// One-of tiles with unique game rules (isWinTile, isStartTile).
// Win tiles are shuffled into the back half of the deck automatically.
const specialTiles = [
  {
    name: "Helipad",
    type: "helipad",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1, [COLLECTIONS.ZOMBIE_CORPS_E_]: 1, [COLLECTIONS.MALL_WALKERS]: 1 },
    connectors: { N: CONNECTOR_RULE.SAME, E: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 9 },
    hearts: 0,
    bullets: 0,
    isWinTile: true,
    subTilesTemplate: {
      "0,0": { walkable: true },
      "1,0": { walkable: true },
      "2,0": { walkable: true },
      "0,1": { walkable: true },
      "1,1": { walkable: true },
      "2,1": { walkable: true },
      "0,2": { walkable: true },
      "1,2": { walkable: true },
      "2,2": { walkable: true }
    }
  },
  {
    name: "Helipad (designated)",
    type: "helipad",
    collection: { [COLLECTIONS.SCHOOLS_OUT_FOREVER]: 1, [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: { N: CONNECTOR_RULE.DESIGNATED, E: CONNECTOR_RULE.DESIGNATED, S: CONNECTOR_RULE.DESIGNATED, W: CONNECTOR_RULE.DESIGNATED },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 9 },
    hearts: 0,
    bullets: 0,
    isWinTile: true,
    subTilesTemplate: {
      "0,0": { walkable: true },
      "1,0": { walkable: true },
      "2,0": { walkable: true },
      "0,1": { walkable: true },
      "1,1": { walkable: true },
      "2,1": { walkable: true },
      "0,2": { walkable: true },
      "1,2": { walkable: true },
      "2,2": { walkable: true }
    }
  }
];
