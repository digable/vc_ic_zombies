// ---------------------------------------------------------------------------
// Map tile definitions
// ---------------------------------------------------------------------------
// Tiles are split into three arrays inside buildMapDeck:
//   roadTiles   — pure road/intersection tiles, no loot or named buildings
//   namedTiles  — named buildings with loot; these are the main event targets
//   specialTiles — one-of tiles (Helipad, etc.) with special game rules
//
// Tile properties:
//   name           {string}              Display name (referenced by event cards via requiresTile)
//   type           {string}              "road" | "named" | "helipad" | "special"
//   count          {number}              Copies shuffled into the deck
//   enabled        {false}               Omit to include; set false to exclude without deleting
//   collection     {COLLECTIONS.*}  Which game set this belongs to
//   connectors     {string[]}            Road exits: "N" | "E" | "S" | "W"
//                                        Placement requires adjacent connector alignment
//   zombieSpawnMode {string}             "by_card"  — spawns zombieCount zombies when placed
//                                        "by_exits" — spawns one zombie per connector
//   zombieCount    {number}              Zombies spawned on placement (by_card mode only)
//   hearts         {number}              Heart tokens placed on tile when drawn
//   bullets        {number}              Bullet tokens placed on tile when drawn
//   isStartTile    {true}                Placed at (0,0) to start the game; one per standalone collection
//   isWinTile      {true}                Shuffled into back half of deck; reaching its center wins the game
//
// subTilesTemplate — 3×3 movement grid, keyed by "lx,ly" (0–2 each axis):
//   walkable  {bool}      true = players/zombies can enter; false = solid (walls, grass)
//   type      {string}    "road" | "building" | "parking" | "grass" | ...
//                         Drives CSS class (.road-subtile etc.) and building-targeting logic
//   walls     {string[]}  Directions that are ALWAYS closed ("N"|"E"|"S"|"W")
//                         Use for interior building walls and road kerbs
//   doors     {string[]}  Directions that are ALWAYS open (overrides connector checks)
//                         Use for building entrances and road exits at tile edges
//
// Subtile grid layout (lx = column left→right, ly = row top→bottom):
//   (0,0) (1,0) (2,0)
//   (0,1) (1,1) (2,1)   ← (1,1) is the tile centre
//   (0,2) (1,2) (2,2)
//
// Road tiles only need to define walkable subtiles — non-walkable ones can be omitted
// (they default to { walkable: false }).
// ---------------------------------------------------------------------------

function buildMapDeck(filters = null) {
  // --- Road Tiles -------------------------------------------------------
  // Pure intersections — no loot, no building subtiles.
  // zombieSpawnMode "by_exits" means one zombie per connector direction.
  const roadTiles = [
    // Straight (N-S or E-W)
    {
      name: "Straight",
      type: "road",
      count: 4,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["N", "S"],
      zombieSpawnMode: "by_exits",
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
      count: 4,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["N", "E"],
      zombieSpawnMode: "by_exits",
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
      count: 4,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["N", "E", "W"],
      zombieSpawnMode: "by_exits",
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
    // 4-way (Parking Lot)
    {
      name: "Parking Lot",
      type: "road",
      count: 1,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["N", "S", "E", "W"],
      zombieSpawnMode: "by_exits",
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

  // --- Named Tiles ------------------------------------------------------
  // Buildings with loot (hearts/bullets) and a fixed zombie count on placement.
  // Each named tile is referenced by name in event card requiresTile fields.
  const namedTiles = [
    {
      name: "Army Surplus",
      type: "named",
      count: 1,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["E", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 2,
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
      count: 1,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["E", "S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
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
      count: 1,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["S"],
      zombieSpawnMode: "by_card",
      zombieCount: 6,
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
      count: 1,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["S"],
      zombieSpawnMode: "by_card",
      zombieCount: 8,
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
      name: "Pharmacy",
      type: "named",
      count: 1,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["E", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
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
      count: 1,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 6,
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
      count: 1,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["E", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
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
      count: 1,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["E", "S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
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
      count: 1,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["E", "S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
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
      count: 1,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["S"],
      zombieSpawnMode: "by_card",
      zombieCount: 6,
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
      count: 1,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["S"],
      zombieSpawnMode: "by_card",
      zombieCount: 6,
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
      count: 1,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["E", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
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

    // INFO: These are not in the main game — Iowa City locations
    {
      name: "The Deadwood",
      type: "named",
      count: 1,
      enabled: false,
      collection: COLLECTIONS.IOWA_CITY,
      connectors: ["S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 4,
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
      count: 1,
      enabled: false,
      collection: COLLECTIONS.IOWA_CITY,
      connectors: ["N", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
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
      count: 1,
      enabled: false,
      collection: COLLECTIONS.IOWA_CITY,
      connectors: ["N", "E", "S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 5,
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
      count: 1,
      enabled: false,
      collection: COLLECTIONS.IOWA_CITY,
      connectors: ["N", "E", "S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 6,
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
      count: 1,
      enabled: false,
      collection: COLLECTIONS.IOWA_CITY,
      connectors: ["N", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 10,
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
      count: 1,
      enabled: false,
      collection: COLLECTIONS.IOWA_CITY,
      connectors: ["N", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 4,
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
      count: 1,
      enabled: false,
      collection: COLLECTIONS.IOWA_CITY,
      connectors: ["N", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 8,
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
      count: 1,
      enabled: false,
      collection: COLLECTIONS.IOWA_CITY,
      connectors: ["E", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 2,
      bullets: 0,
      subTilesTemplate: {
        "0,0": { walkable: true, type: "parking", walls: ["N", "W"] },
        "1,0": { walkable: true, type: "parking", walls: ["N"] },
        "2,0": { walkable: true, type: "parking", walls: ["N", "E"] },
        "0,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, type: "road" },
        "2,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["E"] },
        "0,2": { walkable: true, type: "parking", walls: ["S", "W"] },
        "1,2": { walkable: true, type: "parking", walls: ["S"] },
        "2,2": { walkable: true, type: "parking", walls: ["E", "S"] }
      }
    },
    {
      name: "Sanctuary",
      type: "named",
      count: 1,
      enabled: false,
      collection: COLLECTIONS.IOWA_CITY,
      connectors: ["S", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
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
      count: 1,
      enabled: false,
      collection: COLLECTIONS.IOWA_CITY,
      connectors: ["N", "E"],
      zombieSpawnMode: "by_card",
      zombieCount: 2,
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
      count: 1,
      enabled: false,
      collection: COLLECTIONS.IOWA_CITY,
      connectors: ["S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 3,
      hearts: 1,
      bullets: 0,
      subTilesTemplate: {
        "0,0": { walkable: false },
        "1,0": { walkable: false },
        "2,0": { walkable: false },
        "0,1": { walkable: true, type: "road", walls: ["N", "S"], doors: ["W"] },
        "1,1": { walkable: true, type: "building", walls: ["N", "E"] },
        "2,1": { walkable: false },
        "0,2": { walkable: false },
        "1,2": { walkable: true, type: "road", walls: ["E", "W"], doors: ["S"] },
        "2,2": { walkable: false }
      }
    },
    {
      name: "UIHC",
      type: "named",
      count: 1,
      enabled: false,
      collection: COLLECTIONS.IOWA_CITY,
      connectors: ["N", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 9,
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
      count: 1,
      enabled: false,
      collection: COLLECTIONS.IOWA_CITY,
      connectors: ["E", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 4,
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
      count: 1,
      enabled: false,
      collection: COLLECTIONS.IOWA_CITY,
      connectors: ["N", "E", "S"],
      zombieSpawnMode: "by_card",
      zombieCount: 5,
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

  // --- Special Tiles ----------------------------------------------------
  // One-of tiles with unique game rules (isWinTile, isStartTile).
  // Win tiles are shuffled into the back half of the deck automatically.
  const specialTiles = [
    {
      name: "Helipad",
      type: "helipad",
      count: 1,
      enabled: true,
      collection: COLLECTIONS.DIRECTORS_CUT,
      connectors: ["N", "E", "S", "W"],
      zombieSpawnMode: "by_card",
      zombieCount: 9,
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

  const allTiles = [...roadTiles, ...namedTiles, ...specialTiles];

  const filtered = allTiles
    .filter((t) => {
      const col = t.collection || getBaseCollection();
      if (!filters) return true;
      const rule = filters[col];
      if (!rule) return false;
      return t.enabled !== false ? (rule.enabled ?? false) : (rule.disabled ?? false);
    })
    .flatMap((t) => Array.from({ length: t.count || 1 }, () => ({ ...t })));

  const winTiles = filtered.filter((t) => t.isWinTile);
  const cards = filtered.filter((t) => !t.isWinTile);

  // If no win tile made it through the filter (e.g. expansion selected without base),
  // fall back to the first default win tile from the base specialTiles list.
  if (winTiles.length === 0) {
    const defaultWin = specialTiles.find((t) => t.isWinTile);
    if (defaultWin) winTiles.push({ ...defaultWin });
  }

  shuffle(cards);
  winTiles.forEach((wt) => {
    const start = Math.floor(cards.length / 2);
    const pos = start + Math.floor(Math.random() * (cards.length - start + 1));
    cards.splice(pos, 0, wt);
  });
  return cards;
}

// All standalone start tile definitions (isStartTile: true, not in the deck).
// Each collection that can be played without a base game must have exactly one.
const START_TILES = [
  {
    name: "Town Square",
    type: "town",
    collection: COLLECTIONS.DIRECTORS_CUT,
    isStartTile: true,
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: "by_card",
    zombieCount: 0,
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

// Returns the start tile for the active collection set.
// Prefers a standalone base collection's start tile; falls back to Town Square.
function buildStartTile(filters = null) {
  if (filters) {
    const activeBase = START_TILES.find((st) => {
      const meta = COLLECTION_META[st.collection];
      if (!meta || meta.requiresBase !== null) return false;
      const rule = filters[st.collection];
      return rule && rule.enabled;
    });
    if (activeBase) return { ...activeBase };
  }
  return { ...START_TILES[0] };
}

// Returns { collectionKey: tileCount } using the full unfiltered deck.
function getMapTileCountsByCollection() {
  const counts = {};
  buildMapDeck(null).forEach((t) => {
    const col = t.collection || getBaseCollection();
    counts[col] = (counts[col] || 0) + 1;
  });
  return counts;
}

// Legacy alias — callers that don't need filter-aware selection (e.g. tile-debug)
function buildTownSquareTile() {
  return buildStartTile(null);
}
