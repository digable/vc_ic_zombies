// Zombie AI — target selection and one-step movement.
// These are pure helpers with no side effects; callers mutate state.zombies.
// Entry point for the movement phase is moveZombieOneStep(zKey, options).

function nearestEntityDistance(x, y, positions) {
  let best = Infinity;
  positions.forEach((p) => {
    const dist = manhattanDist(p.x, p.y, x, y);
    if (dist < best) best = dist;
  });
  return best;
}

function nearestPlayerDistance(x, y) {
  return nearestEntityDistance(x, y, state.players);
}

function closestPlayersTo(x, y, pool = null) {
  const chosen = [];
  let best = Infinity;
  (pool ?? state.players).forEach((p) => {
    const dist = manhattanDist(p.x, p.y, x, y);
    if (dist < best) {
      best = dist;
      chosen.length = 0;
      chosen.push(p);
    } else if (dist === best) {
      chosen.push(p);
    }
  });
  return chosen;
}

// options.targetPlayerId — move toward a specific player instead of the nearest one
// options.resolveTiesDeterministically — pick the first tied option instead of a random one
// options.isDog — apply Dog Repellent logic (cannot move closer to players with dogRepellentTurns > 0)
function moveZombieOneStep(zKey, options = {}) {
  const { targetPlayerId = null, resolveTiesDeterministically = false, isDog = false } = options;
  const { x, y } = parseKey(zKey);

  // Players protected by Dog Repellent — dogs may not move closer to them
  const repellentIds = isDog
    ? new Set(state.players.filter((p) => (p.dogRepellentTurns ?? 0) > 0).map((p) => p.id))
    : new Set();

  let target;
  if (targetPlayerId !== null) {
    target = getPlayerById(targetPlayerId) ?? closestPlayersTo(x, y)[0];
  } else if (isDog && repellentIds.size > 0) {
    const nonRepellent = state.players.filter((p) => !repellentIds.has(p.id));
    if (nonRepellent.length === 0) return zKey; // all players repellent — dog stays put
    target = closestPlayersTo(x, y, nonRepellent)[0];
  } else {
    target = closestPlayersTo(x, y)[0];
  }
  if (!target) return zKey;

  const moveOptions = [];
  Object.values(DIRS).forEach((d) => {
    const nx = x + d.x;
    const ny = y + d.y;
    const toKey = key(nx, ny);
    if (!canStep(x, y, nx, ny)) return;
    if (state.zombies.has(toKey)) return;
    if (state.noZombieTiles && state.noZombieTiles.has(key(spaceToTileCoord(nx), spaceToTileCoord(ny)))) return;
    // Dog Repellent: cannot move to a space closer to any protected player
    if (isDog && repellentIds.size > 0) {
      for (const pid of repellentIds) {
        const rp = getPlayerById(pid);
        if (!rp) continue;
        if (manhattanDist(rp.x, rp.y, nx, ny) < manhattanDist(rp.x, rp.y, x, y)) return;
      }
    }
    moveOptions.push({ toKey, dist: manhattanDist(target.x, target.y, nx, ny) });
  });

  if (moveOptions.length === 0) return zKey;

  moveOptions.sort((a, b) => a.dist - b.dist);
  const best = moveOptions.filter((o) => o.dist === moveOptions[0].dist);
  return resolveTiesDeterministically
    ? best[0].toKey
    : best[Math.floor(Math.random() * best.length)].toKey;
}
