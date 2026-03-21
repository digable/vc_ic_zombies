function chooseZombieCombatTarget(playersOnSpace, options = {}) {
  const { specifiedPlayerId = null } = options;
  if (!playersOnSpace || playersOnSpace.length === 0) {
    return null;
  }

  if (specifiedPlayerId !== null && specifiedPlayerId !== undefined) {
    const specified = playersOnSpace.find((p) => p.id === specifiedPlayerId);
    if (specified) {
      return specified;
    }
  }

  if (playersOnSpace.length === 1) {
    return playersOnSpace[0];
  }

  const turnDistance = (player) => {
    const i = state.players.indexOf(player);
    if (i < 0) {
      return Number.MAX_SAFE_INTEGER;
    }
    return (i - state.currentPlayerIndex + state.players.length) % state.players.length;
  };

  const ordered = [...playersOnSpace].sort((a, b) => {
    const d = turnDistance(a) - turnDistance(b);
    if (d !== 0) {
      return d;
    }
    return a.id - b.id;
  });

  return ordered[0];
}

function pickNearestZombieToMove(availableZombieKeys) {
  let nearest = [];
  let nearestDist = Infinity;

  availableZombieKeys.forEach((zk) => {
    const { x, y } = parseKey(zk);
    const d = nearestPlayerDistance(x, y);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = [zk];
    } else if (d === nearestDist) {
      nearest.push(zk);
    }
  });

  if (nearest.length <= 1) {
    return nearest[0];
  }

  nearest.sort((a, b) => {
    const pa = parseKey(a);
    const pb = parseKey(b);
    if (pa.y !== pb.y) {
      return pa.y - pb.y;
    }
    return pa.x - pb.x;
  });

  const chosenZombie = nearest[0];
  const chosenPos = parseKey(chosenZombie);
  logLine(`Zombie tie auto-resolved: moved zombie at (${chosenPos.x}, ${chosenPos.y}).`);
  return chosenZombie;
}

function handleZombieEnteringPlayerSpace(spaceKey) {
  const occupants = state.players.filter((p) => key(p.x, p.y) === spaceKey);
  const target = chooseZombieCombatTarget(occupants);
  if (!target) {
    return false;
  }

  const active = currentPlayer();
  if (target.id !== active.id) {
    logLine(`A zombie moved into ${target.name}'s space. Combat is deferred until ${target.name}'s turn.`);
    return false;
  }

  if (occupants.length > 1) {
    logLine(`A zombie moved into a shared space and targets ${target.name} for combat.`);
  } else {
    logLine(`A zombie moved into ${target.name}'s space. Combat starts immediately.`);
  }

  const combat = resolveCombatForPlayer(target, {
    advanceStepWhenClear: false,
    endStepOnKnockout: false,
    resumeStepAfterPending: STEP.MOVE_ZOMBIES
  });
  return Boolean(combat.pending);
}

function startZombieMovement() {
  if (state.gameOver || state.step !== STEP.MOVE_ZOMBIES) return;

  if (state.zombieMoveFreezeCount > 0) {
    state.zombieMoveFreezeCount -= 1;
    logLine(`Zombie movement frozen (${state.zombieMoveFreezeCount} phase(s) remaining). Zombies do not move.`);
    state.currentZombieRoll = null;
    state.step = STEP.DISCARD;
    render();
    return;
  }

  if (state.zombies.size === 0) {
    autoSkipZombieMoveIfClear();
    render();
    return;
  }

  const roll = rollD6();
  state.currentZombieRoll = roll;
  const moveLimit = Math.min(roll, state.zombies.size);

  logLine(`${currentPlayer().name} rolled ${roll} for zombie movement — ${moveLimit} zombie(s) to move. Select zombies manually or auto-move.`);
  state.pendingZombieMovement = { remaining: moveLimit, movedKeys: new Set(), stuckKeys: new Set() };
  render();
}

function autoFinishZombieMovement() {
  const pzm = state.pendingZombieMovement;
  if (!pzm) return;

  let movedCount = 0;
  let combatDecisionPending = false;

  while (pzm.remaining > 0) {
    const available = [...state.zombies].filter((zk) => !pzm.movedKeys.has(zk) && !pzm.stuckKeys.has(zk));
    if (available.length === 0) break;

    const chosen = pickNearestZombieToMove(available);
    const next = moveZombieOneStep(chosen);

    if (next === chosen) {
      pzm.stuckKeys.add(chosen);
      continue;
    }

    pzm.movedKeys.add(chosen);
    state.zombies.delete(chosen);
    state.zombies.add(next);
    pzm.movedKeys.add(next);
    pzm.remaining -= 1;
    movedCount += 1;
    pzm.stuckKeys.clear();

    combatDecisionPending = handleZombieEnteringPlayerSpace(next);
    if (combatDecisionPending) break;
  }

  if (combatDecisionPending) {
    logLine(`${currentPlayer().name} must resolve combat. ${movedCount} zombie(s) moved.`);
    state.step = STEP.COMBAT;
  } else {
    state.pendingZombieMovement = null;
    logLine(`Zombie auto-movement complete. ${movedCount} zombie(s) moved.`);
    state.step = STEP.DISCARD;
  }
  render();
}

function manualMoveZombie(zKey) {
  const pzm = state.pendingZombieMovement;
  if (!pzm || pzm.remaining <= 0) return;
  if (!state.zombies.has(zKey) || pzm.movedKeys.has(zKey) || pzm.stuckKeys.has(zKey)) return;

  const next = moveZombieOneStep(zKey);

  if (next === zKey) {
    pzm.stuckKeys.add(zKey);
    logLine(`Zombie at ${zKey} is stuck and cannot move.`);
    const available = [...state.zombies].filter((zk) => !pzm.movedKeys.has(zk) && !pzm.stuckKeys.has(zk));
    if (available.length === 0) {
      state.pendingZombieMovement = null;
      state.step = STEP.DISCARD;
      logLine(`No more zombies can move.`);
    }
    render();
    return;
  }

  pzm.movedKeys.add(zKey);
  state.zombies.delete(zKey);
  state.zombies.add(next);
  pzm.movedKeys.add(next);
  pzm.remaining -= 1;
  pzm.stuckKeys.clear();
  logLine(`Zombie moved from ${zKey} to ${next}. (${pzm.remaining} move(s) remaining)`);

  const combatDecisionPending = handleZombieEnteringPlayerSpace(next);
  if (combatDecisionPending) {
    state.step = STEP.COMBAT;
    logLine(`${currentPlayer().name} must resolve combat.`);
    render();
    return;
  }

  if (pzm.remaining <= 0) {
    state.pendingZombieMovement = null;
    state.step = STEP.DISCARD;
    logLine(`Zombie movement complete.`);
  }
  render();
}
