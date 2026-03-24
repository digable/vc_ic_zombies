function setupGame(playerCount, deckFilters = null, eventFilters = null) {
  state.players = [];
  for (let i = 0; i < playerCount; i += 1) {
    state.players.push({
      id: i + 1,
      name: `Shotgun Guy ${i + 1}`,
      hearts: 3,
      bullets: 3,
      kills: 0,
      attack: 0,
      hand: [],
      items: [],
      eventUsedThisRound: false,
      tempCombatBonus: 0,
      shotgunCharges: 0,
      tileCombatBonus: 0,
      tileCombatBonusTile: null,
      movementBonus: 0,
      cannotMoveTurns: 0,
      cannotPlayCardTurns: 0,
      noCombatThisTurn: false,
      maxMoveNextTurn: null,
      forcedDirection: null,
      brainCramp: null,
      claustrophobiaNextTurn: false,
      claustrophobiaActive: false,
      halfMovementNextTurn: false,
      x: 1,
      y: 1,
      knockedOut: false,
      knockouts: 0
    });
  }

  state.currentPlayerIndex = 0;
  state.board = new Map();
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
  state.discardPile = [];
  state.zombies = new Map();
  state.spaceTokens = new Map();
  resetStepProgress(STEP.DRAW_TILE);
  state.turnNumber = 1;
  state.gameOver = false;
  state.winInfo = null;
  state.lastCombatResult = null;
  clearPendingTileState();
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
  addTile(0, 0, startTile);

  const summaryParts = Object.entries(deckMeta).map(([name, m]) => `${name} ×${m.count}`).join(", ");
  logLine(`Tile deck: ${state.deckStartTotal} card(s) — ${summaryParts}`);
  Object.entries(state.standaloneDecks).forEach(([collKey, deck]) => {
    const label = COLLECTION_META[collKey]?.label || collKey;
    const isUnlocked = state.activeStandaloneDecks.has(collKey);
    logLine(`${label} deck: ${deck.length} tile(s) — ${isUnlocked ? "ready to draw." : "locked until gateway tile is placed."}`);
  });
  logLine("Town Square deployed. No zombies are auto-placed at setup.");
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
  state.pendingRotation = 0;
  state.pendingTileOptions = options;
  state.pendingTileDeck = deckId;
  state.pendingCompanionTiles = [];

  if (tile.companionTiles && tile.companionTiles.length > 0) {
    tile.companionTiles.forEach(({ name }) => {
      // Search current deck first, then all standalone decks.
      let idx = deck.findIndex((t) => t.name === name);
      let sourceDeck = deck;
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

  const companionNote = state.pendingCompanionTiles.length > 0
    ? ` (+${state.pendingCompanionTiles.map((t) => t.name).join(", ")})`
    : "";
  logLine(`${currentPlayer().name} drew ${drawnName}${companionNote}. Click a highlighted map space to place it.`);
  render();
}

function rotatePendingTile(delta) {
  if (!state.pendingTile || state.gameOver || state.step !== STEP.DRAW_TILE) {
    return;
  }
  const next = (state.pendingRotation + delta + 4) % 4;
  state.pendingRotation = next;
  logLine(`${currentPlayer().name} rotated pending tile to ${next * 90} degrees.`);
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
    addTile(cx, cy, {
      ...companion,
      connectors: rotatedConnectors,
      placedDeck: companionDeck,
      placedRotation: tileRotation,
      ...(rotatedSubTiles ? { subTiles: rotatedSubTiles } : {})
    });

    const spawnCount = getZombieSpawnCountForPlacedTile(companion, rotatedConnectors);
    if (companion.zombieSpawnMode === "by_exits") {
      const exitType = Object.keys(companion.zombies || {})[0] || ZOMBIE_TYPE.REGULAR;
      const placed = spawnZombiesOnRoadExits(cx, cy, rotatedConnectors, exitType);
      if (placed > 0) logLine(`${placed} zombie(s) placed on ${companion.name} from ${spawnCount} access point(s).`);
    }

    state.discardPile.push(companion);
    logLine(`${companion.name} auto-placed at (${cx}, ${cy}) as part of ${mainTile.name}.`);
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

  addTile(placement.x, placement.y, {
    ...tile,
    connectors: placement.connectors,
    placedDeck: state.pendingTileDeck || "base",
    placedRotation: placement.rotation,
    ...(rotatedSubTiles ? { subTiles: rotatedSubTiles } : {})
  });

  const placedName = getTileDisplayName(tile);
  logLine(`${currentPlayer().name} placed ${placedName} at (${placement.x}, ${placement.y}).`);

  const spawnCount = getZombieSpawnCountForPlacedTile(tile, placement.connectors);
  let placed = 0;
  if (tile.zombieSpawnMode === "by_exits") {
    const exitType = Object.keys(tile.zombies || {})[0] || ZOMBIE_TYPE.REGULAR;
    placed = spawnZombiesOnRoadExits(placement.x, placement.y, placement.connectors, exitType);
  } else {
    Object.entries(tile.zombies || { [ZOMBIE_TYPE.REGULAR]: spawnCount }).forEach(([type, count]) => {
      placed += spawnZombiesOnTile(placement.x, placement.y, count, placedName, type);
    });
  }

  if (spawnCount > 0 && tile.zombieSpawnMode === "by_exits") {
    logLine(`${placed} zombie(s) placed on non-named tile from ${spawnCount} access point(s).`);
  }
  if (spawnCount > 0 && tile.zombieSpawnMode === "by_card") {
    logLine(`${placed} zombie(s) placed inside ${placedName} from card value.`);
  }

  if (tile.zombieSpawnMode === "by_card" && ((tile.hearts || 0) > 0 || (tile.bullets || 0) > 0)) {
    placeBuildingTokens(placement.x, placement.y, tile.hearts || 0, tile.bullets || 0);
    logLine(`${placedName} received item tokens (H${tile.hearts || 0}, B${tile.bullets || 0}).`);
  }

  state.discardPile.push(tile);

  // Unlock standalone deck when a gateway tile is placed
  if (tile.zoneGatewayConnector) {
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
