function rotateConnectors(connectors, times) {
  const order = ["N", "E", "S", "W"];
  return connectors.map((dir) => {
    const i = order.indexOf(dir);
    return order[(i + times) % 4];
  });
}

function hasRoad(tile, dir) {
  return tile.connectors.includes(dir);
}

function isValidPlacement(x, y, connectors) {
  const here = key(x, y);
  if (state.board.has(here)) {
    return false;
  }

  let touching = 0;
  for (const [dir, def] of Object.entries(DIRS)) {
    const neighbor = state.board.get(key(x + def.x, y + def.y));
    if (!neighbor) {
      continue;
    }
    touching += 1;
    const meHas = connectors.includes(dir);
    const themHas = hasRoad(neighbor, def.opposite);
    if (meHas !== themHas) {
      return false;
    }
  }

  return touching > 0;
}

function getPlacementOptions(tile) {
  const frontier = new Set();
  state.board.forEach((_, k) => {
    const { x, y } = parseKey(k);
    Object.values(DIRS).forEach((d) => {
      const candidate = key(x + d.x, y + d.y);
      if (!state.board.has(candidate)) {
        frontier.add(candidate);
      }
    });
  });

  const options = [];
  frontier.forEach((k) => {
    const { x, y } = parseKey(k);
    for (let r = 0; r < 4; r += 1) {
      const connectors = rotateConnectors(tile.connectors, r);
      if (isValidPlacement(x, y, connectors)) {
        options.push({ x, y, connectors, rotation: r });
      }
    }
  });

  return options;
}

function currentPlayer() {
  return state.players[state.currentPlayerIndex];
}

function isCombatRequiredForCurrentPlayer() {
  const player = currentPlayer();
  return state.zombies.has(key(player.x, player.y));
}

function autoSkipCombatIfClear() {
  if (state.step !== STEP.COMBAT || state.gameOver) {
    return;
  }
  if (isCombatRequiredForCurrentPlayer()) {
    return;
  }

  logLine(`${currentPlayer().name} has no zombie in current space. Combat step skipped.`);
  state.step = STEP.DRAW_EVENTS;
}

function autoSkipZombieMoveIfClear() {
  if (state.step !== STEP.MOVE_ZOMBIES || state.gameOver) {
    return;
  }
  if (state.zombies.size > 0) {
    return;
  }

  logLine(`${currentPlayer().name} has no zombies to move. Zombie movement skipped.`);
  state.currentZombieRoll = null;
  state.step = STEP.DISCARD;
}

function canStep(fromX, fromY, toX, toY) {
  if (Math.abs(fromX - toX) + Math.abs(fromY - toY) !== 1) {
    return false;
  }

  const fromTileX = spaceToTileCoord(fromX);
  const fromTileY = spaceToTileCoord(fromY);
  const toTileX = spaceToTileCoord(toX);
  const toTileY = spaceToTileCoord(toY);

  const fromTile = state.board.get(key(fromTileX, fromTileY));
  const toTile = state.board.get(key(toTileX, toTileY));
  if (!fromTile || !toTile) {
    return false;
  }

  const fromLocalX = getLocalCoord(fromX, fromTileX);
  const fromLocalY = getLocalCoord(fromY, fromTileY);
  const toLocalX = getLocalCoord(toX, toTileX);
  const toLocalY = getLocalCoord(toY, toTileY);

  const dx = toX - fromX;
  const dy = toY - fromY;
  let moveDir = "N";
  if (dx === 1) {
    moveDir = "E";
  } else if (dx === -1) {
    moveDir = "W";
  } else if (dy === 1) {
    moveDir = "S";
  }
  const enterFrom = DIRS[moveDir].opposite;

  if (!isLocalWalkable(fromTile, fromLocalX, fromLocalY)) {
    return false;
  }
  if (!canEnterSubTile(toTile, toLocalX, toLocalY, enterFrom)) {
    return false;
  }

  if (fromTileX === toTileX && fromTileY === toTileY) {
    return true;
  }

  if (toTileX === fromTileX + 1 && toTileY === fromTileY) {
    return (
      fromLocalX === 2 &&
      fromLocalY === 1 &&
      toLocalX === 0 &&
      toLocalY === 1 &&
      hasRoad(fromTile, "E") &&
      hasRoad(toTile, "W")
    );
  }

  if (toTileX === fromTileX - 1 && toTileY === fromTileY) {
    return (
      fromLocalX === 0 &&
      fromLocalY === 1 &&
      toLocalX === 2 &&
      toLocalY === 1 &&
      hasRoad(fromTile, "W") &&
      hasRoad(toTile, "E")
    );
  }

  if (toTileY === fromTileY + 1 && toTileX === fromTileX) {
    return (
      fromLocalY === 2 &&
      fromLocalX === 1 &&
      toLocalY === 0 &&
      toLocalX === 1 &&
      hasRoad(fromTile, "S") &&
      hasRoad(toTile, "N")
    );
  }

  if (toTileY === fromTileY - 1 && toTileX === fromTileX) {
    return (
      fromLocalY === 0 &&
      fromLocalX === 1 &&
      toLocalY === 2 &&
      toLocalX === 1 &&
      hasRoad(fromTile, "N") &&
      hasRoad(toTile, "S")
    );
  }

  return false;
}

function canMove(player, dir) {
  const d = DIRS[dir];
  return canStep(player.x, player.y, player.x + d.x, player.y + d.y);
}

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

function closestPlayerTo(x, y) {
  let chosen = null;
  let best = Infinity;
  state.players.forEach((p) => {
    const dist = Math.abs(p.x - x) + Math.abs(p.y - y);
    if (dist < best) {
      best = dist;
      chosen = p;
    }
  });
  return chosen;
}

function moveZombieOneStep(zKey) {
  const { x, y } = parseKey(zKey);
  const target = closestPlayerTo(x, y);
  if (!target) {
    return zKey;
  }

  const options = [];

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

    const distToTarget = Math.abs(target.x - nx) + Math.abs(target.y - ny);
    options.push({ x: nx, y: ny, dist: distToTarget, toKey });
  });

  if (options.length === 0) {
    return zKey;
  }

  options.sort((a, b) => a.dist - b.dist);
  const bestDist = options[0].dist;
  const best = options.filter((o) => o.dist === bestDist);
  return best[Math.floor(Math.random() * best.length)].toKey;
}

function boardBounds() {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  state.board.forEach((_, k) => {
    const { x, y } = parseKey(k);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });

  if (minX === Infinity) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  return {
    minX: minX - 1,
    maxX: maxX + 1,
    minY: minY - 1,
    maxY: maxY + 1
  };
}
