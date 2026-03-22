// ---------------------------------------------------------------------------
// Opponent event cards — disruption and debuffs against other players
// ---------------------------------------------------------------------------
// Card properties:
//   name        {string}         Display name
//   description {string}         Shown on the card face in hand
//   count       {number}         Copies shuffled into the deck
//   collection  {COLLECTIONS.*}  Which game set this belongs to
//   apply(player, helpers)       Called when the card is played from hand
//
// Common target flags set on the target player object:
//   cannotMoveTurns {number}     Remaining turns the player cannot move
//   halfMovementNextTurn {bool}  Movement roll halved next turn
//   claustrophobiaNextTurn {bool} Cannot enter buildings next turn
//   brainCramp {object}          { controllerPlayerId } — another player controls movement
//
// Building-targeting cards:
//   Use state.pendingBuildingSelect = { cardName, mode }
//   mode "fill_all" — fills every empty legal space in the chosen building
//   mode "double"   — adds zombies equal to those already present (up to capacity)
//   Use anyBuildingMatches(fn) to check fizzle conditions before setting pending state
// ---------------------------------------------------------------------------

const opponentEventCards = [
  {
    name: "Bad Sense of Direction",
    description: "Discard 1 life to move target opponent back to Town Square. Your turn continues as normal.",
    count: 1,
    collection: COLLECTIONS.DIRECTORS_CUT,
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
    collection: COLLECTIONS.DIRECTORS_CUT,
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
    collection: COLLECTIONS.DIRECTORS_CUT,
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
    collection: COLLECTIONS.DIRECTORS_CUT,
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
    collection: COLLECTIONS.DIRECTORS_CUT,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      target.cannotMoveTurns = Math.max(target.cannotMoveTurns, 1);
      logLine(`${player.name} played Fear on ${target.name} — ${target.name} cannot move next turn.`);
    }
  },
  {
    // NOTE: functionally identical to Fear — same cannotMoveTurns effect, different name/count/flavour
    name: "Hysterical Paralysis",
    description: "Next opponent cannot move next turn",
    count: 1,
    collection: COLLECTIONS.DIRECTORS_CUT,
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
    collection: COLLECTIONS.DIRECTORS_CUT,
    apply(player) {
      if (!anyBuildingMatches((zombies, empty) => empty > 0)) {
        logLine(`${player.name} played Just When You Thought It Couldn't Get Any Worse — but no buildings have empty spaces. Card fizzles.`);
        return;
      }
      state.pendingBuildingSelect = { cardName: "Just When You Thought It Couldn't Get Any Worse", mode: "fill_all" };
      logLine(`${player.name} played Just When You Thought It Couldn't Get Any Worse — click any space in a building to fill it with zombies.`);
    }
  },
  {
    name: "Slight Miscalculation",
    description: "Select a building — the number of zombies present is doubled, up to filling all legal spaces.",
    count: 2,
    collection: COLLECTIONS.DIRECTORS_CUT,
    apply(player) {
      if (!anyBuildingMatches((zombies, empty) => zombies > 0 && empty > 0)) {
        logLine(`${player.name} played Slight Miscalculation — no buildings have both zombies and empty spaces. Card fizzles.`);
        return;
      }
      state.pendingBuildingSelect = { cardName: "Slight Miscalculation", mode: "double" };
      logLine(`${player.name} played Slight Miscalculation — click a building to double its zombies.`);
    }
  },
  {
    name: "Your Shoe's Untied",
    description: "Target player's movement roll is divided in half (rounded down) next turn.",
    count: 2,
    collection: COLLECTIONS.DIRECTORS_CUT,
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      target.halfMovementNextTurn = true;
      logLine(`${player.name} played Your Shoe's Untied on ${target.name} — their next movement roll is halved.`);
    }
  }
];
