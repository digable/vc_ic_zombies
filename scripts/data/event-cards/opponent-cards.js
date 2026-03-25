// ---------------------------------------------------------------------------
// Opponent event cards — disruption and debuffs against other players
// ---------------------------------------------------------------------------
// Card properties:
//   name        {string}         Display name
//   description {string}         Shown on the card face in hand
//   collection  {object}         { [COLLECTIONS.*]: count } — keys are collections, values are copy counts
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
    name: "I Think It's Over Here",
    description: "Play when an opponent draws a map tile. They draw it first, then you place it instead. Cannot be used on Helipad tiles.",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) {
        logLine(`${player.name} played I Think It's Over Here — no valid target.`);
        return;
      }
      target.tileHijackNotify = player.id;
      logLine(`${player.name} played I Think It's Over Here on ${target.name} — ${player.name} will place ${target.name}'s next drawn tile.`);
    }
  },
  {
    name: "You Don't Need That!",
    description: "Play when you share a space with another player. Take one weapon or item in play from them.",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    canPlay() {
      const cp = currentPlayer();
      return state.players.some((p) => p.id !== cp.id && key(p.x, p.y) === key(cp.x, cp.y) && p.items && p.items.length > 0);
    },
    apply(player) {
      const target = state.players.find((p) => p.id !== player.id && key(p.x, p.y) === key(player.x, player.y) && p.items && p.items.length > 0);
      if (!target) {
        logLine(`${player.name} played You Don't Need That! — no opponent at same space with items.`);
        return;
      }
      if (target.items.length === 1) {
        const [stolen] = target.items.splice(0, 1);
        player.items.push(stolen);
        logLine(`${player.name} took ${stolen.name} from ${target.name} (You Don't Need That!).`);
        return;
      }
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "You Don't Need That!",
        options: target.items.map((item, i) => ({ key: `item_${i}`, label: item.name })),
        resolve(optKey) {
          const idx = Number(optKey.slice(5));
          const stolen = target.items.splice(idx, 1)[0];
          if (stolen) {
            player.items.push(stolen);
            logLine(`${player.name} took ${stolen.name} from ${target.name} (You Don't Need That!).`);
          }
        }
      };
      logLine(`${player.name} played You Don't Need That! on ${target.name} — choose an item to take.`);
    }
  },
  {
    name: "You Lookin' at Me?!?",
    description: "Play when an opponent plays a card. They must pick a new legal target. If none exists, that card is discarded without effect.",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) {
        logLine(`${player.name} played You Lookin' at Me?!? — no valid target.`);
        return;
      }
      target.lookinAtMePending = { byPlayerId: player.id };
      logLine(`${player.name} played You Lookin' at Me?!? on ${target.name} — ${target.name}'s next card must target someone else.`);
    }
  },
  {
    name: "Weekend Pass: DENIED!",
    description: "Target opponent discards their entire hand.",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) {
        logLine(`${player.name} played Weekend Pass: DENIED! — no valid target.`);
        return;
      }
      if (target.hand.length === 0) {
        logLine(`${player.name} played Weekend Pass: DENIED! on ${target.name} — ${target.name} has no cards to discard.`);
        return;
      }
      const count = target.hand.length;
      target.hand.forEach((c) => state.eventDiscardPile.push(c));
      target.hand = [];
      logLine(`${player.name} played Weekend Pass: DENIED! on ${target.name} — ${target.name} discarded all ${count} card(s).`);
    }
  },
  {
    name: "What is That Smell?!?",
    description: "Play before target opponent's movement roll. They must move to a different tile and may not return this turn. If they cannot leave, they skip their next turn instead.",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) {
        logLine(`${player.name} played What is That Smell?!? — no valid target.`);
        return;
      }
      const tileX = spaceToTileCoord(target.x);
      const tileY = spaceToTileCoord(target.y);
      target.smellEffect = { startTileKey: key(tileX, tileY), movedToNewTile: false };
      logLine(`${player.name} played What is That Smell?!? on ${target.name} — ${target.name} must move to a different tile and cannot return this turn.`);
    }
  },
  {
    name: "No Brains Here",
    description: "Play when target opponent shares a space with a zombie. Move that zombie to an adjacent subtile.",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    canPlay() {
      const cp = currentPlayer();
      return state.players.some((p) => p.id !== cp.id && state.zombies.has(key(p.x, p.y)));
    },
    apply(player) {
      const target = state.players.find((p) => p.id !== player.id && state.zombies.has(key(p.x, p.y)));
      if (!target) {
        logLine(`${player.name} played No Brains Here, but no opponent is sharing a space with a zombie.`);
        return;
      }
      const zombieKey = key(target.x, target.y);
      state.pendingZombieReplace = {
        remaining: 1,
        selectedZombieKey: zombieKey,
        adjacentToKey: zombieKey,
        cardName: "No Brains Here"
      };
      logLine(`${player.name} played No Brains Here — move the zombie from ${target.name}'s space to an adjacent subtile.`);
    }
  },
  {
    name: "Government Enhanced Zombies!",
    description: "All players must roll 5+ to kill regular zombies until the end of your next turn.",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    apply(player) {
      if (state.regularZombieEnhanced) {
        state.regularZombieEnhanced.endTurnCount = 0;
        state.regularZombieEnhanced.playerId = player.id;
      } else {
        state.regularZombieEnhanced = { playerId: player.id, endTurnCount: 0 };
      }
      logLine(`${player.name} played Government Enhanced Zombies! — all players need 5+ to kill regular zombies until end of ${player.name}'s next turn.`);
    }
  },
  {
    name: "Bad Sense of Direction",
    description: "Discard 1 life to move target opponent back to Town Square. Your turn continues as normal.",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
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
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
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
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
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

      logLine(`${player.name} played Butter Fingers on ${target.name} — ${player.name} chooses what to take.`);
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Butter Fingers",
        targetName: target.name,
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
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
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
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
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
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
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
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
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
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
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
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) return;
      target.halfMovementNextTurn = true;
      logLine(`${player.name} played Your Shoe's Untied on ${target.name} — their next movement roll is halved.`);
    }
  }
];
