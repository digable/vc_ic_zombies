function endTurn() {
  if (state.step !== STEP.END || state.gameOver) {
    return;
  }

  const outgoing = currentPlayer();
  while (outgoing.hand.length > 3) {
    const card = outgoing.hand.pop();
    state.discardPile.push(card);
    logLine(`${outgoing.name} discarded ${card.name} to meet hand limit 3.`);
  }
  outgoing.forcedDirection = null;
  outgoing.tempCombatBonus = 0;
  outgoing.noCombatThisTurn = false;

  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  if (state.currentPlayerIndex === 0) {
    state.turnNumber += 1;
  }

  const player = currentPlayer();
  player.knockedOut = false;
  player.eventUsedThisRound = false;
  if (player.cannotPlayCardTurns > 0) {
    player.cannotPlayCardTurns -= 1;
  }
  state.step = STEP.DRAW_TILE;
  state.movesRemaining = 0;
  state.currentMoveRoll = null;
  state.currentZombieRoll = null;
  state.selectedHandIndex = null;
  state.pendingCombatDecision = null;
  state.movementBonus = 0;
  state.moveFloorThisTurn = 0;

  logLine(`Turn passes to ${player.name}.`);
  render();
}
