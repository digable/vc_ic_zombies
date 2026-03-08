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
    resumeStepAfterPending: STEP.DISCARD
  });
  return Boolean(combat.pending);
}

function moveZombies() {
  if (state.gameOver) {
    return;
  }

  if (state.step !== STEP.MOVE_ZOMBIES) {
    logLine(`Cannot move zombies during ${state.step}.`);
    render();
    return;
  }

  if (state.zombies.size === 0) {
    autoSkipZombieMoveIfClear();
    render();
    return;
  }

  try {
    const roll = rollD6();
    state.currentZombieRoll = roll;

    const moveLimit = Math.min(roll, state.zombies.size);
    const movedThisPhase = new Set();
    let movedCount = 0;
    let combatDecisionPending = false;

    for (let i = 0; i < moveLimit; i += 1) {
      const available = [...state.zombies].filter((zk) => !movedThisPhase.has(zk));
      if (available.length === 0) {
        break;
      }

      const chosenZombie = pickNearestZombieToMove(available);

      movedThisPhase.add(chosenZombie);
      const next = moveZombieOneStep(chosenZombie, { resolveTiesDeterministically: false });
      if (next !== chosenZombie) {
        state.zombies.delete(chosenZombie);
        state.zombies.add(next);
        movedThisPhase.add(next);
        movedCount += 1;
        combatDecisionPending = handleZombieEnteringPlayerSpace(next);
      }

      if (combatDecisionPending) {
        break;
      }
    }

    if (combatDecisionPending) {
      logLine(`${currentPlayer().name} must resolve combat before zombie movement can continue.`);
      state.step = STEP.COMBAT;
      render();
      return;
    }

    logLine(`${currentPlayer().name} rolled ${roll} for zombie movement. ${movedCount} zombie(s) moved.`);
  } catch (err) {
    logLine(`Zombie movement error: ${err?.message || err}`);
  }

  state.step = STEP.DISCARD;
  render();
}
