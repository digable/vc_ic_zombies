function buildEventDeck(filters = null) {
  const all = [...playerEventCards, ...opponentEventCards, ...zombieEventCards];

  function resolveColCounts(c) {
    if (c.collection !== null && typeof c.collection === "object" && !Array.isArray(c.collection)) {
      return c.collection;
    }
    const cols = Array.isArray(c.collection)
      ? c.collection
      : [c.collection || getBaseCollection()];
    const n = Math.max(1, c.count || 1);
    return Object.fromEntries(cols.map((k) => [k, n]));
  }

  const applyFilter = (filterSet) =>
    all
      .filter((c) => {
        if (!filterSet) return true;
        const colCounts = resolveColCounts(c);
        return Object.keys(colCounts).some((k) => {
          const rule = filterSet[k];
          if (!rule) return false;
          return c.enabled !== false ? (rule.enabled ?? false) : (rule.disabled ?? false);
        });
      })
      .flatMap((c) => {
        const colCounts = resolveColCounts(c);
        const count = Object.entries(colCounts).reduce((sum, [k, n]) => {
          if (!filters || filters[k]?.enabled) return sum + n;
          return sum;
        }, 0) || 1;
        return Array.from({ length: count }, () => ({ ...c }));
      });

  let expanded = applyFilter(filters);

  // If the filter yielded no cards (e.g. an expansion selected without its base),
  // fall back to the base game's events.
  if (expanded.length === 0 && filters) {
    const baseFilter = { [getBaseCollection()]: { enabled: true, disabled: false } };
    expanded = applyFilter(baseFilter);
  }

  return shuffle(expanded);
}

// Returns { collectionKey: cardCount } using all event cards, ignoring enabled flags.
function getEventCardCountsByCollection() {
  const all = [...playerEventCards, ...opponentEventCards, ...zombieEventCards];
  const counts = {};
  all.forEach((c) => {
    const colCounts = (c.collection !== null && typeof c.collection === "object" && !Array.isArray(c.collection))
      ? c.collection
      : { [c.collection || getBaseCollection()]: c.count || 1 };
    Object.entries(colCounts).forEach(([k, n]) => {
      counts[k] = (counts[k] || 0) + n;
    });
  });
  return counts;
}
