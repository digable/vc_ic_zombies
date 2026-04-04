const DIRS = {
  N: { x: 0, y: -1, opposite: "S" },
  E: { x: 1, y: 0, opposite: "W" },
  S: { x: 0, y: 1, opposite: "N" },
  W: { x: -1, y: 0, opposite: "E" }
};

const DOOR_LOCAL = {
  N: { x: 1, y: 0 },
  E: { x: 2, y: 1 },
  S: { x: 1, y: 2 },
  W: { x: 0, y: 1 }
};

const COLLECTIONS = {
  DIRECTORS_CUT: "directors_cut",
  ZOMBIE_CORPS_E_: "zombie_corps_e_",
  MALL_WALKERS: "mall_walkers",
  NOT_DEAD_YET: "not_dead_yet",
  THE_END: "the_end",
  IOWA_CITY: "iowa_city"
};

// requiresBase: null  → can be played without any other collection (standalone or add-on)
// requiresBase: string → always requires that collection to be enabled
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
    standaloneDeck: true
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
    standaloneDeck: true
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
    standaloneDeck: true
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
    standaloneDeck: true
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

const STEP = {
  DRAW_TILE: "DRAW_TILE",
  COMBAT: "COMBAT",
  DRAW_EVENTS: "DRAW_EVENTS",
  ROLL_MOVE: "ROLL_MOVE",
  MOVE: "MOVE",
  MOVE_ZOMBIES: "MOVE_ZOMBIES",
  DISCARD: "DISCARD",
  END: "END"
};

const state = {
  players: [],
  currentPlayerIndex: 0,
  board: new Map(),
  mapDeck: [],
  eventDeck: [],
  discardPile: [],
  eventDiscardPile: [],
  zombies: new Map(),
  spaceTokens: new Map(),
  step: STEP.DRAW_TILE,
  movesRemaining: 0,
  currentMoveRoll: null,
  currentZombieRoll: null,
  selectedHandIndex: null,
  turnNumber: 1,
  gameOver: false,
  winInfo: null,
  lastCombatResult: null,
  pendingCombatDecision: null,
  pendingEventChoice: null,
  zombieMoveFreezeCount: 0,
  weaponsJammedCount: 0,
  movementRollFreezeCount: 0,
  tokenPickupFrozenCount: 0,
  bulletsCombatFrozenCount: 0,
  lastPlayedWeaponName: null,
  lastPlayedWeaponByPlayerId: null,
  movementBonus: 0,
  moveFloorThisTurn: 0,
  doubleMovementThisTurn: false,
  pendingZombieReplace: null,
  pendingZombiePlace: null,
  pendingZombieMovement: null,
  pendingZombieDiceChallenge: null,
  pendingForcedMove: null,
  pendingBuildingSelect: null,
  pendingZombieFlood: null,
  pendingMinefield: null,
  pendingDynamiteTarget: null,
  pendingRocketLauncher: null,
  pendingBreakthrough: null,
  pendingSpaceSelect: null,
  pendingDuctChoice: null,
  pendingTile: null,
  pendingRotation: 0,
  pendingTileOptions: [],
  pendingCompanionTiles: [], // tiles reserved from deck when main tile is drawn (e.g. Front Gate companions)
  standaloneDecks: {},          // { [collKey]: tile[] } — one deck per enabled standalone collection
  activeStandaloneDecks: new Set(), // collKeys whose gateway tile is now on the board
  pendingTileDeck: "base",      // "base" | collKey — which deck the current pending tile came from
  playerTrail: [], // ordered space keys visited this turn: [startKey, ...moves]
  knockoutBanner: null, // { playerName, lostKills } — shown briefly after knockout
  recentKillKey: null,
  recentKillByPlayerId: null,
  zombieMovedSpaces: new Set(), // space keys where zombies arrived this turn — cleared at turn end
  zombieAnimationTimer: null,   // setTimeout ID while stepped auto-move is running; null when idle
  logs: [],
  gameActive: false,            // true once Start Game (or Load) has been explicitly triggered
  multiplayerSession: null      // null = same-device; { code, myPlayerId, myDeviceId, myPlayerSlot, isHost, hostId, mode:"online", pollInterval:null }
};

const refs = {
  board: document.getElementById("board"),
  mapDeckDebug: document.getElementById("mapDeckDebug"),
  mapDeckDebugCount: document.getElementById("mapDeckDebugCount"),
  turnInfo: document.getElementById("turnInfo"),
  currentPlayerCard: document.getElementById("currentPlayerCard"),
  playersList: document.getElementById("playersList"),
  handList: document.getElementById("handList"),
  log: document.getElementById("log"),
  moveRollOutput: document.getElementById("moveRollOutput"),
  zombieRollOutput: document.getElementById("zombieRollOutput"),
  pendingTileInfo: document.getElementById("pendingTileInfo"),
  newGameBtn: document.getElementById("newGameBtn"),
  drawTileBtn: document.getElementById("drawTileBtn"),
  rotateLeftBtn: document.getElementById("rotateLeftBtn"),
  rotateRightBtn: document.getElementById("rotateRightBtn"),
  combatBtn: document.getElementById("combatBtn"),
  combatDecisionPanel: document.getElementById("combatDecisionPanel"),
  eventChoicePanel: document.getElementById("eventChoicePanel"),
  zombieReplacePanel: document.getElementById("zombieReplacePanel"),
  zombieDiceChallengePanel: document.getElementById("zombieDiceChallengePanel"),
  ductChoicePanel: document.getElementById("ductChoicePanel"),
  drawEventsBtn: document.getElementById("drawEventsBtn"),
  rollMoveBtn: document.getElementById("rollMoveBtn"),
  moveDirBtns: Array.from(document.querySelectorAll(".moveDirBtn")),
  endMoveBtn: document.getElementById("endMoveBtn"),
  moveZombiesBtn: document.getElementById("moveZombiesBtn"),
  discardBtn: document.getElementById("discardBtn"),
  endTurnBtn: document.getElementById("endTurnBtn"),
  playerCount: document.getElementById("playerCount"),
  moveStatusMsg: document.getElementById("moveStatusMsg"),
  gameOverOverlay: document.getElementById("gameOverOverlay"),
  gameOverTitle: document.getElementById("gameOverTitle"),
  gameOverMessage: document.getElementById("gameOverMessage"),
  gameOverNewGameBtn: document.getElementById("gameOverNewGameBtn"),
  knockoutBanner: document.getElementById("knockoutBanner")
};

function resetStepProgress(nextStep = STEP.DRAW_TILE) {
  state.step = nextStep;
  state.movesRemaining = 0;
  state.currentMoveRoll = null;
  state.currentZombieRoll = null;
  state.selectedHandIndex = null;
  state.pendingCombatDecision = null;
  state.movementBonus = 0;
  state.moveFloorThisTurn = 0;
}

function clearPendingTileState() {
  state.pendingTile = null;
  state.pendingRotation = 0;
  state.pendingTileOptions = [];
  state.pendingCompanionTiles = [];
  state.pendingTileDeck = "base";
}

function key(x, y) {
  return `${x},${y}`;
}

function parseKey(k) {
  const [x, y] = k.split(",").map(Number);
  return { x, y };
}

function spaceToTileCoord(v) {
  return Math.floor(v / TILE_DIM);
}

function getLocalCoord(v, tileCoord) {
  return v - tileCoord * TILE_DIM;
}

function getSpaceLocalCoords(sx, sy) {
  const tx = spaceToTileCoord(sx);
  const ty = spaceToTileCoord(sy);
  return { lx: getLocalCoord(sx, tx), ly: getLocalCoord(sy, ty) };
}

function getSpaceTileKey(sx, sy) {
  return key(spaceToTileCoord(sx), spaceToTileCoord(sy));
}

function playerKey(player) {
  return key(player.x, player.y);
}

function isSpaceOccupiedByZombie(spaceKey) {
  return state.zombies.has(spaceKey);
}

// Returns true if a zombie of `type` can be placed at `spaceKey`.
// Same-type dogs can share up to maxPerSpace; other types never share.
function isSpaceAvailableForZombie(spaceKey, type) {
  if (!state.zombies.has(spaceKey)) return true;
  const existing = state.zombies.get(spaceKey);
  if (existing.type !== type) return false;
  const maxPerSpace = ZOMBIE_TYPES[type]?.maxPerSpace ?? 1;
  return (existing.count ?? 1) < maxPerSpace;
}

// Decrement zombie count at spaceKey; deletes entry when count reaches 0.
// Returns the zombie data that was there (useful for callers that track what was killed).
function decrementZombieAt(spaceKey) {
  const zdata = state.zombies.get(spaceKey);
  if (!zdata) return null;
  const count = zdata.count ?? 1;
  if (count <= 1) {
    state.zombies.delete(spaceKey);
  } else {
    state.zombies.set(spaceKey, { ...zdata, count: count - 1 });
  }
  return zdata;
}

function manhattanDist(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function getTileAtSpace(x, y) {
  const tx = spaceToTileCoord(x);
  const ty = spaceToTileCoord(y);
  return state.board.get(key(tx, ty));
}

function getTileDisplayName(tile) {
  if (!tile) {
    return "";
  }
  return tile.name && tile.name.trim().length > 0 ? tile.name : "Road";
}

function directionToArrow(dir) {
  if (dir === "N") {
    return "↑";
  }
  if (dir === "E") {
    return "→";
  }
  if (dir === "S") {
    return "↓";
  }
  if (dir === "W") {
    return "←";
  }
  return dir;
}

function getRotatedConnectors(connectors, rotation) {
  const order = ["N", "E", "S", "W"];
  return (connectors || []).map((dir) => {
    const i = order.indexOf(dir);
    return order[(i + rotation) % 4];
  });
}

function rotateDir(dir, rotation) {
  const order = ["N", "E", "S", "W"];
  const i = order.indexOf(dir);
  if (i < 0) {
    return dir;
  }
  return order[(i + rotation) % 4];
}

function rotateLocalCoord(lx, ly, rotation) {
  let x = lx;
  let y = ly;
  for (let i = 0; i < rotation; i += 1) {
    const nextX = TILE_DIM - 1 - y;
    const nextY = x;
    x = nextX;
    y = nextY;
  }
  return { x, y };
}

function rotateDirectionMap(dirMap, rotation) {
  const out = { N: false, E: false, S: false, W: false };
  if (!dirMap) {
    return out;
  }
  Object.entries(dirMap).forEach(([dir, allowed]) => {
    if (!allowed) {
      return;
    }
    const rotated = rotateDir(dir, rotation);
    if (rotated in out) {
      out[rotated] = true;
    }
  });
  return out;
}

function toDirectionMap(value) {
  const out = { N: false, E: false, S: false, W: false };
  if (!value) {
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((dir) => {
      if (dir in out) {
        out[dir] = true;
      }
    });
    return out;
  }

  if (typeof value === "object") {
    Object.entries(value).forEach(([dir, allowed]) => {
      if (dir in out) {
        out[dir] = Boolean(allowed);
      }
    });
  }

  return out;
}

function getRotatedSubTiles(subTiles, rotation = 0) {
  if (!subTiles) {
    return null;
  }

  const steps = ((rotation % 4) + 4) % 4;
  const rotated = {};
  Object.entries(subTiles).forEach(([k, cell]) => {
    const { x: lx, y: ly } = parseKey(k);
    if (
      !Number.isInteger(lx) ||
      !Number.isInteger(ly) ||
      lx < 0 ||
      lx > TILE_DIM - 1 ||
      ly < 0 ||
      ly > TILE_DIM - 1
    ) {
      return;
    }

    const rotatedCoord = rotateLocalCoord(lx, ly, steps);
    const nextCell = { ...cell };
    if (cell?.enterFrom || cell?.sides || cell?.open) {
      const sourceMap = cell.enterFrom || cell.sides || cell.open;
      nextCell.enterFrom = rotateDirectionMap(sourceMap, steps);
    }
    if (cell?.exitTo || cell?.sides || cell?.open) {
      const sourceMap = cell.exitTo || cell.sides || cell.open;
      nextCell.exitTo = rotateDirectionMap(sourceMap, steps);
    }

    const wallsMap = toDirectionMap(cell?.walls || cell?.wall);
    const doorsMap = toDirectionMap(cell?.doors || cell?.door);
    const rotatedWalls = rotateDirectionMap(wallsMap, steps);
    const rotatedDoors = rotateDirectionMap(doorsMap, steps);
    const wallDirs = Object.keys(rotatedWalls).filter((dir) => rotatedWalls[dir]);
    const doorDirs = Object.keys(rotatedDoors).filter((dir) => rotatedDoors[dir]);
    if (wallDirs.length > 0) {
      nextCell.walls = wallDirs;
    }
    if (doorDirs.length > 0) {
      nextCell.doors = doorDirs;
    }

    rotated[key(rotatedCoord.x, rotatedCoord.y)] = nextCell;
  });

  return rotated;
}

function getTileSubTileMap(tile) {
  if (!tile) {
    return null;
  }
  return tile.subTiles || tile.subTilesTemplate || null;
}

// Pass 1: build the walkability/type/wall skeleton for every subtile.
function buildInitialSubTileGrid(tile, customSubTiles) {
  const subTiles = {};

  const getCustomSubTileType = (cell) => {
    if (!cell) return null;
    const raw = cell.type ?? null;
    if (typeof raw !== "string") return null;
    const normalized = raw.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  };

  const baseWalkable = (lx, ly) => {
    if (lx === 1 && ly === 1) return true;
    return (tile.connectors || []).some((dir) => {
      const d = DOOR_LOCAL[dir];
      return d.x === lx && d.y === ly;
    });
  };

  for (let ly = 0; ly < TILE_DIM; ly += 1) {
    for (let lx = 0; lx < TILE_DIM; lx += 1) {
      const custom = customSubTiles?.[key(lx, ly)];
      const walkable = typeof custom?.walkable === "boolean" ? custom.walkable : baseWalkable(lx, ly);
      const subTileType = getCustomSubTileType(custom);
      subTiles[key(lx, ly)] = {
        walkable,
        enterFrom: { N: false, E: false, S: false, W: false },
        exitTo: { N: false, E: false, S: false, W: false },
        ...(subTileType ? { type: subTileType } : {}),
        ...(walkable ? {} : { walls: ["N", "E", "S", "W"] })
      };
    }
  }
  return subTiles;
}

// Pass 2: fill in connectivity (enterFrom/exitTo) and apply any custom overrides.
function applySubTileConnectivity(subTiles, tile, customSubTiles) {
  for (let ly = 0; ly < TILE_DIM; ly += 1) {
    for (let lx = 0; lx < TILE_DIM; lx += 1) {
      const cell = subTiles[key(lx, ly)];
      if (!cell.walkable) continue;

      Object.entries(DIRS).forEach(([dir, d]) => {
        const srcX = lx + d.x;
        const srcY = ly + d.y;
        if (srcX < 0 || srcX > TILE_DIM - 1 || srcY < 0 || srcY > TILE_DIM - 1) return;
        const neighborWalkable = Boolean(subTiles[key(srcX, srcY)]?.walkable);
        cell.enterFrom[dir] = neighborWalkable;
        cell.exitTo[dir] = neighborWalkable;
      });

      // Edge exit cells can be entered from outside the tile if a connector exists.
      if (lx === 1 && ly === 0 && (tile.connectors || []).includes("N")) { cell.enterFrom.N = true; cell.exitTo.N = true; }
      if (lx === 2 && ly === 1 && (tile.connectors || []).includes("E")) { cell.enterFrom.E = true; cell.exitTo.E = true; }
      if (lx === 1 && ly === 2 && (tile.connectors || []).includes("S")) { cell.enterFrom.S = true; cell.exitTo.S = true; }
      if (lx === 0 && ly === 1 && (tile.connectors || []).includes("W")) { cell.enterFrom.W = true; cell.exitTo.W = true; }

      const custom = customSubTiles?.[key(lx, ly)];
      if (custom) {
        const hasSides  = custom.sides !== undefined || custom.open !== undefined;
        const sideMap   = hasSides ? toDirectionMap(custom.sides ?? custom.open) : null;
        const enterMap  = (custom.enterFrom !== undefined || custom.enter !== undefined)
          ? toDirectionMap(custom.enterFrom ?? custom.enter) : sideMap;
        const exitMap   = (custom.exitTo !== undefined || custom.exit !== undefined)
          ? toDirectionMap(custom.exitTo ?? custom.exit) : sideMap;
        const wallsMap  = toDirectionMap(custom.walls || custom.wall);
        const doorsMap  = toDirectionMap(custom.doors || custom.door);
        const wallDirs  = Object.keys(wallsMap).filter((dir) => wallsMap[dir]);
        const doorDirs  = Object.keys(doorsMap).filter((dir) => doorsMap[dir]);

        if (enterMap) Object.entries(enterMap).forEach(([dir, allowed]) => { if (dir in cell.enterFrom) cell.enterFrom[dir] = Boolean(allowed); });
        if (exitMap)  Object.entries(exitMap).forEach(([dir, allowed])  => { if (dir in cell.exitTo)   cell.exitTo[dir]   = Boolean(allowed); });

        // Walls close movement; doors open it.
        Object.entries(wallsMap).forEach(([dir, blocked]) => { if (blocked && dir in cell.enterFrom) { cell.enterFrom[dir] = false; cell.exitTo[dir] = false; } });
        Object.entries(doorsMap).forEach(([dir, open])    => { if (open   && dir in cell.enterFrom) { cell.enterFrom[dir] = true;  cell.exitTo[dir] = true;  } });

        if (wallDirs.length > 0) cell.walls = wallDirs;
        if (doorDirs.length > 0) cell.doors = doorDirs;

        // Pass through non-movement custom properties (e.g. jeepDoor).
        const knownKeys = new Set(["walkable", "type", "walls", "wall", "doors", "door",
          "sides", "open", "enterFrom", "enter", "exitTo", "exit"]);
        Object.entries(custom).forEach(([k, v]) => { if (!knownKeys.has(k)) cell[k] = v; });
      }
    }
  }
}

function buildSubTilesForTile(tile) {
  const customSubTiles = getTileSubTileMap(tile);
  const subTiles = buildInitialSubTileGrid(tile, customSubTiles);
  applySubTileConnectivity(subTiles, tile, customSubTiles);
  return subTiles;
}

function canEnterSubTile(tile, lx, ly, fromDir) {
  const sub = tile?.subTiles?.[key(lx, ly)];
  if (!sub || !sub.walkable) {
    return false;
  }
  return Boolean(sub.enterFrom?.[fromDir]);
}

function canExitSubTile(tile, lx, ly, toDir) {
  const sub = tile?.subTiles?.[key(lx, ly)];
  if (!sub || !sub.walkable) {
    return false;
  }
  if (sub.exitTo && toDir in sub.exitTo) {
    return Boolean(sub.exitTo[toDir]);
  }
  return Boolean(sub.enterFrom?.[toDir]);
}

function isLocalWalkable(tile, lx, ly) {
  if (!tile) {
    return false;
  }
  if (lx < 0 || lx > TILE_DIM - 1 || ly < 0 || ly > TILE_DIM - 1) {
    return false;
  }

  if (tile.subTiles) {
    return Boolean(tile.subTiles[key(lx, ly)]?.walkable);
  }

  if (lx === 1 && ly === 1) {
    return true;
  }

  return tile.connectors.some((dir) => {
    const d = DOOR_LOCAL[dir];
    return d.x === lx && d.y === ly;
  });
}

// Returns true when a zombie can legally be placed on (lx,ly): the subtile is
// walkable AND has at least one open exit so the zombie is not permanently trapped.
// Checks both the subtile's own exitTo AND the neighbor's enterFrom (walls can
// exist on either side of a boundary).
function isSubtileZombieViable(tile, lx, ly) {
  if (!isLocalWalkable(tile, lx, ly)) return false;
  const sub = tile?.subTiles?.[key(lx, ly)];
  if (!sub) return true; // simple tile with no custom subTile data — assume open
  for (const [dir, d] of Object.entries(DIRS)) {
    if (!sub.exitTo[dir]) continue; // this cell blocks exit in this direction
    const nx = lx + d.x;
    const ny = ly + d.y;
    if (nx < 0 || nx >= TILE_DIM || ny < 0 || ny >= TILE_DIM) {
      return true; // edge exit toward another tile — assume traversable
    }
    const neighbor = tile.subTiles?.[key(nx, ny)];
    if (!neighbor || neighbor.enterFrom[d.opposite]) return true; // neighbor allows entry
  }
  return false;
}

function isBuildingSubtileOpen(tile, lx, ly) {
  if (getSubTileType(tile, lx, ly) !== "building") return false;
  const walls = tile.subTiles?.[key(lx, ly)]?.walls;
  return !walls || walls.length < 4;
}

function findSpawnSpaceOnTile(tx, ty, type = ZOMBIE_TYPE.REGULAR) {
  const tile = state.board.get(key(tx, ty));
  if (!tile) {
    return null;
  }

  const allOffsets = [
    [1, 1], [1, 0], [2, 1], [1, 2], [0, 1], [0, 0], [2, 0], [0, 2], [2, 2]
  ];

  const building = allOffsets.filter(([lx, ly]) => isSubtileZombieViable(tile, lx, ly) && isBuildingSubtileOpen(tile, lx, ly));
  const others = allOffsets.filter(([lx, ly]) => isSubtileZombieViable(tile, lx, ly) && !isBuildingSubtileOpen(tile, lx, ly));

  for (const [lx, ly] of [...building, ...others]) {
    const sk = key(tx * TILE_DIM + lx, ty * TILE_DIM + ly);
    if (isSpaceAvailableForZombie(sk, type)) {
      return { x: tx * TILE_DIM + lx, y: ty * TILE_DIM + ly };
    }
  }
  return null;
}

function spawnZombieOnTile(tx, ty, sourceName, type = ZOMBIE_TYPE.REGULAR) {
  const tile = state.board.get(key(tx, ty));
  if (!tile) {
    return false;
  }

  const spawn = findSpawnSpaceOnTile(tx, ty, type);
  if (!spawn) {
    logLine(`No open zombie space on ${sourceName || tile.name}.`);
    return false;
  }

  const spawnKey = key(spawn.x, spawn.y);
  if (state.zombies.has(spawnKey)) {
    // Stacking (only dogs can reach this path via isSpaceAvailableForZombie)
    const existing = state.zombies.get(spawnKey);
    state.zombies.set(spawnKey, { ...existing, count: (existing.count ?? 1) + 1 });
  } else {
    state.zombies.set(spawnKey, { type, count: 1 });
  }
  return true;
}

function spawnZombiesOnTile(tx, ty, count, sourceName, type = ZOMBIE_TYPE.REGULAR) {
  let placed = 0;
  for (let i = 0; i < count; i += 1) {
    if (spawnZombieOnTile(tx, ty, sourceName, type)) {
      placed += 1;
    }
  }
  return placed;
}

function spawnZombiesOnRoadExits(tx, ty, connectors, type = ZOMBIE_TYPE.REGULAR) {
  let placed = 0;
  (connectors || []).forEach((dir) => {
    const door = DOOR_LOCAL[dir];
    if (!door) {
      return;
    }
    const sx = tx * TILE_DIM + door.x;
    const sy = ty * TILE_DIM + door.y;
    const sk = key(sx, sy);
    if (isSpaceAvailableForZombie(sk, type)) {
      if (state.zombies.has(sk)) {
        const existing = state.zombies.get(sk);
        state.zombies.set(sk, { ...existing, count: (existing.count ?? 1) + 1 });
      } else {
        state.zombies.set(sk, { type, count: 1 });
      }
      placed += 1;
    }
  });
  return placed;
}

function getZombieSpawnCountForPlacedTile(tile, connectors) {
  if (!tile) {
    return 0;
  }

  const mode = tile.zombieSpawnMode || "none";
  if (mode === "by_card") {
    return Object.values(tile.zombies || {}).reduce((s, n) => s + n, 0);
  }
  if (mode === "by_exits") {
    return Array.isArray(connectors) ? connectors.length : 0;
  }
  return 0;
}

function addTokensToSpace(x, y, hearts = 0, bullets = 0) {
  const sk = key(x, y);
  const existing = state.spaceTokens.get(sk) || { hearts: 0, bullets: 0 };

  const addHearts = hearts > 0 && existing.hearts === 0 ? 1 : 0;
  const addBullets = bullets > 0 && existing.bullets === 0 ? 1 : 0;

  if (addHearts === 0 && addBullets === 0) {
    return false;
  }

  state.spaceTokens.set(sk, {
    hearts: existing.hearts + addHearts,
    bullets: existing.bullets + addBullets
  });
  return true;
}

function placeBuildingTokens(tx, ty, hearts, bullets) {
  const tile = state.board.get(key(tx, ty));
  if (!tile) {
    return;
  }

  const building = [];
  const others = [];
  for (let ly = 0; ly < TILE_DIM; ly += 1) {
    for (let lx = 0; lx < TILE_DIM; lx += 1) {
      if (!isLocalWalkable(tile, lx, ly)) continue;
      if (isBuildingSubtileOpen(tile, lx, ly)) {
        building.push([lx, ly]);
      } else {
        others.push([lx, ly]);
      }
    }
  }
  const offsets = [...building, ...others];

  let h = hearts || 0;
  let b = bullets || 0;
  let i = 0;
  let attempts = 0;
  const maxAttempts = Math.max(1, offsets.length * 4);

  while ((h > 0 || b > 0) && attempts < maxAttempts && offsets.length > 0) {
    const [lx, ly] = offsets[i % offsets.length];
    const sx = tx * TILE_DIM + lx;
    const sy = ty * TILE_DIM + ly;
    if (h > 0 && addTokensToSpace(sx, sy, 1, 0)) {
      h -= 1;
    } else if (b > 0 && addTokensToSpace(sx, sy, 0, 1)) {
      b -= 1;
    }
    i += 1;
    attempts += 1;
  }
}

function collectTokensAtPlayerSpace(player) {
  if (state.tokenPickupFrozenCount > 0) return;
  const sk = playerKey(player);
  const tokens = state.spaceTokens.get(sk);
  if (!tokens) {
    return;
  }

  let gainedHearts = 0;
  if (tokens.hearts > 0 && player.hearts < MAX_HEARTS) {
    gainedHearts = Math.min(tokens.hearts, MAX_HEARTS - player.hearts);
    player.hearts += gainedHearts;
    tokens.hearts -= gainedHearts;
  }

  let gainedBullets = 0;
  if (tokens.bullets > 0) {
    gainedBullets = tokens.bullets;
    player.bullets += gainedBullets;
    tokens.bullets = 0;
  }

  if (tokens.hearts <= 0 && tokens.bullets <= 0) {
    state.spaceTokens.delete(sk);
  } else {
    state.spaceTokens.set(sk, tokens);
  }

  if (gainedHearts > 0 || gainedBullets > 0) {
    logLine(`${player.name} picked up tokens (+${gainedHearts} hearts, +${gainedBullets} bullets).`);
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function rollD6() {
  return Math.floor(Math.random() * D6_SIDES) + 1;
}

function logLine(text, type) {
  state.logs.unshift({ text: `[T${state.turnNumber}] ${text}`, type: type || null });
  if (state.logs.length > MAX_LOG_ENTRIES) {
    state.logs.pop();
  }
}

function reshuffleEventDeckIfEmpty() {
  if (state.eventDeck.length > 0) return;
  if (state.eventDiscardPile.length === 0) return;
  state.eventDeck = shuffle([...state.eventDiscardPile]);
  state.eventDiscardPile = [];
  logLine("Event deck exhausted — discard pile shuffled back in.");
}

function addTile(x, y, tile) {
  const placedTile = { ...tile, x, y, discovered: true, looted: false };
  placedTile.subTiles = buildSubTilesForTile(placedTile);
  state.board.set(key(x, y), placedTile);
}
