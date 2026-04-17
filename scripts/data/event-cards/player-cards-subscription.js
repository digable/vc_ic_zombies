const SUB = COLLECTIONS.SUBSCRIPTION;

playerEventCards.push(
  {
    name: "You're not a zombie!",
    description: "Play when sharing a subtile with a zombie. Take it as an ally: remove that zombie, gain +1 combat permanently. This card stays in play — when you would lose a life, discard this instead.",
    collection: { [SUB]: 1 },
    canPlay(player) {
      if (player.zombieAllyActive) return false;
      return state.zombies.has(key(player.x, player.y));
    },
    apply(player) {
      if (!state.zombies.has(key(player.x, player.y))) {
        logLine(`${player.name} tried to befriend a zombie but there's none here.`);
        return;
      }
      state.zombies.delete(key(player.x, player.y));
      player.kills += 1;
      player.zombieAllyActive = true;
      logLine(`${player.name} befriends the zombie! +1 combat, next hit absorbed. (You're not a zombie!)`);
      checkWin();
    }
  }
);
