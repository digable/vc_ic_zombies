function setupGame(playerCount, deckFilters = null) {
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
      knockedOut: false
    });
  }

  state.currentPlayerIndex = 0;
  state.board = new Map();
  state.mapDeck = buildMapDeck(deckFilters);
  state.eventDeck = buildEventDeck();
  state.eventDiscardPile = [];
  state.discardPile = [];
  state.zombies = new Set();
  state.spaceTokens = new Map();
  resetStepProgress(STEP.DRAW_TILE);
  state.turnNumber = 1;
  state.gameOver = false;
  state.lastCombatResult = null;
  clearPendingTileState();
  state.logs = [];

  const deckMeta = {};
  state.mapDeck.forEach((t) => {
    if (!deckMeta[t.name]) deckMeta[t.name] = { count: 0, type: t.type };
    deckMeta[t.name].count += 1;
    t._copyNum = deckMeta[t.name].count;
  });

  const townSquare = buildTownSquareTile();
  townSquare._copyNum = 1;
  deckMeta[townSquare.name] = { count: 1, type: townSquare.type, prePlaced: true };
  state.discardPile.push(townSquare);

  state.deckStartCounts = deckMeta;
  state.deckStartTotal = state.mapDeck.length;
  state.eventDeckStartTotal = state.eventDeck.length;

  addTile(0, 0, buildTownSquareTile());

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
    logLine("Map deck is empty. No tile was drawn.");
    state.step = STEP.COMBAT;
    render();
    return;
  }

  const tile = state.mapDeck.shift();
  const drawnName = getTileDisplayName(tile);
  const options = getPlacementOptions(tile);
  if (options.length === 0) {
    logLine(`No valid placement for ${drawnName}; tile discarded.`);
    state.discardPile.push(tile);
    state.step = STEP.COMBAT;
    render();
    return;
  }

  state.pendingTile = tile;
  state.pendingRotation = 0;
  state.pendingTileOptions = options;
  logLine(`${currentPlayer().name} drew ${drawnName}. Click a highlighted map space to place it.`);
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
    placed = spawnZombiesOnRoadExits(placement.x, placement.y, placement.connectors);
  } else {
    placed = spawnZombiesOnTile(placement.x, placement.y, spawnCount, placedName);
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
  clearPendingTileState();
  state.step = STEP.COMBAT;
  autoSkipCombatIfClear();
  render();
}
