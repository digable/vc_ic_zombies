function buildEventDeck(filters = null) {
  const all = [...playerEventCards, ...opponentEventCards, ...zombieEventCards];

  const applyFilter = (filterSet) =>
    all
      .filter((c) => {
        if (!filterSet) return true;
        const colCounts = resolveCollectionCounts(c);
        return Object.keys(colCounts).some((k) => {
          const rule = filterSet[k];
          if (!rule) return false;
          return c.enabled !== false ? (rule.enabled ?? false) : (rule.disabled ?? false);
        });
      })
      .flatMap((c) => {
        const colCounts = resolveCollectionCounts(c);
        const count = Object.entries(colCounts).reduce((sum, [k, n]) => {
          if (!filters || filters[k]?.enabled) return sum + n;
          return sum;
        }, 0) || 1;
        return Array.from({ length: count }, () => ({ ...c }));
      });

  return shuffle(applyFilter(filters));
}

// Returns { collectionKey: cardCount } using all event cards, ignoring enabled flags.
function getEventCardCountsByCollection() {
  const all = [...playerEventCards, ...opponentEventCards, ...zombieEventCards];
  const counts = {};
  all.forEach((c) => {
    const colCounts = resolveCollectionCounts(c);
    Object.entries(colCounts).forEach(([k, n]) => {
      counts[k] = (counts[k] || 0) + n;
    });
  });
  return counts;
}
