function isZ4Active() {
  return !!(state.deckFilters && state.deckFilters[COLLECTIONS.THE_END] && state.deckFilters[COLLECTIONS.THE_END].enabled);
}

// --- Cabin Spell (Z4 / The End standalone win) ----------------------------

function canAttemptSpell(player) {
  if (player.spellAttemptedThisTurn) return false;

  const tile = getTileAtSpace(player.x, player.y);
  if (!tile || tile.name !== "Cabin") return false;

  const tx = spaceToTileCoord(player.x);
  const ty = spaceToTileCoord(player.y);
  const lx = getLocalCoord(player.x, tx);
  const ly = getLocalCoord(player.y, ty);
  const subTile = tile.subTiles && tile.subTiles[key(lx, ly)];
  if (!subTile || subTile.type !== "building") return false;

  // All dogs must be cleared from every building subtile on the Cabin tile
  for (let ly2 = 0; ly2 < TILE_DIM; ly2++) {
    for (let lx2 = 0; lx2 < TILE_DIM; lx2++) {
      const st = tile.subTiles && tile.subTiles[key(lx2, ly2)];
      if (!st || st.type !== "building") continue;
      const zombie = state.zombies.get(key(tx * TILE_DIM + lx2, ty * TILE_DIM + ly2));
      if (zombie && zombie.type === ZOMBIE_TYPE.DOG) return false;
    }
  }

  return true;
}

function attemptSpell() {
  const player = currentPlayer();
  if (!canAttemptSpell(player)) return;

  player.spellAttemptedThisTurn = true;

  const pageCount = player.botdPages.length;
  const target = Math.max(1, SPELL_BASE_TARGET - pageCount);
  const roll = rollD6();

  logLine(`${player.name} attempts the Cabin Spell — needs ${target}+ (${pageCount} BotD page${pageCount !== 1 ? "s" : ""}) — rolled ${roll}.`);

  if (roll >= target) {
    state.winInfo = { playerName: player.name, kills: player.kills, knockouts: player.knockouts || 0, winType: "spell" };
    state.gameOver = true;
    logLine(`${player.name} successfully performs the Cabin Spell and wins!`);
  } else {
    logLine(`${player.name}'s spell fails this turn (rolled ${roll}, needed ${target}+).`);
  }

  syncToCloud();
  render();
}

// --- Passive win checks (called after movement / combat / events) ----------

function checkWin(player) {
  const tile = getTileAtSpace(player.x, player.y);

  // Z7 solo win: exit through the Ticket Booth's south subtile while holding a Clown Car
  if (isZ7Active() && player.hasClownCar && player.hasExitedFunhouse) {
    if (tile && tile.name === "Ticket Booth") {
      const tx = spaceToTileCoord(player.x);
      const ty = spaceToTileCoord(player.y);
      const lx = getLocalCoord(player.x, tx);
      const ly = getLocalCoord(player.y, ty);
      if (lx === 1 && ly === 2) {
        state.winInfo = { playerName: player.name, kills: player.kills, knockouts: player.knockouts || 0, winType: "clown_escape" };
        state.gameOver = true;
        logLine(`${player.name} escapes through the Ticket Booth with a Clown Car — winner!`);
        return true;
      }
    }
  }

  if (tile && tile.isWinTile) {
    const tx = spaceToTileCoord(player.x);
    const ty = spaceToTileCoord(player.y);
    const lx = getLocalCoord(player.x, tx);
    const ly = getLocalCoord(player.y, ty);
    if (lx === 1 && ly === 1) {
      state.winInfo = { playerName: player.name, kills: player.kills, knockouts: player.knockouts || 0, winType: "helipad" };
      state.gameOver = true;
      logLine(`${player.name} reached the center of the Helipad and wins!`);
      return true;
    }
  }

  if (player.kills >= WIN_KILLS) {
    state.winInfo = { playerName: player.name, kills: player.kills, knockouts: player.knockouts || 0, winType: "kills" };
    state.gameOver = true;
    logLine(`${player.name} reached ${WIN_KILLS} kills and wins.`);
    return true;
  }

  return false;
}
