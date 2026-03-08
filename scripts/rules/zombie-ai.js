function nearestPlayerDistance(x, y) {
  let best = Infinity;
  state.players.forEach((p) => {
    const dist = Math.abs(p.x - x) + Math.abs(p.y - y);
    if (dist < best) {
      best = dist;
    }
  });
  return best;
}

function isBuildingTile(tile) {
  return tile?.type === "named";
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

function chooseDeterministicOption(options, labelBuilder) {
  if (options.length <= 1) {
    return options[0] || null;
  }

  // Prompt dialogs are not always available; resolve ties deterministically.
  const normalized = [...options];
  normalized.sort((a, b) => {
    const aKey = labelBuilder(a);
    const bKey = labelBuilder(b);
    return aKey.localeCompare(bKey);
  });
  return normalized[0];
}

function moveZombieOneStep(zKey, options = {}) {
  const { resolveTiesDeterministically = false, targetPlayerId = null } = options;
  const { x, y } = parseKey(zKey);
  const explicitTarget =
    targetPlayerId !== null && targetPlayerId !== undefined
      ? state.players.find((p) => p.id === targetPlayerId) || null
      : null;

  const targetCandidates = explicitTarget ? [explicitTarget] : closestPlayersTo(x, y);
  const target = resolveTiesDeterministically
    ? chooseDeterministicOption(
      targetCandidates,
      (p) => `${p.name} at (${p.x}, ${p.y})`
    )
    : targetCandidates[0];
  if (!target) {
    return zKey;
  }

  const moveOptions = [];
  const fromTile = getTileAtSpace(x, y);
  const fromBuilding = isBuildingTile(fromTile);

  Object.values(DIRS).forEach((d) => {
    const nx = x + d.x;
    const ny = y + d.y;
    const toKey = key(nx, ny);
    if (!canStep(x, y, nx, ny)) {
      return;
    }
    if (state.zombies.has(toKey)) {
      return;
    }

    const toTile = getTileAtSpace(nx, ny);
    const toBuilding = isBuildingTile(toTile);
    if (!fromBuilding && toBuilding) {
      return;
    }

    const distToTarget = Math.abs(target.x - nx) + Math.abs(target.y - ny);
    moveOptions.push({ x: nx, y: ny, dist: distToTarget, toKey });
  });

  if (moveOptions.length === 0) {
    return zKey;
  }

  moveOptions.sort((a, b) => a.dist - b.dist);
  const bestDist = moveOptions[0].dist;
  const best = moveOptions.filter((o) => o.dist === bestDist);

  const chosen = resolveTiesDeterministically
    ? chooseDeterministicOption(
      best,
      (o) => `to (${o.x}, ${o.y})`
    )
    : best[0];

  return chosen?.toKey || zKey;
}
