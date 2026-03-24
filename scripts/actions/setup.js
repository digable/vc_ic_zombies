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

  const startTile = buildStartTile(deckFilters);
  startTile._copyNum = 1;
  deckMeta[startTile.name] = { count: 1, type: startTile.type, prePlaced: true };
  state.discardPile.push(startTile);

  state.deckStartCounts = deckMeta;
  state.deckStartTotal = state.mapDeck.length + 1; // +1 for the pre-placed start tile
  state.eventDeckStartTotal = state.eventDeck.length;

  addTile(0, 0, buildStartTile(deckFilters));

  const summaryParts = Object.entries(deckMeta).map(([name, m]) => `${name} ×${m.count}`).join(", ");
  logLine(`Tile deck: ${state.deckStartTotal} card(s) — ${summaryParts}`);
  logLine("Town Square deployed. No zombies are auto-placed at setup.");
  logLine(`${currentPlayer().name} goes first (most recent zombie movie watcher).`);

  render();
}

function drawAndPlaceTile() {
  if (state.step !== STEP.DRAW_TILE || state.gameOver) {
    return;
  }

  if (state.mapDeck.length === 0) {
    logLine("Map deck is empty — skipping tile draw, continuing turn.");
    state.step = STEP.DRAW_EVENTS;
    render();
    return;
  }

  const tile = state.mapDeck.shift();
  const drawnName = getTileDisplayName(tile);
  const options = getPlacementOptions(tile);
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
  state.pendingCompanionTiles = [];

  // If this tile has companions, pull them from the deck now so they're reserved.
  if (tile.companionTiles && tile.companionTiles.length > 0) {
    tile.companionTiles.forEach(({ name }) => {
      const idx = state.mapDeck.findIndex((t) => t.name === name);
      if (idx !== -1) {
        state.pendingCompanionTiles.push(state.mapDeck.splice(idx, 1)[0]);
      } else {
        logLine(`Note: companion tile "${name}" not found in deck — will be skipped when placed.`);
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

    if (state.board.has(key(cx, cy))) {
      logLine(`Cannot place ${companion.name} at (${cx}, ${cy}) — space already occupied; returning to deck.`);
      state.mapDeck.unshift(companion);
      return;
    }

    const rotatedConnectors = getRotatedConnectors(companion.connectors, tileRotation);
    const sourceSubTiles = getTileSubTileMap(companion);
    const rotatedSubTiles = getRotatedSubTiles(sourceSubTiles, tileRotation);

    addTile(cx, cy, {
      ...companion,
      connectors: rotatedConnectors,
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
  placeCompanionTilesFor(tile, placement.x, placement.y, placement.rotation);
  clearPendingTileState();
  state.step = STEP.COMBAT;
  autoSkipCombatIfClear();
  render();
}
