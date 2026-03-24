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
//   enabled        {false}               Omit to include; set false to exclude without deleting
//   connectors     {string[]}            Road exits: "N" | "E" | "S" | "W"
//   zombieSpawnMode {string}             "by_card"  — spawns zombies per the zombies object when placed
//                                        "by_exits" — spawns one zombie per connector (type from zombies key)
//   zombies        {object}              { [ZOMBIE_TYPE.*]: count } — type-to-count map
//                                        by_card: total spawned per type; by_exits: type only (1 per exit)
//                                        e.g. zombies: { [ZOMBIE_TYPE.REGULAR]: 3 }
//                                             zombies: { [ZOMBIE_TYPE.ENHANCED]: 6 }
//                                             zombies: { [ZOMBIE_TYPE.REGULAR]: 2, [ZOMBIE_TYPE.ENHANCED]: 1 }
//   zombieType     {ZOMBIE_TYPE.*}       Type of zombie spawned for by_exits (default: REGULAR)
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
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 4, [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    connectors: ["N", "S"],
    zombieSpawnMode: "by_exits",
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
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 4, [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    connectors: ["N", "E"],
    zombieSpawnMode: "by_exits",
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
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 4, [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    connectors: ["N", "E", "W"],
    zombieSpawnMode: "by_exits",
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
    enabled: true,
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: "by_exits",
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
  // 4-way (Parking Lot)
  {
    name: "Parking Lot",
    type: "road",
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: ["N", "S", "E", "W"],
    zombieSpawnMode: "by_exits",
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
    name: "Army Surplus",
    type: "named",
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: ["E", "W"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: ["E", "S", "W"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: ["S"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: ["S"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: ["E", "W"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: ["S", "W"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: ["E", "S"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: ["E", "S", "W"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: ["E", "S", "W"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: ["S"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: ["S"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    connectors: ["E", "S"],
    zombieSpawnMode: "by_card",
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
    connectors: ["N", "S"],
    zombieSpawnMode: "by_card",
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 0,
    bullets: 0,
    // First tile drawn when Zombie Corps(e) is played solo.
    firstDrawWhenSolo: true,
    // Companions chain from the S side (compound interior).
    // Front Gate [N connects to map] → [S] Straight [N] → [S] 4-Way
    companionDir: "S",
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
    enabled: true,
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 1 },
    connectors: ["S"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 1 },
    connectors: ["E", "W"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 1 },
    connectors: ["N", "S"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 1 },
    connectors: ["S"],
    zombieSpawnMode: "by_card",
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
    enabled: true,
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 1 },
    connectors: ["S"],
    zombieSpawnMode: "by_card",
    zombies: { [ZOMBIE_TYPE.REGULAR]: 8 },
    hearts: 1,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: false },
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

  // --- Iowa City (custom expansion) ----------------------------------------
  {
    name: "The Deadwood",
    type: "named",
    enabled: false,
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["S", "W"],
    zombieSpawnMode: "by_card",
    zombies: { [ZOMBIE_TYPE.REGULAR]: 4 },
    hearts: 2,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "building", walls: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["W"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "building", walls: ["E", "S"] },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"], doors: ["S"] },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Hamburg Inn",
    type: "named",
    enabled: false,
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["N", "W"],
    zombieSpawnMode: "by_card",
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 3,
    bullets: 0,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "building", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "road", walls: ["E", "W"], doors: ["N"] },
      "2,0": { walkable: true, type: "building", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "road", walls: ["S"], doors: ["W"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "building", walls: ["E"] },
      "0,2": { walkable: true, type: "building", walls: ["S", "W"] },
      "1,2": { walkable: true, type: "building", walls: ["S"] },
      "2,2": { walkable: true, type: "building", walls: ["E", "S"] }
    }
  },
  {
    name: "Ped Mall",
    type: "named",
    enabled: false,
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: "by_card",
    zombies: { [ZOMBIE_TYPE.REGULAR]: 5 },
    hearts: 2,
    bullets: 2,
    subTilesTemplate: {
      "0,0": { walkable: true, type: "grass", walls: ["N", "W"] },
      "1,0": { walkable: true, type: "road", doors: ["N"] },
      "2,0": { walkable: true, type: "grass", walls: ["N", "E"] },
      "0,1": { walkable: true, type: "road", doors: ["W"] },
      "1,1": { walkable: true, type: "road" },
      "2,1": { walkable: true, type: "road", doors: ["E"] },
      "0,2": { walkable: true, type: "grass", walls: ["S", "W"] },
      "1,2": { walkable: true, type: "road", doors: ["S"] },
      "2,2": { walkable: true, type: "grass", walls: ["E", "S"] }
    }
  },
  {
    name: "Old Capitol",
    type: "named",
    enabled: false,
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: "by_card",
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
    enabled: false,
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["N", "S"],
    zombieSpawnMode: "by_card",
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
    enabled: false,
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["N", "E"],
    zombieSpawnMode: "by_card",
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
    enabled: false,
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["N", "S"],
    zombieSpawnMode: "by_card",
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
  },
  {
    name: "City Park",
    type: "named",
    enabled: false,
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: "by_card",
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
    enabled: false,
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["S", "E"],
    zombieSpawnMode: "by_card",
    zombies: { [ZOMBIE_TYPE.REGULAR]: 3 },
    hearts: 1,
    bullets: 1,
    subTilesTemplate: {
      "0,0": { walkable: false },
      "1,0": { walkable: false },
      "2,0": { walkable: false },
      "0,1": { walkable: false },
      "1,1": { walkable: true, type: "building", walls: ["N", "W"] },
      "2,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["E"] },
      "0,2": { walkable: false },
      "1,2": { walkable: true, type: "road", walls: ["E", "W"], doors: ["S"] },
      "2,2": { walkable: false }
    }
  },
  {
    name: "Prairie Lights",
    type: "named",
    enabled: false,
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["N", "E"],
    zombieSpawnMode: "by_card",
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
  },
  {
    name: "FilmScene",
    type: "named",
    enabled: false,
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["S", "W"],
    zombieSpawnMode: "by_card",
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
    enabled: false,
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["N", "S"],
    zombieSpawnMode: "by_card",
    zombies: { [ZOMBIE_TYPE.REGULAR]: 9 },
    hearts: 5,
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
  {
    name: "IMU",
    type: "named",
    enabled: false,
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["E", "W"],
    zombieSpawnMode: "by_card",
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
    enabled: false,
    collection: { [COLLECTIONS.IOWA_CITY]: 1 },
    connectors: ["N", "E", "S"],
    zombieSpawnMode: "by_card",
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
  }
];

// --- Special Tiles ----------------------------------------------------------
// One-of tiles with unique game rules (isWinTile, isStartTile).
// Win tiles are shuffled into the back half of the deck automatically.
const specialTiles = [
  {
    name: "Helipad",
    type: "helipad",
    enabled: true,
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1, [COLLECTIONS.ZOMBIE_CORPS_E_]: 1 },
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: "by_card",
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

// --- Start Tiles ------------------------------------------------------------
// Not shuffled into the deck — placed at (0,0) at game start.
// Each standalone collection must have exactly one entry here.
const START_TILES = [
  {
    name: "Town Square",
    type: "town",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1, [COLLECTIONS.ZOMBIE_CORPS_E_]: 1 },
    isStartTile: true,
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: "by_card",
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
  }
];
