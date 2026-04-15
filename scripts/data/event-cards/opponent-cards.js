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
    preview(player) {
      const target = state.players.find((p) => p.id !== player.id && key(p.x, p.y) === key(player.x, player.y) && p.items && p.items.length > 0);
      if (!target) return null;
      return `Can steal from ${target.name}: ${target.items.map((i) => i.name).join(", ")}`;
    },
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
    preview(player) {
      const n = state.players.length;
      for (let i = 1; i < n; i++) {
        const p = state.players[(state.currentPlayerIndex + i) % n];
        if (p.id === player.id) continue;
        if (p.hand.length === 0) return `${p.name} has no cards — no effect.`;
        return `Would discard ${p.name}'s hand (${p.hand.length} card(s)).`;
      }
      return "No valid target.";
    },
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
      collectTokensAtPlayerSpace(target);
      const movingNote = (state.step === STEP.MOVE && state.movesRemaining > 0 && currentPlayer().id === target.id)
        ? ` ${target.name} may continue moving (${state.movesRemaining} space(s) remaining).`
        : "";
      logLine(`${player.name} played Bad Sense of Direction — spent 1 life (${player.hearts} remaining) and sent ${target.name} back to Town Square.${movingNote}`);
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
      // Rule: if played during the target's own turn (mid-move), it takes effect NEXT turn.
      // cannotMoveTurns is decremented at turn-end, so set 2 when it's currently the target's turn
      // so one decrement is consumed this turn-end, leaving 1 for their next movement roll.
      const targetIsActive = state.players[state.currentPlayerIndex]?.id === target.id;
      const needed = targetIsActive ? 2 : 1;
      target.cannotMoveTurns = Math.max(target.cannotMoveTurns, needed);
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
      const targetIsActive = state.players[state.currentPlayerIndex]?.id === target.id;
      const needed = targetIsActive ? 2 : 1;
      target.cannotMoveTurns = Math.max(target.cannotMoveTurns, needed);
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
  },
  {
    name: "With friends like you...",
    description: "Play at any time if you have a weapon or item in play. All players discard all weapons and items in play.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    canPlay() {
      return (currentPlayer().items?.length ?? 0) > 0;
    },
    apply(player) {
      state.players.forEach((p) => {
        if (!p.items || p.items.length === 0) return;
        p.items.forEach((item) => {
          if (item.name === "Meat Cleaver" && p.meatCleaverActive) p.meatCleaverActive = false;
          state.eventDiscardPile.push(item);
        });
        p.items = [];
      });
      logLine(`${player.name} played With friends like you... — all weapons and items discarded.`);
    }
  },
  {
    name: "Don't go to sleep",
    description: "Play at the beginning of an opponent's turn. They must roll 1 or 6 to continue; any other roll loses their turn and places a zombie on their space.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) {
        logLine(`${player.name} played Don't go to sleep — no valid target.`);
        return;
      }
      target.sleepChallengePending = true;
      logLine(`${player.name} played Don't go to sleep on ${target.name} — ${target.name} must roll 1 or 6 at the start of their next turn.`);
    }
  },
  {
    name: "Why Won't You Die?!?!?",
    description: "Play when an opponent just killed a zombie. That zombie respawns at its kill location and the kill is reversed.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    canPlay() {
      return state.recentKillKey !== null &&
             state.recentKillByPlayerId !== null &&
             state.recentKillByPlayerId !== currentPlayer().id;
    },
    apply(player) {
      const killKey = state.recentKillKey;
      const killer = state.players.find((p) => p.id === state.recentKillByPlayerId);
      if (!killKey || !killer) {
        logLine(`${player.name} played Why Won't You Die?!?!? — no recent opponent kill to target.`);
        return;
      }
      if (state.zombies.has(killKey)) {
        logLine(`${player.name} played Why Won't You Die?!?!? — that space is already occupied by a zombie.`);
        return;
      }
      state.zombies.set(killKey, { type: ZOMBIE_TYPE.REGULAR });
      killer.kills = Math.max(0, killer.kills - 1);
      state.recentKillKey = null;
      state.recentKillByPlayerId = null;
      logLine(`${player.name} played Why Won't You Die?!?!? — zombie respawned at ${killKey}. ${killer.name}'s kill reversed (now ${killer.kills}).`);
    }
  },
  {
    name: "They're Coming For You, ______",
    description: "Place a zombie on every legal space on one opponent's current tile.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    apply(player) {
      const floodTile = (target) => {
        const tx = spaceToTileCoord(target.x);
        const ty = spaceToTileCoord(target.y);
        const tile = state.board.get(key(tx, ty));
        if (!tile) { logLine(`${player.name} played They're Coming For You — no tile found.`); return; }
        if (state.noZombieTiles?.has(key(tx, ty))) {
          logLine(`${player.name} played They're Coming For You on ${target.name}'s tile — zombies cannot be placed there.`);
          return;
        }
        let placed = 0;
        for (let lx = 0; lx < TILE_DIM; lx += 1) {
          for (let ly = 0; ly < TILE_DIM; ly += 1) {
            if (!isSubtileZombieViable(tile, lx, ly)) continue;
            const sk = key(tx * TILE_DIM + lx, ty * TILE_DIM + ly);
            if (state.zombies.has(sk)) continue;
            state.zombies.set(sk, { type: ZOMBIE_TYPE.REGULAR });
            placed += 1;
          }
        }
        logLine(`${player.name} played They're Coming For You on ${target.name}'s tile — ${placed} zombie(s) placed.`);
      };

      const others = state.players.filter((p) => p.id !== player.id);
      if (others.length === 0) {
        logLine(`${player.name} played They're Coming For You — no opponents.`);
        return;
      }
      if (others.length === 1) {
        floodTile(others[0]);
        return;
      }
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "They're Coming For You, ______",
        options: others.map((p) => ({ key: String(p.id), label: p.name })),
        resolve(optionKey) {
          const target = state.players.find((p) => String(p.id) === optionKey);
          if (target) floodTile(target);
        }
      };
      logLine(`${player.name} played They're Coming For You — choose a target.`);
    }
  },
  {
    name: "Lots of running and screaming",
    description: "Play before an opponent rolls movement. Their movement roll is used to move your player instead. Does not count as your movement on your next turn.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    apply(player, helpers) {
      const target = helpers.getNextOpponent(player);
      if (!target) {
        logLine(`${player.name} played Lots of running and screaming — no valid target.`);
        return;
      }
      target.movementHijack = { byPlayerId: player.id };
      logLine(`${player.name} played Lots of running and screaming on ${target.name} — ${player.name} will use ${target.name}'s next movement roll.`);
    }
  },
  {
    name: "Troubled Childhood",
    description: "Look at the cards in one opponent's hand.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    apply(player) {
      const others = state.players.filter((p) => p.id !== player.id);
      if (others.length === 0) {
        logLine(`${player.name} played Troubled Childhood — no opponents.`);
        return;
      }
      const showHand = (target) => {
        if (target.hand.length === 0) {
          logLine(`${player.name} looked at ${target.name}'s hand (Troubled Childhood) — it is empty.`);
        } else {
          logLine(`${player.name} looked at ${target.name}'s hand (Troubled Childhood): ${target.hand.map((c) => c.name).join(", ")}.`);
        }
      };
      if (others.length === 1) {
        showHand(others[0]);
        return;
      }
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Troubled Childhood",
        options: others.map((p) => ({ key: String(p.id), label: p.name })),
        resolve(optionKey) {
          const target = state.players.find((p) => String(p.id) === optionKey);
          if (target) showHand(target);
        }
      };
      logLine(`${player.name} played Troubled Childhood — choose an opponent to look at.`);
    }
  }
];
