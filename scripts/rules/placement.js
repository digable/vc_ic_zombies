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
