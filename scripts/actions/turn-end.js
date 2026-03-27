function endTurn() {
  if (state.step !== STEP.END || state.gameOver) {
    return;
  }

  const outgoing = currentPlayer();
  while (outgoing.hand.length > MAX_HAND_SIZE) {
    const card = outgoing.hand.pop();
    state.discardPile.push(card);
    logLine(`${outgoing.name} discarded ${card.name} to meet hand limit ${MAX_HAND_SIZE}.`);
  }
  outgoing.forcedDirection = null;
  outgoing.tempCombatBonus = 0;
  outgoing.itemsUsedThisTurn = [];
  outgoing.dieRollPenalty = 0;
  outgoing.noCombatThisTurn = false;
  outgoing.inTheZone = false;
  if (state.regularZombieEnhanced?.playerId === outgoing.id) {
    state.regularZombieEnhanced.endTurnCount += 1;
    if (state.regularZombieEnhanced.endTurnCount >= 2) {
      state.regularZombieEnhanced = null;
      logLine("Government Enhanced Zombies effect expires — regular zombies return to 4+ kill roll.");
    }
  }
  outgoing.smellEffect = null;
  outgoing.lookinAtMePending = null;
  outgoing.tileHijackNotify = null;
  outgoing.claustrophobiaActive = false;
  outgoing.halfMovementNextTurn = false;
  outgoing.brainCramp = null;
  if (outgoing.cannotMoveTurns > 0) {
    outgoing.cannotMoveTurns -= 1;
  }
  state.playerTrail = [];
  state.lastCombatResult = null;

  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  if (state.currentPlayerIndex === 0) {
    state.turnNumber += 1;
  }

  const player = currentPlayer();
  player.knockedOut = false;
  player.eventUsedThisRound = false;
  player.dieRollPenalty = player.nextTurnDieRollPenalty || 0;
  player.nextTurnDieRollPenalty = 0;
  if (player.dieRollPenalty > 0) {
    logLine(`${player.name} is penalized -${player.dieRollPenalty} to all die rolls this turn (Abandon All Hope).`);
  }
  if (player.cannotPlayCardTurns > 0) {
    player.cannotPlayCardTurns -= 1;
  }
  resetStepProgress(STEP.DRAW_TILE);
  autoSkipDrawTileIfEmpty();

  logLine(`Turn passes to ${player.name}.`);

  const playerSpaceKey = key(player.x, player.y);
  if (state.step === STEP.DRAW_TILE && state.zombies.has(playerSpaceKey) && !player.noCombatThisTurn) {
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
