// ---------------------------------------------------------------------------
// Map deck build logic
// ---------------------------------------------------------------------------
// Tile definitions live in map-tiles.js (roadTiles, namedTiles, specialTiles, START_TILES).
// This file handles filtering, expanding, and shuffling those definitions into a playable deck.
// resolveCollectionCounts() lives in core.js and is shared with event-deck.js.
// ---------------------------------------------------------------------------

function buildMapDeck(filters = null) {
  const allTiles = [...roadTiles, ...namedTiles, ...specialTiles];

  const filtered = allTiles
    .filter((t) => {
      if (!filters) return true;
      const colCounts = resolveCollectionCounts(t);
      return Object.keys(colCounts).some((c) => {
        const rule = filters[c];
        if (!rule) return false;
        return t.enabled !== false ? (rule.enabled ?? false) : (rule.disabled ?? false);
      });
    })
    .flatMap((t) => {
      const colCounts = resolveCollectionCounts(t);
      const count = Object.entries(colCounts).reduce((sum, [c, n]) => {
        if (!filters || filters[c]?.enabled) return sum + n;
        return sum;
      }, 0) || 1;
      return Array.from({ length: count }, () => ({ ...t }));
    });

  const winTiles = filtered.filter((t) => t.isWinTile);
  const cards = filtered.filter((t) => !t.isWinTile);

  // If no win tile made it through the filter (e.g. expansion selected without base),
  // fall back to the first default win tile from specialTiles.
  if (winTiles.length === 0) {
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
  const counts = {};
  Object.values(COLLECTIONS).forEach((col) => {
    const tiles = buildMapDeck({ [col]: { enabled: true, disabled: false } });
    if (tiles.length > 0) counts[col] = tiles.length;
  });
  return counts;
}

// Legacy alias — callers that don't need filter-aware selection (e.g. tile-debug)
function buildTownSquareTile() {
  return buildStartTile(null);
}
