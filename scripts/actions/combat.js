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

function applyCombatPostStep(player, pKey, options = {}) {
  const { resumeStepAfterPending = null } = options;

  if (resumeStepAfterPending && !state.zombies.has(pKey)) {
    if (resumeStepAfterPending === STEP.MOVE_ZOMBIES) {
      state.step = STEP.MOVE_ZOMBIES;
      autoSkipZombieMoveIfClear();
      return;
    }

    if (resumeStepAfterPending === STEP.MOVE) {
      state.step = STEP.MOVE;
      if (state.movesRemaining > 0) {
        logLine(`${player.name} may continue moving (${state.movesRemaining} space(s) remaining).`);
      }
      return;
    }

    state.step = resumeStepAfterPending;
    return;
  }

  if (state.step === STEP.COMBAT && !state.zombies.has(pKey)) {
    state.step = STEP.DRAW_EVENTS;
  }
}

function resolvePendingCombatDecision(actionCode) {
  const pending = state.pendingCombatDecision;
  if (!pending) {
    return;
  }

  const player = state.players.find((p) => p.id === pending.playerId);
  if (!player) {
    state.pendingCombatDecision = null;
    render();
    return;
  }

  const pKey = key(player.x, player.y);
  if (!state.zombies.has(pKey)) {
    state.pendingCombatDecision = null;
    applyCombatPostStep(player, pKey, pending.options);
    render();
    return;
  }

  if (actionCode === "B") {
    if (player.bullets <= 0) {
      logLine(`${player.name} cannot spend a bullet (none remaining).`);
      render();
      return;
    }

    player.bullets -= 1;
    pending.modifiedRoll += 1;
    logLine(`${player.name} spent 1 bullet. Combat roll is now ${pending.modifiedRoll}.`);

    if (pending.modifiedRoll >= 4) {
      state.zombies.delete(pKey);
      player.kills += 1;
      state.lastCombatResult = `Success (${pending.modifiedRoll})`;
      const bonusText = ` (d6 ${pending.roll} + attack ${pending.permanentBonus} + temp ${pending.tempBonus})`;
      logLine(`${player.name} raised the roll to ${pending.modifiedRoll}${bonusText} and killed the zombie.`);

      const options = pending.options;
      state.pendingCombatDecision = null;
      checkWin(player);
      applyCombatPostStep(player, pKey, options);
      render();
      return;
    }

    render();
    return;
  }

  if (actionCode === "H") {
    if (player.hearts <= 0) {
      logLine(`${player.name} cannot spend a life token (none remaining).`);
      render();
      return;
    }

    player.hearts -= 1;
    logLine(`${player.name} spent 1 life token and chose to reroll.`);
    const options = pending.options;
    state.pendingCombatDecision = null;
    resolveCombatForPlayer(player, options);
    render();
    return;
  }

  if (actionCode === "L") {
    state.lastCombatResult = `Knocked Out (${pending.modifiedRoll})`;
    logLine(`${player.name} lost the fight and was knocked out.`);
    const options = pending.options;
    state.pendingCombatDecision = null;
    handleKnockout(player, { endStep: options.endStepOnKnockout });
    if (!options.endStepOnKnockout && options.resumeStepAfterPending === STEP.DISCARD && state.step !== STEP.END) {
      state.step = STEP.DISCARD;
    }
    render();
  }
}

function resolveCombatForPlayer(player, options = {}) {
  const {
    advanceStepWhenClear = false,
    endStepOnKnockout = false,
    resumeStepAfterPending = null
  } = options;

  if (state.pendingCombatDecision) {
    return { fought: false, knockedOut: false, pending: true };
  }

  if (player.noCombatThisTurn) {
    logLine(`${player.name} avoided combat due to a no-combat effect.`);
    state.lastCombatResult = "Skipped";
    if (advanceStepWhenClear && state.step === STEP.COMBAT) {
      state.step = STEP.DRAW_EVENTS;
    }
    return { fought: false, knockedOut: false, pending: false };
  }

  const pKey = key(player.x, player.y);

  if (!state.zombies.has(pKey)) {
    if (advanceStepWhenClear && state.step === STEP.COMBAT) {
      state.step = STEP.DRAW_EVENTS;
    }
    return { fought: false, knockedOut: false, pending: false };
  }

  const permanentBonus = player.attack || 0;
  const tempBonus = player.tempCombatBonus || 0;

  while (true) {
    const roll = rollD6();
    const baseCombatRoll = roll + permanentBonus + tempBonus;
    const bonusText = ` (d6 ${roll} + attack ${permanentBonus} + temp ${tempBonus})`;

    if (baseCombatRoll >= 4) {
      state.zombies.delete(pKey);
      player.kills += 1;
      state.lastCombatResult = `Success (${baseCombatRoll})`;
      logLine(`${player.name} won combat with a ${baseCombatRoll}${bonusText} and claimed a zombie kill.`);
      checkWin(player);
      applyCombatPostStep(player, pKey, { resumeStepAfterPending });
      return { fought: true, knockedOut: false, pending: false };
    }

    if (player.bullets <= 0 && player.hearts <= 0) {
      state.lastCombatResult = `Knocked Out (${baseCombatRoll})`;
      logLine(`${player.name} lost the fight and was knocked out.`);
      handleKnockout(player, { endStep: endStepOnKnockout });
      return { fought: true, knockedOut: true, pending: false };
    }

    state.pendingCombatDecision = {
      playerId: player.id,
      pKey,
      roll,
      baseRoll: baseCombatRoll,
      modifiedRoll: baseCombatRoll,
      permanentBonus,
      tempBonus,
      options: {
        advanceStepWhenClear,
        endStepOnKnockout,
        resumeStepAfterPending
      }
    };
    state.lastCombatResult = `Pending (${baseCombatRoll})`;
    logLine(`${player.name} failed combat with a ${baseCombatRoll}. Choose how to resolve the fight.`);
    state.step = STEP.COMBAT;
    return { fought: false, knockedOut: false, pending: true };
  }
}

function resolveCombatOnCurrentTile() {
  if (state.pendingCombatDecision) {
    render();
    return;
  }

  if (state.step !== STEP.COMBAT && state.step !== STEP.MOVE) {
    return;
  }

  const player = currentPlayer();
  resolveCombatForPlayer(player, {
    advanceStepWhenClear: true,
    endStepOnKnockout: state.step === STEP.MOVE,
    resumeStepAfterPending: state.step === STEP.MOVE ? (state.movesRemaining > 0 ? STEP.MOVE : STEP.MOVE_ZOMBIES) : null
  });
  render();
}
