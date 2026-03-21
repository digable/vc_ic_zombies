function buildEventDeck(filters = null) {
  const all = [...playerEventCards, ...opponentEventCards, ...zombieEventCards];

  const applyFilter = (filterSet) =>
    all
      .filter((c) => {
        const col = c.collection || TILE_COLLECTIONS.DIRECTORS_CUT;
        if (!filterSet) return true;
        const rule = filterSet[col];
        if (!rule) return false;
        return c.enabled !== false ? (rule.enabled ?? false) : (rule.disabled ?? false);
      })
      .flatMap((c) => Array.from({ length: c.count || 1 }, () => ({ ...c })));

  let expanded = applyFilter(filters);

  // If the filter yielded no cards (e.g. an expansion selected without its base),
  // fall back to the base game's events.
  if (expanded.length === 0 && filters) {
    const baseFilter = { [TILE_COLLECTIONS.DIRECTORS_CUT]: { enabled: true, disabled: false } };
    expanded = applyFilter(baseFilter);
  }

  return shuffle(expanded);
}
