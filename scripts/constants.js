// Game rule constants — change these to tune game balance

const DIRECTION_ORDER = ["N", "E", "S", "W"]; // canonical clockwise order used for rotation math

const TILE_DIM          = 3;   // each map tile is a TILE_DIM × TILE_DIM subtile grid
const WIN_KILLS         = 25;  // kills needed to trigger kill-count win condition
const SPELL_BASE_TARGET = 6;   // d6 roll needed to perform the Cabin spell (reduced by 1 per BotD page)
const MAX_HEARTS        = 5;   // maximum heart tokens a player can hold
const D6_SIDES          = 6;   // die face count (used in rollD6)
const MAX_LOG_ENTRIES   = 120; // how many log lines to keep in memory

const ZOMBIE_SPAWN_MODE = {
  BY_CARD:  "by_card",   // spawn count from tile's zombies object
  BY_EXITS: "by_exits",  // one zombie per road connector
  D6_ROLL:  "d6_roll",   // roll a d6 on placement to determine count
  NONE:     "none",
};

const ZOMBIE_TYPE = {
  REGULAR:  "regular",
  ENHANCED: "government_enhanced",
  DOG:      "dog",
  CLOWN:    "clown"
};

// Per-type zombie stats. Add new types here — combat and movement read from this table.
// killRoll:    minimum d6 total (after bonuses) needed to kill this zombie type.
// movement:    spaces moved per turn slot.
// maxPerSpace: how many of this type can share a subtile (dogs can stack up to 2).
// halfHeartDamage: if true, losing combat costs ½ heart instead of a full knockout.
// halfHeartReroll: if true, player can spend ½ heart tokens to reroll in combat.
const ZOMBIE_TYPES = {
  [ZOMBIE_TYPE.REGULAR]:  { movement: 1, killRoll: 4, maxPerSpace: 1, halfHeartDamage: false, halfHeartReroll: false },
  [ZOMBIE_TYPE.ENHANCED]: { movement: 2, killRoll: 5, maxPerSpace: 1, halfHeartDamage: false, halfHeartReroll: false },
  [ZOMBIE_TYPE.DOG]:      { movement: 2, killRoll: 5, maxPerSpace: 2, halfHeartDamage: true,  halfHeartReroll: true  },
  [ZOMBIE_TYPE.CLOWN]:    { movement: 1, killRoll: 4, maxPerSpace: 1, halfHeartDamage: false, halfHeartReroll: false },
};

const MAX_PLAYERS       = 6;   // maximum players allowed in a single game
const INITIAL_HEARTS         = 3;   // starting hearts for a new/respawned player
const INITIAL_BULLETS        = 3;   // starting bullets for a new/respawned player
const INITIAL_GUTS           = 3;   // starting guts tokens (Guts variant only)
const INITIAL_SEWER_TOKENS   = 2;   // sewer tokens each player starts with (Z6 variant)
const DODGE_ROLL             = 3;   // Z8 variant: exact roll that triggers a dodge; Straight Jacket dodges on any roll >= this value
const MAX_GUTS          = 5;   // maximum guts tokens a player can hold
const MAX_HAND_SIZE     = 3;   // maximum event cards in hand at end of turn (non-guts games)
const BREAKTHROUGH_SEP  = "\u2192"; // separator used in breakthrough connection keys

const KNOCKOUT_BANNER_MS  = 5000; // how long the knockout banner stays on screen (ms)
const ZOOM_INCREMENT      = 0.1;  // zoom step per mouse-wheel tick or pinch move
const ZOOM_MIN            = 0.3;  // minimum board zoom level
const ZOOM_MAX            = 3.0;  // maximum board zoom level
const ISO_SPIN_SNAP       = 15;   // degrees per snap increment when right-click spinning

const SAVE_SLOTS = 5; // number of localStorage save slots

// Sentinel deck key for the shared base map deck (distinct from per-collection standalone decks)
const TILE_DECK = {
  BASE: "base",
};

const CARD_TYPE = {
  EVENT: "event",
  BOTD_PAGE:  "botd_page" // "Book of the Dead" page cards that start in front of the player and have special staging rules
};

// Tile-level types — used on the tile object itself (tile.type)
const TILE_TYPE = {
  TOWN:         "town",
  NAMED:        "named",
  BUILDING:     "building",
  ROAD:         "road",
  WOODS:        "woods",
  HELIPAD:      "helipad",
};

// Connector rule values — used in connectors object format { N: CONNECTOR_RULE.ANY, S: CONNECTOR_RULE.SAME }
const CONNECTOR_RULE = {
  ANY:  "any",   // this connector accepts tiles from any collection (gateway-facing side)
  SAME: "same",  // this connector only connects to tiles in the same collection (default)
  ANY_FIRST: "any_first", // this connector accepts tiles from any collection, but only when the tile is first placed (starting tile side), then it is same
  DISABLE_ON_SOLO: "disable_on_solo", // this connector is disabled if playing the map deck with only its own collection enabled (used for start tile connectors that would otherwise allow any tile to be placed first)
  ONLY: "only",  // this connector only connects to tiles in a specific tile name (used for one-way connections like UIHC-to-helipad)
  NAMED_TYPE: "named_type",  // connects only to tiles with type === TILE_TYPE.NAMED (currently unused — available for future tiles)
  DESIGNATED: "designated",  // only connects where the neighbor has CONNECTOR_RULE.ONLY targeting this tile's name
};

// Special tile names referenced in game logic (placement rules, movement, deck building)
const TILE_NAME = {
  ESCALATOR:      "Escalator",
  TOWN_SQUARE:    "Town Square",
  MOTOR_POOL:     "Motor Pool",
  HELIPAD:        "Helipad",
  HELIPAD_DESIGNATED: "Helipad (designated)",
  ADMIN_BLDG:     "Admin Bldg.",
  SUBWAY_STATION: "Subway Station",
  BIG_TOP_1:      "Big Top 1",
  BIG_TOP_2:      "Big Top 2"
};

// Subtile types — used on individual subtiles within a tile's 3×3 grid (subtile.type)
const SUBTILE_TYPE = {
  ROAD:         "road",
  BUILDING:     "building",
  GRASS:        "grass",
  PARKING:      "parking",
  MALL_HALLWAY: "mall hallway",
  MALL_STORE:   "mall store",
  ESCALATOR:    "escalator",
  WATER:        "water",
  WOODED:       "wooded",
  ALTAR:        "altar",
  CAVE:         "cave",
};

// Subtile type groupings used for event card and combat logic
const SUBTILE_BUILDING_TYPES = new Set([SUBTILE_TYPE.BUILDING, SUBTILE_TYPE.MALL_STORE]);
const SUBTILE_OUTSIDE_TYPES  = new Set([SUBTILE_TYPE.ROAD, SUBTILE_TYPE.GRASS, SUBTILE_TYPE.PARKING, SUBTILE_TYPE.MALL_HALLWAY]);

// ---------------------------------------------------------------------------
// Direction and geometry constants — used by placement, movement, and rendering
// ---------------------------------------------------------------------------

const DIRS = {
  N: { x: 0, y: -1, opposite: "S" },
  E: { x: 1, y: 0, opposite: "W" },
  S: { x: 0, y: 1, opposite: "N" },
  W: { x: -1, y: 0, opposite: "E" }
};

const TILE_CENTER = Math.floor(TILE_DIM / 2); // local coord of the middle subtile (1 in a 3×3 grid)

const DOOR_LOCAL = {
  N: { x: TILE_CENTER,    y: 0            },
  E: { x: TILE_DIM - 1,  y: TILE_CENTER  },
  S: { x: TILE_CENTER,    y: TILE_DIM - 1 },
  W: { x: 0,              y: TILE_CENTER  }
};

// ---------------------------------------------------------------------------
// Collections — expansion set identifiers and metadata
// ---------------------------------------------------------------------------

const COLLECTIONS = {
  DIRECTORS_CUT: "directors_cut",
  ZOMBIE_CORPS_E_: "zombie_corps_e_",
  MALL_WALKERS: "mall_walkers",
  NOT_DEAD_YET: "not_dead_yet",
  THE_END: "the_end",
  SCHOOLS_OUT_FOREVER: "schools_out_forever",
  SIX_FEET_UNDER: "six_feet_under",
  SEND_IN_THE_CLOWNS: "send_in_the_clowns",
  JAILBREAK: "jailbreak",
  IOWA_CITY: "iowa_city",
  SUBSCRIPTION: "subscription"
};

// requiresBase: null  → can be played without any other collection (standalone or add-on)
// requiresBase: string → always requires that collection to be enabled
// compatibleWith: string[] → other collections this can be mixed with in multi-deck play.
//   Absent or empty means: solo only (no multi-deck pairing defined).
//   The UI will auto-enable Z1 when two expansions with compatibleWith are combined.
const COLLECTION_META = {
  [COLLECTIONS.DIRECTORS_CUT]: {
    label: "Director's Cut",
    shortCode: "Z1",
    requiresBase: null,
    year: 2004,
    type: "Base Game",
    version: "2nd Edition",
    description: "The core tile set. Standalone — no other collection required.",
    creator: "Based on the Twilight Creations Zombies!!! by Todd A. Breitenstein"
  },
  [COLLECTIONS.ZOMBIE_CORPS_E_]: {
    label: "Zombie Corps(e)",
    shortCode: "Z2",
    requiresBase: null,
    year: 2007,
    type: "Standalone / Expansion",
    version: "2nd Edition",
    description: "Playable standalone or alongside Director's Cut. Uses its own zone-isolated deck when mixed.",
    creator: "Based on the Twilight Creations Zombies!!! 2 - Zombie Corps(e) by Todd A. Breitenstein",
    standaloneDeck: true,
    compatibleWith: [COLLECTIONS.DIRECTORS_CUT]
  },
  [COLLECTIONS.MALL_WALKERS]: {
    label: "Mall Walkers",
    shortCode: "Z3",
    requiresBase: null,
    year: 2007,
    type: "Standalone / Expansion",
    version: "1.0.0",
    description: "Playable standalone or alongside Director's Cut. Uses its own zone-isolated deck when mixed.",
    creator: "Based on the Twilight Creations Zombies!!! 3 - Mall Walkers by Todd A. Breitenstein",
    standaloneDeck: true,
    compatibleWith: [COLLECTIONS.DIRECTORS_CUT]
  },
  [COLLECTIONS.NOT_DEAD_YET]: {
    label: "Not Dead Yet!",
    shortCode: "Z3.5",
    requiresBase: null,
    year: 2003,
    type: "Expansion",
    version: "1.0.0",
    description: "Event cards only — no map tiles. Add to any standalone or base game collection.",
    creator: "Based on the Twilight Creations Zombies!!! 3.5 - Not Dead Yet! by Todd A. Breitenstein",
    standaloneDeck: false
  },
  [COLLECTIONS.THE_END]: {
    label: "The End... Director's Cut",
    shortCode: "Z4",
    requiresBase: null,
    year: 2004,
    type: "Standalone / Expansion",
    version: "2.0",
    description: "Playable standalone or alongside Director's Cut. Uses its own zone-isolated deck when mixed.",
    creator: "Based on the Twilight Creations Zombies!!! 4 - The End... Director's Cut by Todd A. Breitenstein",
    standaloneDeck: true,
    compatibleWith: [COLLECTIONS.DIRECTORS_CUT]
  },
  [COLLECTIONS.SCHOOLS_OUT_FOREVER]: {
    label: "School's Out Forever",
    shortCode: "Z5",
    requiresBase: null,
    year: 2008,
    type: "Standalone / Expansion",
    version: "2.0",
    description: "Playable standalone or alongside Director's Cut. Uses its own zone-isolated deck when mixed.",
    creator: "Based on the Twilight Creations Zombies!!! 5 - School's Out Forever by Todd A. Breitenstein",
    standaloneDeck: true,
    compatibleWith: [COLLECTIONS.DIRECTORS_CUT]
  },
  [COLLECTIONS.SIX_FEET_UNDER]: {
    label: "Six Feet Under",
    shortCode: "Z6",
    requiresBase: COLLECTIONS.DIRECTORS_CUT,
    year: 2007,
    type: "Expansion",
    version: "1.0",
    description: "Tiles and event cards shuffle directly into the base deck — not zone-isolated. Add to Director's Cut for a fully mixed game.",
    creator: "Based on the Twilight Creations Zombies!!! 6 - Six Feet Under by Todd A. Breitenstein",
    standaloneDeck: false,
    compatibleWith: [COLLECTIONS.DIRECTORS_CUT]
  },
  [COLLECTIONS.SEND_IN_THE_CLOWNS]: {
    label: "Send in the Clowns",
    shortCode: "Z7",
    requiresBase: null,
    year: 2008,
    type: "Standalone / Expansion",
    version: "1.0",
    description: "Playable standalone or alongside Director's Cut. Uses its own zone-isolated deck when mixed.",
    creator: "Based on the Twilight Creations Zombies!!! 7 - Send in the Clowns by Todd A. Breitenstein",
    standaloneDeck: true,
    compatibleWith: [COLLECTIONS.DIRECTORS_CUT]
  },
  [COLLECTIONS.JAILBREAK]: {
    label: "Jailbreak!",
    shortCode: "Z8",
    requiresBase: null,
    year: 2009,
    type: "Standalone / Expansion",
    version: "1.0",
    description: "Playable standalone or alongside Director's Cut. Uses its own zone-isolated deck when mixed.",
    creator: "Based on the Twilight Creations Zombies!!! 8 - Jailbreak!!! by Todd A. Breitenstein",
    standaloneDeck: true,
    compatibleWith: [COLLECTIONS.DIRECTORS_CUT]
  },
  [COLLECTIONS.IOWA_CITY]: {
    label: "Iowa City",
    shortCode: "IC",
    requiresBase: null,
    year: 2026,
    type: "Standalone / Expansion",
    version: "0.1.0",
    description: "Iowa City themed locations. Playable standalone or alongside Director's Cut.",
    creator: "digable",
    standaloneDeck: true,
    compatibleWith: [COLLECTIONS.DIRECTORS_CUT]
  },
  [COLLECTIONS.SUBSCRIPTION]: {
    label: "Subscription",
    shortCode: "SUB",
    requiresBase: null,
    year: 2026,
    type: "Expansion",
    version: "0.1.0",
    description: "Event cards only — no map tiles. Add to any game.",
    creator: "digable",
    standaloneDeck: false
  }
};

// Returns the key of the first standalone base collection (requiresBase === null).
function getBaseCollection() {
  const entry = Object.entries(COLLECTION_META).find(([, meta]) => meta.requiresBase === null);
  return entry ? entry[0] : Object.values(COLLECTIONS)[0];
}

// Normalise a tile or card's collection field into { [collectionKey]: count }.
// Object collection  → use as-is
// String/array + count integer → { col: count } for each listed collection
// String/array, no count → { col: 1 }
// No collection → { [baseCollection]: count || 1 }
function resolveCollectionCounts(item) {
  if (item.collection !== null && typeof item.collection === "object" && !Array.isArray(item.collection)) {
    return item.collection;
  }
  const cols = Array.isArray(item.collection)
    ? item.collection
    : [item.collection || getBaseCollection()];
  const perCol = Math.max(1, item.count || 1);
  return Object.fromEntries(cols.map((c) => [c, perCol]));
}

// ---------------------------------------------------------------------------
// Turn step enum — the ordered phases of a player's turn
// ---------------------------------------------------------------------------

const STEP = {
  DRAW_TILE:    "DRAW_TILE",
  COMBAT:       "COMBAT",
  DRAW_EVENTS:  "DRAW_EVENTS",
  ROLL_MOVE:    "ROLL_MOVE",
  MOVE:         "MOVE",
  MOVE_ZOMBIES: "MOVE_ZOMBIES",
  DISCARD:      "DISCARD",
  END:          "END"
};
