function hasRoad(tile, dir) {
  if (!getConnectorDirs(tile.connectors).includes(dir)) return false;
  const rule = tile.placedConnectorRules?.[dir];
  if (rule === CONNECTOR_RULE.DISABLE_ON_SOLO && isDisabledBySolo(tile.collection)) return false;
  return true;
}

// Returns true when no collection other than the tile's own is currently enabled.
// Used by DISABLE_ON_SOLO to suppress gateway connectors in pure-solo play.
function isDisabledBySolo(tileCollection) {
  if (!state.deckFilters) return false;
  const tileColKeys = new Set(Object.keys(resolveCollectionCounts({ collection: tileCollection })));
  return !Object.entries(state.deckFilters).some(([c, r]) => r.enabled && !tileColKeys.has(c));
}

// Returns the already-rotated gateway connector direction for a placed tile.
// Checks placedConnectorRules first (fastest path), falls back to definition + rotation.
function getPlacedGatewayDir(tile) {
  if (tile.placedConnectorRules) {
    const entry = Object.entries(tile.placedConnectorRules).find(([, r]) => r === CONNECTOR_RULE.DISABLE_ON_SOLO);
    if (entry) return entry[0];
  }
  const unrotated = getGatewayConnectorDir(tile);
  return unrotated ? rotateDir(unrotated, tile.placedRotation || 0) : null;
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
    if (neighbor.name === TILE_NAME.ESCALATOR && neighbor.floor2Connectors) {
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
  if (!tile.isWinTile || tile.type !== TILE_TYPE.HELIPAD) return false;
  if (!state.deckFilters?.[COLLECTIONS.MALL_WALKERS]?.enabled) return false;
  let hasEscalator = false;
  state.board.forEach((t) => { if (t.name === TILE_NAME.ESCALATOR) hasEscalator = true; });
  return hasEscalator;
}

// "directors_cut" and TILE_DECK.BASE are the same zone: tiles drawn from the base map deck always
// receive tileDeck=TILE_DECK.BASE while the Town Square start tile is stamped "directors_cut" in mixed play.
function normalizeZone(deck) {
  return deck === "directors_cut" ? TILE_DECK.BASE : (deck || TILE_DECK.BASE);
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
  // A gateway tile's zone-facing side (opposite of its DISABLE_ON_SOLO connector) must reject
  // same-deck tiles (e.g. base tiles connecting to Bridge's S side) while allowing
  // only the matching standalone collection through.
  const actualGwDir = getPlacedGatewayDir(neighborTile);
  if (actualGwDir) {
    const zoneFacingDir = DIRS[actualGwDir].opposite;

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
// rule values (CONNECTOR_RULE.*):
//   "any"             — connect to any collection
//   "same"            — only connect to tiles in the same collection (default)
//   "any_first"       — reserved; not yet assigned to any tile
//   "disable_on_solo" — gateway connector: ANY in mixed play, disabled in solo play of own collection
//   "only"            — only connect to the tile named in connectorOnlyTarget for this direction
//   "named_type"      — only connect to tiles with type === TILE_TYPE.NAMED (currently unused)
//   "designated"      — only connect where the neighbor's connector is CONNECTOR_RULE.ONLY targeting
//                       this tile's name; checked directly in isValidPlacement (not connectorRuleAllows)
//                       because it requires inspecting the neighbor's rule, not just the neighbor tile
//   "<collectionKey>" — only connect to tiles in that specific collection
//
// Tile data fields:
//   connectors:           { N: CONNECTOR_RULE.SAME, S: CONNECTOR_RULE.DISABLE_ON_SOLO }  (object format)
//   connectorOnlyTarget:  { S: TILE_NAME.HELIPAD_DESIGNATED }  — required when a connector uses CONNECTOR_RULE.ONLY
// ---------------------------------------------------------------------------

// Default rule for all connectors unless overridden.
function getDefaultConnectorRule() {
  return CONNECTOR_RULE.SAME;
}

// Returns true if this connector rule is "open" — invites any tile regardless of the other side's rule.
// Open connectors short-circuit the bidirectional rule check entirely.
function isOpenConnectorRule(rule) {
  return rule === CONNECTOR_RULE.ANY || rule === CONNECTOR_RULE.DISABLE_ON_SOLO;
}

// Returns the connector rule for a placed tile at the given (already-rotated) direction.
// Placed tiles store pre-rotated rules in placedConnectorRules (set in setup.js at placement time).
function getConnectorRule(tile, rotatedDir) {
  return tile.placedConnectorRules?.[rotatedDir] ?? getDefaultConnectorRule();
}

// Returns the primary normalized collection key for a tile.
// Prefers placedDeck (the deck the tile was drawn from) over the first collection key,
// so shared road tiles (e.g. Straight in both Z1 and Z2) resolve to their actual zone.
function tilePrimaryCollection(tile) {
  if (tile.placedDeck) return normalizeZone(tile.placedDeck);
  return normalizeZone(Object.keys(resolveCollectionCounts(tile))[0]);
}

// Returns true if rule permits thisTile to connect to otherTile.
// onlyTarget: the tile name required when rule is CONNECTOR_RULE.ONLY.
function connectorRuleAllows(rule, thisTile, otherTile, onlyTarget) {
  if (!rule || rule === CONNECTOR_RULE.ANY || rule === CONNECTOR_RULE.DISABLE_ON_SOLO) return true;
  if (rule === CONNECTOR_RULE.SAME) return tilePrimaryCollection(thisTile) === tilePrimaryCollection(otherTile);
  if (rule === CONNECTOR_RULE.ONLY) return onlyTarget ? otherTile.name === onlyTarget : false;
  if (rule === CONNECTOR_RULE.NAMED_TYPE) return otherTile.type === TILE_TYPE.NAMED;
  // specific collection key — the other tile must belong to it
  return tilePrimaryCollection(otherTile) === normalizeZone(rule);
}

function isValidPlacement(x, y, connectors, tileDeck, incomingGatewayDirs, lenientMismatch = false, requiresFloor2 = false, floor1OnlyDirs = null, incomingTile = null, incomingConnectorRules = null, incomingOnlyTarget = null) {
  const here = key(x, y);
  if (state.board.has(here)) return false;

  let touching = 0;
  let roadMatches = 0;
  for (const [dir, def] of Object.entries(DIRS)) {
    const neighbor = state.board.get(key(x + def.x, y + def.y));
    if (!neighbor) continue;
    touching += 1;
    const incomingRule = incomingConnectorRules?.[dir] ?? getDefaultConnectorRule();
    const isDisabledGateway = incomingRule === CONNECTOR_RULE.DISABLE_ON_SOLO && incomingTile && isDisabledBySolo(incomingTile.collection);
    const meHas = connectors.includes(dir) && !isDisabledGateway;
    const themHas = hasRoad(neighbor, def.opposite);
    // Road-to-wall mismatch: never valid unless this is a win tile (helipad can abut any edge)
    if (!lenientMismatch && meHas !== themHas) return false;
    // Road-to-road: check zone, connector rules, and count
    if (meHas && themHas) {
      if (floor1OnlyDirs && !floor1OnlyDirs.has(dir)) return false;
      if (tileDeck !== undefined && !isZoneCompatible(neighbor, def.opposite, tileDeck, dir, incomingGatewayDirs)) return false;
      // Connector rule check (bidirectional).
      // If either side is open (ANY or DISABLE_ON_SOLO), skip all rule checks — the open
      // connector's invitation always overrides the other side's SAME restriction.
      if (incomingTile) {
        const neighborRule = getConnectorRule(neighbor, def.opposite);
        const incomingOpen = isOpenConnectorRule(incomingRule);
        const neighborOpen = isOpenConnectorRule(neighborRule);
        if (!incomingOpen && !neighborOpen) {
          const incomingOnly = incomingOnlyTarget?.[dir];
          const neighborOnly = neighbor.placedConnectorOnlyTarget?.[def.opposite];
          // Give the incoming tile a placedDeck so tilePrimaryCollection resolves to the
          // correct zone for shared tiles (e.g. Straight in both Z1 and Z2).
          const effectiveIncoming = tileDeck ? { ...incomingTile, placedDeck: tileDeck } : incomingTile;
          if (incomingRule === CONNECTOR_RULE.DESIGNATED) {
            if (neighborRule !== CONNECTOR_RULE.ONLY || neighborOnly !== effectiveIncoming.name) return false;
          } else if (!connectorRuleAllows(incomingRule, effectiveIncoming, neighbor, incomingOnly)) {
            return false;
          }
          if (!connectorRuleAllows(neighborRule, neighbor, effectiveIncoming, neighborOnly)) return false;
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
      if (neighbor.name === TILE_NAME.ESCALATOR) continue; // escalator bridges both floors
      const neighborFloor = state.floor2Tiles.has(nk) ? 2 : 1;
      if (incomingFloor !== neighborFloor) return false;
    }
  }

  return true;
}

function getPlacementOptions(tile, tileDeck = TILE_DECK.BASE) {
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
      const unrotatedGw = getGatewayConnectorDir(tile);
      const gwDirs = unrotatedGw ? new Set([rotateDir(unrotatedGw, r)]) : null;
      const floor1Dirs = tile.floor1Connectors
        ? new Set(tile.floor1Connectors.map(d => rotateDir(d, r)))
        : null;
      const rotatedRules = getRotatedConnectorRules(tile.connectors, r);
      const rotatedOnlyTarget = tile.connectorOnlyTarget
        ? Object.fromEntries(Object.entries(tile.connectorOnlyTarget).map(([d, n]) => [rotateDir(d, r), n]))
        : null;
      if (isValidPlacement(x, y, connectors, tileDeck, gwDirs, lenient, requiresFloor2, floor1Dirs, tile, rotatedRules, rotatedOnlyTarget)) {
        options.push({ x, y, connectors, rotation: r });
      }
    }
  });

  return options;
}
