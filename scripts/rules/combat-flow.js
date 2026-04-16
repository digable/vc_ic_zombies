// Phase auto-advancement helpers — called after each state change to skip steps
// that have nothing to do (no zombie in space = skip combat, no zombies = skip zombie move).
// These are also called after combat resolves mid-movement or mid-zombie-phase to
// resume the correct step rather than always advancing forward.

function currentPlayer() {
  return state.players[state.currentPlayerIndex];
}

function playerHasNoCombat(player) {
  if (player.noCombatThisTurn) return true;
  if (player.noCombatTileKey) {
    return key(spaceToTileCoord(player.x), spaceToTileCoord(player.y)) === player.noCombatTileKey;
  }
  return false;
}

function isCombatRequiredForCurrentPlayer() {
  const player = currentPlayer();
  if (playerHasNoCombat(player)) {
    return false;
  }
  return state.zombies.has(playerKey(player));
}

function autoSkipCombatIfClear() {
  if (state.step !== STEP.COMBAT || state.gameOver) {
    return;
  }
  if (playerHasNoCombat(currentPlayer())) {
    logLine(`${currentPlayer().name} is under a no-combat effect. Combat step skipped.`, "quiet");
    state.step = STEP.DRAW_EVENTS;
    autoSkipDrawEventsIfFull();
    return;
  }
  if (isCombatRequiredForCurrentPlayer()) {
    return;
  }

  logLine(`${currentPlayer().name} has no zombie in current space. Combat step skipped.`, "quiet");
  state.step = STEP.DRAW_EVENTS;
  autoSkipDrawEventsIfFull();
}

function autoSkipZombieMoveIfClear() {
  if (state.step !== STEP.MOVE_ZOMBIES || state.gameOver) {
    return;
  }
  if (state.zombies.size > 0) {
    return;
  }

  logLine(`${currentPlayer().name} has no zombies to move. Zombie movement skipped.`, "quiet");
  state.currentZombieRoll = null;
  state.step = STEP.DISCARD;
}

function autoSkipDrawEventsIfFull() {
  if (state.step !== STEP.DRAW_EVENTS || state.gameOver) return;
  const player = currentPlayer();
  const drawTarget = (state.useGuts && player.guts != null) ? Math.max(1, player.guts) : MAX_HAND_SIZE;
  if (player.hand.length < drawTarget) return;

  if (player.hand.length > drawTarget) {
    logLine(`${player.name} has ${player.hand.length} card(s) but hand limit is ${drawTarget} — must discard before ending turn. Draw step skipped.`, "quiet");
  } else {
    logLine(`${player.name}'s event hand is full (${player.hand.length}/${drawTarget}) — draw step skipped.`, "quiet");
  }
  state.step = STEP.ROLL_MOVE;
}

function autoSkipDrawTileIfEmpty() {
  if (state.step !== STEP.DRAW_TILE || state.gameOver) {
    return;
  }
  if (state.mapDeck.length > 0) {
    return;
  }
  // Don't skip if any standalone deck still has tiles to draw from.
  const standaloneLeft = Object.entries(state.standaloneDecks || {}).some(
    ([collKey, deck]) => deck.length > 0 && state.activeStandaloneDecks.has(collKey)
  );
  if (standaloneLeft) {
    return;
  }

  logLine(`All tile decks are empty — tile draw step skipped.`);
  state.step = STEP.DRAW_EVENTS;
  autoSkipDrawEventsIfFull();
}
