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

const TILE_COLLECTIONS = {
  NOT_USED: "not_used",
  DIRECTORS_CUT: "directors_cut",
  IOWA_CITY: "iowa_city"
};

// requiresBase: null  → standalone base game
// requiresBase: string → expansion, must be used with that collection
const TILE_COLLECTION_META = {
  [TILE_COLLECTIONS.DIRECTORS_CUT]: { label: "Director's Cut", requiresBase: null },
  [TILE_COLLECTIONS.IOWA_CITY]:     { label: "Iowa City",       requiresBase: TILE_COLLECTIONS.DIRECTORS_CUT },
  [TILE_COLLECTIONS.NOT_USED]:      { label: "Not Used",        requiresBase: null }
};

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
  zombies: new Set(),
  spaceTokens: new Map(),
  step: STEP.DRAW_TILE,
  movesRemaining: 0,
  currentMoveRoll: null,
  currentZombieRoll: null,
  selectedHandIndex: null,
  turnNumber: 1,
  gameOver: false,
  lastCombatResult: null,
  pendingCombatDecision: null,
  pendingEventChoice: null,
  zombieMoveFreezeCount: 0,
  movementBonus: 0,
  moveFloorThisTurn: 0,
  doubleMovementThisTurn: false,
  pendingZombieReplace: null,
  pendingZombiePlace: null,
  pendingZombieMovement: null,
  pendingZombieDiceChallenge: null,
  pendingForcedMove: null,
  pendingBuildingSelect: null,
  pendingTile: null,
  pendingRotation: 0,
  pendingTileOptions: [],
  logs: []
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
  gameOverMessage: document.getElementById("gameOverMessage"),
  gameOverNewGameBtn: document.getElementById("gameOverNewGameBtn")
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
}

function key(x, y) {
  return `${x},${y}`;
}

function parseKey(k) {
  const [x, y] = k.split(",").map(Number);
  return { x, y };
}

function spaceToTileCoord(v) {
  return Math.floor(v / 3);
}

function getLocalCoord(v, tileCoord) {
  return v - tileCoord * 3;
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

function formatTileExits(tile) {
  return (tile.connectors || []).map(directionToArrow).join(" ") || "None";
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
    const nextX = 2 - y;
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
      lx > 2 ||
      ly < 0 ||
      ly > 2
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

function isLocalWalkable(tile, lx, ly) {
  if (!tile) {
    return false;
  }
  if (lx < 0 || lx > 2 || ly < 0 || ly > 2) {
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

function buildSubTilesForTile(tile) {
  const subTiles = {};
  const customSubTiles = getTileSubTileMap(tile);

  const getCustomSubTileType = (cell) => {
    if (!cell) {
      return null;
    }
    const raw = cell.type ?? null;
    if (typeof raw !== "string") {
      return null;
    }
    const normalized = raw.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  };

  const baseWalkable = (lx, ly) => {
    if (lx === 1 && ly === 1) {
      return true;
    }
    return (tile.connectors || []).some((dir) => {
      const d = DOOR_LOCAL[dir];
      return d.x === lx && d.y === ly;
    });
  };

  for (let ly = 0; ly < 3; ly += 1) {
    for (let lx = 0; lx < 3; lx += 1) {
      const custom = customSubTiles?.[key(lx, ly)];
      const walkable =
        typeof custom?.walkable === "boolean"
          ? custom.walkable
          : baseWalkable(lx, ly);
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

  for (let ly = 0; ly < 3; ly += 1) {
    for (let lx = 0; lx < 3; lx += 1) {
      const cell = subTiles[key(lx, ly)];
      if (!cell.walkable) {
        continue;
      }

      Object.entries(DIRS).forEach(([dir, d]) => {
        const srcX = lx + d.x;
        const srcY = ly + d.y;
        if (srcX < 0 || srcX > 2 || srcY < 0 || srcY > 2) {
          return;
        }
        const neighborWalkable = Boolean(subTiles[key(srcX, srcY)]?.walkable);
        cell.enterFrom[dir] = neighborWalkable;
        cell.exitTo[dir] = neighborWalkable;
      });

      // Edge exit cells can be entered from outside the tile if a connector exists.
      if (lx === 1 && ly === 0 && (tile.connectors || []).includes("N")) {
        cell.enterFrom.N = true;
        cell.exitTo.N = true;
      }
      if (lx === 2 && ly === 1 && (tile.connectors || []).includes("E")) {
        cell.enterFrom.E = true;
        cell.exitTo.E = true;
      }
      if (lx === 1 && ly === 2 && (tile.connectors || []).includes("S")) {
        cell.enterFrom.S = true;
        cell.exitTo.S = true;
      }
      if (lx === 0 && ly === 1 && (tile.connectors || []).includes("W")) {
        cell.enterFrom.W = true;
        cell.exitTo.W = true;
      }

      const custom = customSubTiles?.[key(lx, ly)];
      if (custom) {
        const hasSides = custom.sides !== undefined || custom.open !== undefined;
        const sideMap = hasSides ? toDirectionMap(custom.sides ?? custom.open) : null;
        const hasEnterMap = custom.enterFrom !== undefined || custom.enter !== undefined;
        const hasExitMap = custom.exitTo !== undefined || custom.exit !== undefined;
        const enterMap = hasEnterMap
          ? toDirectionMap(custom.enterFrom ?? custom.enter)
          : sideMap;
        const exitMap = hasExitMap
          ? toDirectionMap(custom.exitTo ?? custom.exit)
          : sideMap;
        const wallsMap = toDirectionMap(custom.walls || custom.wall);
        const doorsMap = toDirectionMap(custom.doors || custom.door);
        const wallDirs = Object.keys(wallsMap).filter((dir) => wallsMap[dir]);
        const doorDirs = Object.keys(doorsMap).filter((dir) => doorsMap[dir]);

        if (enterMap) {
          Object.entries(enterMap).forEach(([dir, allowed]) => {
            if (dir in cell.enterFrom) {
              cell.enterFrom[dir] = Boolean(allowed);
            }
          });
        }

        if (exitMap) {
          Object.entries(exitMap).forEach(([dir, allowed]) => {
            if (dir in cell.exitTo) {
              cell.exitTo[dir] = Boolean(allowed);
            }
          });
        }

        // Walls always close movement on that edge for both entering and exiting.
        Object.entries(wallsMap).forEach(([dir, blocked]) => {
          if (blocked && dir in cell.enterFrom) {
            cell.enterFrom[dir] = false;
            cell.exitTo[dir] = false;
          }
        });

        // Doors always open movement on that edge for both entering and exiting.
        Object.entries(doorsMap).forEach(([dir, open]) => {
          if (open && dir in cell.enterFrom) {
            cell.enterFrom[dir] = true;
            cell.exitTo[dir] = true;
          }
        });

        if (wallDirs.length > 0) {
          cell.walls = wallDirs;
        }
        if (doorDirs.length > 0) {
          cell.doors = doorDirs;
        }
      }
    }
  }

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

function isBuildingSubtileOpen(tile, lx, ly) {
  if (getSubTileType(tile, lx, ly) !== "building") return false;
  const walls = tile.subTiles?.[key(lx, ly)]?.walls;
  return !walls || walls.length < 4;
}

function findSpawnSpaceOnTile(tx, ty) {
  const tile = state.board.get(key(tx, ty));
  if (!tile) {
    return null;
  }

  const allOffsets = [
    [1, 1], [1, 0], [2, 1], [1, 2], [0, 1], [0, 0], [2, 0], [0, 2], [2, 2]
  ];

  const building = allOffsets.filter(([lx, ly]) => isLocalWalkable(tile, lx, ly) && isBuildingSubtileOpen(tile, lx, ly));
  const others = allOffsets.filter(([lx, ly]) => isLocalWalkable(tile, lx, ly) && !isBuildingSubtileOpen(tile, lx, ly));

  for (const [lx, ly] of [...building, ...others]) {
    const sk = key(tx * 3 + lx, ty * 3 + ly);
    if (!state.zombies.has(sk)) {
      return { x: tx * 3 + lx, y: ty * 3 + ly };
    }
  }
  return null;
}

function spawnZombieOnTile(tx, ty, sourceName) {
  const tile = state.board.get(key(tx, ty));
  if (!tile) {
    return false;
  }

  const spawn = findSpawnSpaceOnTile(tx, ty);
  if (!spawn) {
    logLine(`No open zombie space on ${sourceName || tile.name}.`);
    return false;
  }

  state.zombies.add(key(spawn.x, spawn.y));
  return true;
}

function spawnZombiesOnTile(tx, ty, count, sourceName) {
  let placed = 0;
  for (let i = 0; i < count; i += 1) {
    if (spawnZombieOnTile(tx, ty, sourceName)) {
      placed += 1;
    }
  }
  return placed;
}

function spawnZombiesOnRoadExits(tx, ty, connectors) {
  let placed = 0;
  (connectors || []).forEach((dir) => {
    const door = DOOR_LOCAL[dir];
    if (!door) {
      return;
    }
    const sx = tx * 3 + door.x;
    const sy = ty * 3 + door.y;
    const sk = key(sx, sy);
    if (!state.zombies.has(sk)) {
      state.zombies.add(sk);
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
    return Math.max(0, tile.zombieCount || 0);
  }
  if (mode === "by_exits") {
    return Array.isArray(connectors) ? connectors.length : 0;
  }
  return 0;
}

function addTokensToSpace(x, y, hearts = 0, bullets = 0) {
  if (hearts > 0 && bullets > 0) {
    return false;
  }

  const sk = key(x, y);
  const existing = state.spaceTokens.get(sk);
  if (existing && (existing.hearts > 0 || existing.bullets > 0)) {
    return false;
  }

  const next = {
    hearts: hearts > 0 ? 1 : 0,
    bullets: bullets > 0 ? 1 : 0
  };

  if (next.hearts === 0 && next.bullets === 0) {
    return false;
  }

  state.spaceTokens.set(sk, next);
  return true;
}

function placeBuildingTokens(tx, ty, hearts, bullets) {
  const tile = state.board.get(key(tx, ty));
  if (!tile) {
    return;
  }

  const building = [];
  const others = [];
  for (let ly = 0; ly < 3; ly += 1) {
    for (let lx = 0; lx < 3; lx += 1) {
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
    const sx = tx * 3 + lx;
    const sy = ty * 3 + ly;
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
  const sk = key(player.x, player.y);
  const tokens = state.spaceTokens.get(sk);
  if (!tokens) {
    return;
  }

  let gainedHearts = 0;
  if (tokens.hearts > 0 && player.hearts < 5) {
    gainedHearts = Math.min(tokens.hearts, 5 - player.hearts);
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
  return Math.floor(Math.random() * 6) + 1;
}

function logLine(text) {
  state.logs.unshift(`[T${state.turnNumber}] ${text}`);
  if (state.logs.length > 120) {
    state.logs.pop();
  }
}

function addTile(x, y, tile) {
  const placedTile = { ...tile, x, y, discovered: true, looted: false };
  placedTile.subTiles = buildSubTilesForTile(placedTile);
  state.board.set(key(x, y), placedTile);
}
