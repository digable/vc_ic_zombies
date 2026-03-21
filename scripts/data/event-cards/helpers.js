// Returns true if any building on the board satisfies conditionFn(zombieCount, emptyCount).
// Used by building-targeting cards to check playability before entering pendingBuildingSelect.
function anyBuildingMatches(conditionFn) {
  for (const [tKey, tile] of state.board) {
    const { x: tx, y: ty } = parseKey(tKey);
    let zombies = 0, empty = 0;
    for (let dlx = 0; dlx < 3; dlx++) {
      for (let dly = 0; dly < 3; dly++) {
        if (getSubTileType(tile, dlx, dly) !== "building") continue;
        if (!isLocalWalkable(tile, dlx, dly)) continue;
        state.zombies.has(key(tx * 3 + dlx, ty * 3 + dly)) ? zombies++ : empty++;
      }
    }
    if (conditionFn(zombies, empty)) return true;
  }
  return false;
}

function buildEventDeckHelpers() {
  const getNextOpponent = (player) => {
    if (state.players.length < 2) return null;
    const i = state.players.indexOf(player);
    if (i < 0) return null;
    return state.players[(i + 1) % state.players.length];
  };

  const nearestZombieDistance = (x, y) =>
    nearestEntityDistance(x, y, [...state.zombies].map(parseKey));

  const moveAwayFromNearestZombie = (target) => {
    if (state.zombies.size === 0) {
      return false;
    }

    let bestDir = null;
    let bestDist = nearestZombieDistance(target.x, target.y);
    ["N", "E", "S", "W"].forEach((dir) => {
      if (!canMove(target, dir)) return;
      const d = DIRS[dir];
      const nx = target.x + d.x;
      const ny = target.y + d.y;
      const dist = nearestZombieDistance(nx, ny);
      if (dist > bestDist) {
        bestDist = dist;
        bestDir = dir;
      }
    });

    if (!bestDir) {
      return false;
    }

    const delta = DIRS[bestDir];
    target.x += delta.x;
    target.y += delta.y;
    return true;
  };

  const removeZombiesOnTile = (tileX, tileY, player) => {
    let removed = 0;
    state.zombies.forEach((zKey) => {
      const { x: zx, y: zy } = parseKey(zKey);
      if (spaceToTileCoord(zx) === tileX && spaceToTileCoord(zy) === tileY) {
        state.zombies.delete(zKey);
        removed += 1;
      }
    });
    if (removed > 0) {
      player.kills += removed;
    }
    return removed;
  };

  const spawnZombieAtOrNear = (x, y) => {
    const spots = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ];
    const valid = [];

    for (let i = 0; i < spots.length; i += 1) {
      const sx = spots[i][0];
      const sy = spots[i][1];
      const tile = getTileAtSpace(sx, sy);
      if (!tile) continue;
      const tileX = spaceToTileCoord(sx);
      const tileY = spaceToTileCoord(sy);
      const localX = getLocalCoord(sx, tileX);
      const localY = getLocalCoord(sy, tileY);
      if (!isLocalWalkable(tile, localX, localY)) continue;
      const sKey = key(sx, sy);
      if (state.zombies.has(sKey)) continue;
      valid.push({ sx, sy, sKey });
    }

    if (valid.length === 0) {
      return null;
    }

    valid.sort((a, b) => {
      if (a.sy !== b.sy) {
        return a.sy - b.sy;
      }
      return a.sx - b.sx;
    });
    const chosen = valid[0];

    state.zombies.add(chosen.sKey);
    return chosen.sKey;
  };

  const moveToParkingLot = (player) => {
    let chosen = null;
    state.board.forEach((tile, posKey) => {
      if (chosen || tile.name !== "Parking Lot") return;
      const { x: tx, y: ty } = parseKey(posKey);
      chosen = { x: tx * 3 + 1, y: ty * 3 + 1 };
    });

    if (!chosen) {
      return false;
    }

    player.x = chosen.x;
    player.y = chosen.y;
    return true;
  };

  const moveOneZombieTowardPlayer = (zKey, options = {}) => {
    const { targetPlayerId = null } = options;
    const next = moveZombieOneStep(zKey, { targetPlayerId, resolveTiesDeterministically: true });
    if (next !== zKey) {
      state.zombies.delete(zKey);
      state.zombies.add(next);
    }
    return next;
  };

  return {
    getNextOpponent,
    moveAwayFromNearestZombie,
    removeZombiesOnTile,
    spawnZombieAtOrNear,
    moveToParkingLot,
    moveOneZombieTowardPlayer
  };
}
