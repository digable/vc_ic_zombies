function setupGame(playerCount) {
  state.players = [];
  for (let i = 0; i < playerCount; i += 1) {
    state.players.push({
      id: i + 1,
      name: `Shotgun Guy ${i + 1}`,
      hearts: 3,
      bullets: 3,
      kills: 0,
      hand: [],
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
  state.eventUsedThisTurn = false;
  state.movementBonus = 0;
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

function handleKnockout(player, options = {}) {
  const { endStep = true } = options;
  const lostKills = Math.floor(player.kills / 2);
  player.kills -= lostKills;
  player.hearts = 3;
  player.bullets = 3;
  player.x = 1;
  player.y = 1;
  player.knockedOut = true;
  if (endStep) {
    state.step = STEP.END;
  }
  logLine(`${player.name} was knocked out, lost ${lostKills} kills, and respawned at Town Square.`);
}

function resolveCombatForPlayer(player, options = {}) {
  const { advanceStepWhenClear = false, endStepOnKnockout = false } = options;
  const pKey = key(player.x, player.y);

  if (!state.zombies.has(pKey)) {
    if (advanceStepWhenClear && state.step === STEP.COMBAT) {
      state.step = STEP.DRAW_EVENTS;
    }
    return { fought: false, knockedOut: false };
  }

  const roll = rollD6();
  if (roll >= 4) {
    state.zombies.delete(pKey);
    player.kills += 1;
    logLine(`${player.name} won combat with a ${roll} and claimed a zombie kill.`);
  } else {
    const deficit = 4 - roll;
    const preferBullets = window.confirm(
      `${player.name} rolled ${roll} and missed by ${deficit}.\nPress OK to spend bullets first, Cancel to spend hearts first.`
    );

    let remaining = deficit;
    const spend = (resource) => {
      const used = Math.min(player[resource], remaining);
      player[resource] -= used;
      remaining -= used;
    };

    if (preferBullets) {
      spend("bullets");
      spend("hearts");
    } else {
      spend("hearts");
      spend("bullets");
    }

    state.zombies.delete(pKey);
    logLine(
      `${player.name} lost combat roll (${roll}) and paid ${deficit} resources to survive (hearts ${player.hearts}, bullets ${player.bullets}).`
    );

    if (remaining > 0 || player.hearts <= 0) {
      handleKnockout(player, { endStep: endStepOnKnockout });
      return { fought: true, knockedOut: true };
    }
  }

  checkWin(player);
  if (state.step === STEP.COMBAT) {
    state.step = STEP.DRAW_EVENTS;
  }
  return { fought: true, knockedOut: false };
}

function resolveCombatOnCurrentTile() {
  if (state.step !== STEP.COMBAT && state.step !== STEP.MOVE) {
    return;
  }

  const player = currentPlayer();
  resolveCombatForPlayer(player, {
    advanceStepWhenClear: true,
    endStepOnKnockout: state.step === STEP.MOVE
  });
  render();
}

function drawEventsToThree() {
  if (state.step !== STEP.DRAW_EVENTS || state.gameOver) {
    return;
  }

  const player = currentPlayer();
  while (player.hand.length < 3 && state.eventDeck.length > 0) {
    player.hand.push(state.eventDeck.shift());
  }

  logLine(`${player.name} refilled event hand to ${player.hand.length}.`);
  state.step = STEP.ROLL_MOVE;
  render();
}

function rollMovement() {
  if (state.step !== STEP.ROLL_MOVE || state.gameOver) {
    return;
  }

  const player = currentPlayer();
  const roll = rollD6();
  state.currentMoveRoll = roll;
  state.movesRemaining = roll + state.movementBonus;
  state.movementBonus = 0;
  state.step = STEP.MOVE;
  logLine(`${player.name} rolled movement ${roll} and can move ${state.movesRemaining} space(s).`);
  render();
}

function movePlayer(dir) {
  if (state.step !== STEP.MOVE || state.gameOver || state.movesRemaining <= 0) {
    return;
  }

  const player = currentPlayer();
  if (!canMove(player, dir)) {
    logLine(`${player.name} cannot move ${directionToArrow(dir)} from current tile.`);
    render();
    return;
  }

  const d = DIRS[dir];
  player.x += d.x;
  player.y += d.y;
  state.movesRemaining -= 1;

  const tile = getTileAtSpace(player.x, player.y);
  collectTokensAtPlayerSpace(player);
  logLine(`${player.name} moved ${directionToArrow(dir)} to ${getTileDisplayName(tile)} [space ${player.x}, ${player.y}].`);

  if (checkWin(player)) {
    render();
    return;
  }

  if (state.zombies.has(key(player.x, player.y))) {
    logLine(`${player.name} encountered a zombie and must fight.`);
    resolveCombatForPlayer(player, { advanceStepWhenClear: false, endStepOnKnockout: true });
    render();
    if (state.step === STEP.END) {
      return;
    }
  }

  if (state.movesRemaining <= 0) {
    state.step = STEP.MOVE_ZOMBIES;
    autoSkipZombieMoveIfClear();
  }

  render();
}

function endMovementEarly() {
  if (state.step !== STEP.MOVE || state.gameOver) {
    return;
  }
  state.movesRemaining = 0;
  state.step = STEP.MOVE_ZOMBIES;
  autoSkipZombieMoveIfClear();
  logLine(`${currentPlayer().name} ended movement early.`);
  render();
}

function moveZombies() {
  if (state.step !== STEP.MOVE_ZOMBIES || state.gameOver) {
    return;
  }

  if (state.zombies.size === 0) {
    autoSkipZombieMoveIfClear();
    render();
    return;
  }

  const roll = rollD6();
  state.currentZombieRoll = roll;

  const zombies = shuffle(Array.from(state.zombies));
  const moving = zombies.slice(0, roll);

  moving.forEach((zk) => {
    const next = moveZombieOneStep(zk);
    if (next !== zk) {
      state.zombies.delete(zk);
      state.zombies.add(next);

      state.players
        .filter((p) => key(p.x, p.y) === next)
        .forEach((p) => {
          logLine(`A zombie moved into ${p.name}'s space. Combat starts immediately.`);
          resolveCombatForPlayer(p, { advanceStepWhenClear: false, endStepOnKnockout: false });
        });
    }
  });

  logLine(`${currentPlayer().name} rolled ${roll} for zombie movement.`);
  state.step = STEP.DISCARD;
  render();
}

function toggleHandSelection(index) {
  if (state.selectedHandIndex === index) {
    state.selectedHandIndex = null;
  } else {
    state.selectedHandIndex = index;
  }
  render();
}

function playEvent(index) {
  if (state.gameOver) {
    return;
  }

  const player = currentPlayer();
  if (state.players[state.currentPlayerIndex] !== player) {
    return;
  }
  if (state.eventUsedThisTurn) {
    logLine("Only one event card can be played per turn.");
    render();
    return;
  }

  const card = player.hand[index];
  if (!card) {
    return;
  }

  player.hand.splice(index, 1);
  card.apply(player);
  state.discardPile.push(card);
  state.eventUsedThisTurn = true;

  checkWin(player);
  render();
}

function discardSelected() {
  if (state.step !== STEP.DISCARD || state.gameOver) {
    return;
  }

  const player = currentPlayer();
  if (state.selectedHandIndex !== null && player.hand[state.selectedHandIndex]) {
    const [card] = player.hand.splice(state.selectedHandIndex, 1);
    state.discardPile.push(card);
    logLine(`${player.name} discarded ${card.name}.`);
  } else {
    logLine(`${player.name} skipped discard.`);
  }

  state.selectedHandIndex = null;
  state.step = STEP.END;
  render();
}

function endTurn() {
  if (state.step !== STEP.END || state.gameOver) {
    return;
  }

  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  if (state.currentPlayerIndex === 0) {
    state.turnNumber += 1;
  }

  const player = currentPlayer();
  player.knockedOut = false;
  state.step = STEP.DRAW_TILE;
  state.movesRemaining = 0;
  state.currentMoveRoll = null;
  state.currentZombieRoll = null;
  state.selectedHandIndex = null;
  state.eventUsedThisTurn = false;
  state.movementBonus = 0;

  logLine(`Turn passes to ${player.name}.`);
  render();
}

function checkWin(player) {
  const tile = getTileAtSpace(player.x, player.y);
  if (tile && tile.isHelipad) {
    state.gameOver = true;
    logLine(`${player.name} reached the Helipad and wins.`);
    return true;
  }

  if (player.kills >= 25) {
    state.gameOver = true;
    logLine(`${player.name} reached 25 kills and wins.`);
    return true;
  }

  return false;
}
