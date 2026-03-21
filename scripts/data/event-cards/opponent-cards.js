const opponentEventCards = [
  {
    name: "Bad Sense of Direction",
    description: "Discard 1 life to move target opponent back to Town Square. Your turn continues as normal.",
    count: 1,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      if (player.hearts <= 0) {
        logLine(`${player.name} cannot play Bad Sense of Direction — no life tokens remaining.`);
        return;
      }
      const target = helpers.getNextOpponent(player);
      if (!target) {
        logLine(`${player.name} played Bad Sense of Direction, but there is no opponent.`);
        return;
      }
      player.hearts -= 1;
      target.x = 1;
      target.y = 1;
      logLine(`${player.name} played Bad Sense of Direction — spent 1 life (${player.hearts} remaining) and sent ${target.name} back to Town Square.`);
    }
  },
  {
    name: "Brain Cramp",
    description: "Play when target opponent begins to move. You decide if and where they move.",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      target.brainCramp = { controllerPlayerId: player.id };
      logLine(`${player.name} played Brain Cramp on ${target.name} — ${player.name} will control ${target.name}'s next movement.`);
    }
  },
  {
    name: "Butter Fingers",
    description: "Choose a target player: they discard a weapon or item in play, or you remove up to 2 of their bullets.",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;

      const options = [];

      (target.items || []).forEach((item, i) => {
        options.push({ key: `item_${i}`, label: `Discard ${item.name}` });
      });

      if (target.bullets >= 2) {
        options.push({ key: "bullet_2", label: `Remove 2 bullets (${target.bullets} → ${target.bullets - 2})` });
      }
      if (target.bullets >= 1) {
        options.push({ key: "bullet_1", label: `Remove 1 bullet (${target.bullets} → ${target.bullets - 1})` });
      }

      if (options.length === 0) {
        logLine(`${player.name} played Butter Fingers on ${target.name}, but ${target.name} has nothing to lose.`);
        return;
      }

      logLine(`${player.name} played Butter Fingers on ${target.name} — choose what to remove.`);
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Butter Fingers",
        options,
        resolve(key) {
          if (key === "bullet_1") {
            target.bullets = Math.max(0, target.bullets - 1);
            logLine(`Butter Fingers: ${target.name} lost 1 bullet (${target.bullets} remaining).`);
          } else if (key === "bullet_2") {
            target.bullets = Math.max(0, target.bullets - 2);
            logLine(`Butter Fingers: ${target.name} lost 2 bullets (${target.bullets} remaining).`);
          } else if (key.startsWith("item_")) {
            const idx = Number(key.slice(5));
            const item = target.items[idx];
            if (item) {
              target.items.splice(idx, 1);
              state.eventDiscardPile.push(item);
              logLine(`Butter Fingers: ${target.name} discarded ${item.name}.`);
            }
          }
        }
      };
    }
  },
  {
    name: "Claustrophobia",
    description: "Target player cannot enter any building next turn. If already in a building, they must use all movement to exit by the shortest route.",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      target.claustrophobiaNextTurn = true;
      logLine(`${player.name} played Claustrophobia on ${target.name}.`);
    }
  },
  {
    name: "Fear",
    description: "Target player may not move by any means on their next turn.",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      target.cannotMoveTurns = Math.max(target.cannotMoveTurns, 1);
      logLine(`${player.name} played Fear on ${target.name} — ${target.name} cannot move next turn.`);
    }
  },
  {
    name: "Hysterical Paralysis",
    description: "Next opponent cannot move next turn",
    count: 1,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      target.cannotMoveTurns = Math.max(target.cannotMoveTurns, 1);
      logLine(`${player.name} played Hysterical Paralysis on ${target.name}.`);
    }
  },
  {
    name: "Just When You Thought It Couldn't Get Any Worse",
    description: "Select a building on the board — every empty legal space in that building gets a zombie.",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player) {
      state.pendingBuildingSelect = { cardName: "Just When You Thought It Couldn't Get Any Worse" };
      logLine(`${player.name} played Just When You Thought It Couldn't Get Any Worse — click any space in a building to fill it with zombies.`);
    }
  },
  {
    name: "Your Shoe's Untied",
    description: "Target player's movement roll is divided in half (rounded down) next turn.",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      target.halfMovementNextTurn = true;
      logLine(`${player.name} played Your Shoe's Untied on ${target.name} — their next movement roll is halved.`);
    }
  }
];
