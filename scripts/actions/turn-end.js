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
  outgoing.tileCombatBonus = 0;
  outgoing.tileCombatBonusTile = null;
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
  outgoing.spellAttemptedThisTurn = false;
  outgoing.smellEffect = null;
  outgoing.lookinAtMePending = null;
  outgoing.tileHijackNotify = null;
  outgoing.claustrophobiaActive = false;
  outgoing.halfMovementNextTurn = false;
  outgoing.brainCramp = null;
  outgoing.movementHijack = null;
  outgoing.movingTogether = null;
  outgoing.musicShieldActive = false;
  outgoing.sleepChallengePending = false;
  if (outgoing.cannotMoveTurns > 0) {
    outgoing.cannotMoveTurns -= 1;
  }
  if ((outgoing.dogRepellentTurns ?? 0) > 0) {
    outgoing.dogRepellentTurns -= 1;
  }
  if ((outgoing.lockedToTileTurns ?? 0) > 0) {
    outgoing.lockedToTileTurns -= 1;
  }
  if (state.weaponsJammedCount > 0) state.weaponsJammedCount -= 1;
  if (state.movementRollFreezeCount > 0) state.movementRollFreezeCount -= 1;
  if (state.tokenPickupFrozenCount > 0) state.tokenPickupFrozenCount -= 1;
  if (state.bulletsCombatFrozenCount > 0) state.bulletsCombatFrozenCount -= 1;
  state.playerTrail = [];
  state.lastCombatResult = null;
  state.lastPlayedEventCard = null;
  state.zombieMovedSpaces = new Set();
  if (state.zombieAnimationTimer !== null) {
    clearTimeout(state.zombieAnimationTimer);
    state.zombieAnimationTimer = null;
  }

  if (outgoing.extraTurnPending) {
    outgoing.extraTurnPending = false;
    outgoing.eventUsedThisRound = false;
    outgoing.pageRemovedThisRound = false;
    outgoing.knockedOut = false;
    outgoing.dieRollPenalty = outgoing.nextTurnDieRollPenalty || 0;
    outgoing.nextTurnDieRollPenalty = 0;
    logLine(`${outgoing.name} takes an extra turn! (That's Not So Scary)`);
    resetStepProgress(STEP.DRAW_TILE);
    autoSkipDrawTileIfEmpty();
    render();
    return;
  }

  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  if (state.currentPlayerIndex === 0) {
    state.turnNumber += 1;
  }

  const player = currentPlayer();
  player.knockedOut = false;
  player.eventUsedThisRound = false;
  player.pageRemovedThisRound = false;
  player.spellAttemptedThisTurn = false;
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

  if (player.werewolfNextTurn) {
    player.werewolfNextTurn = false;
    triggerWerewolfCombat(player);
    syncToCloud();
    render();
    return;
  }

  if (player.sleepChallengePending) {
    player.sleepChallengePending = false;
    const sleepRoll = rollD6();
    logLine(`${player.name} must roll 1 or 6 to continue their turn (Don't go to sleep) — rolled ${sleepRoll}.`);
    if (sleepRoll === 1 || sleepRoll === 6) {
      logLine(`${player.name} rolled ${sleepRoll} — turn continues normally.`);
    } else {
      const spaceKey = playerKey(player);
      const tile = getTileAtSpace(player.x, player.y);
      const lx = getLocalCoord(player.x, spaceToTileCoord(player.x));
      const ly = getLocalCoord(player.y, spaceToTileCoord(player.y));
      if (!state.zombies.has(spaceKey) && isSubtileZombieViable(tile, lx, ly)) {
        state.zombies.set(spaceKey, { type: ZOMBIE_TYPE.REGULAR });
      }
      logLine(`${player.name} rolled ${sleepRoll} — turn lost and a zombie placed on their space.`);
      state.step = STEP.END;
      syncToCloud();
      render();
      return;
    }
  }

  const playerSpaceKey = playerKey(player);
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
    syncToCloud();
    render();
    return;
  }

  syncToCloud();
  render();
}
