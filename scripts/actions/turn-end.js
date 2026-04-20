function endTurn() {
  if (state.step !== STEP.END || state.gameOver) {
    return;
  }

  const outgoing = currentPlayer();
  const handLimit = (state.useGuts && outgoing.guts != null) ? Math.max(1, outgoing.guts) : MAX_HAND_SIZE;
  while (outgoing.hand.length > handLimit) {
    const card = outgoing.hand.pop();
    state.discardPile.push(card);
    logLine(`${outgoing.name} discarded ${card.name} to meet hand limit ${handLimit}.`);
  }
  // Student Loan — return borrowed items to their original owners
  if (outgoing.studentLoanReturn && outgoing.studentLoanReturn.length > 0) {
    for (const { card, fromPlayerId } of outgoing.studentLoanReturn) {
      const idx = outgoing.items.indexOf(card);
      const originalOwner = getPlayerById(fromPlayerId);
      if (idx >= 0) {
        outgoing.items.splice(idx, 1);
        if (originalOwner) {
          originalOwner.items.push(card);
          logLine(`${outgoing.name} returned ${card.name} to ${originalOwner.name} (Student Loan).`);
        } else {
          state.eventDiscardPile.push(card);
          logLine(`${outgoing.name}'s borrowed ${card.name} could not be returned — discarded.`);
        }
      } else {
        logLine(`${outgoing.name}'s borrowed ${card.name} was lost during the turn and cannot be returned.`);
      }
    }
    outgoing.studentLoanReturn = null;
  }

  outgoing.forcedDirection = null;
  outgoing.tempCombatBonus = 0;
  outgoing.tileCombatBonus = 0;
  outgoing.tileCombatBonusTile = null;
  outgoing.itemsUsedThisTurn = [];
  outgoing.dieRollPenalty = 0;
  outgoing.noCombatThisTurn = false;
  outgoing.fixedGearActive = false;
  outgoing.noCombatTileKey = null;
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
  outgoing.mustMoveTowardTile = null;
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
  if (state.itemsDisabledCount > 0) state.itemsDisabledCount -= 1;
  if (state.movementRollFreezeCount > 0) state.movementRollFreezeCount -= 1;
  if (state.tokenPickupFrozenCount > 0) state.tokenPickupFrozenCount -= 1;
  if (state.bulletsCombatFrozenCount > 0) state.bulletsCombatFrozenCount -= 1;
  if (state.pillowFightCount > 0) state.pillowFightCount -= 1;
  if (state.doubleMovementCount > 0) state.doubleMovementCount -= 1;
  state.blockedSewerSpaces.forEach((data, spk) => {
    if (data.turnsLeft <= 1) state.blockedSewerSpaces.delete(spk);
    else data.turnsLeft -= 1;
  });
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

  if (player.inSewer && state.useSewerTokens) {
    const canPayHearts = player.hearts > 0;
    const canPayGuts   = state.useGuts && (player.guts ?? 0) > 0;
    if (!canPayHearts && !canPayGuts) {
      player.inSewer = false;
      logLine(`${player.name} has nothing left to pay the sewer toll — forced to surface!`);
    } else if (canPayGuts) {
      logLine(`${player.name} must pay the sewer toll to remain underground.`);
      state.pendingEventChoice = {
        playerId: player.id,
        title: "Sewer Toll",
        options: [
          { key: "heart", label: `Pay 1 life token (${player.hearts - 1} remaining)` },
          { key: "guts",  label: `Pay 1 guts token (${(player.guts ?? 0) - 1} remaining)` }
        ],
        resolve(choice) {
          if (choice === "guts") {
            player.guts -= 1;
            logLine(`${player.name} paid 1 guts token — remains in the sewer.`);
          } else {
            player.hearts -= 1;
            logLine(`${player.name} paid 1 life token — remains in the sewer.`);
            if (player.hearts <= 0) {
              player.inSewer = false;
              logLine(`${player.name} ran out of life tokens in the sewer!`);
              handleKnockout(player, { endStep: true });
            }
          }
        }
      };
    } else {
      player.hearts -= 1;
      logLine(`${player.name} paid 1 life token to remain in the sewer. (${player.hearts} remaining)`);
      if (player.hearts <= 0) {
        player.inSewer = false;
        logLine(`${player.name} ran out of life tokens in the sewer!`);
        handleKnockout(player, { endStep: true });
        syncToCloud();
        render();
        return;
      }
    }
  }

  if (player.subwayPending) {
    player.subwayPending = false;
    player.subwayTeleport = true;
    logLine(`${player.name} is in the subway system — turn skipped (combat only).`);
    const subwaySpaceKey = playerKey(player);
    if (state.zombies.has(subwaySpaceKey) && !player.noCombatThisTurn) {
      state.step = STEP.COMBAT;
      const combat = resolveCombatForPlayer(player, {
        advanceStepWhenClear: false,
        endStepOnKnockout: true,
        resumeStepAfterPending: STEP.MOVE_ZOMBIES
      });
      if (combat.pending) {
        logLine(`${player.name} must resolve combat on their space before the turn ends.`);
      }
    } else {
      state.step = STEP.MOVE_ZOMBIES;
      autoSkipZombieMoveIfClear();
    }
    syncToCloud();
    render();
    return;
  }

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
      const { lx, ly } = getSpaceLocalCoords(player.x, player.y);
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
