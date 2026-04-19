function setupGame(playerCount, deckFilters = null, eventFilters = null) {
  state.players = [];
  for (let i = 0; i < playerCount; i += 1) {
    state.players.push({
      id: i + 1,
      name: `Shotgun Guy ${i + 1}`,
      hearts: INITIAL_HEARTS,
      bullets: INITIAL_BULLETS,
      guts: state.useGuts ? INITIAL_GUTS : null,
      kills: 0,
      attack: 0,
      hand: [],
      items: [],
      botdPages: [],
      eventUsedThisRound: false,
      pageRemovedThisRound: false,
      tempCombatBonus: 0,
      shotgunCharges: 0,
      tileCombatBonus: 0,
      tileCombatBonusTile: null,
      movementBonus: 0,
      cannotMoveTurns: 0,
      cannotPlayCardTurns: 0,
      noCombatThisTurn: false,
      noCombatTileKey: null,
      maxMoveNextTurn: null,
      forcedDirection: null,
      brainCramp: null,
      claustrophobiaNextTurn: false,
      claustrophobiaActive: false,
      halfMovementNextTurn: false,
      x: 1,
      y: 1,
      knockedOut: false,
      knockouts: 0,
      hasJeep: false,
      hasBike: false,
      smellEffect: null,
      itemsUsedThisTurn: [],
      dieRollPenalty: 0,
      nextTurnDieRollPenalty: 0,
      pendingDuctTeleport: null,
      subwayPending: false,
      subwayTeleport: false,
      sewerTokensAvailable: state.useSewerTokens ? INITIAL_SEWER_TOKENS : 0,
      inSewer: false,
      spellAttemptedThisTurn: false,
      mustMoveTowardTile: null,
      studentLoanReturn: null,
      zombieAllyActive: false
    });
  }

  rebuildPlayerById();
  state.currentPlayerIndex = 0;
  state.deckFilters = deckFilters || {};
  state.eventDeckFilters = eventFilters ?? deckFilters ?? {};
  state.board = new Map();
  state.sewerTokenSpaces = new Map();
  state.pendingSewerTokenPlace = null;
  state.mapDeck = buildMapDeck(deckFilters);
  // Build standalone decks for enabled standalone collections
  state.standaloneDecks = {};
  state.activeStandaloneDecks = new Set();
  const hasBaseCollection = deckFilters && Object.entries(COLLECTION_META).some(
    ([c, meta]) => meta.requiresBase === null && !meta.standaloneDeck && deckFilters[c]?.enabled
  );
  if (deckFilters) {
    Object.entries(COLLECTION_META).forEach(([collKey, meta]) => {
      if (!meta.standaloneDeck) return;
      const rule = deckFilters[collKey];
      if (!rule || !rule.enabled) return;
      state.standaloneDecks[collKey] = buildStandaloneDeck(collKey, deckFilters);
      // When no base collection is active (solo standalone play), unlock immediately.
      if (!hasBaseCollection) state.activeStandaloneDecks.add(collKey);
    });
  }
  state.eventDeck = buildEventDeck(eventFilters ?? deckFilters);
  state.eventDiscardPile = [];
  state.breakthroughConnections = new Set();
  state.floor2Tiles = new Set();
  state.noZombieTiles = new Set();
  state.regularZombieEnhanced = null;
  state.pendingRocketLauncher = null;
  state.forcedNextOpponentId = null;
  state.discardPile = [];
  state.zombies = new Map();
  state.spaceTokens = new Map();
  resetStepProgress(STEP.DRAW_TILE);
  state.turnNumber = 1;
  state.gameOver = false;
  state.winInfo = null;
  state.lastCombatResult = null;
  clearPendingTileState();
  _boardBoundsCache = { minX: null, maxX: null, minY: null, maxY: null };
  _boardCellFps.clear();
  _trailFp = null;
  _trailSvgEl = null;
  state.logs = [];

  const deckMeta = {};
  state.mapDeck.forEach((t) => {
    if (!deckMeta[t.name]) deckMeta[t.name] = { count: 0, type: t.type };
    deckMeta[t.name].count += 1;
    t._copyNum = deckMeta[t.name].count;
  });
  Object.entries(state.standaloneDecks).forEach(([, deck]) => {
    deck.forEach((t) => {
      if (!deckMeta[t.name]) deckMeta[t.name] = { count: 0, type: t.type };
      deckMeta[t.name].count += 1;
      t._copyNum = deckMeta[t.name].count;
    });
  });

  const startTile = buildStartTile(deckFilters);
  startTile._copyNum = 1;
  deckMeta[startTile.name] = { count: 1, type: startTile.type, prePlaced: true };
  state.discardPile.push(startTile);

  state.deckStartCounts = deckMeta;
  const standaloneTotalCount = Object.values(state.standaloneDecks).reduce((s, d) => s + d.length, 0);
  state.baseMapDeckStartCount = state.mapDeck.length;
  state.deckStartTotal = state.mapDeck.length + 1 + standaloneTotalCount; // +1 for the pre-placed start tile
  state.eventDeckStartTotal = state.eventDeck.length;

  // Stamp placedDeck so the shortCode badge shows only the active collection.
  if (!hasBaseCollection) {
    const firstSAKey = Object.keys(state.standaloneDecks)[0];
    if (firstSAKey) startTile.placedDeck = firstSAKey;
  } else {
    const startCollKeys = Object.keys(startTile.collection || {});
    const activeBaseKey = startCollKeys.find((c) => {
      const meta = COLLECTION_META[c];
      return meta && meta.requiresBase === null && !meta.standaloneDeck && deckFilters[c]?.enabled;
    });
    if (activeBaseKey) startTile.placedDeck = activeBaseKey;
  }
  startTile.placedRotation = 0;
  const startTilePlacedRules = getRotatedConnectorRules(startTile.connectors, 0);
  if (startTilePlacedRules) {
    // Only open DISABLE_ON_SOLO on the companion-facing side. Companions are always placed
    // at setup regardless of solo/multi mode, so that side must stay walkable. Other
    // DISABLE_ON_SOLO connectors (e.g. the map-road side of Front Door facing south) should
    // remain closed in solo play.
    const companionDir = startTile.companionDir || null;
    startTile.placedConnectorRules = Object.fromEntries(
      Object.entries(startTilePlacedRules).map(([dir, rule]) => [
        dir,
        (rule === CONNECTOR_RULE.DISABLE_ON_SOLO && dir === companionDir)
          ? CONNECTOR_RULE.ANY
          : rule
      ])
    );
  }
  addTile(0, 0, startTile);

  // For non-Z1 start tiles, players begin on the DISABLE_ON_SOLO connector subtile
  // (the gateway side that faces the outside world).
  // Z1's Town Square has no DISABLE_ON_SOLO connector so players stay at center (1,1).
  if (startTile.connectors && typeof startTile.connectors === "object" && !Array.isArray(startTile.connectors)) {
    const gwDir = Object.entries(startTile.connectors).find(([, rule]) => rule === CONNECTOR_RULE.DISABLE_ON_SOLO)?.[0];
    if (gwDir && DOOR_LOCAL[gwDir]) {
      const sx = DOOR_LOCAL[gwDir].x;
      const sy = DOOR_LOCAL[gwDir].y;
      state.players.forEach((p) => { p.x = sx; p.y = sy; });
    }
  }

  // Auto-place any companion tiles declared on the start tile (e.g. Front Gate → Straight → 4-Way).
  if (startTile.companionTiles && startTile.companionTiles.length > 0) {
    state.pendingCompanionTiles = [];
    state.pendingTileDeck = startTile.placedDeck || "base";
    startTile.companionTiles.forEach(({ name }) => {
      let idx = -1;
      let sourceDeck = null;
      for (const deck of Object.values(state.standaloneDecks)) {
        idx = deck.findIndex((t) => t.name === name);
        if (idx !== -1) { sourceDeck = deck; break; }
      }
      if (idx === -1) {
        idx = state.mapDeck.findIndex((t) => t.name === name);
        if (idx !== -1) sourceDeck = state.mapDeck;
      }
      if (idx !== -1 && sourceDeck) {
        state.pendingCompanionTiles.push(sourceDeck.splice(idx, 1)[0]);
      } else {
        logLine(`Note: companion tile "${name}" not found in any deck — skipped.`);
      }
    });
    if (state.pendingCompanionTiles.length > 0) placeCompanionTilesFor(startTile, 0, 0, 0);
    state.pendingCompanionTiles = [];
    state.pendingTileDeck = null;
  }

  const summaryParts = Object.entries(deckMeta).map(([name, m]) => `${name} ×${m.count}`).join(", ");
  logLine(`Tile deck: ${state.deckStartTotal} card(s) — ${summaryParts}`);
  Object.entries(state.standaloneDecks).forEach(([collKey, deck]) => {
    const label = COLLECTION_META[collKey]?.label || collKey;
    const isUnlocked = state.activeStandaloneDecks.has(collKey);
    logLine(`${label} deck: ${deck.length} tile(s) — ${isUnlocked ? "ready to draw." : "locked until gateway tile is placed."}`);
  });
  logLine(`${startTile.name} deployed. No zombies are auto-placed at setup.`);
  logLine(`${currentPlayer().name} goes first (most recent zombie movie watcher).`);

  render();
}

function drawAndPlaceTile(deckId = "base") {
  if (state.step !== STEP.DRAW_TILE || state.gameOver) return;

  // Standalone deck: must be active (gateway tile placed)
  if (deckId !== "base" && !state.activeStandaloneDecks.has(deckId)) return;

  const deck = deckId === "base" ? state.mapDeck : state.standaloneDecks[deckId];
  if (!deck) return;

  if (deck.length === 0) {
    const label = deckId === "base" ? "Map deck" : (COLLECTION_META[deckId]?.label || deckId) + " deck";
    logLine(`${label} is empty — skipping tile draw, continuing turn.`);
    state.step = STEP.DRAW_EVENTS;
    render();
    return;
  }

  const tile = deck.shift();
  const drawnName = getTileDisplayName(tile);
  const options = getPlacementOptions(tile, deckId);
  if (options.length === 0) {
    logLine(`No valid placement for ${drawnName}; tile discarded, continuing turn.`);
    state.discardPile.push(tile);
    state.step = STEP.DRAW_EVENTS;
    render();
    return;
  }

  state.pendingTile = tile;
  state.pendingRotation = options[0]?.rotation ?? 0;
  state.pendingTileOptions = options;
  state.pendingTileDeck = deckId;
  state.pendingCompanionTiles = [];

  if (tile.companionTiles && tile.companionTiles.length > 0) {
    tile.companionTiles.forEach(({ name }) => {
      // Search current deck first, then base deck, then all standalone decks.
      let idx = deck.findIndex((t) => t.name === name);
      let sourceDeck = deck;
      if (idx === -1) {
        const baseIdx = state.mapDeck.findIndex((t) => t.name === name);
        if (baseIdx !== -1) { idx = baseIdx; sourceDeck = state.mapDeck; }
      }
      if (idx === -1) {
        for (const sd of Object.values(state.standaloneDecks)) {
          const sdIdx = sd.findIndex((t) => t.name === name);
          if (sdIdx !== -1) { idx = sdIdx; sourceDeck = sd; break; }
        }
      }
      if (idx !== -1) {
        state.pendingCompanionTiles.push(sourceDeck.splice(idx, 1)[0]);
      } else {
        logLine(`Note: companion tile "${name}" not found in any deck — will be skipped when placed.`);
      }
    });
  }

  const cp = currentPlayer();
  if (cp.tileHijackNotify != null) {
    const hijacker = getPlayerById(cp.tileHijackNotify);
    cp.tileHijackNotify = null;
    if (tile.type === "helipad") {
      logLine(`I Think It's Over Here has no effect on Helipad tiles — ${cp.name} places it normally.`);
    } else if (hijacker) {
      logLine(`${hijacker.name} played I Think It's Over Here — ${hijacker.name} places this tile instead of ${cp.name}.`);
    }
  }

  const companionNote = state.pendingCompanionTiles.length > 0
    ? ` (+${state.pendingCompanionTiles.map((t) => t.name).join(", ")})`
    : "";
  logLine(`${cp.name} drew ${drawnName}${companionNote}. Click a highlighted map space to place it.`, "quiet");
  render();
}

function rotatePendingTile(delta) {
  if (!state.pendingTile || state.gameOver || state.step !== STEP.DRAW_TILE) {
    return;
  }
  let next = (state.pendingRotation + delta + 4) % 4;
  // Skip rotations that have no valid placements
  for (let i = 0; i < 3; i++) {
    if (state.pendingTileOptions.some((o) => o.rotation === next)) break;
    next = (next + delta + 4) % 4;
  }
  state.pendingRotation = next;
  logLine(`${currentPlayer().name} rotated pending tile to ${next * 90} degrees.`, "quiet");
  render();
}

// Auto-place companion tiles when a tile with companions is placed.
// Uses state.pendingCompanionTiles (reserved at draw time).
// Compound direction is determined from which side of the placed tile connects to an existing
// board tile — companions always chain away from the map connection into open space.
function placeCompanionTilesFor(mainTile, tileX, tileY, tileRotation) {
  if (!state.pendingCompanionTiles || state.pendingCompanionTiles.length === 0) return;

  const baseDir = mainTile.companionDir || "S";
  const companionSide = rotateDir(baseDir, tileRotation);
  const mapSide = rotateDir(DIRS[baseDir].opposite, tileRotation);
  const companionNeighbor = key(tileX + DIRS[companionSide].x, tileY + DIRS[companionSide].y);
  const mapNeighbor = key(tileX + DIRS[mapSide].x, tileY + DIRS[mapSide].y);
  const compoundDir = state.board.has(mapNeighbor) ? companionSide
    : state.board.has(companionNeighbor) ? mapSide
    : companionSide;

  let cx = tileX;
  let cy = tileY;

  state.pendingCompanionTiles.forEach((companion) => {
    cx += DIRS[compoundDir].x;
    cy += DIRS[compoundDir].y;

    const companionCols = Object.keys(resolveCollectionCounts(companion));
    const companionDeck = companionCols.length > 0 && COLLECTION_META[companionCols[0]]?.standaloneDeck
      ? companionCols[0]
      : (state.pendingTileDeck || "base");

    if (state.board.has(key(cx, cy))) {
      logLine(`Cannot place ${companion.name} at (${cx}, ${cy}) — space already occupied; returning to deck.`);
      const returnDeck = companionDeck === "base" ? state.mapDeck : (state.standaloneDecks[companionDeck] || state.mapDeck);
      returnDeck.unshift(companion);
      return;
    }

    const rotatedConnectors = getRotatedConnectors(companion.connectors, tileRotation);
    const sourceSubTiles = getTileSubTileMap(companion);
    const rotatedSubTiles = getRotatedSubTiles(sourceSubTiles, tileRotation);
    const companionPlacedRules = getRotatedConnectorRules(companion.connectors, tileRotation);
    addTile(cx, cy, {
      ...companion,
      connectors: rotatedConnectors,
      ...(companionPlacedRules ? { placedConnectorRules: companionPlacedRules } : {}),
      placedDeck: companionDeck,
      placedRotation: tileRotation,
      ...(rotatedSubTiles ? { subTiles: rotatedSubTiles } : {})
    });
    stampFloorForPlacedTile(cx, cy);
    openOnlyConnectorWalls(cx, cy);

    const spawnCount = getZombieSpawnCountForPlacedTile(companion, rotatedConnectors);
    if (companion.zombieSpawnMode === ZOMBIE_SPAWN_MODE.BY_EXITS) {
      const exitType = Object.keys(companion.zombies || {})[0] || ZOMBIE_TYPE.REGULAR;
      const placed = spawnZombiesOnRoadExits(cx, cy, rotatedConnectors, exitType);
      if (placed > 0) logLine(`${placed} zombie(s) placed on ${companion.name} from ${spawnCount} access point(s).`);
    } else if (companion.zombieSpawnMode === ZOMBIE_SPAWN_MODE.D6_ROLL) {
      const rollType = Object.keys(companion.zombies || {})[0] || ZOMBIE_TYPE.REGULAR;
      const placed = spawnZombiesOnTile(cx, cy, spawnCount, companion.name, rollType);
      if (placed > 0) logLine(`${placed} zombie(s) placed on ${companion.name} (d6 roll: ${spawnCount}).`);
    } else if (spawnCount > 0) {
      let placed = 0;
      Object.entries(companion.zombies || { [ZOMBIE_TYPE.REGULAR]: spawnCount }).forEach(([type, count]) => {
        placed += spawnZombiesOnTile(cx, cy, count, companion.name, type);
      });
      if (placed > 0) logLine(`${placed} zombie(s) placed on ${companion.name} from card value.`);
    }

    state.discardPile.push(companion);
    logLine(`${companion.name} auto-placed at (${cx}, ${cy}) as part of ${mainTile.name}.`);
  });
}

// BFS from the escalator's floor-2 connector sides, marking all reachable tiles as floor 2.
// Called once after the Escalator is placed, in case tiles were already adjacent on that side.
function markFloor2FromEscalator(escX, escY, escTile) {
  const floor2Dirs = (escTile.floor2Connectors || []).map(d => rotateDir(d, escTile.placedRotation || 0));
  const queue = [];
  for (const dir of floor2Dirs) {
    const nk = key(escX + DIRS[dir].x, escY + DIRS[dir].y);
    const neighbor = state.board.get(nk);
    if (neighbor && !state.floor2Tiles.has(nk)) {
      state.floor2Tiles.add(nk);
      queue.push(nk);
    }
  }
  while (queue.length > 0) {
    const cur = queue.shift();
    const { x, y } = parseKey(cur);
    const tile = state.board.get(cur);
    if (!tile || tile.name === TILE_NAME.ESCALATOR) continue;
    for (const [dir, def] of Object.entries(DIRS)) {
      if (!getConnectorDirs(tile.connectors).includes(dir)) continue;
      const nk = key(x + def.x, y + def.y);
      const neighbor = state.board.get(nk);
      if (!neighbor || state.floor2Tiles.has(nk) || neighbor.name === TILE_NAME.ESCALATOR) continue;
      if (!getConnectorDirs(neighbor.connectors).includes(def.opposite)) continue;
      state.floor2Tiles.add(nk);
      queue.push(nk);
    }
  }
}

// Stamp floor on a newly placed tile and trigger escalator propagation if needed.
function stampFloorForPlacedTile(x, y) {
  if (!state.floor2Tiles) state.floor2Tiles = new Set();
  const placedTile = state.board.get(key(x, y));
  if (!placedTile) return;
  if (placedTile.name === "Escalator") {
    markFloor2FromEscalator(x, y, placedTile);
    return;
  }
  const floor = getFloorForPlacement(x, y, placedTile.connectors || []);
  if (floor === 2) state.floor2Tiles.add(key(x, y));
}

// Returns the 3 subtile coords along the edge of a tile facing `dir`.
function getEdgeSubtileCoords(dir) {
  const last = TILE_DIM - 1;
  const result = [];
  for (let i = 0; i < TILE_DIM; i++) {
    if      (dir === "N") result.push({ lx: i,    ly: 0    });
    else if (dir === "S") result.push({ lx: i,    ly: last });
    else if (dir === "W") result.push({ lx: 0,    ly: i    });
    else if (dir === "E") result.push({ lx: last, ly: i    });
  }
  return result;
}

// Open movement and swap wall→door on the edge subtiles of `tile` facing `dir`.
function openEdgeWall(tile, dir) {
  if (!tile.subTiles) return;
  getEdgeSubtileCoords(dir).forEach(({ lx, ly }) => {
    const cell = tile.subTiles[key(lx, ly)];
    if (!cell || !cell.walkable) return;
    if (cell.enterFrom[dir] && cell.exitTo[dir]) return; // already open
    cell.enterFrom[dir] = true;
    cell.exitTo[dir]   = true;
    if (cell.walls) cell.walls = cell.walls.filter((w) => w !== dir);
    if (!cell.doors) cell.doors = [];
    if (!cell.doors.includes(dir)) cell.doors.push(dir);
  });
}

// After any tile is placed at (tileX, tileY), find ONLY↔DESIGNATED connector pairs
// in all 4 directions and open the blocking walls on the ONLY-connector side.
function openOnlyConnectorWalls(tileX, tileY) {
  const placedTile = state.board.get(key(tileX, tileY));
  if (!placedTile) return;

  Object.entries(DIRS).forEach(([dir, d]) => {
    const neighborKey = key(tileX + d.x, tileY + d.y);
    const neighbor = state.board.get(neighborKey);
    if (!neighbor) return;

    const backDir = DIRS[dir].opposite;
    const placedRule   = placedTile.placedConnectorRules?.[dir];
    const neighborRule = neighbor.placedConnectorRules?.[backDir];

    // Need one ONLY side and one DESIGNATED side
    const placedIsOnly       = placedRule   === CONNECTOR_RULE.ONLY;
    const neighborIsOnly     = neighborRule === CONNECTOR_RULE.ONLY;
    const placedIsDesignated = placedRule   === CONNECTOR_RULE.DESIGNATED;
    const neighborIsDesignated = neighborRule === CONNECTOR_RULE.DESIGNATED;

    if (placedIsOnly && neighborIsDesignated) {
      openEdgeWall(placedTile, dir);
    }
    if (neighborIsOnly && placedIsDesignated) {
      openEdgeWall(neighbor, backDir);
    }
  });
}

function placePendingTileAt(x, y) {
  if (state.step !== STEP.DRAW_TILE || state.gameOver || !state.pendingTile) {
    return;
  }

  const optionsAtCoord = state.pendingTileOptions.filter(
    (o) => o.x === x && o.y === y && o.rotation === state.pendingRotation
  );
  if (optionsAtCoord.length === 0) {
    return;
  }

  const placement = optionsAtCoord[0];
  const tile = state.pendingTile;
  const sourceSubTiles = getTileSubTileMap(tile);
  const rotatedSubTiles = getRotatedSubTiles(sourceSubTiles, placement.rotation);

  const placedConnectorRules = getRotatedConnectorRules(tile.connectors, placement.rotation);
  const placedConnectorOnlyTarget = tile.connectorOnlyTarget
    ? Object.fromEntries(Object.entries(tile.connectorOnlyTarget).map(([d, n]) => [rotateDir(d, placement.rotation), n]))
    : null;
  addTile(placement.x, placement.y, {
    ...tile,
    connectors: placement.connectors,
    ...(placedConnectorRules ? { placedConnectorRules } : {}),
    ...(placedConnectorOnlyTarget ? { placedConnectorOnlyTarget } : {}),
    placedDeck: state.pendingTileDeck || "base",
    placedRotation: placement.rotation,
    ...(rotatedSubTiles ? { subTiles: rotatedSubTiles } : {})
  });
  stampFloorForPlacedTile(placement.x, placement.y);
  openOnlyConnectorWalls(placement.x, placement.y);

  const placedName = getTileDisplayName(tile);
  logLine(`${currentPlayer().name} placed ${placedName} at (${placement.x}, ${placement.y}).`);

  const spawnCount = getZombieSpawnCountForPlacedTile(tile, placement.connectors);
  let placed = 0;
  if (tile.zombieSpawnMode === ZOMBIE_SPAWN_MODE.BY_EXITS) {
    const exitType = Object.keys(tile.zombies || {})[0] || ZOMBIE_TYPE.REGULAR;
    placed = spawnZombiesOnRoadExits(placement.x, placement.y, placement.connectors, exitType);
  } else if (tile.zombieSpawnMode === ZOMBIE_SPAWN_MODE.D6_ROLL) {
    const rollType = Object.keys(tile.zombies || {})[0] || ZOMBIE_TYPE.REGULAR;
    placed = spawnZombiesOnTile(placement.x, placement.y, spawnCount, placedName, rollType);
  } else {
    Object.entries(tile.zombies || { [ZOMBIE_TYPE.REGULAR]: spawnCount }).forEach(([type, count]) => {
      placed += spawnZombiesOnTile(placement.x, placement.y, count, placedName, type);
    });
  }

  if (spawnCount > 0 && tile.zombieSpawnMode === ZOMBIE_SPAWN_MODE.BY_EXITS) {
    logLine(`${placed} zombie(s) placed on non-named tile from ${spawnCount} access point(s).`);
  }
  if (spawnCount > 0 && tile.zombieSpawnMode === ZOMBIE_SPAWN_MODE.BY_CARD) {
    logLine(`${placed} zombie(s) placed inside ${placedName} from card value.`);
  }
  if (spawnCount > 0 && tile.zombieSpawnMode === ZOMBIE_SPAWN_MODE.D6_ROLL) {
    logLine(`${placed} zombie(s) placed on ${placedName} (d6 roll: ${spawnCount}).`);
  }

  if ((tile.zombieSpawnMode === ZOMBIE_SPAWN_MODE.BY_CARD || tile.zombieSpawnMode === ZOMBIE_SPAWN_MODE.D6_ROLL) && ((tile.hearts || 0) > 0 || (tile.bullets || 0) > 0)) {
    placeBuildingTokens(placement.x, placement.y, tile.hearts || 0, tile.bullets || 0);
    logLine(`${placedName} received item tokens (H${tile.hearts || 0}, B${tile.bullets || 0}).`, "quiet");
  }

  state.discardPile.push(tile);

  // Unlock standalone deck when a gateway tile is placed
  if (getGatewayConnectorDir(tile)) {
    const tileCols = Object.keys(resolveCollectionCounts(tile));
    tileCols.forEach((collKey) => {
      if (state.standaloneDecks[collKey] && !state.activeStandaloneDecks.has(collKey)) {
        state.activeStandaloneDecks.add(collKey);
        const label = COLLECTION_META[collKey]?.label || collKey;
        logLine(`${label} deck unlocked — you may now draw from it.`);
      }
    });
  }

  placeCompanionTilesFor(tile, placement.x, placement.y, placement.rotation);
  clearPendingTileState();
  state.step = STEP.COMBAT;
  autoSkipCombatIfClear();
  render();
}
