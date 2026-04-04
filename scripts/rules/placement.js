function hasRoad(tile, dir) {
  return getConnectorDirs(tile.connectors).includes(dir);
}

// Returns 1 or 2: the floor a tile placed at (x, y) with the given connectors would occupy.
// A tile is floor 2 if it road-connects to:
//   - the Escalator via one of its floor2Connectors (rotated), or
//   - an existing floor-2 tile.
function getFloorForPlacement(x, y, connectors) {
  if (!state.floor2Tiles) return 1;
  for (const [dir, def] of Object.entries(DIRS)) {
    if (!connectors.includes(dir)) continue;
    const nk = key(x + def.x, y + def.y);
    const neighbor = state.board.get(nk);
    if (!neighbor || !getConnectorDirs(neighbor.connectors).includes(def.opposite)) continue;
    if (neighbor.name === "Escalator" && neighbor.floor2Connectors) {
      const rotatedFloor2 = neighbor.floor2Connectors.map(d => rotateDir(d, neighbor.placedRotation || 0));
      if (rotatedFloor2.includes(def.opposite)) return 2;
    } else if (state.floor2Tiles.has(nk)) {
      return 2;
    }
  }
  return 1;
}

// Returns true if the tile must be placed on floor 2.
// Only applies to the mall helipad (Mall Walkers collection active + Escalator on the board).
function mustBeFloor2(tile) {
  if (!tile.isWinTile || tile.type !== "helipad") return false;
  if (!state.deckFilters?.[COLLECTIONS.MALL_WALKERS]?.enabled) return false;
  let hasEscalator = false;
  state.board.forEach((t) => { if (t.name === "Escalator") hasEscalator = true; });
  return hasEscalator;
}

// "directors_cut" and "base" are the same zone: tiles drawn from the base map deck always
// receive tileDeck="base" while the Town Square start tile is stamped "directors_cut" in mixed play.
function normalizeZone(deck) {
  return deck === "directors_cut" ? "base" : (deck || "base");
}

// Returns true if the tile being placed (with tileDeck) may connect to neighborTile
// via the neighbor's connector in direction neighborConnDir.
// Zone rules: tiles must share the same placedDeck, except at a gateway connector.
// incomingDir: direction from the incoming tile toward the neighbor.
// incomingGatewayDirs: rotated gateway connector directions on the incoming tile (or null).
function isZoneCompatible(neighborTile, neighborConnDir, tileDeck, incomingDir, incomingGatewayDirs) {
  const neighborDeck = normalizeZone(neighborTile.placedDeck);
  const incomingDeck = normalizeZone(tileDeck);

  // Gateway checks must run BEFORE the same-zone short-circuit.
  // A gateway tile's zone-facing side (opposite of zoneGatewayConnector) must reject
  // same-deck tiles (e.g. base tiles connecting to Bridge's S side) while allowing
  // only the matching standalone collection through.
  const gwConn = neighborTile.zoneGatewayConnector;
  if (gwConn) {
    const actualGwDir  = rotateDir(gwConn, neighborTile.placedRotation || 0);
    const zoneFacingDir = rotateDir(DIRS[gwConn].opposite, neighborTile.placedRotation || 0);

    if (zoneFacingDir === neighborConnDir) {
      // Zone-facing side: only the standalone collection this gateway belongs to may connect.
      const neighborCols = Object.keys(resolveCollectionCounts(neighborTile));
      return neighborCols.includes(tileDeck);
    }

    // Map-facing gateway connector: allow cross-zone (base tiles connect here).
    if (actualGwDir === neighborConnDir) return true;
  }

  if (neighborDeck === incomingDeck) return true;

  // Cross-zone also allowed when the incoming tile's gateway faces this neighbor
  if (incomingGatewayDirs && incomingDir && incomingGatewayDirs.has(incomingDir)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Connector rules — per-connector or per-collection connection restrictions.
//
// rule values:
//   "any"  — connect to any collection (default)
//   "same" — only connect to tiles in the same collection
//   "<collectionKey>" — only connect to tiles in that specific collection
//
// Tile data fields:
//   connectorRules: { N: "any", S: "same", ... }  — per-connector, unrotated tile space
//   defaultConnectorRule: "same"                   — tile-level fallback
//
// COLLECTION_META may also define defaultConnectorRule to apply to all tiles in that collection.
// ---------------------------------------------------------------------------

// Default rule for all connectors unless overridden.
function getDefaultConnectorRule() {
  return "same";
}

// Returns the connector rule for a placed tile at the given (already-rotated) direction.
// Placed tiles store pre-rotated rules in placedConnectorRules (set in setup.js at placement time).
function getConnectorRule(tile, rotatedDir) {
  return tile.placedConnectorRules?.[rotatedDir] ?? getDefaultConnectorRule();
}

// Returns the primary normalized collection key for a tile.
function tilePrimaryCollection(tile) {
  return normalizeZone(Object.keys(resolveCollectionCounts(tile))[0]);
}

// Returns true if rule permits thisTile to connect to otherTile.
function connectorRuleAllows(rule, thisTile, otherTile) {
  if (!rule || rule === "any") return true;
  if (rule === "same") return tilePrimaryCollection(thisTile) === tilePrimaryCollection(otherTile);
  // specific collection key — the other tile must belong to it
  return tilePrimaryCollection(otherTile) === normalizeZone(rule);
}

function isValidPlacement(x, y, connectors, tileDeck, incomingGatewayDirs, lenientMismatch = false, requiresFloor2 = false, floor1OnlyDirs = null, incomingTile = null, incomingConnectorRules = null) {
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
    // Road-to-wall mismatch: never valid unless this is a win tile (helipad can abut any edge)
    if (!lenientMismatch && meHas !== themHas) return false;
    // Road-to-road: check zone, connector rules, and count
    if (meHas && themHas) {
      // Standalone restriction: Town Square only accepts its first road neighbor.
      // In base/mixed play the base collection is active and Town Square is the hub — no restriction.
      if (neighbor.isStartTile && neighbor.name === "Town Square") {
        const hasBaseCollection = !!(state.deckFilters?.[COLLECTIONS.DIRECTORS_CUT]?.enabled);
        if (!hasBaseCollection) {
          // Check if Town Square already has any road-connected neighbor
          const ntx = x + def.x;
          const nty = y + def.y;
          let alreadyConnected = false;
          for (const [nd, ndef] of Object.entries(DIRS)) {
            if (!hasRoad(neighbor, nd)) continue;
            const adj = state.board.get(key(ntx + ndef.x, nty + ndef.y));
            if (adj && hasRoad(adj, ndef.opposite)) { alreadyConnected = true; break; }
          }
          if (alreadyConnected) return false;
        }
      }
      if (floor1OnlyDirs && !floor1OnlyDirs.has(dir)) return false;
      if (tileDeck !== undefined && !isZoneCompatible(neighbor, def.opposite, tileDeck, dir, incomingGatewayDirs)) return false;
      // Connector rule check (bidirectional).
      // "any" on either side unlocks the connection — the gateway's open invitation overrides
      // the neighbor's same-collection restriction. Only enforce rules when neither side is "any".
      if (incomingTile) {
        const incomingRule = incomingConnectorRules?.[dir] ?? getDefaultConnectorRule();
        const neighborRule = getConnectorRule(neighbor, def.opposite);
        if (incomingRule !== "any" && neighborRule !== "any") {
          if (!connectorRuleAllows(incomingRule, incomingTile, neighbor)) return false;
          if (!connectorRuleAllows(neighborRule, neighbor, incomingTile)) return false;
        }
      }
      roadMatches += 1;
    }
    // Wall-to-wall: allowed as long as a road match exists somewhere
  }

  if (touching === 0 || roadMatches === 0) return false;

  // Floor isolation: floor-1 and floor-2 tiles may not road-connect except through the Escalator.
  // The mall helipad (win tile) must be placed on floor 2 when the Escalator is on the board.
  if (requiresFloor2 || (state.floor2Tiles && state.floor2Tiles.size > 0)) {
    const incomingFloor = getFloorForPlacement(x, y, connectors);
    if (requiresFloor2 && incomingFloor !== 2) return false;
    for (const [dir, def] of Object.entries(DIRS)) {
      if (!connectors.includes(dir)) continue;
      const nk = key(x + def.x, y + def.y);
      const neighbor = state.board.get(nk);
      if (!neighbor || !hasRoad(neighbor, def.opposite)) continue;
      if (neighbor.name === "Escalator") continue; // escalator bridges both floors
      const neighborFloor = state.floor2Tiles.has(nk) ? 2 : 1;
      if (incomingFloor !== neighborFloor) return false;
    }
  }

  return true;
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

  const lenient = !!tile.isWinTile;
  const requiresFloor2 = mustBeFloor2(tile);
  const options = [];
  frontier.forEach((k) => {
    const { x, y } = parseKey(k);
    for (let r = 0; r < 4; r += 1) {
      const connectors = getRotatedConnectors(tile.connectors, r);
      const gwDirs = tile.zoneGatewayConnector
        ? new Set([rotateDir(tile.zoneGatewayConnector, r)])
        : null;
      const floor1Dirs = tile.floor1Connectors
        ? new Set(tile.floor1Connectors.map(d => rotateDir(d, r)))
        : null;
      // Extract and rotate per-connector rules from connectors property (object format only).
      const rotatedRules = getRotatedConnectorRules(tile.connectors, r);
      if (isValidPlacement(x, y, connectors, tileDeck, gwDirs, lenient, requiresFloor2, floor1Dirs, tile, rotatedRules)) {
        options.push({ x, y, connectors, rotation: r });
      }
    }
  });

  return options;
}
