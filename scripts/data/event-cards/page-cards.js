// ---------------------------------------------------------------------------
// Page cards — shuffled into the event deck; staged in front of the player
// ---------------------------------------------------------------------------
// Page card properties:
//   cardType    {CARD_TYPE.PAGE}  Required — identifies this as a page card
//   name        {string}         Display name
//   description {string}         Shown on the card face in hand and when staged
//   collection  {object}         { [COLLECTIONS.*]: count }
//   apply(player, helpers)       Called when the player uses (discards) the staged card
//
// Rules:
//   - Drawn into hand like a normal event card
//   - "Stage" moves it from hand to in front of the player; uses eventUsedThisRound
//   - "Use & Discard" triggers apply() and discards it; uses pageRemovedThisRound
//   - Players may have any number of pages in front of them
//   - Only one page may be removed per round (pageRemovedThisRound)
//   - Only one event or page card may be staged/played per turn (eventUsedThisRound)
// ---------------------------------------------------------------------------

const pageEventCards = [
  {
    cardType: CARD_TYPE.PAGE,
    name: "Twist of Fate",
    description: "Remove from game: take 1 bullet from each other player.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    apply(player, helpers) {
      state.players.forEach((other) => {
        if (other.id === player.id) return;
        if (other.bullets > 0) {
          other.bullets -= 1;
          player.bullets += 1;
          logLine(`${player.name} takes 1 bullet from ${other.name} (Twist of Fate).`);
        } else {
          logLine(`${other.name} has no bullets to take (Twist of Fate).`);
        }
      });
    }
  },
];
