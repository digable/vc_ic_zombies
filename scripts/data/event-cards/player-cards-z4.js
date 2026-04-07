// ---------------------------------------------------------------------------
// Z4 (The End) player event cards — appended to playerEventCards
// ---------------------------------------------------------------------------
// Appended to playerEventCards after player-cards.js loads.
// See player-cards.js header for full card property reference.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Werewolf combat — triggered at the start of the marked player's next turn.
// Called from turn-end.js when player.werewolfNextTurn is set.
// ---------------------------------------------------------------------------
function triggerWerewolfCombat(player) {
  const others = state.players.filter((p) => p.id !== player.id);
  if (others.length === 0) {
    logLine(`${player.name} transformed into a werewolf but there's no one to attack!`);
    return;
  }

  logLine(`${player.name} transforms into a werewolf! (Full Moon Fever)`);

  const moveLoserToBridge = (loser) => {
    let bridgeTileKey = null;
    for (const [tk, tile] of state.board) {
      if (tile.name === "Bridge") { bridgeTileKey = tk; break; }
    }
    if (!bridgeTileKey) {
      logLine(`${loser.name} would flee to the Bridge, but it's not on the board.`);
      return;
    }
    const [btx, bty] = bridgeTileKey.split(",").map(Number);
    const bridgeTile = state.board.get(bridgeTileKey);
    for (let lx = 0; lx < TILE_DIM; lx++) {
      for (let ly = 0; ly < TILE_DIM; ly++) {
        if (isLocalWalkable(bridgeTile, lx, ly)) {
          loser.x = btx * TILE_DIM + lx;
          loser.y = bty * TILE_DIM + ly;
          logLine(`${loser.name} flees to the Bridge!`);
          return;
        }
      }
    }
    logLine(`${loser.name} would flee to the Bridge, but no walkable space found.`);
  };

  const doAttack = (target) => {
    const werewolfRoll = rollD6();
    const targetRoll = rollD6();
    logLine(`Werewolf combat! ${player.name} rolled ${werewolfRoll} — ${target.name} rolled ${targetRoll}.`);

    const doTargetSpend = (werewolfFinal) => {
      const maxSpend = target.bullets;
      state.pendingEventChoice = {
        playerId: target.id,
        cardName: "Full Moon Fever",
        title: `${target.name} rolled ${targetRoll} — spend bullets to increase? (${target.bullets} available, werewolf is at ${werewolfFinal})`,
        options: Array.from({ length: maxSpend + 1 }, (_, i) => ({
          key: String(i),
          label: i === 0 ? "Add 0 bullets" : `Add ${i} bullet(s) (−${i})`
        })),
        resolve(chosenKey) {
          const spent = Number(chosenKey);
          target.bullets -= spent;
          const targetFinal = targetRoll + spent;
          if (spent > 0) logLine(`${target.name} spent ${spent} bullet(s) — final roll: ${targetFinal}.`);

          if (werewolfFinal > targetFinal) {
            logLine(`${player.name} wins! (${werewolfFinal} vs ${targetFinal}) — ${target.name} retreats to the Bridge.`);
            moveLoserToBridge(target);
          } else if (targetFinal > werewolfFinal) {
            logLine(`${target.name} wins! (${targetFinal} vs ${werewolfFinal}) — ${player.name} retreats to the Bridge.`);
            moveLoserToBridge(player);
          } else {
            logLine(`Werewolf combat — tie! (${werewolfFinal} vs ${targetFinal}) Neither player moves.`);
          }
        }
      };
    };

    state.pendingEventChoice = {
      playerId: player.id,
      cardName: "Full Moon Fever",
      title: `${player.name} rolled ${werewolfRoll} — spend bullets to increase? (${player.bullets} available)`,
      options: Array.from({ length: player.bullets + 1 }, (_, i) => ({
        key: String(i),
        label: i === 0 ? "Add 0 bullets" : `Add ${i} bullet(s) (−${i})`
      })),
      resolve(chosenKey) {
        const spent = Number(chosenKey);
        player.bullets -= spent;
        const werewolfFinal = werewolfRoll + spent;
        if (spent > 0) logLine(`${player.name} spent ${spent} bullet(s) — final roll: ${werewolfFinal}.`);
        doTargetSpend(werewolfFinal);
      }
    };
  };

  if (others.length === 1) {
    doAttack(others[0]);
    return;
  }

  state.pendingEventChoice = {
    playerId: player.id,
    cardName: "Full Moon Fever",
    title: `${player.name} is a werewolf! Choose a target:`,
    options: others.map((p) => ({ key: `p_${p.id}`, label: p.name })),
    resolve(optKey) {
      const target = state.players.find((p) => p.id === Number(optKey.slice(2)));
      if (target) doAttack(target);
    }
  };
}

playerEventCards.push(
  {
    name: "Amulet",
    description: "Play on the Abandoned Cars tile. Discard to teleport to any space on an adjacent map tile.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    isItem: true,
    requiresTile: "Abandoned Cars",
    apply(player) {
      logLine(`${player.name} placed the Amulet in front of them.`);
    },
    activateItem(player) {
      const tx = spaceToTileCoord(player.x);
      const ty = spaceToTileCoord(player.y);
      const validSpaces = new Set();
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
        const atx = tx + dx;
        const aty = ty + dy;
        const adjTile = state.board.get(key(atx, aty));
        if (!adjTile) return;
        for (let lx = 0; lx < TILE_DIM; lx++) {
          for (let ly = 0; ly < TILE_DIM; ly++) {
            if (!isLocalWalkable(adjTile, lx, ly)) continue;
            validSpaces.add(key(atx * TILE_DIM + lx, aty * TILE_DIM + ly));
          }
        }
      });
      if (validSpaces.size === 0) {
        logLine(`${player.name} used the Amulet — no adjacent tiles to teleport to.`);
        return;
      }
      state.pendingSpaceSelect = {
        playerId: player.id,
        cardName: "Amulet",
        validSpaces,
        promptText: "Click any space on an adjacent tile to teleport."
      };
      logLine(`${player.name} activated the Amulet — choose a space on an adjacent tile.`);
    }
  },
  {
    name: "Rolled-Up Newspaper",
    description: "Move 1 zombie (human or dog) from your current subtile to an opponent's subtile.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    apply(player) {
      const fromKey = key(player.x, player.y);
      const zdata = state.zombies.get(fromKey);
      if (!zdata) {
        logLine(`${player.name} played Rolled-Up Newspaper — no zombies on your subtile.`);
        return;
      }
      const targets = state.players.filter((p) => p.id !== player.id);
      if (targets.length === 0) {
        logLine(`${player.name} played Rolled-Up Newspaper — no other players to send a zombie to.`);
        return;
      }

      const doMove = (target) => {
        const src = state.zombies.get(fromKey);
        if (!src) {
          logLine(`Rolled-Up Newspaper — the zombie on your subtile is gone.`);
          return;
        }
        const zombieType = src.type;
        if (src.count <= 1) {
          state.zombies.delete(fromKey);
        } else {
          src.count -= 1;
        }
        const toKey = key(target.x, target.y);
        const dest = state.zombies.get(toKey);
        if (dest && dest.type === zombieType) {
          dest.count += 1;
        } else {
          state.zombies.set(toKey, { type: zombieType, count: 1 });
        }
        const zombieLabel = zombieType === ZOMBIE_TYPE.DOG ? "zombie dog" : "zombie";
        logLine(`${player.name} baps a ${zombieLabel} toward ${target.name}'s space with the Rolled-Up Newspaper!`);
      };

      if (targets.length === 1) {
        doMove(targets[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Rolled-Up Newspaper",
        title: "Rolled-Up Newspaper — Choose target",
        options: targets.map((p) => ({ key: `p_${p.id}`, label: p.name })),
        resolve(optKey) {
          const target = state.players.find((p) => p.id === Number(optKey.slice(2)));
          if (target) doMove(target);
        }
      };
    }
  },
  {
    name: "Sickle",
    description: "Play in a named Z4 building. +1 to your first combat roll per combat. When used, also drives another zombie dog from the same subtile to an adjacent subtile.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    isItem: true,
    isWeapon: true,
    combatWeapon: true,
    oncePerTurnCombatBoost: 1,
    requiresTile: ["Cabin", "Burnt Cabin", "Shed", "Ranger Post", "Pet Cemetery", "Outhouse"],
    apply(player) {
      logLine(`${player.name} placed the Sickle in front of them.`);
    },
    onWeaponUse(player, pending) {
      if (!pending.isDog) return;
      const combatKey = pending.pKey;
      const [cx, cy] = combatKey.split(",").map(Number);
      const zdata = state.zombies.get(combatKey);
      // Only move a dog if there are at least 2 dogs here (one is being fought)
      if (!zdata || zdata.type !== ZOMBIE_TYPE.DOG || zdata.count < 2) return;

      // Find an adjacent walkable space to chase the dog off to
      const neighbors = [
        key(cx - 1, cy), key(cx + 1, cy),
        key(cx, cy - 1), key(cx, cy + 1)
      ].filter((nk) => {
        const [nx, ny] = nk.split(",").map(Number);
        const tile = getTileAtSpace(nx, ny);
        if (!tile) return false;
        const { lx, ly } = getSpaceLocalCoords(nx, ny);
        return isLocalWalkable(tile, lx, ly);
      });

      if (neighbors.length === 0) return;

      const toKey = neighbors[Math.floor(Math.random() * neighbors.length)];
      zdata.count -= 1;
      const dest = state.zombies.get(toKey);
      if (dest && dest.type === ZOMBIE_TYPE.DOG) {
        dest.count += 1;
      } else {
        state.zombies.set(toKey, { type: ZOMBIE_TYPE.DOG, count: 1 });
      }
      const [tx, ty] = toKey.split(",").map(Number);
      logLine(`The Sickle's swing drives a zombie dog away to [${tx}, ${ty}]!`);
    }
  },
  {
    name: "Spear",
    description: "Play in a named Z4 building. While in play: +1 to all attack rolls.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    isItem: true,
    requiresTile: ["Cabin", "Burnt Cabin", "Shed", "Ranger Post", "Pet Cemetery", "Outhouse"],
    apply(player) {
      player.attack = (player.attack || 0) + 1;
      logLine(`${player.name} set the Spear — +1 to all attack rolls while in play.`);
    }
  },
  {
    name: "Talk to the Hand",
    description: "Choose an opponent on your map tile and move them to an adjacent map tile of your choice.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    apply(player) {
      const playerTx = spaceToTileCoord(player.x);
      const playerTy = spaceToTileCoord(player.y);

      const opponents = state.players.filter((p) => {
        if (p.id === player.id) return false;
        return spaceToTileCoord(p.x) === playerTx && spaceToTileCoord(p.y) === playerTy;
      });

      if (opponents.length === 0) {
        logLine(`${player.name} played Talk to the Hand — no opponents on this tile.`);
        return;
      }

      const adjTileKeys = [[-1, 0], [1, 0], [0, -1], [0, 1]]
        .map(([dx, dy]) => key(playerTx + dx, playerTy + dy))
        .filter((tk) => state.board.has(tk));

      if (adjTileKeys.length === 0) {
        logLine(`${player.name} played Talk to the Hand — no adjacent tiles to move to.`);
        return;
      }

      const getValidSpacesForTile = (tk) => {
        const [atx, aty] = tk.split(",").map(Number);
        const adjTile = state.board.get(tk);
        const spaces = new Set();
        for (let lx = 0; lx < TILE_DIM; lx++) {
          for (let ly = 0; ly < TILE_DIM; ly++) {
            if (!isLocalWalkable(adjTile, lx, ly)) continue;
            spaces.add(key(atx * TILE_DIM + lx, aty * TILE_DIM + ly));
          }
        }
        return spaces;
      };

      const doTileSelect = (target) => {
        if (adjTileKeys.length === 1) {
          const validSpaces = getValidSpacesForTile(adjTileKeys[0]);
          if (validSpaces.size === 0) {
            logLine(`Talk to the Hand — no walkable spaces on the adjacent tile.`);
            return;
          }
          state.pendingSpaceSelect = {
            playerId: target.id,
            cardName: "Talk to the Hand",
            validSpaces,
            promptText: `Click a space on the adjacent tile to place ${target.name}.`
          };
          logLine(`Talk to the Hand — choose where to place ${target.name} on the adjacent tile.`);
          return;
        }

        state.pendingEventChoice = {
          playerId: player.id,
          cardName: "Talk to the Hand",
          title: "Talk to the Hand — Choose destination tile",
          options: adjTileKeys.map((tk) => {
            const t = state.board.get(tk);
            return { key: tk, label: t.name || tk };
          }),
          resolve(chosenTk) {
            const validSpaces = getValidSpacesForTile(chosenTk);
            if (validSpaces.size === 0) {
              logLine(`Talk to the Hand — no walkable spaces on that tile.`);
              return;
            }
            state.pendingSpaceSelect = {
              playerId: target.id,
              cardName: "Talk to the Hand",
              validSpaces,
              promptText: `Click a space to place ${target.name}.`
            };
            logLine(`Talk to the Hand — choose where to place ${target.name}.`);
          }
        };
      };

      if (opponents.length === 1) {
        doTileSelect(opponents[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Talk to the Hand",
        title: "Talk to the Hand — Choose opponent",
        options: opponents.map((p) => ({ key: `p_${p.id}`, label: p.name })),
        resolve(optKey) {
          const target = state.players.find((p) => p.id === Number(optKey.slice(2)));
          if (target) doTileSelect(target);
        }
      };
    }
  },
  {
    name: "Tranquilizer Gun",
    description: "Play in a named Z4 building. Discard to defeat all zombie dogs on any one subtile.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    isItem: true,
    requiresTile: ["Cabin", "Burnt Cabin", "Shed", "Ranger Post", "Pet Cemetery", "Outhouse"],
    apply(player) {
      logLine(`${player.name} placed the Tranquilizer Gun in front of them.`);
    },
    activateItem(player) {
      const dogSpaces = [];
      state.zombies.forEach((zdata, zk) => {
        if (zdata.type === ZOMBIE_TYPE.DOG) {
          const [zx, zy] = zk.split(",").map(Number);
          dogSpaces.push({ key: zk, label: `[${zx}, ${zy}] — ${zdata.count} dog(s)` });
        }
      });

      if (dogSpaces.length === 0) {
        logLine(`${player.name} fired the Tranquilizer Gun — no zombie dogs anywhere.`);
        return;
      }

      const doShoot = (zk) => {
        const zdata = state.zombies.get(zk);
        if (!zdata || zdata.type !== ZOMBIE_TYPE.DOG) {
          logLine(`Tranquilizer Gun — no dogs at that space.`);
          return;
        }
        const killed = zdata.count;
        state.zombies.delete(zk);
        player.kills += killed;
        logLine(`${player.name} fired the Tranquilizer Gun — ${killed} zombie dog(s) put to sleep. (${killed} kill(s))`);
        checkWin(player);
      };

      if (dogSpaces.length === 1) {
        doShoot(dogSpaces[0].key);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Tranquilizer Gun",
        title: "Tranquilizer Gun — Choose a subtile",
        options: dogSpaces,
        resolve(chosenKey) {
          doShoot(chosenKey);
        }
      };
    }
  },
  {
    name: "Bad Zombie, No Biscuit!",
    description: "Move all zombies on your map tile to an adjacent map tile. Cannot be used on a Cabin or Helipad tile.",
    collection: { [COLLECTIONS.THE_END]: 3 },
    canPlay() {
      const tile = getTileAtSpace(currentPlayer().x, currentPlayer().y);
      return !!(tile && tile.name !== "Cabin" && tile.type !== "helipad");
    },
    apply(player) {
      const playerTx = spaceToTileCoord(player.x);
      const playerTy = spaceToTileCoord(player.y);

      const tileZombies = [];
      state.zombies.forEach((zdata, zk) => {
        const [zx, zy] = zk.split(",").map(Number);
        if (spaceToTileCoord(zx) === playerTx && spaceToTileCoord(zy) === playerTy) {
          tileZombies.push({ zk, type: zdata.type, count: zdata.count, lx: getLocalCoord(zx, playerTx), ly: getLocalCoord(zy, playerTy) });
        }
      });

      if (tileZombies.length === 0) {
        logLine(`${player.name} played Bad Zombie, No Biscuit! — no zombies on this tile.`);
        return;
      }

      const adjTileKeys = [[-1, 0], [1, 0], [0, -1], [0, 1]]
        .map(([dx, dy]) => key(playerTx + dx, playerTy + dy))
        .filter((tk) => state.board.has(tk));

      if (adjTileKeys.length === 0) {
        logLine(`${player.name} played Bad Zombie, No Biscuit! — no adjacent tiles.`);
        return;
      }

      const doMove = (targetTk) => {
        const [atx, aty] = targetTk.split(",").map(Number);
        const targetTile = state.board.get(targetTk);

        const walkableSpaces = [];
        for (let lx = 0; lx < TILE_DIM; lx++) {
          for (let ly = 0; ly < TILE_DIM; ly++) {
            if (isLocalWalkable(targetTile, lx, ly)) {
              walkableSpaces.push(key(atx * TILE_DIM + lx, aty * TILE_DIM + ly));
            }
          }
        }

        if (walkableSpaces.length === 0) {
          logLine(`Bad Zombie, No Biscuit! — no walkable spaces on target tile.`);
          return;
        }

        let totalMoved = 0;
        tileZombies.forEach(({ zk, type, count, lx, ly }) => {
          state.zombies.delete(zk);
          // Prefer the same local coords if walkable on target tile
          const preferred = key(atx * TILE_DIM + lx, aty * TILE_DIM + ly);
          const usePreferred = isLocalWalkable(targetTile, lx, ly);
          const baseKey = usePreferred ? preferred : walkableSpaces[Math.floor(Math.random() * walkableSpaces.length)];

          // Find a compatible space (no zombie or same type)
          let destKey = baseKey;
          const existing = state.zombies.get(destKey);
          if (existing && existing.type !== type) {
            const alt = walkableSpaces.find((sk) => {
              const z = state.zombies.get(sk);
              return !z || z.type === type;
            });
            if (alt) destKey = alt;
          }

          const dest = state.zombies.get(destKey);
          if (dest) {
            dest.count += count;
          } else {
            state.zombies.set(destKey, { type, count });
          }
          totalMoved += count;
        });

        const tileName = targetTile.name || targetTk;
        logLine(`${player.name} yelled Bad Zombie, No Biscuit! — ${totalMoved} zombie(s) chased to ${tileName}.`);
      };

      if (adjTileKeys.length === 1) {
        doMove(adjTileKeys[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Bad Zombie, No Biscuit!",
        title: "Bad Zombie, No Biscuit! — Choose destination tile",
        options: adjTileKeys.map((tk) => {
          const t = state.board.get(tk);
          return { key: tk, label: t.name || tk };
        }),
        resolve(chosenTk) {
          doMove(chosenTk);
        }
      };
    }
  },
  {
    name: "Dog Repellent",
    description: "Until the end of your next turn, no zombie dogs may move closer to you. Dogs encountered during your movement are fought as normal.",
    collection: { [COLLECTIONS.THE_END]: 3 },
    apply(player) {
      player.dogRepellentTurns = 2;
      logLine(`${player.name} sprayed Dog Repellent — zombie dogs won't approach until end of next turn.`);
    }
  },
  {
    name: "Fully Loaded",
    description: "Take enough bullets and life tokens to match the totals of any one other player.",
    collection: { [COLLECTIONS.THE_END]: 3 },
    apply(player) {
      const others = state.players.filter((p) => p.id !== player.id);
      if (others.length === 0) {
        logLine(`${player.name} played Fully Loaded — no other players.`);
        return;
      }

      const doMatch = (target) => {
        const bulletsBefore = player.bullets;
        const heartsBefore = player.hearts;
        player.bullets = Math.max(player.bullets, target.bullets);
        player.hearts = Math.min(5, Math.max(player.hearts, target.hearts));
        const gainedBullets = player.bullets - bulletsBefore;
        const gainedHearts = player.hearts - heartsBefore;
        logLine(`${player.name} played Fully Loaded, matching ${target.name}: +${gainedBullets} bullet(s), +${gainedHearts} life token(s).`);
      };

      if (others.length === 1) {
        doMatch(others[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Fully Loaded",
        title: "Fully Loaded — Choose a player to match",
        options: others.map((p) => ({
          key: `p_${p.id}`,
          label: `${p.name} (${p.bullets} bullets, ${p.hearts} hearts)`
        })),
        resolve(optKey) {
          const target = state.players.find((p) => p.id === Number(optKey.slice(2)));
          if (target) doMatch(target);
        }
      };
    }
  },
  {
    name: "Clair Warlock",
    description: "Move an opponent to any woods tile adjacent to their current map tile.",
    collection: { [COLLECTIONS.THE_END]: 3 },
    apply(player) {
      const others = state.players.filter((p) => p.id !== player.id);
      if (others.length === 0) {
        logLine(`${player.name} played Clair Warlock — no other players.`);
        return;
      }

      const getAdjacentWoodsTileKeys = (target) => {
        const tx = spaceToTileCoord(target.x);
        const ty = spaceToTileCoord(target.y);
        return [[-1, 0], [1, 0], [0, -1], [0, 1]]
          .map(([dx, dy]) => key(tx + dx, ty + dy))
          .filter((tk) => {
            const t = state.board.get(tk);
            return t && t.type === "woods";
          });
      };

      const getValidSpacesForTile = (tk) => {
        const [atx, aty] = tk.split(",").map(Number);
        const adjTile = state.board.get(tk);
        const spaces = new Set();
        for (let lx = 0; lx < TILE_DIM; lx++) {
          for (let ly = 0; ly < TILE_DIM; ly++) {
            if (!isLocalWalkable(adjTile, lx, ly)) continue;
            spaces.add(key(atx * TILE_DIM + lx, aty * TILE_DIM + ly));
          }
        }
        return spaces;
      };

      const doWoodsSelect = (target) => {
        const woodsKeys = getAdjacentWoodsTileKeys(target);
        if (woodsKeys.length === 0) {
          logLine(`Clair Warlock — no adjacent woods tiles for ${target.name}.`);
          return;
        }
        if (woodsKeys.length === 1) {
          const validSpaces = getValidSpacesForTile(woodsKeys[0]);
          if (validSpaces.size === 0) {
            logLine(`Clair Warlock — no walkable spaces on the adjacent woods tile.`);
            return;
          }
          state.pendingSpaceSelect = {
            playerId: target.id,
            cardName: "Clair Warlock",
            validSpaces,
            promptText: `Click a space on the woods tile to place ${target.name}.`
          };
          logLine(`Clair Warlock — choose where to place ${target.name} on the woods tile.`);
          return;
        }
        state.pendingEventChoice = {
          playerId: player.id,
          cardName: "Clair Warlock",
          title: "Clair Warlock — Choose destination woods tile",
          options: woodsKeys.map((tk) => {
            const t = state.board.get(tk);
            return { key: tk, label: t.name || tk };
          }),
          resolve(chosenTk) {
            const validSpaces = getValidSpacesForTile(chosenTk);
            if (validSpaces.size === 0) {
              logLine(`Clair Warlock — no walkable spaces on that woods tile.`);
              return;
            }
            state.pendingSpaceSelect = {
              playerId: target.id,
              cardName: "Clair Warlock",
              validSpaces,
              promptText: `Click a space to place ${target.name}.`
            };
            logLine(`Clair Warlock — choose where to place ${target.name}.`);
          }
        };
      };

      if (others.length === 1) {
        doWoodsSelect(others[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Clair Warlock",
        title: "Clair Warlock — Choose an opponent",
        options: others.map((p) => ({ key: `p_${p.id}`, label: p.name })),
        resolve(optKey) {
          const target = state.players.find((p) => p.id === Number(optKey.slice(2)));
          if (target) doWoodsSelect(target);
        }
      };
    }
  },
  {
    name: "We're All Friends Here.",
    description: "Take a Book of the Dead page card staged by another player and place it in front of you as if you had just staged it.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    apply(player) {
      const stagedCards = [];
      state.players.forEach((p) => {
        if (p.id === player.id) return;
        (p.botdPages || []).forEach((card) => {
          stagedCards.push({ owner: p, card });
        });
      });

      if (stagedCards.length === 0) {
        logLine(`${player.name} played We're All Friends Here. — no BOTD pages staged by other players.`);
        return;
      }

      const doSteal = ({ owner, card }) => {
        const freshIdx = owner.botdPages.findIndex((c) => c === card);
        if (freshIdx < 0) {
          logLine(`We're All Friends Here. — that card is no longer available.`);
          return;
        }
        owner.botdPages.splice(freshIdx, 1);
        player.botdPages.push(card);
        logLine(`${player.name} took ${card.name} from ${owner.name} (We're All Friends Here!)`);
        if (card.onStage) card.onStage(player, buildEventDeckHelpers());
      };

      if (stagedCards.length === 1) {
        doSteal(stagedCards[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "We're All Friends Here.",
        title: "We're All Friends Here. — Choose a page to take",
        options: stagedCards.map((sc, i) => ({
          key: String(i),
          label: `${sc.card.name} (from ${sc.owner.name})`
        })),
        resolve(chosenKey) {
          const sc = stagedCards[Number(chosenKey)];
          if (sc) doSteal(sc);
        }
      };
    }
  },
  {
    name: "Portal",
    description: "Play on the Altar. Immediately switch places with another player.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    canPlay() {
      const tile = getTileAtSpace(currentPlayer().x, currentPlayer().y);
      return !!(tile && tile.name === "Altar");
    },
    apply(player) {
      const others = state.players.filter((p) => p.id !== player.id);
      if (others.length === 0) {
        logLine(`${player.name} played Portal — no other players to swap with.`);
        return;
      }

      const doSwap = (target) => {
        const px = player.x, py = player.y;
        player.x = target.x;
        player.y = target.y;
        target.x = px;
        target.y = py;
        logLine(`${player.name} opened a Portal — swapped places with ${target.name}!`);
      };

      if (others.length === 1) {
        doSwap(others[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Portal",
        title: "Portal — Choose a player to swap with",
        options: others.map((p) => ({ key: `p_${p.id}`, label: p.name })),
        resolve(optKey) {
          const target = state.players.find((p) => p.id === Number(optKey.slice(2)));
          if (target) doSwap(target);
        }
      };
    }
  },
  {
    name: "Monkeys are Funny!",
    description: "Move through wooded subtiles freely — no combat on those subtiles. Discarded automatically when you enter a non-wooded subtile.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    isItem: true,
    apply(player) {
      player.monkeysAreFunny = true;
      logLine(`${player.name} plays Monkeys are Funny! — swinging through the trees until they leave a wooded subtile.`);
    }
  },
  {
    name: "Magic Key",
    description: "Play in a Cave. Discard to look at an opponent's hand and take 1 card. You must then discard down to 3 cards.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    isItem: true,
    canPlay() {
      const tile = getTileAtSpace(currentPlayer().x, currentPlayer().y);
      return !!(tile && tile.name === "Cave");
    },
    apply(player) {
      logLine(`${player.name} placed the Magic Key in front of them.`);
    },
    activateItem(player) {
      const others = state.players.filter((p) => p.id !== player.id && p.hand.length > 0);
      if (others.length === 0) {
        logLine(`${player.name} used the Magic Key — no opponents with cards in hand.`);
        return;
      }

      const promptDiscard = () => {
        if (player.hand.length <= MAX_HAND_SIZE) return;
        const promptNext = () => {
          if (player.hand.length <= MAX_HAND_SIZE) return;
          state.pendingEventChoice = {
            playerId: player.id,
            cardName: "Magic Key",
            title: `Magic Key — Discard a card (${player.hand.length - MAX_HAND_SIZE} over limit)`,
            options: player.hand.map((c, i) => ({ key: String(i), label: c.name })),
            resolve(chosenKey) {
              const idx = Number(chosenKey);
              const discarded = player.hand.splice(idx, 1)[0];
              state.eventDiscardPile.push(discarded);
              logLine(`${player.name} discarded ${discarded.name} (Magic Key hand limit).`);
              promptNext();
            }
          };
        };
        promptNext();
      };

      const doSteal = (target) => {
        if (target.hand.length === 0) {
          logLine(`Magic Key — ${target.name} has no cards.`);
          return;
        }
        // Show all of target's hand then let player pick one
        const handList = target.hand.map((c, i) => ({ key: String(i), label: c.name }));
        logLine(`${player.name} looks at ${target.name}'s hand: ${target.hand.map((c) => c.name).join(", ")}.`);
        state.pendingEventChoice = {
          playerId: player.id,
          cardName: "Magic Key",
          title: `Magic Key — Take a card from ${target.name}'s hand`,
          options: handList,
          resolve(chosenKey) {
            const idx = Number(chosenKey);
            const taken = target.hand.splice(idx, 1)[0];
            player.hand.push(taken);
            logLine(`${player.name} took ${taken.name} from ${target.name} (Magic Key).`);
            promptDiscard();
          }
        };
      };

      if (others.length === 1) {
        doSteal(others[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Magic Key",
        title: "Magic Key — Choose an opponent to steal from",
        options: others.map((p) => ({ key: `p_${p.id}`, label: `${p.name} (${p.hand.length} card(s))` })),
        resolve(optKey) {
          const target = state.players.find((p) => p.id === Number(optKey.slice(2)));
          if (target) doSteal(target);
        }
      };
    }
  },
  {
    name: "Lost in the Woods",
    description: "Target opponent may not move off their current map tile until the end of their next turn.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    apply(player) {
      const others = state.players.filter((p) => p.id !== player.id);
      if (others.length === 0) {
        logLine(`${player.name} played Lost in the Woods — no other players to target.`);
        return;
      }

      const doMark = (target) => {
        const isTheirTurn = state.players[state.currentPlayerIndex].id === target.id;
        // If it's currently the target's turn, needs to last through this turn + next turn end
        // If it's not their turn, needs to last through their next turn end
        target.lockedToTileTurns = isTheirTurn ? 2 : 1;
        const tileName = getTileDisplayName(getTileAtSpace(target.x, target.y)) || "their tile";
        logLine(`${player.name} played Lost in the Woods on ${target.name} — they cannot leave ${tileName} until the end of their next turn.`);
      };

      if (others.length === 1) {
        doMark(others[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Lost in the Woods",
        title: "Lost in the Woods — Choose a target",
        options: others.map((p) => ({ key: `p_${p.id}`, label: p.name })),
        resolve(optKey) {
          const target = state.players.find((p) => p.id === Number(optKey.slice(2)));
          if (target) doMark(target);
        }
      };
    }
  },
  {
    name: "That Didn't Just Happen!?!",
    description: "Cancel any card that was just played — it is discarded without effect.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    canPlay() {
      return state.lastPlayedEventCard !== null &&
             state.lastPlayedEventCard.playerId !== currentPlayer().id;
    },
    apply(player) {
      const last = state.lastPlayedEventCard;
      if (!last) {
        logLine(`${player.name} played That Didn't Just Happen!?! — no card to cancel.`);
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

      // If it was an item card, remove it from play and return it to the discard pile
      if (card.isItem && caster) {
        const idx = caster.items.findIndex((c) => c === card);
        if (idx >= 0) caster.items.splice(idx, 1);
      } else {
        // For regular cards the card was already pushed to eventDiscardPile — it stays there
        // but any pending multi-step effects are cleared above
      }

      // Undo eventUsedThisRound so the caster can play again
      if (caster) {
        caster.eventUsedThisRound = false;
        logLine(`${player.name} cancelled ${caster.name}'s ${card.name} — That Didn't Just Happen!?!`);
      } else {
        logLine(`${player.name} cancelled ${card.name} — That Didn't Just Happen!?!`);
      }
    }
  },
  {
    name: "Full Moon Fever",
    description: "Target opponent becomes a werewolf on their next turn — they must attack another player. Both roll 1 die and may spend bullets to increase their roll. The loser moves immediately to the Bridge.",
    collection: { [COLLECTIONS.THE_END]: 2 },
    apply(player) {
      const others = state.players.filter((p) => p.id !== player.id);
      if (others.length === 0) {
        logLine(`${player.name} played Full Moon Fever — no other players to target.`);
        return;
      }

      const doMark = (target) => {
        target.werewolfNextTurn = true;
        logLine(`${player.name} played Full Moon Fever on ${target.name} — they'll transform next turn!`);
      };

      if (others.length === 1) {
        doMark(others[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Full Moon Fever",
        title: "Full Moon Fever — Choose a target",
        options: others.map((p) => ({ key: `p_${p.id}`, label: p.name })),
        resolve(optKey) {
          const target = state.players.find((p) => p.id === Number(optKey.slice(2)));
          if (target) doMark(target);
        }
      };
    }
  }
);
