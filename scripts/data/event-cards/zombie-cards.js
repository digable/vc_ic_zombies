// ---------------------------------------------------------------------------
// Zombie event cards — spawning, removing, and moving zombies
// ---------------------------------------------------------------------------
// Card properties:
//   name        {string}         Display name
//   description {string}         Shown on the card face in hand
//   collection  {object}         { [COLLECTIONS.*]: count } — keys are collections, values are copy counts
//   apply(player, helpers)       Called when the card is played from hand
//
// Common patterns:
//   Zombie placement  — state.pendingZombiePlace = { remaining, cardName }
//   Forced movement   — state.pendingForcedMove = { targetPlayerId, remaining, priorStep, cardName }
//   Dice challenge    — state.pendingZombieDiceChallenge = { targetPlayerId, dice }
//   Item card usage   — see player-cards.js header for isItem / activateItem pattern
// ---------------------------------------------------------------------------

const zombieEventCards = [
  {
    name: "Grenade",
    description: "Play in the Army Surplus to place in front of you. Discard to kill all zombies on your current tile — but lose 1 health.",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    isItem: true,
    requiresTile: "Army Surplus",
    apply(player) {
      logLine(`${player.name} placed Grenade in front of them.`);
    },
    canActivate(player) {
      // Rule: must be inside a building OR directly in front of a building door
      const { lx, ly } = getSpaceLocalCoords(player.x, player.y);
      const tile = getTileAtSpace(player.x, player.y);
      if (!tile) return false;
      const subType = getSubTileType(tile, lx, ly);
      if (SUBTILE_BUILDING_TYPES.has(subType)) return true;
      // Check if any orthogonally adjacent subtile (same tile) is a building door facing this space
      for (const [dir, d] of Object.entries(DIRS)) {
        const nlx = lx + d.x;
        const nly = ly + d.y;
        if (nlx < 0 || nlx > 2 || nly < 0 || nly > 2) continue;
        const sub = tile.subTiles?.[key(nlx, nly)];
        if (sub?.doors?.includes(DIRS[dir].opposite)) return true;
      }
      return false;
    },
    activateItem(player, helpers) {
      const tileX = spaceToTileCoord(player.x);
      const tileY = spaceToTileCoord(player.y);
      const removed = helpers.removeZombiesOnTile(tileX, tileY, player);
      player.hearts = Math.max(0, player.hearts - 1);
      logLine(`${player.name} threw the Grenade — ${removed} zombie(s) eliminated, but lost 1 health (${player.hearts} remaining).`);
    }
  },
  {
    name: "I Don't Think They're Dead",
    description: "Target opponent rolls 2 dice. If either die is 3 or lower, they lose 2 kills. Bullets (+1) and hearts (reroll) can modify the dice.",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) {
        logLine(`${player.name} played I Don't Think They're Dead, but there is no opponent.`);
        return;
      }
      const dice = [rollD6(), rollD6()];
      logLine(`${player.name} played I Don't Think They're Dead on ${target.name} — rolled [${dice.join("] [")}].`);
      state.pendingZombieDiceChallenge = { targetPlayerId: target.id, dice };
    }
  },
  {
    name: "Molotov Cocktail",
    description: "Play in the Gas Station to place in front of you. Discard to gain +2 to all combat rolls against zombies on your current tile.",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    isItem: true,
    requiresTile: "Gas Station",
    apply(player) {
      logLine(`${player.name} placed Molotov Cocktail in front of them.`);
    },
    activateItem(player) {
      const tileX = spaceToTileCoord(player.x);
      const tileY = spaceToTileCoord(player.y);
      player.tileCombatBonus = 2;
      player.tileCombatBonusTile = key(tileX, tileY);
      logLine(`${player.name} lit the Molotov Cocktail (+2 to all combat rolls on this tile).`);
    }
  },
  {
    name: "We're Screwed",
    description: "Place zombies on any 10 legal empty spaces on the board.",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    apply(player) {
      state.pendingZombiePlace = { remaining: 10, cardName: "We're Screwed" };
      logLine(`${player.name} played We're Screwed — place 10 zombies on the board.`);
    }
  },
  {
    name: "Where Did Everybody Go?",
    description: "Move target opponent 5 spaces. All zombies encountered must be fought as normal.",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) {
        logLine(`${player.name} played Where Did Everybody Go?, but there is no opponent.`);
        return;
      }
      state.pendingForcedMove = { targetPlayerId: target.id, remaining: 5, priorStep: state.step, cardName: "Where Did Everybody Go!" };
      state.movesRemaining = 5;
      state.step = STEP.MOVE;
      logLine(`${player.name} played Where Did Everybody Go! — ${target.name} must move 5 spaces.`);
    }
  },
  {
    name: "Zombie Master",
    description: "Place 5 zombies on any legal space not occupied by a player.",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    apply(player) {
      state.pendingZombiePlace = { remaining: 5, cardName: "Zombie Master" };
      logLine(`${player.name} played Zombie Master — place 5 zombies on the board.`);
    }
  }
];
