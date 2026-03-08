function rollMovement() {
  if (state.step !== STEP.ROLL_MOVE || state.gameOver) {
    return;
  }

  const player = currentPlayer();
  if (player.cannotMoveTurns > 0) {
    player.cannotMoveTurns -= 1;
    state.currentMoveRoll = 0;
    state.movesRemaining = 0;
    state.step = STEP.MOVE_ZOMBIES;
    autoSkipZombieMoveIfClear();
    logLine(`${player.name} is unable to move this turn.`);
    render();
    return;
  }

  const roll = rollD6();
  state.currentMoveRoll = roll;
  let move = roll + state.movementBonus;
  if (state.moveFloorThisTurn > 0) {
    move = Math.max(move, state.moveFloorThisTurn);
  }
  if (player.maxMoveNextTurn !== null && player.maxMoveNextTurn !== undefined) {
    move = Math.min(move, player.maxMoveNextTurn);
    player.maxMoveNextTurn = null;
  }
  state.movesRemaining = move;
  state.movementBonus = 0;
  state.moveFloorThisTurn = 0;
  state.step = STEP.MOVE;
  logLine(`${player.name} rolled movement ${roll} and can move ${state.movesRemaining} space(s).`);
  render();
}

function movePlayer(dir) {
  if (state.step !== STEP.MOVE || state.gameOver || state.movesRemaining <= 0) {
    return;
  }

  const player = currentPlayer();
  if (player.forcedDirection && dir !== player.forcedDirection) {
    logLine(`${player.name} is forced to move ${directionToArrow(player.forcedDirection)}.`);
    render();
    return;
  }
  if (!canMove(player, dir)) {
    const d = DIRS[dir];
    logLine(
      `${player.name} cannot move ${directionToArrow(dir)} from [space ${player.x}, ${player.y}] to [space ${player.x + d.x}, ${player.y + d.y}].`
    );
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

  const playerSpaceKey = key(player.x, player.y);
  if (state.zombies.has(playerSpaceKey)) {
    if (player.noCombatThisTurn) {
      logLine(`${player.name} is under a no-combat effect and ignores zombie battle this turn.`);
      if (state.movesRemaining <= 0) {
        state.step = STEP.MOVE_ZOMBIES;
        autoSkipZombieMoveIfClear();
      }
      render();
      return;
    }

    logLine(`${player.name} encountered a zombie and must fight immediately.`);
    resolveCombatForPlayer(player, {
      advanceStepWhenClear: false,
      endStepOnKnockout: true,
      resumeStepAfterPending: state.movesRemaining > 0 ? STEP.MOVE : STEP.MOVE_ZOMBIES
    });
    if (state.step === STEP.END) {
      render();
      return;
    }

    // If a zombie is still on this exact space, movement cannot continue.
    // This provides a deterministic fallback when immediate combat did not fully resolve.
    const unresolvedEncounterOnCurrentSpace =
      state.zombies.has(playerSpaceKey) &&
      key(player.x, player.y) === playerSpaceKey &&
      !player.noCombatThisTurn;

    if (unresolvedEncounterOnCurrentSpace) {
      state.step = STEP.COMBAT;
      logLine(`${player.name}'s combat did not resolve. Resolve combat before moving again.`);
      render();
      return;
    }

    if (state.movesRemaining <= 0) {
      state.step = STEP.MOVE_ZOMBIES;
      autoSkipZombieMoveIfClear();
    } else {
      state.step = STEP.MOVE;
      logLine(`${player.name} may continue moving (${state.movesRemaining} space(s) remaining).`);
    }
    render();
    return;
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
