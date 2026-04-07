function handleKnockout(player, options = {}) {
  const { endStep = true } = options;
  const adjIdx = player.items ? player.items.findIndex((c) => c.name === "Adjusting Nicely") : -1;
  let lostKills;
  if (adjIdx >= 0) {
    const [card] = player.items.splice(adjIdx, 1);
    state.eventDiscardPile.push(card);
    lostKills = 0;
    logLine(`${player.name} discarded Adjusting Nicely — no kills lost on knockout.`);
  } else {
    lostKills = Math.floor(player.kills / 2);
    player.kills -= lostKills;
  }
  player.hearts = INITIAL_HEARTS;
  player.bullets = INITIAL_BULLETS;
  player.x = 1;
  player.y = 1;
  player.knockedOut = true;
  player.hasJeep = false;
  player.knockouts = (player.knockouts || 0) + 1;
  if (player.meatCleaverActive) {
    player.meatCleaverActive = false;
    const mcIdx = player.items ? player.items.findIndex((c) => c.name === "Meat Cleaver") : -1;
    if (mcIdx >= 0) {
      const [mc] = player.items.splice(mcIdx, 1);
      state.eventDiscardPile.push(mc);
      logLine(`${player.name}'s Meat Cleaver was lost on knockout.`);
    }
  }
  const respawnTile = getTileAtSpace(player.x, player.y);
  const respawnName = respawnTile ? getTileDisplayName(respawnTile) : `(${player.x}, ${player.y})`;
  if (endStep) {
    state.step = STEP.END;
  }
  logLine(`${player.name} was knocked out, lost ${lostKills} kill(s), and respawned at ${respawnName}.`, "knockout");
  state.knockoutBanner = { playerName: player.name, lostKills, respawnName };
  setTimeout(() => {
    state.knockoutBanner = null;
    render();
  }, 5000);
}

function applyCombatPostStep(player, playerSpaceKey, options = {}) {
  const { resumeStepAfterPending = null } = options;

  if (!state.zombies.has(playerSpaceKey)) {
    collectTokensAtPlayerSpace(player);
  }

  if (resumeStepAfterPending && !state.zombies.has(playerSpaceKey)) {
    state.combatMoveResume = null;
    state.combatZombiePhaseResume = null;
    checkJeepDoorOffer(player);

    if (resumeStepAfterPending === STEP.MOVE_ZOMBIES) {
      state.step = STEP.MOVE_ZOMBIES;
      if (!state.pendingZombieMovement) {
        autoSkipZombieMoveIfClear();
      }
      return;
    }

    if (resumeStepAfterPending === STEP.MOVE) {
      state.step = STEP.MOVE;
      if (state.movesRemaining > 0) {
        logLine(`${player.name} may continue moving (${state.movesRemaining} space(s) remaining).`);
      }
      return;
    }

    if (resumeStepAfterPending === STEP.DRAW_TILE) {
      state.step = STEP.DRAW_TILE;
      autoSkipDrawTileIfEmpty();
      return;
    }

    state.step = resumeStepAfterPending;
    return;
  }

  if (state.step === STEP.COMBAT && !state.zombies.has(playerSpaceKey)) {
    state.combatMoveResume = null;
    state.combatZombiePhaseResume = null;
    state.step = STEP.DRAW_EVENTS;
  }
}

// Action codes passed to resolvePendingCombatDecision:
//   "B"          — spend a bullet for +1 to the current roll
//   "H"          — spend a heart to reroll from scratch
//   "FAK"        — use First Aid Kit (free reroll, item discarded)
//   "W:<name>"   — use a combat weapon item by name (e.g. "W:Chainsaw")
//   "L"          — accept the loss (knockout or take the hit)
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

  const playerSpaceKey = playerKey(player);
  if (!state.zombies.has(playerSpaceKey)) {
    state.pendingCombatDecision = null;
    applyCombatPostStep(player, playerSpaceKey, pending.options);
    render();
    return;
  }

  if (actionCode === "LS") {
    const lsIndex = player.hand ? player.hand.findIndex((c) => c.name === "Lucky Shot") : -1;
    if (lsIndex === -1) { render(); return; }
    if (player.bullets <= 0) { logLine(`${player.name} has no bullets for Lucky Shot.`); render(); return; }
    if (state.weaponsJammedCount > 0) { logLine("Weapons are jammed — Lucky Shot cannot be used."); render(); return; }
    if (state.bulletsCombatFrozenCount > 0) { logLine("No Guts, No Glory — bullets may not be spent in zombie combat."); render(); return; }
    const lsCard = player.hand.splice(lsIndex, 1)[0];
    state.eventDiscardPile.push(lsCard);
    player.bullets -= 1;
    decrementZombieAt(playerSpaceKey);
    player.kills += 1;
    state.lastCombatResult = "Lucky Shot";
    state.recentKillKey = playerSpaceKey;
    state.recentKillByPlayerId = player.id;
    logLine(`${player.name} used Lucky Shot — spent 1 bullet and auto-killed the zombie.`, "kill");
    const options = pending.options;
    state.pendingCombatDecision = null;
    checkWin(player);
    applyCombatPostStep(player, playerSpaceKey, options);
    render();
    return;
  }

  if (actionCode === "B") {
    if (state.weaponsJammedCount > 0) {
      logLine("Weapons and bullets are jammed — cannot spend bullets.");
      render();
      return;
    }
    if (state.bulletsCombatFrozenCount > 0) {
      logLine("No Guts, No Glory — bullets may not be spent in zombie combat.");
      render();
      return;
    }
    if (player.bullets <= 0) {
      logLine(`${player.name} cannot spend a bullet (none remaining).`);
      render();
      return;
    }

    player.bullets -= 1;
    pending.modifiedRoll += 1;
    logLine(`${player.name} spent 1 bullet. Combat roll is now ${pending.modifiedRoll}.`);

    if (pending.modifiedRoll >= pending.killRoll) {
      decrementZombieAt(playerSpaceKey);
      player.kills += 1;
      state.lastCombatResult = `Success (${pending.modifiedRoll})`;
      state.recentKillKey = playerSpaceKey;
      state.recentKillByPlayerId = player.id;
      const bonusText = ` (d6 ${pending.roll} + attack ${pending.permanentBonus} + temp ${pending.tempBonus})`;
      const zombieLabel = pending.isDog ? "zombie dog" : pending.isEnhanced ? "government-enhanced zombie" : "zombie";
      logLine(`${player.name} raised the roll to ${pending.modifiedRoll}${bonusText} and killed the ${zombieLabel}.`, "kill");

      const options = pending.options;
      state.pendingCombatDecision = null;
      checkWin(player);
      applyCombatPostStep(player, playerSpaceKey, options);
      render();
      return;
    }

    render();
    return;
  }

  if (actionCode === "HH") {
    // Spend ½ heart to reroll (only available vs zombie dogs)
    if (player.hearts < 0.5) {
      logLine(`${player.name} has no hearts left to spend.`);
      render();
      return;
    }
    player.hearts -= 0.5;
    logLine(`${player.name} spent ½ heart and chose to reroll (${player.hearts} heart(s) remaining).`);
    const optHH = pending.options;
    state.pendingCombatDecision = null;
    resolveCombatForPlayer(player, optHH);
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

  if (actionCode === "FAK") {
    const fakIndex = player.items ? player.items.findIndex((c) => c.name === "First Aid Kit") : -1;
    if (fakIndex < 0) {
      logLine(`${player.name} has no First Aid Kit to use.`);
      render();
      return;
    }
    const [fak] = player.items.splice(fakIndex, 1);
    state.eventDiscardPile.push(fak);
    logLine(`${player.name} used the First Aid Kit (free reroll, no heart spent).`);
    const options = pending.options;
    state.pendingCombatDecision = null;
    resolveCombatForPlayer(player, options);
    render();
    return;
  }

  if (actionCode.startsWith("W:")) {
    if (state.weaponsJammedCount > 0) {
      logLine("Weapons and bullets are jammed — cannot use weapons.");
      render();
      return;
    }
    const weaponName = actionCode.slice(2);
    const weaponIndex = player.items ? player.items.findIndex((c) => c.name === weaponName) : -1;
    if (weaponIndex < 0) {
      logLine(`${player.name} does not have ${weaponName} in play.`);
      render();
      return;
    }
    const [weapon] = player.items.splice(weaponIndex, 1);

    if (weapon.oncePerTurnCombatBoost) {
      // Not discarded — stays in play, usable once per turn
      player.items.push(weapon);
      if (!player.itemsUsedThisTurn) player.itemsUsedThisTurn = [];
      player.itemsUsedThisTurn.push(weapon.name);
      pending.modifiedRoll += weapon.oncePerTurnCombatBoost;
      logLine(`${player.name} used the ${weapon.name} (+${weapon.oncePerTurnCombatBoost} once this turn). Combat roll is now ${pending.modifiedRoll}.`);
      if (weapon.onWeaponUse) weapon.onWeaponUse(player, pending);
    } else {
      if (pending.weaponUsed) {
        player.items.splice(weaponIndex, 0, weapon); // put back
        logLine(`${player.name} already used a weapon in this fight.`);
        render();
        return;
      }
      state.eventDiscardPile.push(weapon);
      pending.weaponUsed = true;

      if (weapon.combatBoost) {
        pending.modifiedRoll += weapon.combatBoost;
        logLine(`${player.name} used the ${weapon.name} (+${weapon.combatBoost}). Combat roll is now ${pending.modifiedRoll}.`);
      }
      if (weapon.turnCombatBoost) {
        pending.modifiedRoll += weapon.turnCombatBoost;
        player.tempCombatBonus = (player.tempCombatBonus || 0) + weapon.turnCombatBoost;
        logLine(`${player.name} used the ${weapon.name} (+${weapon.turnCombatBoost} this combat and all remaining combats this turn). Combat roll is now ${pending.modifiedRoll}.`);
      }
      if (weapon.permanentAttackBoost) {
        player.attack += weapon.permanentAttackBoost;
        pending.modifiedRoll += weapon.permanentAttackBoost;
        logLine(`${player.name} used the ${weapon.name} (+${weapon.permanentAttackBoost} permanent attack). Combat roll is now ${pending.modifiedRoll}.`);
      }
    }

    if (pending.modifiedRoll >= pending.killRoll) {
      decrementZombieAt(pending.pKey);
      player.kills += 1;
      state.lastCombatResult = `Success (${pending.modifiedRoll})`;
      state.recentKillKey = pending.pKey;
      state.recentKillByPlayerId = player.id;
      const zombieLabel = pending.isDog ? "zombie dog" : pending.isEnhanced ? "government-enhanced zombie" : "zombie";
      logLine(`${player.name} raised the roll to ${pending.modifiedRoll} and killed the ${zombieLabel}.`, "kill");
      const options = pending.options;
      state.pendingCombatDecision = null;
      checkWin(player);
      applyCombatPostStep(player, pending.pKey, options);
    }
    render();
    return;
  }

  if (actionCode === "L") {
    const options = pending.options;
    if (pending.isDog) {
      // Dog damage: lose ½ heart instead of full knockout
      state.lastCombatResult = `Dog Hit (${pending.modifiedRoll})`;
      state.pendingCombatDecision = null;
      player.hearts -= 0.5;
      logLine(`${player.name} was bitten by a zombie dog — lost ½ heart (${player.hearts} heart(s) remaining).`);
      if (player.hearts <= 0) {
        state.combatMoveResume = null;
        state.combatZombiePhaseResume = null;
        handleKnockout(player, { endStep: options.endStepOnKnockout });
        if (!options.endStepOnKnockout && options.resumeStepAfterPending && state.step !== STEP.END) {
          state.step = options.resumeStepAfterPending;
        }
      } else {
        // Dog stays; force-advance past this combat encounter
        state.combatMoveResume = null;
        state.combatZombiePhaseResume = null;
        if (options.resumeStepAfterPending) {
          state.step = options.resumeStepAfterPending;
        } else if (state.step === STEP.COMBAT) {
          state.step = STEP.DRAW_EVENTS;
        }
      }
    } else {
      state.lastCombatResult = `Knocked Out (${pending.modifiedRoll})`;
      logLine(`${player.name} lost the fight and was knocked out.`);
      state.pendingCombatDecision = null;
      state.combatMoveResume = null;
      state.combatZombiePhaseResume = null;
      handleKnockout(player, { endStep: options.endStepOnKnockout });
      if (!options.endStepOnKnockout && options.resumeStepAfterPending && state.step !== STEP.END) {
        state.step = options.resumeStepAfterPending;
      }
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

  const playerSpaceKey = playerKey(player);

  if (!state.zombies.has(playerSpaceKey)) {
    if (advanceStepWhenClear && state.step === STEP.COMBAT) {
      state.step = STEP.DRAW_EVENTS;
    }
    return { fought: false, knockedOut: false, pending: false };
  }

  const zombieData = state.zombies.get(playerSpaceKey);
  const zombieTypeProps = ZOMBIE_TYPES[zombieData?.type] ?? ZOMBIE_TYPES[ZOMBIE_TYPE.REGULAR];
  const isRegular = !zombieData?.type || zombieData.type === ZOMBIE_TYPE.REGULAR;
  const killRoll = (state.regularZombieEnhanced && isRegular)
    ? Math.max(zombieTypeProps.killRoll, 5)
    : zombieTypeProps.killRoll;
  const isEnhanced = zombieData?.type === ZOMBIE_TYPE.ENHANCED;
  const isDog = zombieData?.type === ZOMBIE_TYPE.DOG;

  const permanentBonus = player.attack || 0;
  const tempBonus = player.tempCombatBonus || 0;
  const shotgunBonus = player.shotgunCharges > 0 ? 1 : 0;
  if (shotgunBonus) {
    player.shotgunCharges -= 1;
  }
  const playerTileKey = key(spaceToTileCoord(player.x), spaceToTileCoord(player.y));
  const tileBonus = (player.tileCombatBonusTile === playerTileKey) ? (player.tileCombatBonus || 0) : 0;

  const roll = rollD6();
  if (player.inTheZone && roll === 6) {
    drawOneEventCardForPlayer(player, "In the Zone");
  }
  const diePenalty = player.dieRollPenalty || 0;
  const meatCleaverBonus = player.meatCleaverActive ? 1 : 0;
  const macheteBonus = (player.items || []).some((c) => c.name === "Machete") ? 1 : 0;
  const baseCombatRoll = roll - diePenalty + permanentBonus + tempBonus + shotgunBonus + tileBonus + meatCleaverBonus + macheteBonus;
  const bonusText = ` (d6 ${roll}${diePenalty ? ` - penalty ${diePenalty}` : ""} + attack ${permanentBonus} + temp ${tempBonus}${shotgunBonus ? ` + shotgun ${shotgunBonus}` : ""}${tileBonus ? ` + molotov ${tileBonus}` : ""}${meatCleaverBonus ? ` + cleaver ${meatCleaverBonus}` : ""}${macheteBonus ? ` + machete ${macheteBonus}` : ""})`;
  const zombieLabel = isDog ? "zombie dog" : isEnhanced ? "government-enhanced zombie" : "zombie";

  if (baseCombatRoll >= killRoll) {
    decrementZombieAt(playerSpaceKey);
    player.kills += 1;
    state.lastCombatResult = `Success (${baseCombatRoll})`;
    state.recentKillKey = playerSpaceKey;
    state.recentKillByPlayerId = player.id;
    logLine(`${player.name} won combat with a ${baseCombatRoll}${bonusText} and killed the ${zombieLabel}.`, "kill");
    checkWin(player);
    applyCombatPostStep(player, playerSpaceKey, { resumeStepAfterPending });
    return { fought: true, knockedOut: false, pending: false };
  }

  state.pendingCombatDecision = {
    playerId: player.id,
    pKey: playerSpaceKey,
    killRoll,
    isEnhanced,
    isDog,
    roll,
    baseRoll: baseCombatRoll,
    modifiedRoll: baseCombatRoll,
    permanentBonus,
    tempBonus,
    weaponUsed: false,
    options: {
      advanceStepWhenClear,
      endStepOnKnockout,
      resumeStepAfterPending
    }
  };
  state.lastCombatResult = `Pending (${baseCombatRoll})`;
  logLine(`${player.name} failed combat (${baseCombatRoll}) against a ${zombieLabel}. Need ${killRoll}+ to win. Choose how to resolve.`);
  state.step = STEP.COMBAT;
  return { fought: false, knockedOut: false, pending: true };
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
  const resumeStep = state.combatMoveResume
    ?? state.combatZombiePhaseResume
    ?? (state.step === STEP.MOVE ? (state.movesRemaining > 0 ? STEP.MOVE : STEP.MOVE_ZOMBIES) : null);
  resolveCombatForPlayer(player, {
    advanceStepWhenClear: true,
    endStepOnKnockout: true,
    resumeStepAfterPending: resumeStep
  });
  render();
}
