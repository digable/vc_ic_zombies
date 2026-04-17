// ---------------------------------------------------------------------------
// Iowa City player event cards — appended to playerEventCards
// ---------------------------------------------------------------------------
// Appended to playerEventCards after player-cards.js loads.
// See player-cards.js header for full card property reference.
// ---------------------------------------------------------------------------

// File-local shorthand — avoids repeating the full collection key on every card.
const IC = COLLECTIONS.IOWA_CITY;

playerEventCards.push(
  {
    name: "Pie & Coffee",
    description: "Recover 2 life tokens. Must be at the Hamburg Inn.",
    collection: { [IC]: 2 },
    canPlay() {
      const tile = getTileAtSpace(currentPlayer().x, currentPlayer().y);
      return !!(tile && tile.name === "Hamburg Inn");
    },
    apply(player) {
      const gained = Math.min(2, MAX_HEARTS - player.hearts);
      player.hearts = Math.min(player.hearts + 2, MAX_HEARTS);
      logLine(`${player.name} played Pie & Coffee — recovered ${gained} life token(s) (now ${player.hearts}).`);
    }
  },

  {
    name: "Page Turner",
    description: "Draw 2 event cards. You must immediately discard 1 of them. Must be at Prairie Lights.",
    collection: { [IC]: 2 },
    canPlay() {
      const tile = getTileAtSpace(currentPlayer().x, currentPlayer().y);
      return !!(tile && tile.name === "Prairie Lights");
    },
    apply(player) {
      const drawn = [];
      for (let i = 0; i < 2; i++) {
        if (state.eventDeck.length === 0) {
          if (state.eventDiscardPile.length === 0) break;
          reshuffleEventDeckIfEmpty();
        }
        drawn.push(state.eventDeck.shift());
      }

      if (drawn.length === 0) {
        logLine(`${player.name} played Page Turner — no cards left to draw.`);
        return;
      }

      drawn.forEach((c) => player.hand.push(c));

      if (drawn.length === 1) {
        logLine(`${player.name} played Page Turner — drew ${drawn[0].name} (only 1 card available, keeping it).`);
        return;
      }

      logLine(`${player.name} played Page Turner — drew ${drawn.map((c) => c.name).join(" and ")}. Must discard 1.`);

      const handLen = player.hand.length;
      const idx1 = handLen - 2;
      const idx2 = handLen - 1;

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Page Turner",
        title: "Page Turner — discard 1 of the 2 drawn cards",
        options: [
          { key: String(idx1), label: drawn[0].name },
          { key: String(idx2), label: drawn[1].name },
        ],
        resolve(chosenKey) {
          const idx = Number(chosenKey);
          const discarded = player.hand.splice(idx, 1)[0];
          state.eventDiscardPile.push(discarded);
          logLine(`${player.name} discarded ${discarded.name} (Page Turner).`);
        }
      };
    }
  },

  {
    name: "Bar Crawl",
    description: "Roll a d6 during your move step. On 4–6: move to any named tile immediately and end movement. On 1–3: same, but lose 1 life token — you stumbled getting there.",
    collection: { [IC]: 2 },
    canPlay() {
      return state.step === STEP.MOVE;
    },
    apply(player) {
      const namedTiles = [];
      state.board.forEach((tile, tk) => {
        if (tile.type === TILE_TYPE.NAMED) namedTiles.push({ tk, tile });
      });
      if (namedTiles.length === 0) {
        logLine(`${player.name} played Bar Crawl — no named tiles on the board.`);
        return;
      }

      const roll = rollD6();
      const stumbled = roll <= 3;
      logLine(`${player.name} played Bar Crawl — rolled ${roll}.${stumbled ? " Stumbled!" : ""}`);

      const teleport = (tk) => {
        const { x: tx, y: ty } = parseKey(tk);
        const dest = state.board.get(tk);
        player.x = tx * TILE_DIM + 1;
        player.y = ty * TILE_DIM + 1;
        if (stumbled) {
          damagePlayer(player, 1, { endStep: false });
          logLine(`${player.name} stumbled to ${dest.name} — lost 1 life.`);
        } else {
          logLine(`${player.name} moved to ${dest.name}.`);
        }
        if (!state.gameOver) {
          state.movesRemaining = 0;
          moveToZombiePhase();
        }
      };

      if (namedTiles.length === 1) {
        teleport(namedTiles[0].tk);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Bar Crawl",
        title: `Bar Crawl — choose a named tile${stumbled ? " (stumbled — lose 1 life)" : ""}`,
        options: namedTiles.map(({ tk, tile }) => ({ key: tk, label: tile.name })),
        resolve(chosenKey) { teleport(chosenKey); }
      };
    }
  },

  {
    name: "Fixed Gear",
    description: "Play during your move step. Gain +3 movement spaces this turn. Riding through a zombie space deals 1 damage to you instead of stopping to fight.",
    collection: { [IC]: 2 },
    canPlay() {
      return state.step === STEP.MOVE;
    },
    apply(player) {
      player.fixedGearActive = true;
      state.movesRemaining += 3;
      logLine(`${player.name} played Fixed Gear — +3 movement spaces. Riding through zombies deals 1 damage instead of triggering combat.`);
    }
  },

  {
    name: "Frisbee",
    description: "Kill 1 zombie on any space within 2 tiles of your position. No roll required.",
    collection: { [IC]: 2 },
    canPlay() {
      const p = currentPlayer();
      const ptx = spaceToTileCoord(p.x);
      const pty = spaceToTileCoord(p.y);
      return [...state.zombies.keys()].some((zk) => {
        const [zx, zy] = zk.split(",").map(Number);
        return Math.abs(spaceToTileCoord(zx) - ptx) + Math.abs(spaceToTileCoord(zy) - pty) <= 2;
      });
    },
    apply(player) {
      const ptx = spaceToTileCoord(player.x);
      const pty = spaceToTileCoord(player.y);
      const validSpaces = new Set(
        [...state.zombies.keys()].filter((zk) => {
          const [zx, zy] = zk.split(",").map(Number);
          return Math.abs(spaceToTileCoord(zx) - ptx) + Math.abs(spaceToTileCoord(zy) - pty) <= 2;
        })
      );
      if (validSpaces.size === 0) {
        logLine(`${player.name} played Frisbee — no zombies within range.`);
        return;
      }
      state.pendingFrisbeeTarget = { playerId: player.id, validSpaces };
      logLine(`${player.name} played Frisbee — click a highlighted zombie to take it out!`);
    }
  },

  {
    name: "Game Day",
    description: "Play when on Kinnick Stadium. All players gain 1 bullet. Then 1 zombie per player spawns on Kinnick Stadium.",
    collection: { [IC]: 2 },
    canPlay() {
      const tile = getTileAtSpace(currentPlayer().x, currentPlayer().y);
      return !!(tile && tile.name === "Kinnick Stadium");
    },
    apply(player) {
      let kinnickKey = null;
      state.board.forEach((tile, tk) => {
        if (tile.name === "Kinnick Stadium") kinnickKey = tk;
      });

      const playerCount = state.players.length;
      state.players.forEach((p) => { p.bullets += 1; });
      logLine(`${player.name} played Game Day — all ${playerCount} player(s) gain 1 bullet (tailgate!).`);

      if (kinnickKey) {
        const { x: tx, y: ty } = parseKey(kinnickKey);
        let spawned = 0;
        for (let i = 0; i < playerCount; i++) {
          if (spawnZombieOnTile(tx, ty, "Game Day")) spawned++;
        }
        logLine(spawned > 0
          ? `The noise drew ${spawned} zombie(s) to Kinnick Stadium!`
          : `Kinnick Stadium is packed — no room for more zombies.`);
      }
    }
  },

  {
    name: "Nothing But Net",
    description: "Spend 1 bullet to automatically kill 1 zombie on your current space — no roll needed.",
    collection: { [IC]: 2 },
    canPlay() {
      const p = currentPlayer();
      return p.bullets > 0 && state.zombies.has(key(p.x, p.y));
    },
    apply(player) {
      const spaceKey = key(player.x, player.y);
      if (!state.zombies.has(spaceKey) || player.bullets <= 0) {
        logLine(`${player.name} played Nothing But Net — no valid target or no bullets.`);
        return;
      }
      player.bullets -= 1;
      state.zombies.delete(spaceKey);
      player.kills += 1;
      state.recentKillKey = spaceKey;
      logLine(`${player.name} played Nothing But Net — spent 1 bullet, zombie down. Nothing but net!`, "kill");
      checkWin(player);
    }
  },

  {
    name: "Candlelight Vigil",
    description: "Roll a d6. On 1–2: spawn 1 zombie on Oakland Cemetery. On 3–6: remove up to 2 zombies from Oakland Cemetery.",
    collection: { [IC]: 2 },
    apply(player) {
      // Find the Oakland Cemetery tile on the board.
      let cemKey = null;
      state.board.forEach((tile, tk) => {
        if (tile.name === "Oakland Cemetery") cemKey = tk;
      });

      if (!cemKey) {
        logLine(`${player.name} played Candlelight Vigil — Oakland Cemetery is not on the board.`);
        return;
      }

      const roll = rollD6();
      const { x: tx, y: ty } = parseKey(cemKey);
      logLine(`${player.name} played Candlelight Vigil — rolled ${roll}.`);

      if (roll <= 2) {
        const spawned = spawnZombieOnTile(tx, ty, "Candlelight Vigil");
        logLine(spawned
          ? `A zombie rises at Oakland Cemetery!`
          : `A zombie would rise at Oakland Cemetery, but there's no room.`);
        return;
      }

      // Roll 3–6: remove up to 2 zombies from the Cemetery tile.
      let removed = 0;
      for (let lx = 0; lx < TILE_DIM && removed < 2; lx++) {
        for (let ly = 0; ly < TILE_DIM && removed < 2; ly++) {
          const sk = key(tx * TILE_DIM + lx, ty * TILE_DIM + ly);
          if (state.zombies.has(sk)) {
            state.zombies.delete(sk);
            player.kills += 1;
            removed += 1;
          }
        }
      }

      if (removed > 0) {
        logLine(`${player.name} removed ${removed} zombie(s) from Oakland Cemetery.`, "kill");
        checkWin(player);
      } else {
        logLine(`${player.name} played Candlelight Vigil — no zombies at Oakland Cemetery to remove.`);
      }
    }
  },

  {
    name: "Vintage Encyclopaedia",
    description: "Play at the Main Library to place in front of you. Discard during combat for +2 to your roll.",
    collection: { [IC]: 2 },
    isItem: true,
    isWeapon: true,
    combatWeapon: true,
    combatBoost: 2,
    requiresTile: "Main Library",
    apply(player) {
      logLine(`${player.name} picked up the Vintage Encyclopaedia from the Main Library.`);
    }
  },

  // ── Cigarettes ────────────────────────────────────────────────────────────

  {
    name: "Steady Your Nerves",
    description: "Lose 1 life token. Gain +2 to your next combat roll this turn.",
    collection: { [IC]: 2 },
    apply(player) {
      damagePlayer(player, 1, { endStep: false });
      if (!state.gameOver) {
        player.tempCombatBonus = (player.tempCombatBonus || 0) + 2;
        logLine(`${player.name} played Steady Your Nerves — lost 1 life, +2 to next combat roll.`);
      }
    }
  },

  {
    name: "Smoke Break",
    description: "Lose 1 life token. Draw 2 event cards, then immediately discard 1 of them.",
    collection: { [IC]: 2 },
    apply(player) {
      damagePlayer(player, 1, { endStep: false });
      if (state.gameOver) return;

      const drawn = [];
      for (let i = 0; i < 2; i++) {
        if (state.eventDeck.length === 0) {
          if (state.eventDiscardPile.length === 0) break;
          reshuffleEventDeckIfEmpty();
        }
        drawn.push(state.eventDeck.shift());
      }

      if (drawn.length === 0) {
        logLine(`${player.name} played Smoke Break — lost 1 life, no cards left to draw.`);
        return;
      }

      drawn.forEach((c) => player.hand.push(c));

      if (drawn.length === 1) {
        logLine(`${player.name} played Smoke Break — lost 1 life, drew ${drawn[0].name} (only 1 available, keeping it).`);
        return;
      }

      logLine(`${player.name} played Smoke Break — lost 1 life, drew ${drawn.map((c) => c.name).join(" and ")}. Must discard 1.`);

      const handLen = player.hand.length;
      const idx1 = handLen - 2;
      const idx2 = handLen - 1;
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Smoke Break",
        title: "Smoke Break — discard 1 of the 2 drawn cards",
        options: [
          { key: String(idx1), label: drawn[0].name },
          { key: String(idx2), label: drawn[1].name },
        ],
        resolve(chosenKey) {
          const idx = Number(chosenKey);
          const discarded = player.hand.splice(idx, 1)[0];
          state.eventDiscardPile.push(discarded);
          logLine(`${player.name} discarded ${discarded.name} (Smoke Break).`);
        }
      };
    }
  },

  {
    name: "Bum a Smoke",
    description: "Target another player. They lose 1 life token — you gain 1 bullet.",
    collection: { [IC]: 2 },
    canPlay() {
      return state.players.length > 1;
    },
    apply(player) {
      const others = state.players.filter((p) => p.id !== player.id);
      if (others.length === 0) {
        logLine(`${player.name} played Bum a Smoke — no other players to target.`);
        return;
      }
      if (others.length === 1) {
        const target = others[0];
        damagePlayer(target, 1, { endStep: false });
        player.bullets += 1;
        logLine(`${player.name} bummed a smoke from ${target.name} — ${target.name} lost 1 life, ${player.name} gained 1 bullet.`);
        return;
      }
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Bum a Smoke",
        title: "Bum a Smoke — choose a target",
        options: others.map((p) => ({ key: p.id, label: p.name })),
        resolve(chosenId) {
          const target = state.players.find((p) => p.id === chosenId);
          if (!target) return;
          damagePlayer(target, 1, { endStep: false });
          player.bullets += 1;
          logLine(`${player.name} bummed a smoke from ${target.name} — ${target.name} lost 1 life, ${player.name} gained 1 bullet.`);
        }
      };
    }
  },

  // ── Pass the Bong ─────────────────────────────────────────────────────────

  {
    name: "Pass It Around",
    description: "Each player draws 1 event card.",
    collection: { [IC]: 2 },
    apply(player) {
      const drew = [];
      state.players.forEach((p) => {
        if (state.eventDeck.length === 0) {
          if (state.eventDiscardPile.length === 0) return;
          reshuffleEventDeckIfEmpty();
        }
        if (state.eventDeck.length === 0) return;
        const card = state.eventDeck.shift();
        p.hand.push(card);
        drew.push(`${p.name} drew ${card.name}`);
      });
      if (drew.length === 0) {
        logLine(`${player.name} played Pass It Around — no cards left in the deck.`);
      } else {
        logLine(`${player.name} played Pass It Around — ${drew.join(", ")}.`);
      }
    }
  },

  {
    name: "Paranoia",
    description: "Roll a d6. On 4–6: all players draw 1 event card. On 1–3: all players draw 1 event card, then you must immediately discard 1.",
    collection: { [IC]: 2 },
    apply(player) {
      const roll = rollD6();
      const bad = roll <= 3;
      logLine(`${player.name} played Paranoia — rolled ${roll}.${bad ? " Paranoia sets in!" : ""}`);

      const drew = [];
      state.players.forEach((p) => {
        if (state.eventDeck.length === 0) {
          if (state.eventDiscardPile.length === 0) return;
          reshuffleEventDeckIfEmpty();
        }
        if (state.eventDeck.length === 0) return;
        const card = state.eventDeck.shift();
        p.hand.push(card);
        drew.push(p.name);
      });

      if (drew.length > 0) {
        logLine(`${drew.join(", ")} each drew 1 event card.`);
      }

      if (!bad || player.hand.length === 0) return;

      // Roll 1–3: current player must immediately discard 1 card.
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Paranoia",
        title: "Paranoia — discard 1 card from your hand",
        options: player.hand.map((c, i) => ({ key: String(i), label: c.name })),
        resolve(chosenKey) {
          const idx = Number(chosenKey);
          const discarded = player.hand.splice(idx, 1)[0];
          state.eventDiscardPile.push(discarded);
          logLine(`${player.name} discarded ${discarded.name} (Paranoia).`);
        }
      };
    }
  },

  {
    name: "Contact High",
    description: "Give 1 card from your hand to any player. They give 1 card back. Both of you gain 1 life token.",
    collection: { [IC]: 2 },
    canPlay() {
      return state.players.length > 1 && currentPlayer().hand.length >= 2;
    },
    apply(player) {
      const others = state.players.filter((p) => p.id !== player.id);
      if (others.length === 0 || player.hand.length === 0) {
        logLine(`${player.name} played Contact High — can't complete the exchange.`);
        return;
      }

      const doExchange = (target) => {
        // Step 1: current player picks which card to give.
        state.pendingEventChoice = {
          playerId: player.id,
          cardName: "Contact High",
          title: `Contact High — give 1 card to ${target.name}`,
          options: player.hand.map((c, i) => ({ key: String(i), label: c.name })),
          resolve(chosenKey) {
            const idx = Number(chosenKey);
            const given = player.hand.splice(idx, 1)[0];
            target.hand.push(given);
            logLine(`${player.name} gave ${given.name} to ${target.name}.`);

            // Step 2: target picks which card to give back.
            if (target.hand.length === 0) {
              player.hearts = Math.min(player.hearts + 1, MAX_HEARTS);
              target.hearts = Math.min(target.hearts + 1, MAX_HEARTS);
              logLine(`${target.name} had no cards to give back. Both players gain 1 life.`);
              return;
            }
            state.pendingEventChoice = {
              playerId: target.id,
              cardName: "Contact High",
              title: `Contact High — give 1 card back to ${player.name}`,
              options: target.hand.map((c, i) => ({ key: String(i), label: c.name })),
              resolve(returnKey) {
                const retIdx = Number(returnKey);
                const returned = target.hand.splice(retIdx, 1)[0];
                player.hand.push(returned);
                logLine(`${target.name} gave ${returned.name} back to ${player.name}.`);
                player.hearts = Math.min(player.hearts + 1, MAX_HEARTS);
                target.hearts = Math.min(target.hearts + 1, MAX_HEARTS);
                logLine(`${player.name} and ${target.name} each gain 1 life (Contact High).`);
              }
            };
          }
        };
      };

      if (others.length === 1) {
        doExchange(others[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Contact High",
        title: "Contact High — choose a player to exchange with",
        options: others.map((p) => ({ key: p.id, label: p.name })),
        resolve(chosenId) {
          const target = state.players.find((p) => p.id === chosenId);
          if (target) doExchange(target);
        }
      };
    }
  },

  {
    name: "Mellow Out",
    description: "Roll a d6. On 2–6: all zombies skip their next movement phase. On 1: it backfires — 1 zombie spawns on each player's tile.",
    collection: { [IC]: 2 },
    apply(player) {
      const roll = rollD6();
      logLine(`${player.name} played Mellow Out — rolled ${roll}.`);

      if (roll === 1) {
        let spawned = 0;
        state.players.forEach((p) => {
          const tx = spaceToTileCoord(p.x);
          const ty = spaceToTileCoord(p.y);
          if (spawnZombieOnTile(tx, ty, "Mellow Out")) spawned++;
        });
        logLine(`Mellow Out backfired! ${spawned} zombie(s) drawn in by the noise.`);
        return;
      }

      state.zombieMoveFreezeCount = (state.zombieMoveFreezeCount || 0) + state.players.length;
      logLine(`Mellow Out — zombie movement frozen for the next ${state.players.length} phase(s).`);
    }
  }
);
