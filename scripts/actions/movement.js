function isSpaceBuilding(sx, sy) {
  const tile = getTileAtSpace(sx, sy);
  if (!tile) return false;
  const lx = getLocalCoord(sx, spaceToTileCoord(sx));
  const ly = getLocalCoord(sy, spaceToTileCoord(sy));
  return getSubTileType(tile, lx, ly) === "building";
}

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

  if (player.claustrophobiaNextTurn) {
    player.claustrophobiaNextTurn = false;
    player.claustrophobiaActive = true;
    if (isSpaceBuilding(player.x, player.y)) {
      logLine(`${player.name} has Claustrophobia and is in a building — must exit this turn.`);
    } else {
      logLine(`${player.name} has Claustrophobia — cannot enter any buildings this turn.`);
    }
  }

  if (player.brainCramp) {
    const { controllerPlayerId } = player.brainCramp;
    player.brainCramp = null;
    const controller = state.players.find((p) => p.id === controllerPlayerId);
    const controllerName = controller ? controller.name : "opponent";
    const roll = rollD6();
    state.currentMoveRoll = roll;
    const move = roll + state.movementBonus + (player.movementBonus || 0);
    state.movesRemaining = move;
    state.movementBonus = 0;
    state.moveFloorThisTurn = 0;
    state.step = STEP.MOVE;
    state.pendingForcedMove = { targetPlayerId: player.id, remaining: move, priorStep: STEP.MOVE_ZOMBIES, cardName: "Brain Cramp" };
    logLine(`Brain Cramp! ${player.name} rolled ${roll} (${move} space(s)) — ${controllerName} decides where ${player.name} moves.`);
    render();
    return;
  }

  const roll = rollD6();
  state.currentMoveRoll = roll;
  let move = roll + state.movementBonus + (player.movementBonus || 0);
  if (state.moveFloorThisTurn > 0) {
    move = Math.max(move, state.moveFloorThisTurn);
  }
  if (player.maxMoveNextTurn !== null && player.maxMoveNextTurn !== undefined) {
    move = Math.min(move, player.maxMoveNextTurn);
    player.maxMoveNextTurn = null;
  }
  if (player.halfMovementNextTurn) {
    move = Math.floor(move / 2);
    player.halfMovementNextTurn = false;
    logLine(`${player.name}'s movement is halved (Your Shoe's Untied) — ${move} space(s).`);
  }
  if (state.doubleMovementThisTurn) {
    move *= 2;
    state.doubleMovementThisTurn = false;
  }
  state.movesRemaining = move;
  state.movementBonus = 0;
  state.moveFloorThisTurn = 0;
  state.step = STEP.MOVE;
  logLine(`${player.name} rolled movement ${roll} and can move ${state.movesRemaining} space(s).`);
  render();
}

function moveToZombiePhase() {
  state.step = STEP.MOVE_ZOMBIES;
  autoSkipZombieMoveIfClear();
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

  if (player.claustrophobiaActive) {
    if (!isSpaceBuilding(player.x, player.y)) {
      if (isSpaceBuilding(player.x + d.x, player.y + d.y)) {
        const destTile = getTileAtSpace(player.x + d.x, player.y + d.y);
        logLine(`${player.name} cannot enter ${getTileDisplayName(destTile)} (Claustrophobia).`);
        render();
        return;
      }
    }
  }

  const wasInBuilding = player.claustrophobiaActive && isSpaceBuilding(player.x, player.y);

  player.x += d.x;
  player.y += d.y;
  state.movesRemaining -= 1;

  const tile = getTileAtSpace(player.x, player.y);
  collectTokensAtPlayerSpace(player);
  logLine(`${player.name} moved ${directionToArrow(dir)} to ${getTileDisplayName(tile)} [space ${player.x}, ${player.y}].`);

  if (wasInBuilding && !isSpaceBuilding(player.x, player.y)) {
    player.claustrophobiaActive = false;
    state.movesRemaining = 0;
    logLine(`${player.name} exited the building (Claustrophobia — movement ends).`);
  }

  if (checkWin(player)) {
    render();
    return;
  }

  const playerSpaceKey = key(player.x, player.y);
  if (state.zombies.has(playerSpaceKey)) {
    if (player.noCombatThisTurn) {
      logLine(`${player.name} is under a no-combat effect and ignores zombie battle this turn.`);
      if (state.movesRemaining <= 0) {
        moveToZombiePhase();
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
      moveToZombiePhase();
    } else {
      state.step = STEP.MOVE;
      logLine(`${player.name} may continue moving (${state.movesRemaining} space(s) remaining).`);
    }
    render();
    return;
  }

  if (state.movesRemaining <= 0) {
    moveToZombiePhase();
  }

  render();
}

function forcedMoveTarget(dir) {
  const pfm = state.pendingForcedMove;
  if (!pfm || pfm.remaining <= 0) return;

  const player = state.players.find((p) => p.id === pfm.targetPlayerId);
  if (!player) {
    state.pendingForcedMove = null;
    render();
    return;
  }

  if (!canMove(player, dir)) {
    const d = DIRS[dir];
    logLine(`${player.name} cannot move ${directionToArrow(dir)} from [space ${player.x}, ${player.y}] to [space ${player.x + d.x}, ${player.y + d.y}].`);
    render();
    return;
  }

  const d = DIRS[dir];
  player.x += d.x;
  player.y += d.y;
  pfm.remaining -= 1;

  const tile = getTileAtSpace(player.x, player.y);
  collectTokensAtPlayerSpace(player);
  logLine(`${player.name} was moved ${directionToArrow(dir)} to ${getTileDisplayName(tile)} [space ${player.x}, ${player.y}] (${pfm.remaining} move(s) remaining).`);

  if (checkWin(player)) {
    state.pendingForcedMove = null;
    render();
    return;
  }

  const playerSpaceKey = key(player.x, player.y);
  if (state.zombies.has(playerSpaceKey)) {
    logLine(`${player.name} encountered a zombie and must fight immediately.`);
    const result = resolveCombatForPlayer(player, {
      advanceStepWhenClear: false,
      endStepOnKnockout: false,
      resumeStepAfterPending: pfm.priorStep
    });
    if (result.knockedOut || pfm.remaining <= 0) {
      state.pendingForcedMove = null;
    }
    render();
    return;
  }

  if (pfm.remaining <= 0) {
    state.pendingForcedMove = null;
    logLine(`${player.name} finished their forced movement.`);
  }
  render();
}

function endForcedMovement() {
  const pfm = state.pendingForcedMove;
  if (!pfm) return;
  const player = state.players.find((p) => p.id === pfm.targetPlayerId);
  state.pendingForcedMove = null;
  if (player) {
    logLine(`Forced movement of ${player.name} ended early.`);
  }
  render();
}

function endMovementEarly() {
  if (state.step !== STEP.MOVE || state.gameOver) {
    return;
  }
  const player = currentPlayer();
  if (player.claustrophobiaActive && isSpaceBuilding(player.x, player.y)) {
    logLine(`${player.name} cannot end movement while inside a building (Claustrophobia).`);
    render();
    return;
  }
  state.movesRemaining = 0;
  moveToZombiePhase();
  logLine(`${player.name} ended movement early.`);
  render();
}
