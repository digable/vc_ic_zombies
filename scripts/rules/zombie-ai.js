// Zombie AI — target selection and one-step movement.
// These are pure helpers with no side effects; callers mutate state.zombies.
// Entry point for the movement phase is moveZombieOneStep(zKey, options).

function nearestEntityDistance(x, y, positions) {
  let best = Infinity;
  positions.forEach((p) => {
    const dist = Math.abs(p.x - x) + Math.abs(p.y - y);
    if (dist < best) best = dist;
  });
  return best;
}

function nearestPlayerDistance(x, y) {
  return nearestEntityDistance(x, y, state.players);
}

function closestPlayersTo(x, y) {
  const chosen = [];
  let best = Infinity;
  state.players.forEach((p) => {
    const dist = Math.abs(p.x - x) + Math.abs(p.y - y);
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
function moveZombieOneStep(zKey, options = {}) {
  const { targetPlayerId = null, resolveTiesDeterministically = false } = options;
  const { x, y } = parseKey(zKey);

  let target;
  if (targetPlayerId !== null) {
    target = state.players.find((p) => p.id === targetPlayerId) ?? closestPlayersTo(x, y)[0];
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
    moveOptions.push({ toKey, dist: Math.abs(target.x - nx) + Math.abs(target.y - ny) });
  });

  if (moveOptions.length === 0) return zKey;

  moveOptions.sort((a, b) => a.dist - b.dist);
  const best = moveOptions.filter((o) => o.dist === moveOptions[0].dist);
  return resolveTiesDeterministically
    ? best[0].toKey
    : best[Math.floor(Math.random() * best.length)].toKey;
}
