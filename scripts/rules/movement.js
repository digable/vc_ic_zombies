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
  if (!canExitSubTile(fromTile, fromLocalX, fromLocalY, moveDir)) {
    return false;
  }

  if (fromTileX === toTileX && fromTileY === toTileY) {
    if (!canEnterSubTile(toTile, toLocalX, toLocalY, enterFrom)) {
      return false;
    }
    return true;
  }

  const canCrossTileEdge = (exitDir, expected) => {
    if (
      fromLocalX !== expected.fromX ||
      fromLocalY !== expected.fromY ||
      toLocalX !== expected.toX ||
      toLocalY !== expected.toY
    ) {
      return false;
    }

    const enterDir = DIRS[exitDir].opposite;
    if (!hasRoad(fromTile, exitDir) || !hasRoad(toTile, enterDir)) {
      return false;
    }

    if (!canExitSubTile(fromTile, fromLocalX, fromLocalY, exitDir)) {
      return false;
    }

    return canEnterSubTile(toTile, toLocalX, toLocalY, enterDir);
  };

  if (toTileX === fromTileX + 1 && toTileY === fromTileY) {
    return canCrossTileEdge("E", { fromX: 2, fromY: 1, toX: 0, toY: 1 });
  }

  if (toTileX === fromTileX - 1 && toTileY === fromTileY) {
    return canCrossTileEdge("W", { fromX: 0, fromY: 1, toX: 2, toY: 1 });
  }

  if (toTileY === fromTileY + 1 && toTileX === fromTileX) {
    return canCrossTileEdge("S", { fromX: 1, fromY: 2, toX: 1, toY: 0 });
  }

  if (toTileY === fromTileY - 1 && toTileX === fromTileX) {
    return canCrossTileEdge("N", { fromX: 1, fromY: 0, toX: 1, toY: 2 });
  }

  // Breakthrough: permanent cross-tile path created by the card
  if (state.breakthroughConnections?.has(`${key(fromX, fromY)}\u2192${moveDir}`)) {
    return isLocalWalkable(fromTile, fromLocalX, fromLocalY) &&
           isLocalWalkable(toTile, toLocalX, toLocalY);
  }

  return false;
}

function canMove(player, dir) {
  const d = DIRS[dir];
  return canStep(player.x, player.y, player.x + d.x, player.y + d.y);
}
