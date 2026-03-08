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

      let nearest = [];
      let nearestDist = Infinity;
      available.forEach((zk) => {
        const { x, y } = parseKey(zk);
        const d = nearestPlayerDistance(x, y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = [zk];
        } else if (d === nearestDist) {
          nearest.push(zk);
        }
      });

      let chosenZombie = nearest[0];
      if (nearest.length > 1) {
        nearest.sort((a, b) => {
          const pa = parseKey(a);
          const pb = parseKey(b);
          if (pa.y !== pb.y) {
            return pa.y - pb.y;
          }
          return pa.x - pb.x;
        });
        chosenZombie = nearest[0];
        const chosenPos = parseKey(chosenZombie);
        logLine(`Zombie tie auto-resolved: moved zombie at (${chosenPos.x}, ${chosenPos.y}).`);
      }

      movedThisPhase.add(chosenZombie);
      const next = moveZombieOneStep(chosenZombie, { resolveTiesWithPrompt: false });
      if (next !== chosenZombie) {
        state.zombies.delete(chosenZombie);
        state.zombies.add(next);
        movedThisPhase.add(next);
        movedCount += 1;

        state.players
          .filter((p) => key(p.x, p.y) === next)
          .forEach((p) => {
            logLine(`A zombie moved into ${p.name}'s space. Combat starts immediately.`);
            const combat = resolveCombatForPlayer(p, {
              advanceStepWhenClear: false,
              endStepOnKnockout: false,
              resumeStepAfterPending: STEP.DISCARD
            });
            if (combat.pending) {
              combatDecisionPending = true;
            }
          });
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
