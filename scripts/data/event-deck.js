function buildEventDeck() {
  const cards = [];
  const pushCard = (name, description, apply) => {
    for (let i = 0; i < 2; i += 1) {
      cards.push({ name, description, apply });
    }
  };

  const helpers = buildEventDeckHelpers();
  addPlayerEventCards(pushCard, helpers);
  addOpponentEventCards(pushCard, helpers);
  addZombieEventCards(pushCard, helpers);

  return shuffle(cards);
}
