// Game rule constants — change these to tune game balance

const TILE_DIM          = 3;   // each map tile is a TILE_DIM × TILE_DIM subtile grid
const MIN_COMBAT_ROLL   = 4;   // roll must be >= this to win combat
const WIN_KILLS         = 25;  // kills needed to trigger kill-count win condition
const MAX_HEARTS        = 5;   // maximum heart tokens a player can hold
const D6_SIDES          = 6;   // die face count (used in rollD6)
const MAX_LOG_ENTRIES   = 120; // how many log lines to keep in memory
