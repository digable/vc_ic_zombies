function addZombieEventCards(pushCard, helpers) {
  pushCard("Grenade", "Remove all zombies on your tile", (player) => {
    const tileX = Math.floor(player.x / 3);
    const tileY = Math.floor(player.y / 3);
    const removed = helpers.removeZombiesOnTile(tileX, tileY, player);
    logLine(`${player.name} played Grenade and removed ${removed} zombie(s) on this tile.`);
  });

  pushCard("I Don't Think They're Dead", "Spawn 1 zombie near you", (player) => {
    const spawnedKey = helpers.spawnZombieAtOrNear(player.x, player.y);
    logLine(spawnedKey
      ? `${player.name} played I Don't Think They're Dead and a zombie appeared at ${spawnedKey}.`
      : `${player.name} played I Don't Think They're Dead but no open space was available.`);
  });

  pushCard("Molotov", "Remove all zombies on your tile", (player) => {
    const tileX = Math.floor(player.x / 3);
    const tileY = Math.floor(player.y / 3);
    const removed = helpers.removeZombiesOnTile(tileX, tileY, player);
    logLine(`${player.name} played Molotov and burned ${removed} zombie(s) on this tile.`);
  });

  pushCard("We're Screwed", "All zombies move 1 space toward nearest players", (player) => {
    const zombieKeys = [...state.zombies];
    zombieKeys.forEach((zKey) => {
      if (state.zombies.has(zKey)) {
        helpers.moveOneZombieTowardPlayer(zKey);
      }
    });
    logLine(`${player.name} played We're Screwed. All zombies shambled forward.`);
  });

  pushCard("Where Did Everybody Go?", "Remove all zombies on your tile", (player) => {
    const tileX = Math.floor(player.x / 3);
    const tileY = Math.floor(player.y / 3);
    const removed = helpers.removeZombiesOnTile(tileX, tileY, player);
    logLine(`${player.name} played Where Did Everybody Go? (${removed} zombie(s) removed).`);
  });

  pushCard("Zombie Master", "Move up to 6 zombies one space", (player) => {
    const zombieKeys = [...state.zombies];
    const limit = Math.min(6, zombieKeys.length);
    for (let i = 0; i < limit; i += 1) {
      const zKey = zombieKeys[i];
      if (state.zombies.has(zKey)) {
        helpers.moveOneZombieTowardPlayer(zKey);
      }
    }
    logLine(`${player.name} played Zombie Master and moved up to ${Math.min(6, zombieKeys.length)} zombie(s).`);
  });
}
