function hasRoad(tile, dir) {
  return tile.connectors.includes(dir);
}

// Returns true if the tile being placed (with tileDeck) may connect to neighborTile
// via the neighbor's connector in direction neighborConnDir.
// Zone rules: tiles must share the same placedDeck, except at a gateway connector.
// incomingDir: direction from the incoming tile toward the neighbor.
// incomingGatewayDirs: rotated gateway connector directions on the incoming tile (or null).
function isZoneCompatible(neighborTile, neighborConnDir, tileDeck, incomingDir, incomingGatewayDirs) {
  // The start tile (Town Square) always acts as "base" zone regardless of its placedDeck stamp.
  const neighborDeck = (neighborTile.isStartTile ? null : neighborTile.placedDeck) || "base";
  if (neighborDeck === tileDeck) return true;

  // Cross-zone allowed at the neighbor's gateway connector
  const gwConn = neighborTile.zoneGatewayConnector;
  if (gwConn) {
    const actualGwDir = rotateDir(gwConn, neighborTile.placedRotation || 0);
    if (actualGwDir === neighborConnDir) return true;
  }

  // Cross-zone also allowed when the incoming tile's gateway faces this neighbor
  if (incomingGatewayDirs && incomingDir && incomingGatewayDirs.has(incomingDir)) return true;

  return false;
}

function isValidPlacement(x, y, connectors, tileDeck, incomingGatewayDirs) {
  const here = key(x, y);
  if (state.board.has(here)) return false;

  let touching = 0;
  let roadMatches = 0;
  for (const [dir, def] of Object.entries(DIRS)) {
    const neighbor = state.board.get(key(x + def.x, y + def.y));
    if (!neighbor) continue;
    touching += 1;
    const meHas = connectors.includes(dir);
    const themHas = hasRoad(neighbor, def.opposite);
    // Road-to-wall mismatch is never valid
    if (meHas !== themHas) return false;
    // Road-to-road: check zone and count
    if (meHas && themHas) {
      if (tileDeck !== undefined && !isZoneCompatible(neighbor, def.opposite, tileDeck, dir, incomingGatewayDirs)) return false;
      roadMatches += 1;
    }
    // Wall-to-wall: allowed as long as a road match exists somewhere
  }

  // Must touch at least one tile and have at least one road-to-road connection
  return touching > 0 && roadMatches > 0;
}

function getPlacementOptions(tile, tileDeck = "base") {
  const frontier = new Set();
  state.board.forEach((_, k) => {
    const { x, y } = parseKey(k);
    Object.values(DIRS).forEach((d) => {
      const candidate = key(x + d.x, y + d.y);
      if (!state.board.has(candidate)) frontier.add(candidate);
    });
  });

  const options = [];
  frontier.forEach((k) => {
    const { x, y } = parseKey(k);
    for (let r = 0; r < 4; r += 1) {
      const connectors = getRotatedConnectors(tile.connectors, r);
      const gwDirs = tile.zoneGatewayConnector
        ? new Set([rotateDir(tile.zoneGatewayConnector, r)])
        : null;
      if (isValidPlacement(x, y, connectors, tileDeck, gwDirs)) {
        options.push({ x, y, connectors, rotation: r });
      }
    }
  });

  return options;
}
