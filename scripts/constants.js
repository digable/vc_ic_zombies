// Game rule constants — change these to tune game balance

const TILE_DIM          = 3;   // each map tile is a TILE_DIM × TILE_DIM subtile grid
const WIN_KILLS         = 25;  // kills needed to trigger kill-count win condition
const MAX_HEARTS        = 5;   // maximum heart tokens a player can hold
const D6_SIDES          = 6;   // die face count (used in rollD6)
const MAX_LOG_ENTRIES   = 120; // how many log lines to keep in memory

const ZOMBIE_TYPE = {
  REGULAR:  "regular",
  ENHANCED: "government_enhanced",
};

// Per-type zombie stats. Add new types here — combat and movement read from this table.
// killRoll: minimum d6 total (after bonuses) needed to kill this zombie type.
// movement: spaces moved per turn slot.
const ZOMBIE_TYPES = {
  [ZOMBIE_TYPE.REGULAR]:  { movement: 1, killRoll: 4 },
  [ZOMBIE_TYPE.ENHANCED]: { movement: 2, killRoll: 5 },
};
