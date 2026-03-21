function drawEventsToThree() {
  if (state.step !== STEP.DRAW_EVENTS || state.gameOver) {
    return;
  }

  const player = currentPlayer();
  while (player.hand.length < 3) {
    if (state.eventDeck.length === 0) {
      if (state.eventDiscardPile.length === 0) break;
      state.eventDeck = shuffle([...state.eventDiscardPile]);
      state.eventDiscardPile = [];
      logLine("Event deck exhausted — discard pile shuffled back in.");
    }
    player.hand.push(state.eventDeck.shift());
  }

  logLine(`${player.name} refilled event hand to ${player.hand.length}.`);
  state.step = STEP.ROLL_MOVE;
  render();
}

function toggleHandSelection(index) {
  if (state.selectedHandIndex === index) {
    state.selectedHandIndex = null;
  } else {
    state.selectedHandIndex = index;
  }
  render();
}

function playEvent(index) {
  if (state.gameOver) {
    return;
  }

  const player = currentPlayer();
  if (state.players[state.currentPlayerIndex] !== player) {
    return;
  }
  if (player.cannotPlayCardTurns > 0) {
    logLine(`${player.name} cannot play event cards this turn.`);
    render();
    return;
  }
  if (player.eventUsedThisRound) {
    logLine("Only one event card may be played from the start of your turn to the start of your next turn.");
    render();
    return;
  }

  const card = player.hand[index];
  if (!card) {
    return;
  }

  if (card.isWeapon && card.isItem) {
    const hasSameWeapon = player.items && player.items.some((c) => c.name === card.name);
    if (hasSameWeapon) {
      logLine(`${player.name} already has a ${card.name} in play. Discard it before playing another.`);
      render();
      return;
    }
  }

  if (card.isItem) {
    if (card.requiresTile) {
      const tile = getTileAtSpace(player.x, player.y);
      const allowed = Array.isArray(card.requiresTile) ? card.requiresTile : [card.requiresTile];
      if (!tile || !allowed.includes(tile.name)) {
        logLine(`${player.name} can only play ${card.name} while on the ${allowed.join(" or ")}.`);
        render();
        return;
      }
    }
    player.hand.splice(index, 1);
    player.items.push(card);
    card.apply(player, buildEventDeckHelpers());
    player.eventUsedThisRound = true;
    render();
    return;
  }

  player.hand.splice(index, 1);
  card.apply(player, buildEventDeckHelpers());
  state.eventDiscardPile.push(card);
  player.eventUsedThisRound = true;

  const pKey = key(player.x, player.y);
  if (state.zombies.has(pKey) && !player.noCombatThisTurn) {
    logLine(`${player.name} is in a zombie space after playing ${card.name}. Combat resolves immediately.`);
    resolveCombatForPlayer(player, { advanceStepWhenClear: false, endStepOnKnockout: true });
  }

  checkWin(player);
  render();
}

function resolveZombieDiceChallenge(action) {
  const pzdc = state.pendingZombieDiceChallenge;
  if (!pzdc) return;

  const target = state.players.find((p) => p.id === pzdc.targetPlayerId);
  if (!target) { state.pendingZombieDiceChallenge = null; render(); return; }

  if (action === "B0" || action === "B1") {
    if (target.bullets <= 0) { logLine(`${target.name} has no bullets.`); render(); return; }
    const idx = action === "B0" ? 0 : 1;
    target.bullets -= 1;
    pzdc.dice[idx] += 1;
    logLine(`${target.name} spent 1 bullet — die ${idx + 1} is now ${pzdc.dice[idx]}.`);
    render();
    return;
  }

  if (action === "H0" || action === "H1") {
    if (target.hearts <= 0) { logLine(`${target.name} has no hearts.`); render(); return; }
    const idx = action === "H0" ? 0 : 1;
    target.hearts -= 1;
    pzdc.dice[idx] = rollD6();
    logLine(`${target.name} spent 1 heart — die ${idx + 1} rerolled to ${pzdc.dice[idx]}.`);
    render();
    return;
  }

  if (action === "ACCEPT") {
    const failing = pzdc.dice.filter((d) => d <= 3);
    state.pendingZombieDiceChallenge = null;
    if (failing.length > 0) {
      const lost = Math.min(2, target.kills);
      target.kills -= lost;
      logLine(`${target.name} failed the dice challenge — lost ${lost} kill(s) (${target.kills} remaining).`);
    } else {
      logLine(`${target.name} passed the dice challenge — no kills lost.`);
    }
    render();
  }
}

function handleZombieReplaceClick(sx, sy) {
  const pzr = state.pendingZombieReplace;
  if (!pzr) return;

  const spaceKey = key(sx, sy);

  if (!pzr.selectedZombieKey) {
    if (!state.zombies.has(spaceKey)) return;
    pzr.selectedZombieKey = spaceKey;
    render();
    return;
  }

  if (spaceKey === pzr.selectedZombieKey) {
    pzr.selectedZombieKey = null;
    render();
    return;
  }

  const tile = getTileAtSpace(sx, sy);
  if (!tile) return;
  const tileX = spaceToTileCoord(sx);
  const tileY = spaceToTileCoord(sy);
  if (!isLocalWalkable(tile, getLocalCoord(sx, tileX), getLocalCoord(sy, tileY))) return;
  if (state.zombies.has(spaceKey)) return;

  state.zombies.delete(pzr.selectedZombieKey);
  state.zombies.add(spaceKey);
  logLine(`Zombie moved from ${pzr.selectedZombieKey} to ${spaceKey}.`);

  pzr.remaining -= 1;
  pzr.selectedZombieKey = null;

  if (pzr.remaining <= 0) {
    state.pendingZombieReplace = null;
    logLine("This Isn't So Bad resolved.");
  }
  render();
}

function handleZombiePlaceClick(sx, sy) {
  const pzp = state.pendingZombiePlace;
  if (!pzp) return;

  const tile = getTileAtSpace(sx, sy);
  if (!tile) return;
  if (!isLocalWalkable(tile, getLocalCoord(sx, spaceToTileCoord(sx)), getLocalCoord(sy, spaceToTileCoord(sy)))) return;
  const spaceKey = key(sx, sy);
  if (state.zombies.has(spaceKey)) return;
  if (state.players.some((p) => key(p.x, p.y) === spaceKey)) return;

  state.zombies.add(spaceKey);
  logLine(`Zombie placed at ${spaceKey}.`);
  pzp.remaining -= 1;

  if (pzp.remaining <= 0) {
    const cardName = pzp.cardName || "Card";
    state.pendingZombiePlace = null;
    logLine(`${cardName} resolved.`);
  }
  render();
}

function finishZombiePlace() {
  if (!state.pendingZombiePlace) return;
  const cardName = state.pendingZombiePlace.cardName || "Card";
  state.pendingZombiePlace = null;
  logLine(`${cardName} — done placing zombies.`);
  render();
}

function handleBuildingSelectClick(sx, sy) {
  if (!state.pendingBuildingSelect) return;
  const tile = getTileAtSpace(sx, sy);
  if (!tile) return;
  const lx = getLocalCoord(sx, spaceToTileCoord(sx));
  const ly = getLocalCoord(sy, spaceToTileCoord(sy));
  if (getSubTileType(tile, lx, ly) !== "building") return;

  const tx = spaceToTileCoord(sx);
  const ty = spaceToTileCoord(sy);
  const { cardName, mode } = state.pendingBuildingSelect;

  // Collect all legal building spaces and which are empty
  const emptySpaces = [];
  let existingZombies = 0;
  for (let dlx = 0; dlx < 3; dlx++) {
    for (let dly = 0; dly < 3; dly++) {
      if (getSubTileType(tile, dlx, dly) !== "building") continue;
      if (!isLocalWalkable(tile, dlx, dly)) continue;
      const spaceKey = key(tx * 3 + dlx, ty * 3 + dly);
      if (state.zombies.has(spaceKey)) {
        existingZombies++;
      } else {
        emptySpaces.push(spaceKey);
      }
    }
  }

  let placed = 0;
  if (mode === "double") {
    // Fill up to existingZombies empty spaces
    const toFill = emptySpaces.slice(0, existingZombies);
    toFill.forEach((spaceKey) => { state.zombies.add(spaceKey); placed++; });
  } else {
    // "fill_all" — fill every empty legal space
    emptySpaces.forEach((spaceKey) => { state.zombies.add(spaceKey); placed++; });
  }

  state.pendingBuildingSelect = null;
  logLine(`${cardName} — ${placed} zombie(s) placed in ${tile.name}.`);
  render();
}

function finishZombieReplace() {
  if (!state.pendingZombieReplace) return;
  state.pendingZombieReplace = null;
  logLine("This Isn't So Bad — done moving zombies.");
  render();
}

function resolveEventChoice(optionKey) {
  const pending = state.pendingEventChoice;
  if (!pending) return;
  state.pendingEventChoice = null;
  pending.resolve(optionKey);
  render();
}

function activateItem(index) {
  if (state.gameOver) return;
  const player = currentPlayer();
  const card = player.items[index];
  if (!card) return;
  player.items.splice(index, 1);
  card.activateItem(player, buildEventDeckHelpers());
  state.eventDiscardPile.push(card);
  render();
}

function discardSelected() {
  if (state.step !== STEP.DISCARD || state.gameOver) {
    return;
  }

  const player = currentPlayer();
  if (state.selectedHandIndex !== null && player.hand[state.selectedHandIndex]) {
    const [card] = player.hand.splice(state.selectedHandIndex, 1);
    state.eventDiscardPile.push(card);
    logLine(`${player.name} discarded ${card.name}.`);
  } else {
    logLine(`${player.name} skipped discard.`);
  }

  state.selectedHandIndex = null;
  state.step = STEP.END;
  render();
}
