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
};

const MAX_PLAYERS       = 6;   // maximum players allowed in a single game
const INITIAL_HEARTS    = 3;   // starting hearts for a new/respawned player
const INITIAL_BULLETS   = 3;   // starting bullets for a new/respawned player
const INITIAL_GUTS      = 3;   // starting guts tokens (Guts variant only)
const MAX_GUTS          = 5;   // maximum guts tokens a player can hold
const MAX_HAND_SIZE     = 3;   // maximum event cards in hand at end of turn (non-guts games)
const BREAKTHROUGH_SEP  = "\u2192"; // separator used in breakthrough connection keys

const KNOCKOUT_BANNER_MS  = 5000; // how long the knockout banner stays on screen (ms)
const ZOOM_INCREMENT      = 0.1;  // zoom step per mouse-wheel tick or pinch move
const ZOOM_MIN            = 0.3;  // minimum board zoom level
const ZOOM_MAX            = 3.0;  // maximum board zoom level
const ISO_SPIN_SNAP       = 15;   // degrees per snap increment when right-click spinning

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
