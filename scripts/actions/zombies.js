// ---------------------------------------------------------------------------
// Zombie movement phase
// ---------------------------------------------------------------------------
// pendingZombieMovement = { remaining, movedKeys: Set, stuckKeys: Set }
//   remaining  — moves left this phase
//   movedKeys  — zombies that have already moved (won't move again this phase)
//   stuckKeys  — zombies with no valid moves THIS pass; cleared after any zombie
//                successfully moves so previously stuck zombies are re-evaluated
//                (e.g. a zombie blocking a path moves away, un-sticking a neighbour)
// ---------------------------------------------------------------------------

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
  if (availableZombieKeys.length === 0) return undefined;
  if (availableZombieKeys.length === 1) return availableZombieKeys[0];

  // Priority: current player first, then others in turn order.
  const orderedPlayers = [];
  for (let i = 0; i < state.players.length; i++) {
    orderedPlayers.push(state.players[(state.currentPlayerIndex + i) % state.players.length]);
  }

  const distVec = (zk) => {
    const { x, y } = parseKey(zk);
    return orderedPlayers.map((p) => Math.abs(p.x - x) + Math.abs(p.y - y));
  };

  const compareVec = (a, b) => {
    for (let i = 0; i < a.length; i++) {
      if (a[i] < b[i]) return -1;
      if (a[i] > b[i]) return 1;
    }
    return 0;
  };

  let bestKeys = [];
  let bestVec = null;
  availableZombieKeys.forEach((zk) => {
    const vec = distVec(zk);
    if (bestVec === null) {
      bestVec = vec;
      bestKeys = [zk];
    } else {
      const cmp = compareVec(vec, bestVec);
      if (cmp < 0) {
        bestVec = vec;
        bestKeys = [zk];
      } else if (cmp === 0) {
        bestKeys.push(zk);
      }
    }
  });

  if (bestKeys.length === 1) return bestKeys[0];

  // Position tie-break: top-left first
  bestKeys.sort((a, b) => {
    const pa = parseKey(a);
    const pb = parseKey(b);
    if (pa.y !== pb.y) return pa.y - pb.y;
    return pa.x - pb.x;
  });

  const chosenZombie = bestKeys[0];
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

// Moves a zombie its full movement allowance for one turn slot, respecting
// multi-step movement for enhanced types. Returns { finalKey, moved, combatPending }.
// Updates pzm.movedKeys and pzm.stuckKeys. Does NOT touch pzm.remaining.
function moveZombieAllSteps(startKey, pzm) {
  const zTypeProps = ZOMBIE_TYPES[state.zombies.get(startKey)?.type] ?? ZOMBIE_TYPES[ZOMBIE_TYPE.REGULAR];
  const steps = zTypeProps.movement;
  let currentKey = startKey;
  let movedAtLeastOnce = false;
  let combatPending = false;

  for (let step = 0; step < steps; step++) {
    const next = moveZombieOneStep(currentKey);
    if (next === currentKey) break;

    const zdata = state.zombies.get(currentKey);
    state.zombies.delete(currentKey);
    state.zombies.set(next, zdata);
    if (!movedAtLeastOnce) pzm.movedKeys.add(startKey);
    pzm.movedKeys.add(next);
    pzm.stuckKeys.clear();
    movedAtLeastOnce = true;
    currentKey = next;

    combatPending = handleZombieEnteringPlayerSpace(next);
    if (combatPending) break;
  }

  return { finalKey: currentKey, moved: movedAtLeastOnce, combatPending };
}

function autoFinishZombieMovement() {
  const pzm = state.pendingZombieMovement;
  if (!pzm) return;

  let movedCount = 0;
  let combatDecisionPending = false;

  while (pzm.remaining > 0) {
    const available = [...state.zombies.keys()].filter((zk) => !pzm.movedKeys.has(zk) && !pzm.stuckKeys.has(zk));
    if (available.length === 0) break;

    const chosen = pickNearestZombieToMove(available);
    const { finalKey, moved, combatPending } = moveZombieAllSteps(chosen, pzm);

    if (!moved) {
      pzm.stuckKeys.add(chosen);
      continue;
    }

    pzm.remaining -= 1;
    movedCount += 1;
    combatDecisionPending = combatPending;
    if (combatDecisionPending) break;
  }

  if (combatDecisionPending) {
    if (pzm.remaining <= 0) state.pendingZombieMovement = null;
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

  const { finalKey, moved, combatPending } = moveZombieAllSteps(zKey, pzm);

  if (!moved) {
    pzm.stuckKeys.add(zKey);
    logLine(`Zombie at ${zKey} is stuck and cannot move.`);
    const available = [...state.zombies.keys()].filter((zk) => !pzm.movedKeys.has(zk) && !pzm.stuckKeys.has(zk));
    if (available.length === 0) {
      state.pendingZombieMovement = null;
      state.step = STEP.DISCARD;
      logLine(`No more zombies can move.`);
    }
    render();
    return;
  }

  pzm.remaining -= 1;
  logLine(`Zombie moved to ${finalKey}. (${pzm.remaining} move(s) remaining)`);

  if (combatPending) {
    if (pzm.remaining <= 0) state.pendingZombieMovement = null;
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
