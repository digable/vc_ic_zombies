// ---------------------------------------------------------------------------
// Z3.5 — Not Dead Yet! player event cards
// Appended to playerEventCards after player-cards.js loads.
// ---------------------------------------------------------------------------

playerEventCards.push(
  {
    name: "There You Are!",
    description: "Move your player to the same space as the nearest opponent. Your choice if two or more are equidistant.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    canPlay() {
      return state.players.length > 1;
    },
    apply(player) {
      const others = state.players.filter((p) => p.id !== player.id);
      if (others.length === 0) {
        logLine(`${player.name} played There You Are! — no opponents.`);
        return;
      }
      let minDist = Infinity;
      others.forEach((p) => {
        const d = manhattanDist(player.x, player.y, p.x, p.y);
        if (d < minDist) minDist = d;
      });
      const nearest = others.filter((p) => manhattanDist(player.x, player.y, p.x, p.y) === minDist);
      const moveTo = (target) => {
        player.x = target.x;
        player.y = target.y;
        logLine(`${player.name} played There You Are! — moved to ${target.name}'s space [${target.x}, ${target.y}].`);
        const sk = playerKey(player);
        if (state.zombies.has(sk) && !player.noCombatThisTurn) {
          resolveCombatForPlayer(player, { advanceStepWhenClear: false, endStepOnKnockout: true });
        }
      };
      if (nearest.length === 1) {
        moveTo(nearest[0]);
        return;
      }
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "There You Are!",
        options: nearest.map((p) => ({ key: String(p.id), label: p.name })),
        resolve(optKey) {
          const target = state.players.find((p) => String(p.id) === optKey);
          if (target) moveTo(target);
        }
      };
      logLine(`${player.name} played There You Are! — choose which nearest opponent to join.`);
    }
  },
  {
    name: "Power Outage",
    description: "No player may pick up tokens until the end of your next turn.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    apply(player) {
      state.tokenPickupFrozenCount = state.players.length + 1;
      logLine(`${player.name} played Power Outage — token pickup disabled for ${state.players.length + 1} turn(s).`);
    }
  },
  {
    name: "Machete",
    description: "Play in the Outfitter, Barracks, or Lawn & Garden Store to place in front of you. While in play, +1 to all combat rolls. Counts as a weapon.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    isItem: true,
    isWeapon: true,
    requiresTile: ["Outfitter", "Barracks", "Lawn & Garden Store"],
    apply(player) {
      logLine(`${player.name} placed Machete in front of them — +1 to all combat rolls while in play.`);
    }
  },
  {
    name: "Oooooh, what luck!",
    description: "Play when in a building or store. Immediately play any weapon from your hand and place it in front of you as if you just found it.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    canPlay() {
      return isOnBuildingOrStoreTile() &&
             currentPlayer().hand.some((c) => c.isWeapon && c.isItem);
    },
    apply(player) {
      const weaponOptions = player.hand
        .map((c, i) => ({ card: c, i }))
        .filter(({ card }) => card.isWeapon && card.isItem);
      if (weaponOptions.length === 0) {
        logLine(`${player.name} played Oooooh, what luck! — no weapon items in hand.`);
        return;
      }
      const placeWeapon = (idx) => {
        const [card] = player.hand.splice(idx, 1);
        if ((player.items || []).some((c) => c.name === card.name)) {
          logLine(`${player.name} already has ${card.name} in play — Oooooh, what luck! could not place it.`);
          player.hand.splice(idx, 0, card);
          return;
        }
        if (!player.items) player.items = [];
        player.items.push(card);
        if (card.apply) card.apply(player, buildEventDeckHelpers());
        logLine(`${player.name} played Oooooh, what luck! — placed ${card.name} in front of them.`);
      };
      if (weaponOptions.length === 1) {
        placeWeapon(weaponOptions[0].i);
        return;
      }
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Oooooh, what luck!",
        options: weaponOptions.map(({ card, i }) => ({ key: String(i), label: card.name })),
        resolve(optKey) {
          placeWeapon(Number(optKey));
        }
      };
      logLine(`${player.name} played Oooooh, what luck! — choose which weapon to place.`);
    }
  },
  {
    name: "No Guts, No Glory",
    description: "Until the end of your next turn, no player may spend bullets in zombie combat.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    apply(player) {
      state.bulletsCombatFrozenCount = state.players.length + 1;
      logLine(`${player.name} played No Guts, No Glory — bullet spending in combat disabled for ${state.players.length + 1} turn(s).`);
    }
  },
  {
    name: "That's Not So Scary",
    description: "Play during your turn if you have exactly 1 life and 1 bullet. Take an extra turn immediately after this one.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    canPlay() {
      const cp = currentPlayer();
      return cp.hearts === 1 && cp.bullets === 1;
    },
    apply(player) {
      player.extraTurnPending = true;
      logLine(`${player.name} played That's Not So Scary — will take an extra turn after this one.`);
    }
  },
  {
    name: "Why don't we go some place more private?",
    description: "Play when sharing a space with another player. Both move as one for the rest of this movement phase.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    canPlay() {
      const cp = currentPlayer();
      return (state.step === STEP.MOVE || state.step === STEP.ROLL_MOVE) &&
             state.players.some((p) => p.id !== cp.id && p.x === cp.x && p.y === cp.y);
    },
    apply(player) {
      const companion = state.players.find((p) => p.id !== player.id && p.x === player.x && p.y === player.y);
      if (!companion) {
        logLine(`${player.name} played Why don't we go some place more private? — no companion at same space.`);
        return;
      }
      player.movingTogether = { withPlayerId: companion.id };
      logLine(`${player.name} played Why don't we go some place more private? — ${companion.name} will follow ${player.name} for the rest of this movement phase.`);
    }
  },
  {
    name: "It's hard being you",
    description: "Play after an opponent has just been knocked out. Take one weapon or item in play from them before it is discarded.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    canPlay() {
      const cp = currentPlayer();
      return state.players.some((p) => p.knockedOut && p.id !== cp.id && (p.items?.length ?? 0) > 0);
    },
    apply(player) {
      const targets = state.players.filter((p) => p.knockedOut && p.id !== player.id && (p.items?.length ?? 0) > 0);
      const steal = (target) => {
        if (target.items.length === 1) {
          const [taken] = target.items.splice(0, 1);
          player.items.push(taken);
          logLine(`${player.name} played It's hard being you — took ${taken.name} from ${target.name}.`);
          return;
        }
        state.pendingEventChoice = {
          playerId: player.id,
          cardName: "It's hard being you",
          options: target.items.map((item, i) => ({ key: String(i), label: item.name })),
          resolve(optKey) {
            const idx = Number(optKey);
            const taken = target.items.splice(idx, 1)[0];
            if (taken) {
              player.items.push(taken);
              logLine(`${player.name} took ${taken.name} from ${target.name} (It's hard being you).`);
            }
          }
        };
        logLine(`${player.name} played It's hard being you on ${target.name} — choose an item to take.`);
      };
      if (targets.length === 1) {
        steal(targets[0]);
        return;
      }
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "It's hard being you",
        options: targets.map((p) => ({ key: String(p.id), label: p.name })),
        resolve(optKey) {
          const target = state.players.find((p) => String(p.id) === optKey);
          if (target) steal(target);
        }
      };
      logLine(`${player.name} played It's hard being you — choose a knocked-out opponent.`);
    }
  },
  {
    name: "What could possibly be behind that door?",
    description: "Play when entering a building or store. Roll: 4–6 removes all zombies (not kills); 1–3 fills all empty legal spaces with zombies.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    canPlay: isOnBuildingOrStoreTile,
    apply(player) {
      const tx = spaceToTileCoord(player.x);
      const ty = spaceToTileCoord(player.y);
      const tile = state.board.get(key(tx, ty));
      if (!tile?.subTiles) {
        logLine(`${player.name} played What could possibly be behind that door? — no subtile data.`);
        return;
      }
      const roll = rollD6();
      const BLDG = new Set(["building", "mall store"]);
      logLine(`${player.name} played What could possibly be behind that door? — rolled ${roll}.`);
      if (roll >= 4) {
        let removed = 0;
        forEachTileSpace(tx, ty, (lx, ly, sk) => {
          const sub = tile.subTiles[key(lx, ly)];
          if (!sub || !BLDG.has(sub.type)) return;
          if (state.zombies.has(sk)) { state.zombies.delete(sk); removed += 1; }
        });
        logLine(`Success! Cleared ${removed} zombie(s) from the building — not counted as kills.`);
      } else {
        let placed = 0;
        forEachTileSpace(tx, ty, (lx, ly, sk) => {
          const sub = tile.subTiles[key(lx, ly)];
          if (!sub || !BLDG.has(sub.type)) return;
          if (!isLocalWalkable(tile, lx, ly)) return;
          if (state.zombies.has(sk)) return;
          state.zombies.set(sk, { type: ZOMBIE_TYPE.REGULAR });
          placed += 1;
        });
        logLine(`Something lurks within! Placed ${placed} zombie(s) in the building/store.`);
      }
    }
  },
  {
    name: "Where is that music coming from?",
    description: "Play on your turn to shield yourself. The next event card played directly against you is automatically countered and discarded. Normal card rules apply.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    apply(player) {
      player.musicShieldActive = true;
      logLine(`${player.name} played Where is that music coming from? — shielded against the next opponent card targeting them.`);
    }
  },
  {
    name: "My, you look familiar.",
    description: "Look at the top 3 cards of the event deck. Discard 1, place 1 on the bottom, and replace 1 on top.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    canPlay() {
      return state.eventDeck.length > 0 || state.eventDiscardPile.length > 0;
    },
    apply(player) {
      if (state.eventDeck.length === 0) reshuffleEventDeckIfEmpty();
      const topThree = state.eventDeck.slice(0, Math.min(3, state.eventDeck.length));
      if (topThree.length === 0) {
        logLine(`${player.name} played My, you look familiar. — no cards to look at.`);
        return;
      }
      logLine(`${player.name} played My, you look familiar. — top ${topThree.length} card(s): ${topThree.map((c) => c.name).join(", ")}.`);
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "My, you look familiar.",
        title: "My, you look familiar. — Choose a card to DISCARD",
        options: topThree.map((c, i) => ({ key: String(i), label: c.name })),
        resolve(discardKey) {
          const discardIdx = Number(discardKey);
          const discarded = topThree[discardIdx];
          const di = state.eventDeck.indexOf(discarded);
          if (di >= 0) state.eventDeck.splice(di, 1);
          state.eventDiscardPile.push(discarded);
          logLine(`My, you look familiar. — discarded ${discarded.name}.`);
          const remaining = topThree.filter((_, i) => i !== discardIdx);
          if (remaining.length <= 1) {
            if (remaining.length === 1) {
              const ri = state.eventDeck.indexOf(remaining[0]);
              if (ri >= 0) state.eventDeck.splice(ri, 1);
              state.eventDeck.unshift(remaining[0]);
              logLine(`My, you look familiar. — ${remaining[0].name} placed on top.`);
            }
            return;
          }
          state.pendingEventChoice = {
            playerId: player.id,
            cardName: "My, you look familiar.",
            title: "My, you look familiar. — Choose a card to place on the BOTTOM",
            options: remaining.map((c, i) => ({ key: String(i), label: c.name })),
            resolve(bottomKey) {
              const bottomIdx = Number(bottomKey);
              const bottomCard = remaining[bottomIdx];
              const topCard = remaining[1 - bottomIdx];
              [bottomCard, topCard].forEach((c) => {
                const ri = state.eventDeck.indexOf(c);
                if (ri >= 0) state.eventDeck.splice(ri, 1);
              });
              state.eventDeck.push(bottomCard);
              state.eventDeck.unshift(topCard);
              logLine(`My, you look familiar. — ${topCard.name} on top, ${bottomCard.name} on bottom.`);
            }
          };
        }
      };
    }
  },
  {
    name: "Hey, I got one of those",
    description: "Play when another player plays a weapon/item card. Gain the same effect: if an item, it is placed in front of you; if a direct weapon, you gain its effect immediately.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    isWeapon: true,
    canPlay() {
      return state.lastPlayedWeaponName !== null &&
             state.lastPlayedWeaponByPlayerId !== currentPlayer().id;
    },
    apply(player, helpers) {
      const cardName = state.lastPlayedWeaponName;
      const allDefs = [...playerEventCards, ...opponentEventCards];
      const def = allDefs.find((c) => c.name === cardName);
      if (!def) {
        logLine(`${player.name} played Hey, I got one of those — card definition for "${cardName}" not found.`);
        return;
      }
      if (def.isItem) {
        if ((player.items || []).some((c) => c.name === def.name)) {
          logLine(`${player.name} already has ${def.name} in play — Hey, I got one of those has no effect.`);
          return;
        }
        player.items.push({ ...def });
        logLine(`${player.name} played Hey, I got one of those — copied ${def.name} and placed it in front of them.`);
      } else {
        def.apply(player, helpers);
        logLine(`${player.name} played Hey, I got one of those — copied the effect of ${def.name}.`);
      }
    }
  },
  {
    name: "Did you hear that?",
    description: "Move all zombies on your current tile to any legal space on an adjacent tile. Zombies that cannot be placed are removed — they do not count as kills.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    canPlay() {
      const cp = currentPlayer();
      const tx = spaceToTileCoord(cp.x);
      const ty = spaceToTileCoord(cp.y);
      return [...state.zombies.keys()].some((zk) => {
        const { x: zx, y: zy } = parseKey(zk);
        return spaceToTileCoord(zx) === tx && spaceToTileCoord(zy) === ty;
      });
    },
    apply(player) {
      const tx = spaceToTileCoord(player.x);
      const ty = spaceToTileCoord(player.y);
      const toMove = [...state.zombies.keys()].filter((zk) => {
        const { x: zx, y: zy } = parseKey(zk);
        return spaceToTileCoord(zx) === tx && spaceToTileCoord(zy) === ty;
      });
      if (toMove.length === 0) {
        logLine(`${player.name} played Did you hear that? — no zombies on this tile.`);
        return;
      }
      toMove.forEach((zk) => state.zombies.delete(zk));
      const validSpaces = new Set();
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
        const atx = tx + dx;
        const aty = ty + dy;
        const adjTile = state.board.get(key(atx, aty));
        if (!adjTile) return;
        if (state.noZombieTiles?.has(key(atx, aty))) return;
        for (let lx = 0; lx < TILE_DIM; lx += 1) {
          for (let ly = 0; ly < TILE_DIM; ly += 1) {
            if (!isSubtileZombieViable(adjTile, lx, ly)) continue;
            validSpaces.add(key(atx * TILE_DIM + lx, aty * TILE_DIM + ly));
          }
        }
      });
      logLine(`${player.name} played Did you hear that? — ${toMove.length} zombie(s) cleared from this tile. Place them on adjacent tiles (or finish to discard the rest).`);
      state.pendingZombiePlace = { remaining: toMove.length, validSpaces, cardName: "Did you hear that?" };
    }
  },
  {
    name: "I could use a drink.",
    description: "Discard this card and your remaining hand, then immediately draw back up to 3 cards.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    apply(player) {
      const discarded = player.hand.splice(0);
      discarded.forEach((c) => state.eventDiscardPile.push(c));
      const drew = [];
      while (player.hand.length < 3) {
        if (state.eventDeck.length === 0) {
          if (state.eventDiscardPile.length === 0) break;
          reshuffleEventDeckIfEmpty();
        }
        player.hand.push(state.eventDeck.shift());
        drew.push(player.hand[player.hand.length - 1].name);
      }
      const discardText = discarded.length > 0 ? `Discarded: ${discarded.map((c) => c.name).join(", ")}. ` : "";
      const drawText = drew.length > 0 ? `Drew: ${drew.join(", ")}.` : "No cards to draw.";
      logLine(`${player.name} played I could use a drink. — ${discardText}${drawText}`);
    }
  },
  {
    name: "Meat Cleaver",
    description: "Play in any building or store. While in front of you, +1 to all your combat rolls. Lost (discarded) when you are knocked out.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    isItem: true,
    isWeapon: true,
    canPlay: isOnBuildingOrStoreTile,
    apply(player) {
      player.meatCleaverActive = true;
      logLine(`${player.name} placed Meat Cleaver in front of them — +1 to all combat rolls until knocked out.`);
    }
  },
  {
    name: "I know what you did",
    description: "Play only if every other player has more kills than you. Move yourself to any legal space on an adjacent tile.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    canPlay() {
      const cp = currentPlayer();
      return state.players.length > 1 &&
        state.players.every((p) => p.id === cp.id || p.kills > cp.kills);
    },
    apply(player) {
      const tx = spaceToTileCoord(player.x);
      const ty = spaceToTileCoord(player.y);
      const validSpaces = new Set();
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
        const atx = tx + dx;
        const aty = ty + dy;
        const adjTile = state.board.get(key(atx, aty));
        if (!adjTile) return;
        for (let lx = 0; lx < TILE_DIM; lx += 1) {
          for (let ly = 0; ly < TILE_DIM; ly += 1) {
            if (!isLocalWalkable(adjTile, lx, ly)) continue;
            validSpaces.add(key(atx * TILE_DIM + lx, aty * TILE_DIM + ly));
          }
        }
      });
      if (validSpaces.size === 0) {
        logLine(`${player.name} played I know what you did — no legal spaces on adjacent tiles.`);
        return;
      }
      state.pendingSpaceSelect = {
        playerId: player.id,
        cardName: "I know what you did",
        validSpaces,
        promptText: "Click any highlighted space on an adjacent tile."
      };
      logLine(`${player.name} played I know what you did — choose a space on an adjacent tile.`);
    }
  },
  {
    name: "Sheer Determination",
    description: "Discard 1 bullet and 1 life to take any card from the event discard pile into your hand. Cannot exceed hand size.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    canPlay() {
      const cp = currentPlayer();
      return cp.bullets >= 1 && cp.hearts >= 1 &&
             cp.hand.length < MAX_HAND_SIZE &&
             state.eventDiscardPile.length > 0;
    },
    apply(player) {
      player.bullets -= 1;
      player.hearts -= 1;
      logLine(`${player.name} played Sheer Determination — spent 1 bullet and 1 life.`);
      if (state.eventDiscardPile.length === 1) {
        const retrieved = state.eventDiscardPile.pop();
        player.hand.push(retrieved);
        logLine(`${player.name} retrieved ${retrieved.name} from the discard pile.`);
        return;
      }
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Sheer Determination",
        options: state.eventDiscardPile.map((c, i) => ({ key: String(i), label: c.name })),
        resolve(optionKey) {
          const idx = Number(optionKey);
          if (idx < 0 || idx >= state.eventDiscardPile.length) return;
          const [retrieved] = state.eventDiscardPile.splice(idx, 1);
          player.hand.push(retrieved);
          logLine(`${player.name} retrieved ${retrieved.name} from the discard pile (Sheer Determination).`);
        }
      };
      logLine(`${player.name} — choose a card to retrieve from the discard pile.`);
    }
  },
  {
    name: "Where did he go?",
    description: "Play in front of you when an opponent just killed a zombie. Discard at any time to place one zombie anywhere on the board.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    isItem: true,
    canPlay() {
      return state.recentKillKey !== null;
    },
    apply(player) {
      logLine(`${player.name} played Where did he go? — a zombie has been snatched away and is stored on this card.`);
    },
    activateItem(player) {
      state.pendingZombiePlace = { remaining: 1, cardName: "Where did he go?" };
      logLine(`${player.name} discarded Where did he go? — click any valid space to place the zombie.`);
    }
  },
  {
    name: "Too..tired..to...run",
    description: "After this card is played, no movement rolls are made until the end of your next turn. Players may still move due to card effects.",
    collection: { [COLLECTIONS.NOT_DEAD_YET]: 2 },
    apply(player) {
      state.movementRollFreezeCount = state.players.length + 1;
      logLine(`${player.name} played Too..tired..to...run — no movement rolls for ${state.players.length + 1} turn(s). Card effects that grant movement still work.`);
    }
  }
);
