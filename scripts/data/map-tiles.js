// ---------------------------------------------------------------------------
// Map tile data — barrel file
// ---------------------------------------------------------------------------
// Individual tile definitions live in scripts/data/map-tiles/:
//   road.js    — roadTiles       (shared across collections)
//   z1.js      — namedTilesZ1    (Zombies!!! Director's Cut)
//   z2.js      — namedTilesZ2    (Zombies!!! 2: Zombie Corps(e))
//   z3.js      — namedTilesZ3    (Zombies!!! 3: Mall Walkers)
//   z4.js      — namedTilesZ4    (Zombies!!! 4: The End…)
//   z5.js      — namedTilesZ5    (Zombies!!! 5: School's Out Forever!)
//   z6.js      — namedTilesZ6    (Zombies!!! 6: Six Feet Under)
//   z7.js      — namedTilesZ7    (Zombies!!! 7: Send in the Clowns)
//   ic.js      — namedTilesIC    (Iowa City — custom expansion)
//   special.js — specialTiles    (win / start tiles)
// Build logic lives in map-deck.js. All files must load before map-tiles.js.
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
//   companionDir   {string}              Which connector side the companions chain from, in the tile's UNROTATED
//                                        orientation. Default "S". The opposite side is assumed to be the
//                                        map-connection side. Engine auto-detects reversed placement.
//   connectorOnlyTarget  {object}        Parallel to connectors — maps direction to tile name for
//                                        CONNECTOR_RULE.ONLY connectors. e.g. { S: "Helipad" }
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

const namedTiles = [
  ...namedTilesZ1,
  ...namedTilesZ2,
  ...namedTilesZ3,
  ...namedTilesZ4,
  ...namedTilesZ5,
  ...namedTilesZ6,
  ...namedTilesZ7,
  ...namedTilesIC,
];
