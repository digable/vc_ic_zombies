// ---------------------------------------------------------------------------
// Map deck build logic
// ---------------------------------------------------------------------------
// Tile definitions live in map-tiles.js (roadTiles, namedTiles, specialTiles, START_TILES).
// This file handles filtering, expanding, and shuffling those definitions into a playable deck.
// resolveCollectionCounts() lives in core.js and is shared with event-deck.js.
// ---------------------------------------------------------------------------

// Ensures the Escalator is always drawn before the Helipad in Mall Walkers games.
// If the Helipad lands at or before the Escalator after shuffling, move it to just after.
function ensureEscalatorBeforeHelipad(deck) {
  const helIdx = deck.findIndex((t) => t.name === "Helipad");
  const escIdx = deck.findIndex((t) => t.name === "Escalator");
  if (escIdx === -1 || helIdx === -1 || escIdx < helIdx) return;
  const [helipad] = deck.splice(helIdx, 1);
  const newEscIdx = deck.findIndex((t) => t.name === "Escalator");
  deck.splice(newEscIdx + 1, 0, helipad);
}

function buildMapDeck(filters = null) {
  const allTiles = [...roadTiles, ...namedTiles, ...specialTiles];

  // Gateway tiles (zoneGatewayConnector) from standalone collections are included in the
  // base deck when a base collection is also active so players can draw them to unlock the zone.
  const hasBaseCollection = filters && Object.entries(COLLECTION_META).some(
    ([c, meta]) => meta.requiresBase === null && !meta.standaloneDeck && filters[c]?.enabled
  );

  const filtered = allTiles
    .filter((t) => {
      if (!filters) return true;
      const colCounts = resolveCollectionCounts(t);
      return Object.keys(colCounts).some((c) => {
        const rule = filters[c];
        if (!rule) return false;
        const isSA = COLLECTION_META[c]?.standaloneDeck;
        if (isSA) {
          // Gateway tiles go into the base deck when mixed with a base collection.
          return hasBaseCollection && !!t.zoneGatewayConnector
            ? (rule.enabled ?? false)
            : false;
        }
        return rule.enabled ?? false;
      });
    })
    .flatMap((t) => {
      const colCounts = resolveCollectionCounts(t);
      if (!filters) {
        const count = Object.values(colCounts).reduce((s, n) => s + n, 0) || 1;
        return Array.from({ length: count }, () => ({ ...t }));
      }
      const count = Object.entries(colCounts).reduce((sum, [c, n]) => {
        const isSA = COLLECTION_META[c]?.standaloneDeck;
        if (isSA) {
          // Only include gateway tiles when mixed with a base collection.
          return hasBaseCollection && !!t.zoneGatewayConnector && filters[c]?.enabled ? sum + n : sum;
        }
        if (filters[c]?.enabled) return sum + n;
        return sum;
      }, 0);
      if (count === 0) return []; // tile has no base-deck copies
      return Array.from({ length: count }, () => ({ ...t }));
    });

  const winTiles = filtered.filter((t) => t.isWinTile);
  const cards = filtered.filter((t) => !t.isWinTile);

  // If no win tile made it through the filter (e.g. expansion selected without base),
  // fall back to the first default win tile — but only if there are base-deck cards to
  // insert it into. Standalone-only games manage their own win tile in their deck.
  if (winTiles.length === 0 && cards.length > 0) {
    const defaultWin = specialTiles.find((t) => t.isWinTile);
    if (defaultWin) winTiles.push({ ...defaultWin });
  }

  shuffle(cards);

  // If only one collection is enabled, promote any firstDrawWhenSolo tile to position 0.
  if (filters) {
    const enabledCols = Object.entries(filters)
      .filter(([, rule]) => rule.enabled)
      .map(([col]) => col);
    if (enabledCols.length === 1) {
      const soloCol = enabledCols[0];
      const firstIdx = cards.findIndex((t) => {
        if (!t.firstDrawWhenSolo) return false;
        return Object.keys(resolveCollectionCounts(t)).includes(soloCol);
      });
      if (firstIdx > 0) cards.unshift(cards.splice(firstIdx, 1)[0]);
    }
  }

  winTiles.forEach((wt) => {
    const start = Math.floor(cards.length / 2);
    const pos = start + Math.floor(Math.random() * (cards.length - start + 1));
    cards.splice(pos, 0, wt);
  });
  ensureEscalatorBeforeHelipad(cards);
  return cards;
}

// Builds the tile deck for a single standalone collection.
// Only tiles that have collKey in their collection are included.
// Each tile contributes only the count from collKey (not other collections).
// Win tiles are shuffled into the back half. firstDrawWhenSolo applies.
function buildStandaloneDeck(collKey, filters = null) {
  const allTiles = [...roadTiles, ...namedTiles, ...specialTiles];
  const rule = filters && filters[collKey];

  // When a base collection is active, gateway tiles are in the base deck instead.
  const hasBaseCollection = filters && Object.entries(COLLECTION_META).some(
    ([c, meta]) => meta.requiresBase === null && !meta.standaloneDeck && filters[c]?.enabled
  );

  const filtered = allTiles
    .filter((t) => {
      if (hasBaseCollection && t.zoneGatewayConnector) return false; // gateway goes to base deck when mixed
      const colCounts = resolveCollectionCounts(t);
      if (!colCounts[collKey]) return false;
      return rule?.enabled ?? true;
    })
    .flatMap((t) => {
      const colCounts = resolveCollectionCounts(t);
      const count = colCounts[collKey] || 0;
      if (count === 0) return [];
      return Array.from({ length: count }, () => ({ ...t }));
    });

  const winTiles = filtered.filter((t) => t.isWinTile);
  const cards = filtered.filter((t) => !t.isWinTile);

  shuffle(cards);

  // firstDrawWhenSolo: if only this collection is enabled, promote its first-draw tile
  if (filters) {
    const enabledCols = Object.entries(filters)
      .filter(([, r]) => r.enabled)
      .map(([c]) => c);
    if (enabledCols.length === 1 && enabledCols[0] === collKey) {
      const firstIdx = cards.findIndex((t) => t.firstDrawWhenSolo);
      if (firstIdx > 0) cards.unshift(cards.splice(firstIdx, 1)[0]);
    }
  }

  winTiles.forEach((wt) => {
    const start = Math.floor(cards.length / 2);
    const pos = start + Math.floor(Math.random() * (cards.length - start + 1));
    cards.splice(pos, 0, wt);
  });
  ensureEscalatorBeforeHelipad(cards);
  return cards;
}

// Returns the start tile for the active collection set.
// Finds the first START_TILES entry that belongs to an enabled base collection
// (requiresBase === null). Falls back to START_TILES[0].
function buildStartTile(filters = null) {
  if (filters) {
    const activeBase = START_TILES.find((st) => {
      const colCounts = resolveCollectionCounts(st);
      return Object.keys(colCounts).some((c) => {
        const meta = COLLECTION_META[c];
        if (!meta || meta.requiresBase !== null) return false;
        const rule = filters[c];
        return rule && rule.enabled;
      });
    });
    if (activeBase) return { ...activeBase };
  }
  return { ...START_TILES[0] };
}

// Returns { collectionKey: tileCount } — count per collection when only that collection is enabled.
function getMapTileCountsByCollection() {
  const allTiles = [...roadTiles, ...namedTiles, ...specialTiles];
  const counts = {};
  Object.values(COLLECTIONS).forEach((col) => {
    let total = 0;
    allTiles.forEach((t) => {
      const colCounts = resolveCollectionCounts(t);
      total += colCounts[col] || 0;
    });
    if (total > 0) counts[col] = total;
  });
  return counts;
}

// Legacy alias — callers that don't need filter-aware selection (e.g. tile-debug)
function buildTownSquareTile() {
  return buildStartTile(null);
}
