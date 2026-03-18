const zombieEventCards = [
  {
    name: "Grenade",
    description: "Remove all zombies on your tile",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const tileX = spaceToTileCoord(player.x);
      const tileY = spaceToTileCoord(player.y);
      const removed = helpers.removeZombiesOnTile(tileX, tileY, player);
      logLine(`${player.name} played Grenade and removed ${removed} zombie(s) on this tile.`);
    }
  },
  {
    name: "I Don't Think They're Dead",
    description: "Spawn 1 zombie near you",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const spawnedKey = helpers.spawnZombieAtOrNear(player.x, player.y);
      logLine(spawnedKey
        ? `${player.name} played I Don't Think They're Dead and a zombie appeared at ${spawnedKey}.`
        : `${player.name} played I Don't Think They're Dead but no open space was available.`);
    }
  },
  {
    name: "Molotov",
    description: "Remove all zombies on your tile",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const tileX = spaceToTileCoord(player.x);
      const tileY = spaceToTileCoord(player.y);
      const removed = helpers.removeZombiesOnTile(tileX, tileY, player);
      logLine(`${player.name} played Molotov and burned ${removed} zombie(s) on this tile.`);
    }
  },
  {
    name: "We're Screwed",
    description: "All zombies move 1 space toward nearest players",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const zombieKeys = [...state.zombies];
      zombieKeys.forEach((zKey) => {
        if (state.zombies.has(zKey)) {
          helpers.moveOneZombieTowardPlayer(zKey);
        }
      });
      logLine(`${player.name} played We're Screwed. All zombies shambled forward.`);
    }
  },
  {
    name: "Where Did Everybody Go?",
    description: "Remove all zombies on your tile",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const tileX = spaceToTileCoord(player.x);
      const tileY = spaceToTileCoord(player.y);
      const removed = helpers.removeZombiesOnTile(tileX, tileY, player);
      logLine(`${player.name} played Where Did Everybody Go? (${removed} zombie(s) removed).`);
    }
  },
  {
    name: "Zombie Master",
    description: "Move up to 6 zombies one space",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const zombieKeys = [...state.zombies];
      const limit = Math.min(6, zombieKeys.length);
      for (let i = 0; i < limit; i += 1) {
        const zKey = zombieKeys[i];
        if (state.zombies.has(zKey)) {
          helpers.moveOneZombieTowardPlayer(zKey, { targetPlayerId: player.id });
        }
      }
      logLine(`${player.name} played Zombie Master and moved up to ${Math.min(6, zombieKeys.length)} zombie(s).`);
    }
  }
];
