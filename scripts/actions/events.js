function drawOneEventCardForPlayer(player, sourceName) {
  if (state.eventDeck.length === 0) {
    if (state.eventDiscardPile.length === 0) {
      logLine(`${sourceName}: no cards left to draw.`);
      return;
    }
    reshuffleEventDeckIfEmpty();
  }
  const card = state.eventDeck.shift();
  player.hand.push(card);
  logLine(`${player.name} drew ${card.name} (${sourceName} — natural 6).`);
}

function drawEventsToThree() {
  if (state.step !== STEP.DRAW_EVENTS || state.gameOver) {
    return;
  }

  const player = currentPlayer();
  while (player.hand.length < 3) {
    if (state.eventDeck.length === 0) {
      if (state.eventDiscardPile.length === 0) break;
      reshuffleEventDeckIfEmpty();
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

  if (card.canPlay && !card.canPlay()) {
    logLine(`${card.name} cannot be played at this time.`);
    render();
    return;
  }

  if (card.isItem) {
    if (player.items && player.items.some((c) => c.name === card.name)) {
      logLine(`${player.name} already has ${card.name} in play.`);
      render();
      return;
    }
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

  if (player.lookinAtMePending) {
    const lookin = player.lookinAtMePending;
    player.lookinAtMePending = null;
    const normalTarget = state.players[(state.players.indexOf(player) + 1) % state.players.length];
    const altTargets = state.players.filter((p) => p.id !== player.id && p !== normalTarget);
    if (altTargets.length === 0) {
      logLine(`You Lookin' at Me?!? — no other legal target. ${card.name} is discarded without effect.`);
      state.eventDiscardPile.push(card);
      player.eventUsedThisRound = true;
      render();
      return;
    }
    if (altTargets.length === 1) {
      state.forcedNextOpponentId = altTargets[0].id;
      card.apply(player, buildEventDeckHelpers());
      state.forcedNextOpponentId = null;
    } else {
      state.pendingEventChoice = {
        playerId: lookin.byPlayerId,
        cardName: `You Lookin' at Me?!? — New target for ${card.name}`,
        options: altTargets.map((t) => ({ key: `t_${t.id}`, label: t.name })),
        resolve(optKey) {
          state.forcedNextOpponentId = Number(optKey.slice(2));
          card.apply(player, buildEventDeckHelpers());
          state.forcedNextOpponentId = null;
          state.eventDiscardPile.push(card);
          checkWin(player);
        }
      };
      player.eventUsedThisRound = true;
      render();
      return;
    }
    state.eventDiscardPile.push(card);
    player.eventUsedThisRound = true;
    const pKey = playerKey(player);
    if (state.zombies.has(pKey) && !player.noCombatThisTurn) {
      resolveCombatForPlayer(player, { advanceStepWhenClear: false, endStepOnKnockout: true });
    }
    checkWin(player);
    render();
    return;
  }

  card.apply(player, buildEventDeckHelpers());
  state.eventDiscardPile.push(card);
  player.eventUsedThisRound = true;

  const pKey = playerKey(player);
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
    if (!isSpaceOccupiedByZombie(spaceKey)) return;
    pzr.selectedZombieKey = spaceKey;
    render();
    return;
  }

  if (spaceKey === pzr.selectedZombieKey) {
    if (!pzr.adjacentToKey) {
      pzr.selectedZombieKey = null;
      render();
    }
    return;
  }

  const tile = getTileAtSpace(sx, sy);
  if (!tile) return;
  const tileX = spaceToTileCoord(sx);
  const tileY = spaceToTileCoord(sy);
  if (!isLocalWalkable(tile, getLocalCoord(sx, tileX), getLocalCoord(sy, tileY))) return;
  if (isSpaceOccupiedByZombie(spaceKey)) return;

  if (pzr.adjacentToKey) {
    const { x: ax, y: ay } = parseKey(pzr.adjacentToKey);
    if (Math.abs(sx - ax) + Math.abs(sy - ay) !== 1) return;
  }

  const replacedData = state.zombies.get(pzr.selectedZombieKey);
  state.zombies.delete(pzr.selectedZombieKey);
  state.zombies.set(spaceKey, replacedData);
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
  if (!isSubtileZombieViable(tile, getLocalCoord(sx, spaceToTileCoord(sx)), getLocalCoord(sy, spaceToTileCoord(sy)))) return;
  const spaceKey = key(sx, sy);
  if (isSpaceOccupiedByZombie(spaceKey)) return;
  if (state.players.some((p) => key(p.x, p.y) === spaceKey)) return;

  state.zombies.set(spaceKey, { type: ZOMBIE_TYPE.REGULAR });
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

function handleRocketLauncherClick(sx, sy) {
  const prl = state.pendingRocketLauncher;
  if (!prl) return;

  const player = state.players.find((p) => p.id === prl.playerId);
  if (!player) { state.pendingRocketLauncher = null; render(); return; }

  const tileKey = getSpaceTileKey(sx, sy);
  const tile = state.board.get(tileKey);
  if (!tile) return;

  if (tile.type === "helipad") {
    logLine("Rocket Launcher cannot target the Helipad.");
    render();
    return;
  }
  if (!isBoardEdgeTile(tileX, tileY)) {
    logLine("Rocket Launcher can only target tiles on the edge of the board.");
    render();
    return;
  }

  let killed = 0;
  for (let lx = 0; lx < TILE_DIM; lx++) {
    for (let ly = 0; ly < TILE_DIM; ly++) {
      const spaceKey = key(tileX * TILE_DIM + lx, tileY * TILE_DIM + ly);
      if (state.zombies.has(spaceKey)) {
        state.zombies.delete(spaceKey);
        player.kills += 1;
        killed++;
      }
      state.spaceTokens.delete(spaceKey);
    }
  }

  // Remove breakthrough connections referencing this tile's spaces
  const staleConns = [...state.breakthroughConnections].filter((conn) => {
    const coordPart = conn.split(BREAKTHROUGH_SEP)[0];
    const { x, y } = parseKey(coordPart);
    return spaceToTileCoord(x) === tileX && spaceToTileCoord(y) === tileY;
  });
  staleConns.forEach((conn) => state.breakthroughConnections.delete(conn));

  state.players.forEach((p) => {
    if (spaceToTileCoord(p.x) === tileX && spaceToTileCoord(p.y) === tileY) {
      p.x = 1;
      p.y = 1;
      logLine(`${p.name} was on the destroyed tile and was moved to Town Square.`);
    }
  });

  state.board.delete(tileKey);
  state.pendingRocketLauncher = null;

  const msg = killed > 0 ? `${killed} zombie(s) killed.` : "no zombies were present.";
  logLine(`${player.name}'s Rocket Launcher destroyed ${getTileDisplayName(tile)} — ${msg}`, killed > 0 ? "kill" : undefined);
  checkWin(player);
  render();
}

function finishRocketLauncher() {
  if (!state.pendingRocketLauncher) return;
  state.pendingRocketLauncher = null;
  logLine("Rocket Launcher — cancelled.");
  render();
}

function handleMinefieldClick(sx, sy) {
  const pmf = state.pendingMinefield;
  if (!pmf) return;

  const player = state.players.find((p) => p.id === pmf.playerId);
  if (!player) { state.pendingMinefield = null; render(); return; }

  const tile = state.board.get(getSpaceTileKey(sx, sy));
  if (!tile) return;

  let killed = 0;
  for (let lx = 0; lx < 3 && killed < pmf.remaining; lx++) {
    for (let ly = 0; ly < 3 && killed < pmf.remaining; ly++) {
      if (getSubTileType(tile, lx, ly) !== "road") continue;
      const spaceKey = key(tileX * TILE_DIM + lx, tileY * TILE_DIM + ly);
      if (!state.zombies.has(spaceKey)) continue;
      state.zombies.delete(spaceKey);
      player.kills += 1;
      state.recentKillKey = spaceKey;
      killed++;
    }
  }

  if (killed === 0) {
    logLine(`${player.name}: no zombies on road spaces of ${getTileDisplayName(tile)} — pick another tile.`);
    render();
    return;
  }

  logLine(`${player.name}'s Mine Field destroyed ${killed} zombie(s) on road spaces of ${getTileDisplayName(tile)}.`, "kill");
  state.pendingMinefield = null;
  checkWin(player);
  render();
}

function finishMinefield() {
  if (!state.pendingMinefield) return;
  state.pendingMinefield = null;
  logLine("Mine Field — skipped.");
  render();
}

function handleZombieFloodClick(sx, sy) {
  const pzf = state.pendingZombieFlood;
  if (!pzf) return;

  const player = state.players.find((p) => p.id === pzf.playerId);
  if (!player) { state.pendingZombieFlood = null; render(); return; }

  const tileKey = getSpaceTileKey(sx, sy);
  const tile = state.board.get(tileKey);
  if (!tile) return;

  if (state.noZombieTiles?.has(tileKey)) {
    logLine("That tile is marked as a no-zombie zone — pick another.");
    render();
    return;
  }

  let placed = 0;
  for (let lx = 0; lx < TILE_DIM; lx += 1) {
    for (let ly = 0; ly < TILE_DIM; ly += 1) {
      if (!isSubtileZombieViable(tile, lx, ly)) continue;
      const spaceKey = key(tileX * TILE_DIM + lx, tileY * TILE_DIM + ly);
      if (state.zombies.has(spaceKey)) continue;
      state.zombies.set(spaceKey, { type: ZOMBIE_TYPE.REGULAR });
      placed += 1;
    }
  }

  logLine(`${player.name}'s We're all gonna die! — ${placed} zombie(s) placed on ${getTileDisplayName(tile)}.`);
  state.pendingZombieFlood = null;
  render();
}

function finishZombieFlood() {
  if (!state.pendingZombieFlood) return;
  state.pendingZombieFlood = null;
  logLine("We're all gonna die! — cancelled.");
  render();
}

// Returns a Set of global space keys that are walkable and border at least one building/mall store subtile.
function getSpacesAdjoiningBuilding() {
  const valid = new Set();
  state.board.forEach((tile, tKey) => {
    const { x: tx, y: ty } = parseKey(tKey);
    for (let lx = 0; lx < TILE_DIM; lx += 1) {
      for (let ly = 0; ly < TILE_DIM; ly += 1) {
        const sub = tile.subTiles?.[key(lx, ly)];
        if (!sub?.walkable) continue;
        const gx = tx * TILE_DIM + lx;
        const gy = ty * TILE_DIM + ly;
        const neighbors = [[gx - 1, gy], [gx + 1, gy], [gx, gy - 1], [gx, gy + 1]];
        for (const [nx, ny] of neighbors) {
          const ntx = spaceToTileCoord(nx);
          const nty = spaceToTileCoord(ny);
          const nTile = state.board.get(key(ntx, nty));
          if (!nTile) continue;
          const nlx = getLocalCoord(nx, ntx);
          const nly = getLocalCoord(ny, nty);
          const subType = getSubTileType(nTile, nlx, nly);
          if (subType === "building" || subType === "mall store") {
            valid.add(key(gx, gy));
            break;
          }
        }
      }
    }
  });
  return valid;
}

function handleSpaceSelectClick(sx, sy) {
  const pss = state.pendingSpaceSelect;
  if (!pss) return;

  const player = state.players.find((p) => p.id === pss.playerId);
  if (!player) { state.pendingSpaceSelect = null; render(); return; }

  const valid = getSpacesAdjoiningBuilding();
  const spaceKey = key(sx, sy);
  if (!valid.has(spaceKey)) return;

  player.x = sx;
  player.y = sy;
  state.pendingSpaceSelect = null;
  logLine(`${player.name} used ${pss.cardName} — moved to [${sx}, ${sy}].`);

  if (state.zombies.has(spaceKey) && !player.noCombatThisTurn) {
    logLine(`${player.name} landed on a zombie space — combat triggers immediately.`);
    resolveCombatForPlayer(player, { advanceStepWhenClear: false, endStepOnKnockout: true });
  }
  render();
}

function finishSpaceSelect() {
  if (!state.pendingSpaceSelect) return;
  state.pendingSpaceSelect = null;
  logLine("Now that's just gross! — cancelled.");
  render();
}

function handleDynamiteTargetClick(sx, sy) {
  const pdt = state.pendingDynamiteTarget;
  if (!pdt) return;

  const player = state.players.find((p) => p.id === pdt.playerId);
  if (!player) { state.pendingDynamiteTarget = null; render(); return; }

  const dx = Math.abs(sx - player.x);
  const dy = Math.abs(sy - player.y);
  if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) return;

  const spaceKey = key(sx, sy);
  if (!state.zombies.has(spaceKey)) return;

  state.zombies.delete(spaceKey);
  player.kills += 1;
  state.recentKillKey = spaceKey;
  pdt.remaining -= 1;
  logLine(`${player.name} killed a zombie at [${sx}, ${sy}] with Dynamite (${pdt.remaining} target(s) remaining).`, "kill");

  checkWin(player);
  if (state.gameOver) { state.pendingDynamiteTarget = null; render(); return; }

  const hasAdjacentZombie = [...state.zombies.keys()].some((zk) => {
    const [zx, zy] = zk.split(",").map(Number);
    return Math.abs(zx - player.x) <= 1 && Math.abs(zy - player.y) <= 1 && !(zx === player.x && zy === player.y);
  });

  if (pdt.remaining <= 0 || !hasAdjacentZombie) {
    state.pendingDynamiteTarget = null;
    logLine("Dynamite resolved.");
  }
  render();
}

function finishDynamite() {
  if (!state.pendingDynamiteTarget) return;
  state.pendingDynamiteTarget = null;
  logLine("Dynamite — done targeting.");
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
      if (!isSubtileZombieViable(tile, dlx, dly)) continue;
      const spaceKey = key(tx * TILE_DIM + dlx, ty * TILE_DIM + dly);
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
    toFill.forEach((spaceKey) => { state.zombies.set(spaceKey, { type: ZOMBIE_TYPE.REGULAR }); placed++; });
  } else {
    // "fill_all" — fill every empty legal space
    emptySpaces.forEach((spaceKey) => { state.zombies.set(spaceKey, { type: ZOMBIE_TYPE.REGULAR }); placed++; });
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
    if (player.inTheZone && player.hand.length > 3) {
      logLine(`${player.name} must discard down to 3 (In the Zone — select a card to discard).`);
      render();
      return;
    }
    logLine(`${player.name} skipped discard.`);
  }

  state.selectedHandIndex = null;

  if (player.inTheZone && player.hand.length > 3) {
    logLine(`${player.name} must discard down to 3 (In the Zone — ${player.hand.length - 3} more to discard).`);
    render();
    return;
  }

  state.step = STEP.END;
  render();
}
