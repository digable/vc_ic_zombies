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
  state.playerTrail = [];

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
  resetStepProgress(STEP.DRAW_TILE);

  logLine(`Turn passes to ${player.name}.`);

  const playerSpaceKey = key(player.x, player.y);
  if (state.zombies.has(playerSpaceKey) && !player.noCombatThisTurn) {
    state.step = STEP.COMBAT;
    logLine(`${player.name} starts the turn in a zombie space. Combat resolves immediately.`);
    const combat = resolveCombatForPlayer(player, {
      advanceStepWhenClear: false,
      endStepOnKnockout: true,
      resumeStepAfterPending: STEP.DRAW_TILE
    });
    if (combat.pending) {
      logLine(`${player.name} must resolve combat before continuing the turn.`);
    }
    render();
    return;
  }

  render();
}
