function currentPlayer() {
  return state.players[state.currentPlayerIndex];
}

function isCombatRequiredForCurrentPlayer() {
  const player = currentPlayer();
  if (player.noCombatThisTurn) {
    return false;
  }
  return state.zombies.has(key(player.x, player.y));
}

function autoSkipCombatIfClear() {
  if (state.step !== STEP.COMBAT || state.gameOver) {
    return;
  }
  if (currentPlayer().noCombatThisTurn) {
    logLine(`${currentPlayer().name} is under a no-combat effect. Combat step skipped.`);
    state.step = STEP.DRAW_EVENTS;
    return;
  }
  if (isCombatRequiredForCurrentPlayer()) {
    return;
  }

  logLine(`${currentPlayer().name} has no zombie in current space. Combat step skipped.`);
  state.step = STEP.DRAW_EVENTS;
}

function autoSkipZombieMoveIfClear() {
  if (state.step !== STEP.MOVE_ZOMBIES || state.gameOver) {
    return;
  }
  if (state.zombies.size > 0) {
    return;
  }

  logLine(`${currentPlayer().name} has no zombies to move. Zombie movement skipped.`);
  state.currentZombieRoll = null;
  state.step = STEP.DISCARD;
}
