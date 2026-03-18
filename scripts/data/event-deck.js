function buildEventDeck() {
  const all = [...playerEventCards, ...opponentEventCards, ...zombieEventCards];
  const expanded = all.flatMap((c) => Array.from({ length: c.count || 1 }, () => ({ ...c })));
  return shuffle(expanded);
}
