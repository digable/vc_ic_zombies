// ---------------------------------------------------------------------------
// Page cards — shuffled into the event deck; staged in front of the player
// ---------------------------------------------------------------------------
// Page card properties:
//   cardType    {CARD_TYPE.BOTD_PAGE}  Required — identifies this as a book of the dead page card
//   name        {string}         Display name
//   description {string}         Shown on the card face in hand and when staged
//   collection  {object}         { [COLLECTIONS.*]: count }
//   apply(player, helpers)       Called when the player uses (discards) the staged card
//
// Rules:
//   - Drawn into hand like a normal event card
//   - "Stage" moves it from hand to in front of the player; uses eventUsedThisRound
//   - "Use & Discard" triggers apply() and discards it; uses pageRemovedThisRound
//   - Players may have any number of book of the dead pages in front of them
//   - Only one page may be removed per round (pageRemovedThisRound)
//   - Only one event or page card may be staged/played per turn (eventUsedThisRound)
// ---------------------------------------------------------------------------

const pageEventCards = [
  {
    cardType: CARD_TYPE.BOTD_PAGE,
    name: "Twist of Fate",
    description: "Remove from play: take 1 bullet from each other player.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    preview(player) {
      const total = state.players.filter((p) => p.id !== player.id && p.bullets > 0).length;
      if (total === 0) return "No opponents have bullets — no effect.";
      return `Would take ${total} bullet(s) total.`;
    },
    apply(player) {
      state.players.forEach((other) => {
        if (other.id === player.id) return;
        if (other.bullets > 0) {
          other.bullets -= 1;
          player.bullets += 1;
          logLine(`${player.name} takes 1 bullet from ${other.name} (Twist of Fate).`);
        } else {
          logLine(`${other.name} has no bullets to take (Twist of Fate).`);
        }
      });
    }
  },
  {
    cardType: CARD_TYPE.BOTD_PAGE,
    name: "Return to Sender",
    description: "Remove from play: transport one opponent inside the Cabin to an outside subtile of the Cabin.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    preview(player) {
      let cabinKey = null;
      for (const [tk, tile] of state.board) {
        if (tile.name === "Cabin") { cabinKey = tk; break; }
      }
      if (!cabinKey) return "Cabin not on the board — no effect.";
      const { x: ctx, y: cty } = parseKey(cabinKey);
      const cabinTile = state.board.get(cabinKey);
      const targets = state.players.filter((p) => {
        if (p.id === player.id) return false;
        if (spaceToTileCoord(p.x) !== ctx || spaceToTileCoord(p.y) !== cty) return false;
        const lx = getLocalCoord(p.x, ctx);
        const ly = getLocalCoord(p.y, cty);
        return getSubTileType(cabinTile, lx, ly) === "building";
      });
      if (targets.length === 0) return "No opponents inside the Cabin.";
      if (targets.length === 1) return `Would eject: ${targets[0].name}.`;
      return `Multiple targets inside: ${targets.map((p) => p.name).join(", ")} — you choose.`;
    },
    apply(player) {
      // Find Cabin tile on the board
      let cabinKey = null;
      for (const [tk, tile] of state.board) {
        if (tile.name === "Cabin") { cabinKey = tk; break; }
      }
      if (!cabinKey) {
        logLine("Return to Sender — the Cabin is not on the board.");
        return;
      }
      const { x: ctx, y: cty } = parseKey(cabinKey);
      const cabinTile = state.board.get(cabinKey);

      // Opponents currently on a building subtile of the Cabin
      const affected = state.players.filter((p) => {
        if (p.id === player.id) return false;
        if (spaceToTileCoord(p.x) !== ctx || spaceToTileCoord(p.y) !== cty) return false;
        const lx = getLocalCoord(p.x, ctx);
        const ly = getLocalCoord(p.y, cty);
        return getSubTileType(cabinTile, lx, ly) === "building";
      });

      if (affected.length === 0) {
        logLine("Return to Sender — no opponents are inside the Cabin.");
        return;
      }

      // Valid destinations: walkable, non-building subtiles on the Cabin
      const validSpaces = new Set();
      for (let lx = 0; lx < TILE_DIM; lx++) {
        for (let ly = 0; ly < TILE_DIM; ly++) {
          if (!isLocalWalkable(cabinTile, lx, ly)) continue;
          if (getSubTileType(cabinTile, lx, ly) === "building") continue;
          validSpaces.add(key(ctx * TILE_DIM + lx, cty * TILE_DIM + ly));
        }
      }

      if (validSpaces.size === 0) {
        logLine("Return to Sender — no valid outside spaces on the Cabin.");
        return;
      }

      const doTransport = (target) => {
        state.pendingSpaceSelect = {
          playerId: target.id,
          cardName: "Return to Sender",
          validSpaces,
          promptText: `Click an outside space on the Cabin to place ${target.name}.`
        };
        logLine(`Return to Sender — choose where to place ${target.name} outside the Cabin.`);
      };

      if (affected.length === 1) {
        doTransport(affected[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        title: "Return to Sender — Choose opponent",
        cardName: "Return to Sender",
        options: affected.map((p) => ({ key: `p_${p.id}`, label: p.name })),
        resolve(optKey) {
          const target = state.players.find((p) => p.id === Number(optKey.slice(2)));
          if (target) doTransport(target);
        }
      };
    }
  },
  {
    cardType: CARD_TYPE.BOTD_PAGE,
    name: "The Trees Are Alive!",
    description: "Remove from play: all opponents on a wooded subtile must fight the trees (need 4+ to defeat).",
    collection: { [COLLECTIONS.THE_END]: 2 },
    preview(player) {
      const targets = state.players.filter((p) => {
        if (p.id === player.id) return false;
        const tile = getTileAtSpace(p.x, p.y);
        if (!tile) return false;
        const { lx, ly } = getSpaceLocalCoords(p.x, p.y);
        return getSubTileType(tile, lx, ly) === "wooded" && !state.zombies.has(key(p.x, p.y));
      });
      if (targets.length === 0) return "No opponents on wooded subtiles — no effect.";
      return `Would target: ${targets.map((p) => p.name).join(", ")}`;
    },
    apply(player) {
      let count = 0;
      state.players.forEach((other) => {
        if (other.id === player.id) return;
        const tile = getTileAtSpace(other.x, other.y);
        if (!tile) return;
        const { lx, ly } = getSpaceLocalCoords(other.x, other.y);
        if (getSubTileType(tile, lx, ly) !== "wooded") return;
        const sk = key(other.x, other.y);
        if (!state.zombies.has(sk)) {
          // Spawn a regular zombie (kill roll 4+) to represent the trees/shrubs
          state.zombies.set(sk, { type: ZOMBIE_TYPE.REGULAR, count: 1 });
          count++;
          logLine(`${other.name} is attacked by the trees! They must fight their way out. (The Trees Are Alive!)`);
        }
      });
      if (count === 0) {
        logLine("The Trees Are Alive! — no opponents are on wooded subtiles.");
      }
    }
  },
  {
    cardType: CARD_TYPE.BOTD_PAGE,
    name: "Here Doggie!",
    description: "When staged: fills the Pet Cemetery with 9 zombie dogs. Remove from play at any time.",
    collection: { [COLLECTIONS.THE_END]: 3 },
    preview() {
      const onBoard = [...state.board.values()].some((t) => t.name === "Pet Cemetery");
      if (!onBoard) return "Pet Cemetery not on the board — staging will have no effect.";
      return "Will fill the Pet Cemetery with 9 zombie dogs on staging.";
    },
    onStage(player) {
      let cemKey = null;
      for (const [tk, tile] of state.board) {
        if (tile.name === "Pet Cemetery") { cemKey = tk; break; }
      }
      if (!cemKey) {
        logLine("Here Doggie! — the Pet Cemetery is not on the board.");
        return;
      }
      const { x: ctx, y: cty } = parseKey(cemKey);
      // Clear existing zombies on the tile first, then fill with 9 dogs
      state.zombies.forEach((_v, zk) => {
        const { x: zx, y: zy } = parseKey(zk);
        if (spaceToTileCoord(zx) === ctx && spaceToTileCoord(zy) === cty) {
          state.zombies.delete(zk);
        }
      });
      let total = 0;
      for (let i = 0; i < 9; i++) {
        if (spawnZombieOnTile(ctx, cty, "Here Doggie!", ZOMBIE_TYPE.DOG)) total++;
      }
      logLine(`${player.name} staged Here Doggie! — Pet Cemetery filled with ${total} zombie dog(s).`);
    },
    apply(player) {
      logLine(`${player.name} discarded Here Doggie! from play.`);
    }
  },
  {
    cardType: CARD_TYPE.BOTD_PAGE,
    name: "Something Doesn't Feel Quite Right",
    description: "Remove from play: permanently remove any 3 non-page cards from the draw deck or discard pile.",
    collection: { [COLLECTIONS.THE_END]: 3 },
    apply(player) {
      const getNonPageCards = () => {
        const candidates = [];
        state.eventDeck.forEach((c, i) => {
          if (c.cardType !== CARD_TYPE.BOTD_PAGE) {
            candidates.push({ name: c.name, source: "deck", index: i });
          }
        });
        state.eventDiscardPile.forEach((c, i) => {
          if (c.cardType !== CARD_TYPE.BOTD_PAGE) {
            candidates.push({ name: c.name, source: "discard", index: i });
          }
        });
        // Deduplicate by name (show each unique card name once; multiple copies handled by removing first match)
        const seen = new Set();
        return candidates.filter((c) => {
          if (seen.has(c.name)) return false;
          seen.add(c.name);
          return true;
        });
      };

      const removeCard = (name) => {
        const di = state.eventDeck.findIndex((c) => c.name === name);
        if (di >= 0) { state.eventDeck.splice(di, 1); return; }
        const pi = state.eventDiscardPile.findIndex((c) => c.name === name);
        if (pi >= 0) { state.eventDiscardPile.splice(pi, 1); }
      };

      const promptPick = (remaining) => {
        const candidates = getNonPageCards();
        if (candidates.length === 0 || remaining <= 0) {
          if (remaining > 0) logLine(`Something Doesn't Feel Quite Right — no more non-page cards to remove.`);
          return;
        }
        state.pendingEventChoice = {
          playerId: player.id,
          title: `Something Doesn't Feel Quite Right — Remove a card (${remaining} left)`,
          cardName: "Something Doesn't Feel Quite Right",
          options: candidates.map((c) => ({ key: c.name, label: `${c.name} (${c.source})` })),
          resolve(chosenName) {
            removeCard(chosenName);
            logLine(`${player.name} permanently removed "${chosenName}" from the game (Something Doesn't Feel Quite Right).`);
            promptPick(remaining - 1);
          }
        };
      };

      promptPick(3);
    }
  },
];
