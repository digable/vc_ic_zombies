// ---------------------------------------------------------------------------
// Map tile data
// ---------------------------------------------------------------------------
// This file contains only tile definition arrays. Build logic lives in map-deck.js.
//
// Tile properties:
//   name           {string}              Display name (referenced by event cards via requiresTile)
//   type           {string}              "road" | "named" | "helipad" | "special"
//   collection     {object}              Preferred form — keys are COLLECTIONS.*, values are copy counts
//                                        e.g. collection: { [COLLECTIONS.DIRECTORS_CUT]: 4 }
//                                        Tile included when ANY of its collections is enabled.
//                                        Copies = sum of counts for all enabled collections.
//   collection     {string|string[]}     Legacy form — still supported alongside integer count below.
//   count          {number}              Legacy — copies in deck. Omit when using object collection.
//   connectors     {string[]}            Road exits: "N" | "E" | "S" | "W"
//   zombieSpawnMode {string}             "by_card"  — spawns zombies per the zombies object when placed
//                                        "by_exits" — spawns one zombie per connector (type from zombies key)
//   zombies        {object}              { [ZOMBIE_TYPE.*]: count } — type-to-count map
//                                        by_card: total spawned per type; by_exits: type only (1 per exit)
//                                        e.g. zombies: { [ZOMBIE_TYPE.REGULAR]: 3 }
//                                             zombies: { [ZOMBIE_TYPE.ENHANCED]: 6 }
//                                             zombies: { [ZOMBIE_TYPE.REGULAR]: 2, [ZOMBIE_TYPE.ENHANCED]: 1 }
//   hearts         {number}              Heart tokens placed on tile when drawn
//   bullets        {number}              Bullet tokens placed on tile when drawn
//   isStartTile    {true}                Placed at (0,0) to start the game; one per standalone collection
//   isWinTile      {true}                Shuffled into back half of deck; reaching its center wins the game
//   firstDrawWhenSolo {true}             Moved to position 0 in the deck when its collection is the ONLY
//                                        enabled collection. Ignored in mixed-collection games.
//
// Companion tile system — tiles that auto-place alongside another when it is drawn/placed:
//   companionTiles {Array}               List of tiles to pull from the deck and auto-place when this tile is
//                                        drawn. Each entry: { name: "TileName" }. Tiles chain in a line.
//                                        e.g. companionTiles: [{ name: "Straight" }, { name: "4-Way" }]
//   companionDir   {string}              Which connector side the companions chain from, in the tile's UNROTATED
//                                        orientation. Default "S". The opposite side is assumed to be the
//                                        map-connection side (N for "S", W for "E", etc.).
//                                        The engine auto-detects if the tile is placed reversed and flips
//                                        the chain direction accordingly.
//   connectorOnlyTarget  {object}        Parallel to connectors — maps direction to tile name for
//                                        CONNECTOR_RULE.ONLY connectors. e.g. { S: "Helipad" }
//                                        means the S connector only accepts the tile named "Helipad".
//
// subTilesTemplate — 3×3 movement grid, keyed by "lx,ly" (0–2 each axis):
//   walkable  {bool}      true = players/zombies can enter; false = solid (walls, grass)
//   type      {string}    "road" | "building" | "parking" | "grass" | ...
//   walls     {string[]}  Directions always closed ("N"|"E"|"S"|"W")
//   doors     {string[]}  Directions always open (overrides connector checks)
//
// Subtile grid layout (lx = column left→right, ly = row top→bottom):
//   (0,0) (1,0) (2,0)
//   (0,1) (1,1) (2,1)   ← (1,1) is the tile centre
//   (0,2) (1,2) (2,2)
//
// Road tiles only need to define walkable subtiles — non-walkable ones default to { walkable: false }.
// ---------------------------------------------------------------------------

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
  // 4-way (Parking Lot)
  {
    name: "Parking Lot",
    type: "road",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
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

// --- Named Tiles ------------------------------------------------------------
// Buildings with loot (hearts/bullets) and a fixed zombie count on placement.
// Each named tile is referenced by name in event card requiresTile fields.
const namedTiles = [
  // --- Zombies!!! (Director's Cut) -----------------------------------------
  {
    name: "Town Square",
    type: "town",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    isStartTile: true,
    connectors: { N: CONNECTOR_RULE.SAME, E: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    hearts: 0,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "grass", walls: ["N", "E", "S", "W"] },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,0": { walkable: true, type: "grass", walls: ["N", "E", "S", "W"] },
      "0,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "0,2": { walkable: true, type: "grass", walls: ["N", "E", "S", "W"] },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,2": { walkable: true, type: "grass", walls: ["N", "E", "S", "W"] }
    }
  },
  {
    name: "Army Surplus",
    type: "named",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: { E: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 2 },
    hearts: 0,
    bullets: 2,
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
    name: "Gas Station",
    type: "named",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: { E: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 1,
    bullets: 2,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "S", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["S"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
      "0,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Police Station",
    type: "named",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: { S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 6 },
    hearts: 2,
    bullets: 4,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "building", walls: ["S", "W"], doors: ["W"] },
      "1,1": { walkable: true, type: "building" },
      "2,1": { walkable: true, type: "building", walls: ["E", "S"] },
      "0,2": { walkable: true, type: "parking", walls: ["N"] },
      "1,2": { walkable: true, type: "road" },
      "2,2": { walkable: true, type: "parking", walls: ["N"] }
    }
  },
  {
    name: "Hospital",
    type: "named",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: { S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 8 },
    hearts: 4,
    bullets: 0,
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
    name: "Drug Store",
    type: "named",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: { E: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 3,
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
    name: "Fire Station",
    type: "named",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: { S: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 6 },
    hearts: 4,
    bullets: 2,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "S", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "road", walls: ["N"], doors: ["W"] },
      "1,1": { walkable: true, type: "road", walls: ["E"] },
      "2,1": { walkable: true, type: "building", walls: ["E", "W"] },
      "0,2": { walkable: true, type: "parking" },
      "1,2": { walkable: true, type: "road", walls: ["E"] },
      "2,2": { walkable: true, type: "building", walls: ["E", "S", "W"] }
    }
  },
  {
    name: "Toy Store",
    type: "named",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: { E: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 1,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N", "S"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
      "0,1": { walkable: true, type: "building", walls: ["W"], doors: ["E"] },
      "1,1": { walkable: true, type: "road", walls: ["N"] },
      "2,1": { walkable: true, type: "road", walls: ["N"] },
      "0,2": { walkable: true, type: "building", walls: ["E", "S", "W"] },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Skate Shop",
    type: "named",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: { E: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 0,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "S", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["S"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
      "0,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Florist",
    type: "named",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: { E: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME, W: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 1,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "S", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["S"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E", "S"] },
      "0,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "road", walls: ["N", "S"] },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"] },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Sporting Goods Store",
    type: "named",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: { S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 6 },
    hearts: 2,
    bullets: 4,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"], doors: ["N"] },
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
    name: "Lawn & Garden Store",
    type: "named",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: { S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 6 },
    hearts: 2,
    bullets: 3,
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
    name: "Hardware Store",
    type: "named",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: { E: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.SAME },
    zombieSpawnMode: ZOMBIE_SPAWN_MODE.BY_CARD,
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 1,
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
      "2,2": { walkable: false },
    }
  },

  // --- Zombies!!! 2: Zombie Corps(e) ---------------------------------------
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

  // --- Zombies!!! 3: Mall Walkers ---------------------------------------
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

  // --- Zombies!!! 4: The End... ------------------------------------------
  // Mixed-play tile: shuffled into the base deck when playing alongside another collection.
  // In solo Z4 this tile is pre-placed as the start tile instead of drawn.
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
  // --- Iowa City (custom expansion) ----------------------------------------
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
    connectors: { N: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.ONLY },
    connectorOnlyTarget: { S: TILE_NAME.HELIPAD },
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

// --- Special Tiles ----------------------------------------------------------
// One-of tiles with unique game rules (isWinTile, isStartTile).
// Win tiles are shuffled into the back half of the deck automatically.
const specialTiles = [
  {
    name: "Helipad",
    type: "helipad",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1, [COLLECTIONS.ZOMBIE_CORPS_E_]: 1, [COLLECTIONS.MALL_WALKERS]: 1, [COLLECTIONS.IOWA_CITY]: 1 },
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
  }
];
