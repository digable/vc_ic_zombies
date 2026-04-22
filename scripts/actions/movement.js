// Checks whether the player is standing on a Motor Pool jeep-door subtile and,
// if so, presents the jeep acquisition offer. Safe to call after combat clears.
function checkJeepDoorOffer(player) {
  if (player.hasJeep || state.pendingEventChoice || state.pendingCombatDecision) return;
  const tile = getTileAtSpace(player.x, player.y);
  if (!tile || tile.name !== TILE_NAME.MOTOR_POOL) return;
  const { lx, ly } = getSpaceLocalCoords(player.x, player.y);
  const sub = tile.subTiles?.[key(lx, ly)];
  if (!sub || !sub.jeepDoor) return;
  logLine(`${player.name} found a jeep at the Motor Pool!`);
  state.pendingEventChoice = {
    playerId: player.id,
    title: "Motor Pool — Jeep Available",
    cardName: "Motor Pool",
    options: [
      { key: "acquire", label: "Take the Jeep" },
      { key: "pass", label: "Leave it" }
    ],
    resolve(choice) {
      if (choice === "acquire") {
        player.hasJeep = true;
        state.itemAcquiredBanner = { playerName: player.name, itemName: "Jeep", icon: "🚗", description: "Movement doubles while on roads. Lost if you start a turn inside a building." };
        logLine(`${player.name} acquired a jeep! Movement doubles while on roads.`);
      } else {
        logLine(`${player.name} left the jeep behind.`);
      }
    }
  };
}

function checkClownCarAward(player) {
  if (player.hasClownCar) return;
  const tile = getTileAtSpace(player.x, player.y);
  if (!tile || (tile.name !== TILE_NAME.BIG_TOP_1 && tile.name !== TILE_NAME.BIG_TOP_2)) return;
  player.hasClownCar = true;
  player.clownCarPending = true;
  state.itemAcquiredBanner = { playerName: player.name, itemName: "Clown Car", icon: "★", description: "+2 to all movement rolls. Active from next turn." };
  logLine(`${player.name} found a Clown Car at the ${tile.name}! +2 movement starting next turn.`);
}

function checkSubwayOffer(player) {
  if (player.subwayPending || player.subwayTeleport || state.pendingEventChoice || state.pendingCombatDecision) return;
  const tile = getTileAtSpace(player.x, player.y);
  if (!tile || tile.name !== TILE_NAME.SUBWAY_STATION) return;
  const { lx, ly } = getSpaceLocalCoords(player.x, player.y);
  const sub = tile.subTiles?.[key(lx, ly)];
  if (!sub || sub.type !== SUBTILE_TYPE.BUILDING) return;
  logLine(`${player.name} found a working subway station.`);
  state.pendingEventChoice = {
    playerId: player.id,
    title: "Subway Station",
    options: [
      { key: "enter", label: "Use the subway system" },
      { key: "pass",  label: "Stay above ground" }
    ],
    resolve(choice) {
      if (choice === "enter") {
        player.subwayPending = true;
        logLine(`${player.name} enters the subway — next turn skipped, then teleport to any other station.`);
      } else {
        logLine(`${player.name} decided not to use the subway.`);
      }
    }
  };
}

function placeSewerToken(sx, sy) {
  const player = currentPlayer();
  if (!state.pendingSewerTokenPlace || state.pendingSewerTokenPlace.playerId !== player.id) return;
  const tile = getTileAtSpace(sx, sy);
  if (!tile) { logLine("No tile there — cannot place sewer token."); return; }
  const { lx, ly } = getSpaceLocalCoords(sx, sy);
  if (getSubTileType(tile, lx, ly) !== SUBTILE_TYPE.ROAD) {
    logLine("Sewer tokens can only be placed on road spaces.");
    return;
  }
  const spaceKey = key(sx, sy);
  if (state.sewerTokenSpaces.has(spaceKey)) {
    logLine("A sewer token is already on that space.");
    return;
  }
  state.sewerTokenSpaces.set(spaceKey, { ownerId: player.id });
  player.sewerTokensAvailable -= 1;
  state.pendingSewerTokenPlace = null;
  logLine(`${player.name} placed a sewer token at [space ${sx}, ${sy}]. (${player.sewerTokensAvailable} remaining)`);
  render();
}

function isSpaceBuilding(sx, sy) {
  const tile = getTileAtSpace(sx, sy);
  if (!tile) return false;
  const { lx, ly } = getSpaceLocalCoords(sx, sy);
  return getSubTileType(tile, lx, ly) === "building";
}

// Returns { name, cx, cy } for the "Where's the Admin Bldg.?" toward-movement target.
// Tries the primary tile name, then fallback, then defaults to start space.
function findAdminBldgTarget(config) {
  for (const tileName of [config.tileName, config.fallbackTileName]) {
    if (!tileName) continue;
    for (const [bKey, tile] of state.board) {
      if (tile && tile.name === tileName) {
        const [tx, ty] = bKey.split(",").map(Number);
        return { name: tileName, cx: tx * 3 + 1, cy: ty * 3 + 1 };
      }
    }
  }
  return { name: TILE_NAME.TOWN_SQUARE, cx: 1, cy: 1 };
}

function canPlayerReachDifferentTile(player) {
  const tileX = spaceToTileCoord(player.x);
  const tileY = spaceToTileCoord(player.y);
  const tile = state.board.get(key(tileX, tileY));
  if (!tile) return false;
  return ["N", "S", "E", "W"].some((dir) => {
    const d = DIRS[dir];
    const adjTile = state.board.get(key(tileX + d.x, tileY + d.y));
    if (!adjTile) return false;
    return hasRoad(tile, dir) && hasRoad(adjTile, DIRS[dir].opposite);
  });
}

function rollMovement() {
  if (state.step !== STEP.ROLL_MOVE || state.gameOver) {
    return;
  }

  const player = currentPlayer();

  // Air duct teleport: player committed to a duct last turn — execute it first
  if (player.pendingDuctTeleport) {
    const { x, y } = player.pendingDuctTeleport;
    player.pendingDuctTeleport = null;
    player.x = x;
    player.y = y;
    state.currentMoveRoll = null;
    state.movesRemaining = 0;
    state.playerTrail = [key(x, y)];
    collectTokensAtPlayerSpace(player);
    const destTile = getTileAtSpace(x, y);
    logLine(`${player.name} teleports through the air duct to ${destTile?.name || `(${x}, ${y})`}!`);
    moveToZombiePhase(true);
    render();
    return;
  }

  // Subway teleport: player spent last turn in the subway — now choose a destination station.
  if (player.subwayTeleport) {
    const destinations = findSubwayDestinations(player);
    player.subwayTeleport = false;
    if (destinations.length === 0) {
      logLine(`${player.name} cannot use the subway — no other stations on the board. Moving normally.`);
      // Fall through to normal movement roll.
    } else {
      state.pendingEventChoice = {
        playerId: player.id,
        title: "Subway Teleport — Choose a Station",
        options: destinations.map((d, i) => ({ key: `subway_${i}`, label: d.label })),
        resolve(choice) {
          const idx = parseInt(choice.replace("subway_", ""), 10);
          const dest = destinations[idx];
          player.x = dest.sx;
          player.y = dest.sy;
          state.currentMoveRoll = null;
          state.movesRemaining = 0;
          state.playerTrail = [key(dest.sx, dest.sy)];
          collectTokensAtPlayerSpace(player);
          logLine(`${player.name} rides the subway to ${dest.label}!`);
          if (checkWin(player)) { render(); return; }
          moveToZombiePhase(true);
          render();
        }
      };
      render();
      return;
    }
  }

  // Duct check: offer the duct before rolling (only if no other turn-skipping effects).
  // The skipToRoll flag tells the panel that "skip" should continue the roll, not end the turn.
  if (!rollMovement._skipDuctCheck && !player.cannotMoveTurns && !player.pendingDuctTeleport && playerOnDuctSpace(player)) {
    const destinations = findDuctDestinations(player);
    if (destinations.length > 0) {
      state.pendingDuctChoice = { playerId: player.id, destinations, skipToRoll: true };
      render();
      return;
    }
  }

  if (player.cannotMoveTurns > 0) {
    state.currentMoveRoll = 0;
    state.movesRemaining = 0;
    state.step = STEP.MOVE_ZOMBIES;
    autoSkipZombieMoveIfClear();
    logLine(`${player.name} is unable to move this turn.`);
    render();
    return;
  }

  if (player.smellEffect && !canPlayerReachDifferentTile(player)) {
    player.smellEffect = null;
    player.cannotMoveTurns = 2;
    state.currentMoveRoll = 0;
    state.movesRemaining = 0;
    state.step = STEP.MOVE_ZOMBIES;
    autoSkipZombieMoveIfClear();
    logLine(`${player.name} cannot reach a different tile (What is That Smell?!?) — movement skipped and next turn forfeited.`);
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
    const controller = getPlayerById(controllerPlayerId);
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

  if (player.movementHijack) {
    const { byPlayerId } = player.movementHijack;
    player.movementHijack = null;
    const hijacker = getPlayerById(byPlayerId);
    const roll = rollD6();
    const move = roll + (hijacker ? (hijacker.movementBonus || 0) : 0);
    state.currentMoveRoll = roll;
    state.movementBonus = 0;
    state.moveFloorThisTurn = 0;
    if (hijacker) {
      state.movesRemaining = move;
      state.step = STEP.MOVE;
      state.pendingForcedMove = { targetPlayerId: hijacker.id, remaining: move, priorStep: STEP.MOVE_ZOMBIES, cardName: "Lots of running and screaming" };
      logLine(`Lots of running and screaming! ${player.name} rolled ${roll} — ${hijacker.name} uses this movement (${move} space(s)).`);
    } else {
      state.movesRemaining = 0;
      state.step = STEP.MOVE_ZOMBIES;
      autoSkipZombieMoveIfClear();
      logLine(`Lots of running and screaming! ${player.name} rolled ${roll} — hijacking player not found; movement lost.`);
    }
    render();
    return;
  }

  if (state.movementRollFreezeCount > 0) {
    state.currentMoveRoll = null;
    state.movesRemaining = 0;
    state.movementBonus = 0;
    state.moveFloorThisTurn = 0;
    state.step = STEP.MOVE;
    logLine(`${player.name} cannot roll for movement (Too...tired...to...run is active) — 0 spaces. Card effects may still move players.`);
    render();
    return;
  }

  const roll = rollD6();
  const dieRollPenalty = player.dieRollPenalty || 0;
  const penalizedRoll = roll - dieRollPenalty;
  state.currentMoveRoll = penalizedRoll;
  if (player.inTheZone && roll === 6) {
    drawOneEventCardForPlayer(player, "In the Zone");
  }
  const heliSightBonus = (player.items || []).some((c) => c.name === "I See the Helicopter") ? 1 : 0;
  let move = penalizedRoll + state.movementBonus + (player.movementBonus || 0) + heliSightBonus;
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
  if (player.hasClownCar && !player.clownCarPending) {
    move += 2;
    logLine(`${player.name}'s Clown Car adds +2 movement — ${move} space(s).`);
  }
  if (player.hasJeep) {
    const jeepTile = getTileAtSpace(player.x, player.y);
    const onMotorPool = jeepTile && jeepTile.name === TILE_NAME.MOTOR_POOL;
    if (!onMotorPool && isSpaceBuilding(player.x, player.y)) {
      player.hasJeep = false;
      logLine(`${player.name} lost their jeep — they're inside a building.`);
    } else {
      move *= 2;
      logLine(`${player.name} uses the jeep — movement doubled to ${move} space(s). Doubled movement lasts this full turn; jeep is lost if you start next turn in a building.`);
    }
  }
  if (state.doubleMovementThisTurn) {
    move *= 2;
    state.doubleMovementThisTurn = false;
  }
  if (state.doubleMovementCount > 0) {
    move *= 2;
    logLine(`${player.name}'s movement doubled (We gotta get out of this place!) — ${move} space(s).`);
  }
  if (player.inSewer && (player.items || []).some((c) => c.name === "Flashlight")) {
    move *= 2;
    logLine(`${player.name}'s Flashlight illuminates the tunnels — sewer movement doubled to ${move} space(s).`);
  }
  state.movesRemaining = move;
  state.movementBonus = 0;
  state.moveFloorThisTurn = 0;
  state.playerTrail = [key(player.x, player.y)];
  state.step = STEP.MOVE;
  logLine(`${player.name} rolled movement ${roll} and can move ${state.movesRemaining} space(s).`);
  render();
}

// skipDuctCheck=true when called after a teleport (don't offer duct again immediately)
function moveToZombiePhase(skipDuctCheck = false) {
  if (!skipDuctCheck) {
    const player = currentPlayer();
    if (player && playerOnDuctSpace(player)) {
      const destinations = findDuctDestinations(player);
      if (destinations.length > 0) {
        state.pendingDuctChoice = { playerId: player.id, destinations };
        // Don't transition yet — wait for player to choose
        render();
        return;
      }
    }
  }
  state.step = STEP.MOVE_ZOMBIES;
  autoSkipZombieMoveIfClear();
}

// Called by both confirm and skip when the panel was shown at roll-time.
// Bypasses the duct check so rollMovement doesn't loop back into the panel.
function _resumeRollAfterDuctPanel() {
  rollMovement._skipDuctCheck = true;
  rollMovement();
  rollMovement._skipDuctCheck = false;
}

function confirmDuctTeleport(destIndex) {
  const pdc = state.pendingDuctChoice;
  if (!pdc) return;
  const player = getPlayerById(pdc.playerId);
  if (!player) { state.pendingDuctChoice = null; return; }
  const dest = pdc.destinations[destIndex];
  if (!dest) return;
  const skipToRoll = pdc.skipToRoll;
  state.pendingDuctChoice = null;
  player.pendingDuctTeleport = { x: dest.sx, y: dest.sy };
  if (skipToRoll) {
    // Still in ROLL_MOVE — re-enter to execute the teleport immediately
    _resumeRollAfterDuctPanel();
  } else {
    logLine(`${player.name} will use the air duct next turn — destination: ${dest.tileName}.`);
    moveToZombiePhase(true);
    render();
  }
}

function skipDuct() {
  const pdc = state.pendingDuctChoice;
  if (!pdc) return;
  const skipToRoll = pdc.skipToRoll;
  const player = getPlayerById(pdc.playerId);
  state.pendingDuctChoice = null;
  if (player) logLine(`${player.name} chose not to use the air duct.`);
  if (skipToRoll) {
    // Panel shown before rolling — continue with normal roll
    _resumeRollAfterDuctPanel();
  } else {
    // Panel shown after moving — proceed to zombie phase
    moveToZombiePhase(true);
    render();
  }
}

const BREAKTHROUGH_EDGE = {
  N: { fromX: 1, fromY: 0, toX: 1, toY: 2 },
  S: { fromX: 1, fromY: 2, toX: 1, toY: 0 },
  E: { fromX: 2, fromY: 1, toX: 0, toY: 1 },
  W: { fromX: 0, fromY: 1, toX: 2, toY: 1 },
};

function handleBreakthroughAttempt(dir) {
  const pb = state.pendingBreakthrough;
  if (!pb) return;
  state.pendingBreakthrough = null;

  const player = getPlayerById(pb.playerId);
  if (!player) { render(); return; }

  const d = DIRS[dir];
  const fromX = player.x;
  const fromY = player.y;
  const toX = fromX + d.x;
  const toY = fromY + d.y;

  const fromTileX = spaceToTileCoord(fromX);
  const fromTileY = spaceToTileCoord(fromY);
  const toTileX = spaceToTileCoord(toX);
  const toTileY = spaceToTileCoord(toY);

  const fromTile = state.board.get(key(fromTileX, fromTileY));
  const toTile = state.board.get(key(toTileX, toTileY));

  if (fromTileX === toTileX && fromTileY === toTileY) {
    logLine(`${player.name}: Breakthrough only works across tile boundaries.`);
    render();
    return;
  }
  if (!fromTile || !toTile) {
    logLine(`${player.name}: Breakthrough — no adjacent tile in that direction.`);
    render();
    return;
  }
  if (fromTile.type === "helipad" || toTile.type === "helipad") {
    logLine(`${player.name}: Breakthrough cannot be used to or from the Helipad.`);
    render();
    return;
  }

  const fromLocalX = getLocalCoord(fromX, fromTileX);
  const fromLocalY = getLocalCoord(fromY, fromTileY);
  const toLocalX = getLocalCoord(toX, toTileX);
  const toLocalY = getLocalCoord(toY, toTileY);
  const edge = BREAKTHROUGH_EDGE[dir];

  if (fromLocalX !== edge.fromX || fromLocalY !== edge.fromY || toLocalX !== edge.toX || toLocalY !== edge.toY) {
    logLine(`${player.name}: Breakthrough — must be at the center-edge subtile to break through.`);
    render();
    return;
  }
  if (!isLocalWalkable(toTile, toLocalX, toLocalY)) {
    logLine(`${player.name}: Breakthrough — destination is not a legal space.`);
    render();
    return;
  }
  if (canStep(fromX, fromY, toX, toY)) {
    logLine(`${player.name}: Breakthrough — that path is already open.`);
    render();
    return;
  }

  const roll = rollD6();
  logLine(`${player.name} attempts Breakthrough ${directionToArrow(dir)} — rolled ${roll}.`);

  if (roll >= 5) {
    state.breakthroughConnections.add(`${key(fromX, fromY)}${BREAKTHROUGH_SEP}${dir}`);
    state.breakthroughConnections.add(`${key(toX, toY)}${BREAKTHROUGH_SEP}${DIRS[dir].opposite}`);
    logLine(`${player.name} broke through! Permanent path created between ${getTileDisplayName(fromTile)} and ${getTileDisplayName(toTile)}.`);
    player.x = toX;
    player.y = toY;
    state.movesRemaining -= 1;
    state.playerTrail.push(key(player.x, player.y));
    collectTokensAtPlayerSpace(player);
    logLine(`${player.name} moved ${directionToArrow(dir)} to ${getTileDisplayName(toTile)} [space ${toX}, ${toY}].`, "quiet");
    if (checkWin(player)) { render(); return; }
    const playerSpaceKey = playerKey(player);
    if (state.zombies.has(playerSpaceKey) && !playerHasNoCombat(player)) {
      logLine(`${player.name} encountered a zombie and must fight immediately.`);
      resolveCombatForPlayer(player, {
        advanceStepWhenClear: false,
        endStepOnKnockout: true,
        resumeStepAfterPending: state.movesRemaining > 0 ? STEP.MOVE : STEP.MOVE_ZOMBIES
      });
      if (state.step === STEP.END) { render(); return; }
      if (state.zombies.has(playerSpaceKey) && !playerHasNoCombat(player)) {
        state.step = STEP.COMBAT;
        render();
        return;
      }
    }
    if (state.movesRemaining <= 0) moveToZombiePhase();
  } else {
    player.hearts -= 1;
    logLine(`${player.name} failed to break through — lost 1 life token. Movement ends.`);
    if (player.hearts <= 0) {
      handleKnockout(player, { endStep: true });
    } else {
      state.movesRemaining = 0;
      moveToZombiePhase();
    }
  }
  render();
}

function movePlayer(dir) {
  if (state.step !== STEP.MOVE || state.gameOver || state.movesRemaining <= 0) {
    return;
  }

  if (state.pendingBreakthrough) {
    handleBreakthroughAttempt(dir);
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
      `${player.name} cannot move ${directionToArrow(dir)} from [space ${player.x}, ${player.y}] to [space ${player.x + d.x}, ${player.y + d.y}].`, "quiet"
    );
    render();
    return;
  }

  const d = DIRS[dir];

  if (player.smellEffect?.movedToNewTile) {
    const destTileKey = key(spaceToTileCoord(player.x + d.x), spaceToTileCoord(player.y + d.y));
    if (destTileKey === player.smellEffect.startTileKey) {
      logLine(`${player.name} cannot return to their starting tile this turn (What is That Smell?!?).`);
      render();
      return;
    }
  }

  if (player.claustrophobiaActive) {
    if (!isSpaceBuilding(player.x, player.y)) {
      // Outside building: cannot enter any building subtile
      if (isSpaceBuilding(player.x + d.x, player.y + d.y)) {
        const destTile = getTileAtSpace(player.x + d.x, player.y + d.y);
        logLine(`${player.name} cannot enter ${getTileDisplayName(destTile)} (Claustrophobia).`);
        render();
        return;
      }
    } else {
      // Inside building: must exit by shortest path — cannot move deeper into more building subtiles
      if (isSpaceBuilding(player.x + d.x, player.y + d.y)) {
        logLine(`${player.name} must move toward the exit, not deeper into the building (Claustrophobia).`);
        render();
        return;
      }
    }
  }

  if ((player.lockedToTileTurns ?? 0) > 0) {
    const destTileX = spaceToTileCoord(player.x + d.x);
    const destTileY = spaceToTileCoord(player.y + d.y);
    if (destTileX !== spaceToTileCoord(player.x) || destTileY !== spaceToTileCoord(player.y)) {
      logLine(`${player.name} cannot leave this tile (Lost in the Woods).`);
      render();
      return;
    }
  }

  if (player.subwayPending && !isSpaceBuilding(player.x + d.x, player.y + d.y)) {
    logLine(`${player.name} cannot leave the Subway Station building while committed to the subway.`);
    render();
    return;
  }

  if (player.mustMoveTowardTile) {
    const adminTarget = findAdminBldgTarget(player.mustMoveTowardTile);
    const curDist = Math.abs(player.x - adminTarget.cx) + Math.abs(player.y - adminTarget.cy);
    const nextDist = Math.abs(player.x + d.x - adminTarget.cx) + Math.abs(player.y + d.y - adminTarget.cy);
    if (curDist > 0 && nextDist > curDist) {
      // Only block if at least one valid move would reduce distance
      const hasTowardOption = ["N", "S", "E", "W"].some((checkDir) => {
        const cd = DIRS[checkDir];
        if (!canMove(player, checkDir)) return false;
        return Math.abs(player.x + cd.x - adminTarget.cx) + Math.abs(player.y + cd.y - adminTarget.cy) < curDist;
      });
      if (hasTowardOption) {
        logLine(`${player.name} must move toward ${adminTarget.name} (Where's the 'Admin Bldg.?').`);
        render();
        return;
      }
    }
  }

  const wasInBuilding = player.claustrophobiaActive && isSpaceBuilding(player.x, player.y);

  player.x += d.x;
  player.y += d.y;
  state.movesRemaining -= 1;
  state.playerTrail.push(key(player.x, player.y));

  if (player.movingTogether) {
    const companion = getPlayerById(player.movingTogether.withPlayerId);
    if (companion) {
      companion.x = player.x;
      companion.y = player.y;
    }
  }

  const tile = getTileAtSpace(player.x, player.y);
  collectTokensAtPlayerSpace(player);
  logLine(`${player.name} moved ${directionToArrow(dir)} to ${getTileDisplayName(tile)} [space ${player.x}, ${player.y}].`, "quiet");

  if (player.smellEffect && !player.smellEffect.movedToNewTile) {
    const newTileKey = key(spaceToTileCoord(player.x), spaceToTileCoord(player.y));
    if (newTileKey !== player.smellEffect.startTileKey) {
      player.smellEffect.movedToNewTile = true;
    }
  }

  if (wasInBuilding && !isSpaceBuilding(player.x, player.y)) {
    player.claustrophobiaActive = false;
    state.movesRemaining = 0;
    logLine(`${player.name} exited the building (Claustrophobia — movement ends).`);
  }

  if (player.subwayPending && !isSpaceBuilding(player.x, player.y)) {
    player.subwayPending = false;
    logLine(`${player.name} left the Subway Station building — subway use cancelled.`);
  }

  if (checkWin(player)) {
    render();
    return;
  }

  // Monkeys Are Funny! — auto-discard when player leaves a wooded subtile
  if (player.monkeysAreFunny) {
    const mafTile = getTileAtSpace(player.x, player.y);
    const { lx: mafLx, ly: mafLy } = getSpaceLocalCoords(player.x, player.y);
    const onWooded = mafTile && getSubTileType(mafTile, mafLx, mafLy) === "wooded";
    if (!onWooded) {
      player.monkeysAreFunny = false;
      consumeItemByName(player, "Monkeys are Funny!");
      logLine(`${player.name} left the trees — Monkeys are Funny! is discarded.`);
    }
  }

  // I've got a bike! — auto-discard when player enters a building subtile
  if (player.hasBike && isSpaceBuilding(player.x, player.y)) {
    player.hasBike = false;
    player.movementBonus = Math.max(0, (player.movementBonus || 0) - 2);
    consumeItemByName(player, "I've got a bike!");
    logLine(`${player.name} entered a building — I've got a bike! is discarded.`);
  }

  const playerSpaceKey = playerKey(player);

  // In the sewer — skip all zombie combat (underground, zombies can't follow).
  if (player.inSewer && state.zombies.has(playerSpaceKey)) {
    logLine(`${player.name} is underground — zombie skipped.`, "quiet");
    if (state.movesRemaining <= 0) moveToZombiePhase();
    render();
    return;
  }

  if (state.zombies.has(playerSpaceKey)) {
    if (playerHasNoCombat(player)) {
      logLine(`${player.name} is under a no-combat effect and ignores zombie battle this turn.`);
      if (state.movesRemaining <= 0) {
        moveToZombiePhase();
      }
      render();
      return;
    }

    // Fixed Gear — take 1 damage and keep riding instead of stopping to fight.
    if (player.fixedGearActive) {
      logLine(`${player.name} rides through a zombie — takes 1 damage! (Fixed Gear)`);
      damagePlayer(player, 1, { endStep: false });
      if (!state.gameOver) {
        if (state.movesRemaining <= 0) moveToZombiePhase();
        else { state.step = STEP.MOVE; }
      }
      render();
      return;
    }

    // Monkeys Are Funny! — skip combat while swinging through wooded subtiles
    if (player.monkeysAreFunny) {
      const mafSkipTile = getTileAtSpace(player.x, player.y);
      const { lx: mafSkipLx, ly: mafSkipLy } = getSpaceLocalCoords(player.x, player.y);
      if (mafSkipTile && getSubTileType(mafSkipTile, mafSkipLx, mafSkipLy) === "wooded") {
        logLine(`${player.name} swings through the trees — no combat on wooded subtiles (Monkeys are Funny!).`);
        if (state.movesRemaining <= 0) {
          moveToZombiePhase();
        }
        render();
        return;
      }
    }

    logLine(`${player.name} encountered a zombie and must fight immediately.`);
    state.combatMoveResume = state.movesRemaining > 0 ? STEP.MOVE : STEP.MOVE_ZOMBIES;
    resolveCombatForPlayer(player, {
      advanceStepWhenClear: false,
      endStepOnKnockout: true,
      resumeStepAfterPending: state.combatMoveResume
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
      !playerHasNoCombat(player);

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
      logLine(`${player.name} may continue moving (${state.movesRemaining} space(s) remaining).`, "quiet");
    }
    render();
    return;
  }

  if (state.movesRemaining <= 0) {
    moveToZombiePhase();
  }

  // Award Clown Car when player enters either Big Top tile (no offer needed — automatic).
  checkClownCarAward(player);

  // Offer jeep when player enters the Motor Pool door subtile and doesn't already have one.
  checkJeepDoorOffer(player);

  // Offer subway when player enters a Subway Station building subtile.
  checkSubwayOffer(player);

  render();
}

function forcedMoveTarget(dir) {
  const pfm = state.pendingForcedMove;
  if (!pfm || pfm.remaining <= 0) return;

  const player = getPlayerById(pfm.targetPlayerId);
  if (!player) {
    state.pendingForcedMove = null;
    state.step = pfm.priorStep;
    render();
    return;
  }

  if (!canMove(player, dir)) {
    const d = DIRS[dir];
    logLine(`${player.name} cannot move ${directionToArrow(dir)} from [space ${player.x}, ${player.y}] to [space ${player.x + d.x}, ${player.y + d.y}].`, "quiet");
    render();
    return;
  }

  const d = DIRS[dir];
  player.x += d.x;
  player.y += d.y;
  pfm.remaining -= 1;
  state.movesRemaining = pfm.remaining;
  state.playerTrail.push(key(player.x, player.y));

  if (player.movingTogether) {
    const companion = getPlayerById(player.movingTogether.withPlayerId);
    if (companion) {
      companion.x = player.x;
      companion.y = player.y;
    }
  }

  const tile = getTileAtSpace(player.x, player.y);
  collectTokensAtPlayerSpace(player);
  logLine(`${player.name} was moved ${directionToArrow(dir)} to ${getTileDisplayName(tile)} [space ${player.x}, ${player.y}] (${pfm.remaining} move(s) remaining).`, "quiet");

  if (checkWin(player)) {
    state.pendingForcedMove = null;
    state.step = pfm.priorStep;
    render();
    return;
  }

  const playerSpaceKey = playerKey(player);
  if (state.zombies.has(playerSpaceKey)) {
    logLine(`${player.name} encountered a zombie and must fight immediately.`);
    const result = resolveCombatForPlayer(player, {
      advanceStepWhenClear: false,
      endStepOnKnockout: false,
      resumeStepAfterPending: pfm.remaining > 0 ? STEP.MOVE : pfm.priorStep
    });
    if (result.knockedOut || pfm.remaining <= 0) {
      state.pendingForcedMove = null;
      state.step = pfm.priorStep;
    }
    render();
    return;
  }

  if (pfm.remaining <= 0) {
    state.pendingForcedMove = null;
    state.step = pfm.priorStep;
    logLine(`${player.name} finished their forced movement.`);
  }
  render();
}

function endForcedMovement() {
  const pfm = state.pendingForcedMove;
  if (!pfm) return;
  const player = getPlayerById(pfm.targetPlayerId);
  state.pendingForcedMove = null;
  state.movesRemaining = 0;
  state.step = pfm.priorStep;
  if (player) {
    logLine(`Forced movement of ${player.name} ended early.`);
  }
  render();
}

function endMovementEarly() {
  if (state.step !== STEP.MOVE || state.gameOver) {
    return;
  }
  if (state.pendingBreakthrough) {
    state.pendingBreakthrough = null;
    logLine(`${currentPlayer().name} chose not to attempt a Breakthrough.`);
  }
  const player = currentPlayer();
  if (player.smellEffect && !player.smellEffect.movedToNewTile) {
    logLine(`${player.name} must move to a different tile before ending movement (What is That Smell?!?).`);
    render();
    return;
  }
  if (player.claustrophobiaActive && isSpaceBuilding(player.x, player.y)) {
    logLine(`${player.name} cannot end movement while inside a building (Claustrophobia).`);
    render();
    return;
  }
  if (player.mustMoveTowardTile) {
    const { name: targetName } = findAdminBldgTarget(player.mustMoveTowardTile);
    logLine(`${player.name} must use all movement toward ${targetName} — cannot end early (Where's the 'Admin Bldg.?').`);
    render();
    return;
  }
  state.movesRemaining = 0;
  moveToZombiePhase();
  logLine(`${player.name} ended movement early.`);
  render();
}
