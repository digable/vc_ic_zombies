const opponentEventCards = [
  {
    name: "Bad Sense of Direction",
    description: "Next opponent is forced to move in one direction",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      const dirs = ["N", "E", "S", "W"];
      target.forcedDirection = dirs[Math.floor(Math.random() * dirs.length)];
      logLine(`${player.name} played Bad Sense of Direction on ${target.name}.`);
    }
  },
  {
    name: "Brain Cramp",
    description: "Next opponent cannot move or play event cards next turn",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      target.cannotMoveTurns = Math.max(target.cannotMoveTurns, 1);
      target.cannotPlayCardTurns = Math.max(target.cannotPlayCardTurns, 1);
      logLine(`${player.name} played Brain Cramp on ${target.name}.`);
    }
  },
  {
    name: "Butter Fingers",
    description: "Next opponent loses all bullets",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      target.bullets = 0;
      logLine(`${player.name} played Butter Fingers on ${target.name}.`);
    }
  },
  {
    name: "Claustrophobia",
    description: "Next opponent cannot move next turn",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      target.cannotMoveTurns = Math.max(target.cannotMoveTurns, 1);
      logLine(`${player.name} played Claustrophobia on ${target.name}.`);
    }
  },
  {
    name: "Fear",
    description: "Move next opponent one space away from zombies",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      const moved = helpers.moveAwayFromNearestZombie(target);
      logLine(moved
        ? `${player.name} played Fear and moved ${target.name} away from danger.`
        : `${player.name} played Fear, but ${target.name} could not move away.`);
    }
  },
  {
    name: "Hysterical Paralysis",
    description: "Next opponent cannot move next turn",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      target.cannotMoveTurns = Math.max(target.cannotMoveTurns, 1);
      logLine(`${player.name} played Hysterical Paralysis on ${target.name}.`);
    }
  },
  {
    name: "Just When You Thought They Were Dead",
    description: "Spawn 2 zombies near next opponent",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      const spawned = [];
      const first = helpers.spawnZombieAtOrNear(target.x, target.y);
      const second = helpers.spawnZombieAtOrNear(target.x, target.y);
      if (first) spawned.push(first);
      if (second) spawned.push(second);
      logLine(`${player.name} played Just When You Thought They Were Dead on ${target.name} (${spawned.length} zombie(s) spawned at ${spawned.join(" | ") || "none"}).`);
    }
  },
  {
    name: "Your Shoe's Untied",
    description: "Next opponent can move only 1 space next turn",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      target.maxMoveNextTurn = 1;
      logLine(`${player.name} played Your Shoe's Untied on ${target.name}.`);
    }
  }
];
