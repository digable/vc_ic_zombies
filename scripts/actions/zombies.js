// ---------------------------------------------------------------------------
// Zombie movement phase
// ---------------------------------------------------------------------------
// pendingZombieMovement = { remaining, movedFromCounts: Map<key,n>, stuckKeys: Set, snapshot: Map<key,count> }
//   remaining       — move slots left this phase (capped by total individual zombie count)
//   movedFromCounts — how many zombies have been moved FROM each space key this turn;
//                     a space is available if snapshot[key] - movedFromCounts[key] > 0
//   snapshot        — zombie counts per space at the START of this movement phase;
//                     prevents newly-arrived zombies from being moved again this turn
//   stuckKeys       — spaces where the zombie couldn't move THIS pass; cleared after any
//                     zombie successfully moves so previously stuck zombies are re-evaluated
// ---------------------------------------------------------------------------

function totalZombieCount() {
  let n = 0;
  state.zombies.forEach((zdata) => { n += zdata.count ?? 1; });
  return n;
}

function isAvailableForMove(pzm, zk) {
  if (pzm.stuckKeys.has(zk)) return false;
  const snap = pzm.snapshot.get(zk) ?? 0;
  const moved = pzm.movedFromCounts.get(zk) ?? 0;
  return snap - moved > 0;
}

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
  const total = totalZombieCount();
  const moveLimit = Math.min(roll, total);

  const snapshot = new Map();
  state.zombies.forEach((zdata, zk) => snapshot.set(zk, zdata.count ?? 1));

  logLine(`${currentPlayer().name} rolled ${roll} for zombie movement — ${moveLimit} zombie(s) to move. Select zombies manually or auto-move.`);
  state.pendingZombieMovement = { remaining: moveLimit, movedFromCounts: new Map(), stuckKeys: new Set(), snapshot };
  render();
}

// Moves ONE zombie (from a potentially stacked group) its full movement allowance
// for one turn slot. Returns { finalKey, moved, combatPending }.
// Updates pzm.movedFromCounts and pzm.stuckKeys. Does NOT touch pzm.remaining.
function moveZombieAllSteps(startKey, pzm) {
  const zdata = state.zombies.get(startKey);
  if (!zdata) return { finalKey: startKey, moved: false, combatPending: false };
  const zTypeProps = ZOMBIE_TYPES[zdata.type] ?? ZOMBIE_TYPES[ZOMBIE_TYPE.REGULAR];
  const isDog = zdata.type === ZOMBIE_TYPE.DOG;
  const steps = zTypeProps.movement;
  let currentKey = startKey;
  let movedAtLeastOnce = false;
  let combatPending = false;

  for (let step = 0; step < steps; step++) {
    const next = moveZombieOneStep(currentKey, { isDog });
    if (next === currentKey) break;

    // Move exactly 1 zombie from currentKey to next (split the stack if count > 1)
    const src = state.zombies.get(currentKey);
    if (!src) break;
    const srcCount = src.count ?? 1;
    if (srcCount <= 1) {
      state.zombies.delete(currentKey);
    } else {
      state.zombies.set(currentKey, { ...src, count: srcCount - 1 });
    }
    const dest = state.zombies.get(next);
    if (dest) {
      state.zombies.set(next, { ...dest, count: (dest.count ?? 1) + 1 });
    } else {
      state.zombies.set(next, { type: src.type, count: 1 });
    }
    state.zombieMovedSpaces.add(next);
    pzm.stuckKeys.clear();
    movedAtLeastOnce = true;
    currentKey = next;

    combatPending = handleZombieEnteringPlayerSpace(next);
    if (combatPending || !state.zombies.has(currentKey)) break;
  }

  if (movedAtLeastOnce) {
    pzm.movedFromCounts.set(startKey, (pzm.movedFromCounts.get(startKey) ?? 0) + 1);
  }

  return { finalKey: currentKey, moved: movedAtLeastOnce, combatPending };
}

const ZOMBIE_ANIM_DELAY_MS = 350;

function finalizeZombieAutoMove(combatPending) {
  state.zombieAnimationTimer = null;
  const pzm = state.pendingZombieMovement;
  if (combatPending) {
    const resumeAfter = (pzm && pzm.remaining > 0) ? STEP.MOVE_ZOMBIES : STEP.DISCARD;
    if (pzm && pzm.remaining <= 0) state.pendingZombieMovement = null;
    logLine(`${currentPlayer().name} must resolve combat.`);
    state.step = STEP.COMBAT;
    state.combatZombiePhaseResume = resumeAfter;
  } else {
    state.pendingZombieMovement = null;
    if (isCombatRequiredForCurrentPlayer()) {
      logLine(`Zombie auto-movement complete. ${currentPlayer().name} must resolve combat.`);
      state.step = STEP.COMBAT;
      state.combatZombiePhaseResume = STEP.DISCARD;
    } else {
      logLine(`Zombie auto-movement complete.`);
      state.step = STEP.DISCARD;
    }
  }
  render();
}

function availableZombiesForMove(pzm) {
  return [...state.zombies.keys()].filter((zk) => isAvailableForMove(pzm, zk));
}

// Stepped (animated) auto-move — moves one zombie per tick.
function autoMoveOneZombie() {
  state.zombieAnimationTimer = null;
  const pzm = state.pendingZombieMovement;
  if (!pzm || pzm.remaining <= 0) { finalizeZombieAutoMove(false); return; }

  const available = availableZombiesForMove(pzm);
  if (available.length === 0) { finalizeZombieAutoMove(false); return; }

  const chosen = pickNearestZombieToMove(available);
  const { moved, combatPending } = moveZombieAllSteps(chosen, pzm);

  if (!moved) {
    pzm.stuckKeys.add(chosen);
    render();
    state.zombieAnimationTimer = setTimeout(autoMoveOneZombie, ZOMBIE_ANIM_DELAY_MS);
    return;
  }

  pzm.remaining -= 1;
  render();

  if (combatPending || pzm.remaining <= 0) {
    finalizeZombieAutoMove(combatPending);
    return;
  }

  state.zombieAnimationTimer = setTimeout(autoMoveOneZombie, ZOMBIE_ANIM_DELAY_MS);
}

// Entry point for the "Auto-move remaining" button — starts the animation.
function autoFinishZombieMovement() {
  if (!state.pendingZombieMovement) return;
  autoMoveOneZombie();
}

// Flush all remaining moves instantly (skip/cancel animation).
function flushZombieMovement() {
  if (state.zombieAnimationTimer !== null) {
    clearTimeout(state.zombieAnimationTimer);
    state.zombieAnimationTimer = null;
  }
  const pzm = state.pendingZombieMovement;
  if (!pzm) return;

  let combatDecisionPending = false;
  while (pzm.remaining > 0) {
    const available = availableZombiesForMove(pzm);
    if (available.length === 0) break;
    const chosen = pickNearestZombieToMove(available);
    const { moved, combatPending } = moveZombieAllSteps(chosen, pzm);
    if (!moved) { pzm.stuckKeys.add(chosen); continue; }
    pzm.remaining -= 1;
    combatDecisionPending = combatPending;
    if (combatDecisionPending) break;
  }
  finalizeZombieAutoMove(combatDecisionPending);
}

function manualMoveZombie(zKey) {
  const pzm = state.pendingZombieMovement;
  if (!pzm || pzm.remaining <= 0) return;
  if (!state.zombies.has(zKey) || !isAvailableForMove(pzm, zKey)) return;

  const { finalKey, moved, combatPending } = moveZombieAllSteps(zKey, pzm);

  if (!moved) {
    pzm.stuckKeys.add(zKey);
    logLine(`Zombie at ${zKey} is stuck and cannot move.`, "quiet");
    const available = availableZombiesForMove(pzm);
    if (available.length === 0) {
      state.pendingZombieMovement = null;
      state.step = STEP.DISCARD;
      logLine(`No more zombies can move.`, "quiet");
    }
    render();
    return;
  }

  pzm.remaining -= 1;
  logLine(`Zombie moved to ${finalKey}. (${pzm.remaining} move(s) remaining)`, "quiet");

  if (combatPending) {
    const resumeAfter = pzm.remaining > 0 ? STEP.MOVE_ZOMBIES : STEP.DISCARD;
    if (pzm.remaining <= 0) state.pendingZombieMovement = null;
    state.step = STEP.COMBAT;
    state.combatZombiePhaseResume = resumeAfter;
    logLine(`${currentPlayer().name} must resolve combat.`);
    render();
    return;
  }

  if (pzm.remaining <= 0) {
    state.pendingZombieMovement = null;
    if (isCombatRequiredForCurrentPlayer()) {
      logLine(`Zombie movement complete. ${currentPlayer().name} must resolve combat.`);
      state.step = STEP.COMBAT;
      state.combatZombiePhaseResume = STEP.DISCARD;
    } else {
      logLine(`Zombie movement complete.`);
      state.step = STEP.DISCARD;
    }
  }
  render();
}
