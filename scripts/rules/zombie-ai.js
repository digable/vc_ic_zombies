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

function moveZombieOneStep(zKey) {
  const { x, y } = parseKey(zKey);

  const target = closestPlayersTo(x, y)[0];
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
  return best[Math.floor(Math.random() * best.length)].toKey;
}
