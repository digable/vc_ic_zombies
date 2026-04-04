// Game rule constants — change these to tune game balance

const TILE_DIM          = 3;   // each map tile is a TILE_DIM × TILE_DIM subtile grid
const WIN_KILLS         = 25;  // kills needed to trigger kill-count win condition
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

const INITIAL_HEARTS    = 3;   // starting hearts for a new/respawned player
const INITIAL_BULLETS   = 3;   // starting bullets for a new/respawned player
const MAX_HAND_SIZE     = 3;   // maximum event cards in hand at end of turn
const BREAKTHROUGH_SEP  = "\u2192"; // separator used in breakthrough connection keys

// Tile-level types — used on the tile object itself (tile.type)
const TILE_TYPE = {
  TOWN:         "town",
  NAMED:        "named",
  BUILDING:     "building",
  ROAD:         "road",
  WOODS:        "woods",
  HELIPAD:      "helipad",
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
};
