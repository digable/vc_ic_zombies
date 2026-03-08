function setupGame(playerCount) {
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
      eventUsedThisRound: false,
      tempCombatBonus: 0,
      cannotMoveTurns: 0,
      cannotPlayCardTurns: 0,
      noCombatThisTurn: false,
      maxMoveNextTurn: null,
      forcedDirection: null,
      x: 1,
      y: 1,
      knockedOut: false
    });
  }

  state.currentPlayerIndex = 0;
  state.board = new Map();
  state.mapDeck = buildMapDeck();
  state.eventDeck = buildEventDeck();
  state.discardPile = [];
  state.zombies = new Set();
  state.spaceTokens = new Map();
  state.step = STEP.DRAW_TILE;
  state.movesRemaining = 0;
  state.currentMoveRoll = null;
  state.currentZombieRoll = null;
  state.selectedHandIndex = null;
  state.turnNumber = 1;
  state.gameOver = false;
  state.lastCombatResult = null;
  state.pendingCombatDecision = null;
  state.movementBonus = 0;
  state.moveFloorThisTurn = 0;
  state.pendingTile = null;
  state.pendingRotation = 0;
  state.pendingTileOptions = [];
  state.logs = [];

  addTile(0, 0, {
    name: "Town Square",
    type: "town",
    connectors: ["N", "E", "S", "W"],
    zombieSpawnMode: "by_card",
    zombieCount: 0,
    hearts: 0,
    bullets: 0
  });

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

  addTile(placement.x, placement.y, {
    ...tile,
    connectors: placement.connectors
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

  state.pendingTile = null;
  state.pendingRotation = 0;
  state.pendingTileOptions = [];
  state.step = STEP.COMBAT;
  autoSkipCombatIfClear();
  render();
}
