// ---------------------------------------------------------------------------
// Z5 (School's Out Forever) player event cards — appended to playerEventCards
// ---------------------------------------------------------------------------
// Appended to playerEventCards after player-cards.js loads.
// See player-cards.js header for full card property reference.
// ---------------------------------------------------------------------------

// File-local shorthand — avoids repeating the full collection key on every card.
const Z5 = COLLECTIONS.SCHOOLS_OUT_FOREVER;

// Returns true when `player` is currently standing on any Z5 tile.
function isOnZ5Tile(player) {
  const tile = getTileAtSpace(player.x, player.y);
  return !!(tile && tile.collection && tile.collection[Z5]);
}

// Builds the list of non-empty map deck stacks as { id, label, shortLabel, deck }.
// Pass activeOnly=true to restrict standalone decks to those currently unlocked.
function buildMapStacks(activeOnly = false) {
  const stacks = [];
  if (state.mapDeck.length > 0) {
    stacks.push({ id: "base", label: "Base Deck", shortLabel: "Base", deck: state.mapDeck });
  }
  Object.entries(state.standaloneDecks).forEach(([collKey, deck]) => {
    if (deck.length === 0) return;
    if (activeOnly && !state.activeStandaloneDecks.has(collKey)) return;
    const meta = COLLECTION_META[collKey];
    stacks.push({ id: collKey, label: meta ? meta.label : collKey, shortLabel: meta ? meta.shortCode : collKey, deck });
  });
  return stacks;
}

playerEventCards.push(
  {
    name: "Raise your hand...",
    description: "Play immediately to cancel any card just played on you. The card is discarded without effect.",
    collection: { [Z5]: 2 },
    canPlay() {
      return state.lastPlayedEventCard !== null &&
             state.lastPlayedEventCard.playerId !== currentPlayer().id;
    },
    apply(player) {
      const last = state.lastPlayedEventCard;
      if (!last) {
        logLine(`${player.name} played Raise your hand... — no card to cancel.`);
        return;
      }

      const { card, playerId } = last;
      const caster = state.players.find((p) => p.id === playerId);
      state.lastPlayedEventCard = null;

      // Cancel any pending state the card may have set up
      state.pendingEventChoice    = null;
      state.pendingSpaceSelect    = null;
      state.pendingZombieReplace  = null;
      state.pendingForcedMove     = null;
      state.pendingBuildingSelect = null;
      state.pendingDynamiteTarget = null;
      state.pendingMinefield      = null;
      state.pendingRocketLauncher = null;
      state.pendingBreakthrough   = null;
      state.pendingZombieFlood    = null;

      // If it was an item card, find and remove it from whoever received it
      if (card.isItem) {
        for (const p of state.players) {
          const idx = p.items.findIndex((c) => c === card);
          if (idx >= 0) { p.items.splice(idx, 1); break; }
        }
      }

      // Undo eventUsedThisRound so the caster can play again
      if (caster) {
        caster.eventUsedThisRound = false;
        logLine(`${player.name} cancelled ${caster.name}'s ${card.name} — Raise your hand...`);
      } else {
        logLine(`${player.name} cancelled ${card.name} — Raise your hand...`);
      }
    }
  },
  {
    name: "Scalpel",
    description: "Play in a Hospital, Science Center, or Lab — give to an opponent. Holder suffers -1 to all combat rolls. At end of turn, discard 1 life, bullet, or guts to pass it to another player.",
    collection: { [Z5]: 2 },
    isItem: true,
    activateLabel: "Pass Scalpel",
    requiresTile: ["Hospital", "Science Center", "Lab"],
    preview(player) {
      const scalpelCount = (player.items || []).filter((c) => c.name === "Scalpel").length;
      if (scalpelCount > 0) {
        const parts = [];
        if (player.hearts > 0) parts.push(`${player.hearts} life`);
        if (player.bullets > 0) parts.push(`${player.bullets} bullets`);
        if (state.useGuts && player.guts > 0) parts.push(`${player.guts} guts`);
        return parts.length > 0
          ? `−${scalpelCount} to combat rolls. Can pay: ${parts.join(", ")}.`
          : "−1 to combat rolls. No resources to pass it!";
      }
      return null;
    },
    apply(player) {
      // The item system already placed this card in player.items.
      // Move it to an opponent instead.
      const scalpelIdx = player.items.findIndex((c) => c.name === "Scalpel");
      if (scalpelIdx < 0) return;
      const [scalpel] = player.items.splice(scalpelIdx, 1);

      const others = state.players.filter((p) => p.id !== player.id);
      if (others.length === 0) {
        // Solo game — stays with the player
        player.items.push(scalpel);
        logLine(`${player.name} played Scalpel — no opponents; penalty applies to you.`);
        return;
      }

      const giveToOpponent = (target) => {
        target.items.push(scalpel);
        logLine(`${player.name} played Scalpel — given to ${target.name}. ${target.name} suffers -1 to all combat rolls.`);
      };

      if (others.length === 1) {
        giveToOpponent(others[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Scalpel",
        title: "Scalpel — Choose an opponent to give it to",
        options: playerOpts(others),
        resolve(optKey) {
          const target = playerFromOpt(optKey);
          if (target) giveToOpponent(target);
          else player.items.push(scalpel); // fallback — shouldn't happen
        }
      };
    },
    activateItem(player) {
      // Build payment options
      const payOptions = [];
      if (player.hearts > 0) payOptions.push({ key: "life", label: `1 life${player.hearts === 1 ? " (will KO)" : ""}` });
      if (player.bullets > 0) payOptions.push({ key: "bullet", label: "1 bullet" });
      if (state.useGuts && player.guts != null && player.guts > 0) payOptions.push({ key: "guts", label: "1 guts token" });

      if (payOptions.length === 0) {
        logLine(`${player.name} cannot pass the Scalpel — no life, bullets, or guts to discard.`);
        // Put it back (activateItem already removed it via consumeItemByName)
        player.items.push(this);
        render();
        return;
      }

      const others = state.players.filter((p) => p.id !== player.id);
      if (others.length === 0) {
        logLine(`Scalpel — no other players to pass to.`);
        player.items.push(this);
        render();
        return;
      }

      const scalpelRef = this;

      const doPass = (payKey, target) => {
        if (payKey === "life") {
          player.hearts -= 1;
          logLine(`${player.name} discarded 1 life to pass the Scalpel.`);
          if (player.hearts <= 0) handleKnockout(player, { endStep: false });
        } else if (payKey === "bullet") {
          player.bullets -= 1;
          logLine(`${player.name} discarded 1 bullet to pass the Scalpel.`);
        } else if (payKey === "guts") {
          player.guts -= 1;
          logLine(`${player.name} discarded 1 guts token to pass the Scalpel.`);
        }
        target.items.push(scalpelRef);
        logLine(`${player.name} passed the Scalpel to ${target.name}. ${target.name} now suffers -1 to all combat rolls.`);
      };

      const promptTarget = (payKey) => {
        if (others.length === 1) {
          doPass(payKey, others[0]);
          return;
        }
        state.pendingEventChoice = {
          playerId: player.id,
          cardName: "Scalpel",
          title: "Scalpel — Choose a player to pass it to",
          options: playerOpts(others),
          resolve(optKey) {
            const target = playerFromOpt(optKey);
            if (target) doPass(payKey, target);
            else player.items.push(scalpelRef); // fallback
          }
        };
      };

      if (payOptions.length === 1) {
        promptTarget(payOptions[0].key);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Scalpel",
        title: "Scalpel — Choose what to discard to pass it",
        options: payOptions,
        resolve(payKey) {
          promptTarget(payKey);
        }
      };
    }
  },
  {
    name: "Cram Session",
    description: "Look at the top 3 map tiles from any one stack. Replace them in any order.",
    collection: { [Z5]: 3 },
    preview() {
      const stacks = buildMapStacks();
      if (stacks.length === 0) return "No map tiles remaining.";
      return stacks.map((s) => `${s.shortLabel}: ${s.deck.length} tile(s)`).join(" | ");
    },
    canPlay() {
      return buildMapStacks().length > 0;
    },
    apply(player) {
      const stacks = buildMapStacks();

      if (stacks.length === 0) {
        logLine(`${player.name} played Cram Session — no map tiles remaining.`);
        return;
      }

      const doReorder = (stack) => {
        const count = Math.min(3, stack.deck.length);
        const top = stack.deck.slice(0, count);
        logLine(`${player.name} played Cram Session — looking at top ${count} tile(s) of ${stack.label}: ${top.map((t) => t.name).join(", ")}.`);

        if (count === 1) {
          logLine(`Cram Session — only 1 tile; order unchanged.`);
          return;
        }

        const pickTop = (remaining, placed) => {
          if (remaining.length === 1) {
            placed.push(remaining[0]);
            placed.forEach((t, i) => { stack.deck[i] = t; });
            logLine(`Cram Session — new order: ${placed.map((t) => t.name).join(", ")}.`);
            return;
          }

          const position = placed.length + 1;
          const ordinal = position === 1 ? "1st (top)" : position === 2 ? "2nd" : `${position}th`;
          state.pendingEventChoice = {
            playerId: player.id,
            cardName: "Cram Session",
            title: `Cram Session — Choose tile to place ${ordinal}`,
            options: remaining.map((t, i) => ({ key: String(i), label: t.name })),
            resolve(chosenKey) {
              const idx = Number(chosenKey);
              const chosen = remaining[idx];
              const nextRemaining = remaining.filter((_, i) => i !== idx);
              placed.push(chosen);
              pickTop(nextRemaining, placed);
            }
          };
        };

        pickTop(top, []);
      };

      if (stacks.length === 1) {
        doReorder(stacks[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Cram Session",
        title: "Cram Session — Choose a map deck stack",
        options: stacks.map((s) => ({ key: s.id, label: `${s.label} (${s.deck.length} tile(s))` })),
        resolve(chosenId) {
          const stack = stacks.find((s) => s.id === chosenId);
          if (stack) doReorder(stack);
        }
      };
    }
  },
  {
    name: "Pool Cue",
    description: "Play in the Rec Hall. While in play, +1 to all combat rolls. Discarded if you spend any life or bullet tokens during combat.",
    collection: { [Z5]: 2 },
    isItem: true,
    isWeapon: true,
    requiresTile: "Rec Hall",
    preview(player) {
      const hasIt = (player.items || []).some((c) => c.name === "Pool Cue");
      if (hasIt) return "+1 combat — breaks if you spend life or bullets.";
      const tile = getTileAtSpace(player.x, player.y);
      if (!tile || tile.name !== "Rec Hall") return "Must be in the Rec Hall to play.";
      return "+1 to all combat rolls while in play.";
    },
    apply(player) {
      logLine(`${player.name} placed the Pool Cue in front of them — +1 to all combat rolls while in play.`);
    }
  },
  {
    name: "Bat",
    description: "Play on any Z5 map tile. While in play, +2 to all combat rolls. Discarded if you spend any life or bullet tokens during combat.",
    collection: { [Z5]: 2 },
    isItem: true,
    isWeapon: true,
    preview(player) {
      const hasIt = (player.items || []).some((c) => c.name === "Bat");
      if (hasIt) return "+2 combat — breaks if you spend life or bullet tokens.";
      if (!isOnZ5Tile(player)) return "Must be on a Z5 tile to play.";
      return "+2 to all combat rolls while in play.";
    },
    canPlay() {
      return isOnZ5Tile(currentPlayer());
    },
    apply(player) {
      logLine(`${player.name} placed the Bat in front of them — +2 to all combat rolls while in play.`);
    }
  },
  {
    name: "I've got a bike!",
    description: "Play on any Z5 map tile. While in play, +2 to all movement die rolls. Discarded when you enter any building.",
    collection: { [Z5]: 2 },
    isItem: true,
    preview(player) {
      if (!isOnZ5Tile(player)) return "Must be on a Z5 tile to play.";
      return `+2 movement while on non-building tiles. Current move bonus: +${(player.movementBonus || 0) + 2}.`;
    },
    canPlay() {
      return isOnZ5Tile(currentPlayer());
    },
    apply(player) {
      player.hasBike = true;
      player.movementBonus = (player.movementBonus || 0) + 2;
      logLine(`${player.name} placed I've got a bike! — +2 to all movement rolls while in play.`);
    }
  },
  {
    name: "Go Team Go!!!",
    description: "Target player bypasses all combat on their current tile for 1 turn.",
    collection: { [Z5]: 2 },
    preview() {
      return state.players.map((p) => {
        const tile = getTileAtSpace(p.x, p.y);
        const tileName = getTileDisplayName(tile) || "?";
        const tileKey = key(spaceToTileCoord(p.x), spaceToTileCoord(p.y));
        const hasZombies = [...state.zombies.keys()].some((zk) => {
          const [zx, zy] = zk.split(",").map(Number);
          return key(spaceToTileCoord(zx), spaceToTileCoord(zy)) === tileKey;
        });
        return `${p.name}: ${tileName}${hasZombies ? " (zombies)" : ""}`;
      }).join(" | ");
    },
    apply(player) {
      const doApply = (target) => {
        const tx = spaceToTileCoord(target.x);
        const ty = spaceToTileCoord(target.y);
        target.noCombatTileKey = key(tx, ty);
        const tileName = getTileDisplayName(getTileAtSpace(target.x, target.y)) || `[${tx}, ${ty}]`;
        logLine(`${player.name} played Go Team Go!!! on ${target.name} — combat bypassed on ${tileName} for this turn.`);
        autoSkipCombatIfClear();
      };

      if (state.players.length === 1) {
        doApply(state.players[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Go Team Go!!!",
        title: "Go Team Go!!! — Choose a target player",
        options: playerOpts(state.players),
        resolve(optKey) {
          const target = playerFromOpt(optKey);
          if (target) doApply(target);
        }
      };
    }
  },
  {
    name: "Sedatives",
    description: "Target player may take 1 guts token from any other player.",
    collection: { [Z5]: 2 },
    preview() {
      if (!state.useGuts) return "Guts variant not active.";
      return state.players.map((p) => `${p.name}: ${p.guts ?? 0} guts`).join(" | ");
    },
    canPlay() {
      if (!state.useGuts) return false;
      return state.players.some((p) => p.guts > 0);
    },
    apply(player) {
      const doTake = (target) => {
        const donors = state.players.filter((p) => p.id !== target.id && p.guts > 0);
        if (donors.length === 0) {
          logLine(`Sedatives — no players with guts tokens for ${target.name} to take from.`);
          return;
        }

        const takeFrom = (donor) => {
          donor.guts -= 1;
          target.guts = Math.min(MAX_GUTS, target.guts + 1);
          logLine(`${target.name} took 1 guts token from ${donor.name} (Sedatives) — ${target.name}: ${target.guts}, ${donor.name}: ${donor.guts}.`);
        };

        if (donors.length === 1) {
          takeFrom(donors[0]);
          return;
        }

        state.pendingEventChoice = {
          playerId: target.id,
          cardName: "Sedatives",
          title: `Sedatives — ${target.name}: choose a player to take a guts token from`,
          options: playerOpts(donors, (p) => `${p.name} (${p.guts} guts)`),
          resolve(optKey) {
            const donor = playerFromOpt(optKey);
            if (donor) takeFrom(donor);
          }
        };
      };

      if (state.players.length === 1) {
        doTake(state.players[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Sedatives",
        title: "Sedatives — Choose a target player",
        options: playerOpts(state.players),
        resolve(optKey) {
          const target = playerFromOpt(optKey);
          if (target) doTake(target);
        }
      };
    }
  },
  {
    name: "Electro-Shock Therapy",
    description: "Target player gets 3 guts tokens.",
    collection: { [Z5]: 2 },
    preview() {
      if (!state.useGuts) return "Guts variant not active.";
      return state.players.map((p) => {
        const after = Math.min(MAX_GUTS, (p.guts ?? 0) + 3);
        return `${p.name}: ${p.guts ?? 0} → ${after}`;
      }).join(" | ");
    },
    canPlay() {
      return state.useGuts && state.players.some((p) => p.guts != null && p.guts < MAX_GUTS);
    },
    apply(player) {
      const doGive = (target) => {
        const before = target.guts;
        target.guts = Math.min(MAX_GUTS, target.guts + 3);
        logLine(`${player.name} played Electro-Shock Therapy on ${target.name} — guts: ${before} → ${target.guts}.`);
      };

      if (state.players.length === 1) {
        doGive(state.players[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Electro-Shock Therapy",
        title: "Electro-Shock Therapy — Choose a target player",
        options: playerOpts(state.players, (p) => `${p.name} (${p.guts ?? 0} guts)`),
        resolve(optKey) {
          const target = playerFromOpt(optKey);
          if (target) doGive(target);
        }
      };
    }
  },
  {
    name: "Straight Jacket",
    description: "Target player loses all their guts tokens.",
    collection: { [Z5]: 2 },
    preview() {
      if (!state.useGuts) return "Guts variant not active.";
      const targets = state.players.filter((p) => p.guts > 0);
      if (targets.length === 0) return "No players have guts tokens.";
      return targets.map((p) => `${p.name}: ${p.guts} guts`).join(" | ");
    },
    canPlay() {
      return state.useGuts && state.players.some((p) => p.guts != null && p.guts > 0);
    },
    apply(player) {
      const doStrip = (target) => {
        const lost = target.guts;
        target.guts = 0;
        logLine(`${player.name} played Straight Jacket on ${target.name} — lost ${lost} guts token(s).`);
      };

      const targets = state.players.filter((p) => p.guts != null && p.guts > 0);
      if (targets.length === 0) {
        logLine(`${player.name} played Straight Jacket — no valid target with guts tokens.`);
        return;
      }

      if (targets.length === 1) {
        doStrip(targets[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Straight Jacket",
        title: "Straight Jacket — Choose a target player",
        options: playerOpts(targets, (p) => `${p.name} (${p.guts} guts)`),
        resolve(optKey) {
          const target = playerFromOpt(optKey);
          if (target) doStrip(target);
        }
      };
    }
  },
  {
    name: "Shots",
    description: "All players gain 1 guts token.",
    collection: { [Z5]: 2 },
    preview() {
      if (!state.useGuts) return "Guts variant not active.";
      return state.players.map((p) => {
        const gain = p.guts < MAX_GUTS ? "+1" : "at max";
        return `${p.name}: ${p.guts} → ${gain}`;
      }).join(" | ");
    },
    canPlay() {
      return state.useGuts && state.players.some((p) => p.guts != null && p.guts < MAX_GUTS);
    },
    apply(player) {
      const results = [];
      state.players.forEach((p) => {
        if (p.guts != null && p.guts < MAX_GUTS) {
          p.guts += 1;
          results.push(`${p.name}: ${p.guts}`);
        }
      });
      logLine(`${player.name} played Shots! — all players gain 1 guts token. ${results.join(", ")}.`);
    }
  },
  {
    name: "Pillow Fight",
    description: "All bullet tokens are worth half their normal value (2 bullets = +1). Discarded at the end of your next turn.",
    collection: { [Z5]: 2 },
    preview() {
      if (state.pillowFightCount > 0) return "Already active.";
      return null;
    },
    apply(player) {
      state.pillowFightCount = state.players.length + 1;
      logLine(`${player.name} played Pillow Fight — bullets worth half value (2 = +1) for ${state.pillowFightCount} turn(s).`);
    }
  },
  {
    name: "Student Loan",
    description: "Borrow 1 item currently in play from any player. Use it if possible this turn, then it returns to its owner at the end of your turn.",
    collection: { [Z5]: 2 },
    preview() {
      const allItems = [];
      for (const p of state.players) {
        for (const item of (p.items || [])) {
          allItems.push(`${item.name} (${p.name})`);
        }
      }
      return allItems.length > 0 ? allItems.join(", ") : "No items in play.";
    },
    canPlay() {
      return state.players.some((p) => (p.items || []).length > 0);
    },
    apply(player) {
      const available = [];
      for (const p of state.players) {
        for (const item of (p.items || [])) {
          available.push({ item, owner: p });
        }
      }

      if (available.length === 0) {
        logLine(`${player.name} played Student Loan — no items in play to borrow.`);
        return;
      }

      const doBorrow = ({ item, owner }) => {
        const idx = owner.items.indexOf(item);
        if (idx < 0) return;
        owner.items.splice(idx, 1);
        player.items.push(item);
        if (!player.studentLoanReturn) player.studentLoanReturn = [];
        player.studentLoanReturn.push({ card: item, fromPlayerId: owner.id });
        const fromLabel = owner.id === player.id ? "their own" : `${owner.name}'s`;
        logLine(`${player.name} borrowed ${fromLabel} ${item.name} (Student Loan) — returns at end of turn.`);
      };

      if (available.length === 1) {
        doBorrow(available[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Student Loan",
        title: "Student Loan — Choose an item to borrow",
        options: available.map((a, i) => ({
          key: String(i),
          label: `${a.item.name} (${a.owner.id === player.id ? "yours" : a.owner.name})`
        })),
        resolve(chosenKey) {
          const chosen = available[Number(chosenKey)];
          if (chosen) doBorrow(chosen);
        }
      };
    }
  },
  {
    name: "Where's the 'Admin Bldg.?'",
    description: "Target player must use all movement to move toward the Admin Bldg. If the Admin Bldg. is not in play, target must move toward Town Square instead.",
    collection: { [Z5]: 2 },
    preview() {
      const target = findAdminBldgTarget({ tileName: TILE_NAME.ADMIN_BLDG, fallbackTileName: TILE_NAME.TOWN_SQUARE });
      return state.players.map((p) => {
        const dist = Math.abs(p.x - target.cx) + Math.abs(p.y - target.cy);
        return `${p.name}: ${dist} space(s) from ${target.name}`;
      }).join(" | ");
    },
    apply(player) {
      const setFlag = (target) => {
        target.mustMoveTowardTile = { tileName: TILE_NAME.ADMIN_BLDG, fallbackTileName: TILE_NAME.TOWN_SQUARE };
        const adminTarget = findAdminBldgTarget(target.mustMoveTowardTile);
        logLine(`${player.name} played Where's the 'Admin Bldg.?' on ${target.name} — ${target.name} must use all movement toward ${adminTarget.name}.`);
      };

      if (state.players.length === 1) {
        setFlag(state.players[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Where's the 'Admin Bldg.?'",
        title: "Where's the 'Admin Bldg.?' — Choose a target player",
        options: playerOpts(state.players),
        resolve(optKey) {
          const target = playerFromOpt(optKey);
          if (target) setFlag(target);
        }
      };
    }
  },
  {
    name: "Valedictorian",
    description: "Play when drawing a map tile. Look at the top 3 tiles of that stack, choose one to draw and place as normal. Return the other 2 in any order.",
    collection: { [Z5]: 3 },
    preview() {
      const stacks = buildMapStacks(true);
      if (stacks.length === 0) return "No map tiles remaining.";
      return stacks.map((s) => `${s.shortLabel}: ${s.deck.length} tile(s)`).join(" | ");
    },
    canPlay() {
      return state.step === STEP.DRAW_TILE && buildMapStacks(true).length > 0;
    },
    apply(player) {
      const stacks = buildMapStacks(true);

      if (stacks.length === 0) {
        logLine(`${player.name} played Valedictorian — no map tiles remaining.`);
        return;
      }

      const doPeek = (stack) => {
        const count = Math.min(3, stack.deck.length);
        const top = stack.deck.slice(0, count);
        logLine(`${player.name} played Valedictorian — top ${count} tile(s) of ${stack.label}: ${top.map((t) => t.name).join(", ")}.`);

        const finalize = (chosen, orderedOthers) => {
          // Remove the peeked tiles, rebuild deck front with chosen first
          stack.deck.splice(0, count);
          for (let i = orderedOthers.length - 1; i >= 0; i--) {
            stack.deck.unshift(orderedOthers[i]);
          }
          stack.deck.unshift(chosen);
          if (orderedOthers.length > 0) {
            logLine(`Valedictorian — returning ${orderedOthers.map((t) => t.name).join(", ")} to the stack.`);
          }
          drawAndPlaceTile(stack.id);
        };

        // With only 1 tile, just draw it
        if (count === 1) {
          finalize(top[0], []);
          return;
        }

        // Choose which tile to draw
        state.pendingEventChoice = {
          playerId: player.id,
          cardName: "Valedictorian",
          title: "Valedictorian — Choose a tile to draw",
          options: top.map((t, i) => ({ key: String(i), label: t.name })),
          resolve(chosenKey) {
            const chosenIdx = Number(chosenKey);
            const chosen = top[chosenIdx];
            const others = top.filter((_, i) => i !== chosenIdx);

            // With only 1 other tile, no ordering choice needed
            if (others.length === 1) {
              finalize(chosen, others);
              return;
            }

            // 2 others — ask which goes on top of the stack
            state.pendingEventChoice = {
              playerId: player.id,
              cardName: "Valedictorian",
              title: "Valedictorian — Choose which tile goes on top of the stack",
              options: others.map((t, i) => ({ key: String(i), label: t.name })),
              resolve(topKey) {
                const topIdx = Number(topKey);
                const orderedOthers = [others[topIdx], others[1 - topIdx]];
                finalize(chosen, orderedOthers);
              }
            };
          }
        };
      };

      if (stacks.length === 1) {
        doPeek(stacks[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Valedictorian",
        title: "Valedictorian — Choose a map deck stack",
        options: stacks.map((s) => ({ key: s.id, label: `${s.label} (${s.deck.length} tile(s))` })),
        resolve(chosenId) {
          const stack = stacks.find((s) => s.id === chosenId);
          if (stack) doPeek(stack);
        }
      };
    }
  }
);
