// ---------------------------------------------------------------------------
// Z6 (Six Feet Under) player event cards — appended to playerEventCards
// ---------------------------------------------------------------------------

const Z6 = COLLECTIONS.SIX_FEET_UNDER;

// Returns true when `player` is on a building subtile of a Subway Station.
function isOnSubwayBuilding(player) {
  const tile = getTileAtSpace(player.x, player.y);
  if (!tile || tile.name !== TILE_NAME.SUBWAY_STATION) return false;
  const { lx, ly } = getSpaceLocalCoords(player.x, player.y);
  const sub = tile.subTiles?.[key(lx, ly)];
  return !!(sub && sub.type === SUBTILE_TYPE.BUILDING);
}

// Returns all building subtile global-space keys for a Subway Station tile at (tx, ty).
function subwayBuildingSpaces(tx, ty, tile) {
  const spaces = [];
  const subTiles = tile.subTiles || {};
  for (const [sk, sub] of Object.entries(subTiles)) {
    if (sub && sub.walkable && sub.type === SUBTILE_TYPE.BUILDING) {
      const [lx, ly] = sk.split(",").map(Number);
      spaces.push(key(tx * TILE_DIM + lx, ty * TILE_DIM + ly));
    }
  }
  return spaces;
}

playerEventCards.push(
  // -------------------------------------------------------------------------
  {
    name: "Missed Step",
    description: "Play on a player exiting the subway — they must exit using a Subway Station of your choice.",
    collection: { [Z6]: 3 },
    preview(player) {
      const targets = state.players.filter((p) => p.id !== player.id && p.subwayTeleport);
      if (targets.length === 0) return "No opponents currently exiting the subway.";
      return `Can redirect: ${targets.map((p) => p.name).join(", ")}`;
    },
    canPlay() {
      return state.players.some((p) => p.id !== currentPlayer().id && p.subwayTeleport);
    },
    apply(player) {
      const targets = state.players.filter((p) => p.id !== player.id && p.subwayTeleport);
      if (targets.length === 0) {
        logLine(`${player.name} played Missed Step — no opponents currently exiting the subway.`);
        return;
      }

      const doRedirect = (target) => {
        const dests = findSubwayDestinations(target);
        if (dests.length === 0) {
          logLine(`Missed Step — no other Subway Stations for ${target.name} to exit at.`);
          return;
        }

        const doPlace = (dest) => {
          target.subwayTeleport = false;
          target.x = dest.sx;
          target.y = dest.sy;
          state.playerTrail = [key(dest.sx, dest.sy)];
          collectTokensAtPlayerSpace(target);
          logLine(`${player.name} played Missed Step — ${target.name} is forced off at ${dest.label}!`);
          if (checkWin(target)) { render(); return; }
          render();
        };

        if (dests.length === 1) {
          doPlace(dests[0]);
          return;
        }

        state.pendingEventChoice = {
          playerId: player.id,
          cardName: "Missed Step",
          title: `Missed Step — Choose where ${target.name} exits the subway`,
          options: dests.map((d, i) => ({ key: `subway_${i}`, label: d.label })),
          resolve(choice) {
            const idx = parseInt(choice.replace("subway_", ""), 10);
            doPlace(dests[idx]);
          }
        };
      };

      if (targets.length === 1) {
        doRedirect(targets[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Missed Step",
        title: "Missed Step — Choose a target",
        options: playerOpts(targets),
        resolve(optKey) {
          const target = playerFromOpt(optKey);
          if (target) doRedirect(target);
        }
      };
    }
  },
  // -------------------------------------------------------------------------
  {
    name: "Flashlight",
    description: "Play when you are in a building. While in play, movement is doubled when travelling through the sewers.",
    collection: { [Z6]: 3 },
    isItem: true,
    preview(player) {
      const hasIt = (player.items || []).some((c) => c.name === "Flashlight");
      if (hasIt) return player.inSewer ? "Active — sewer movement is doubled." : "In play — doubles movement when in the sewer.";
      const tile = getTileAtSpace(player.x, player.y);
      const onBuilding = tile && (tile.type === TILE_TYPE.BUILDING || tile.type === TILE_TYPE.NAMED || tile.type === TILE_TYPE.MALL_STORE);
      if (!onBuilding) return "Must be in a building to play.";
      return "Will double your movement while in the sewer.";
    },
    canPlay() {
      const tile = getTileAtSpace(currentPlayer().x, currentPlayer().y);
      return !!(tile && (tile.type === TILE_TYPE.BUILDING || tile.type === TILE_TYPE.NAMED || tile.type === TILE_TYPE.MALL_STORE));
    },
    apply(player) {
      logLine(`${player.name} placed the Flashlight in front of them — movement doubled in the sewers.`);
    }
  },
  // -------------------------------------------------------------------------
  {
    name: "Zombies!!! Come Out and Play!",
    description: "Add 1 zombie to every legal space adjacent to every player.",
    collection: { [Z6]: 2 },
    preview() {
      const affected = new Set();
      state.players.forEach((p) => {
        [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dx, dy]) => {
          const nx = p.x + dx, ny = p.y + dy;
          const tile = getTileAtSpace(nx, ny);
          if (!tile) return;
          const { lx, ly } = getSpaceLocalCoords(nx, ny);
          if (isLocalWalkable(tile, lx, ly)) affected.add(key(nx, ny));
        });
      });
      return affected.size === 0 ? "No adjacent walkable spaces." : `Adds 1 zombie to ${affected.size} adjacent space(s).`;
    },
    apply(player) {
      const affected = new Set();
      state.players.forEach((p) => {
        [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dx, dy]) => {
          const nx = p.x + dx, ny = p.y + dy;
          const tile = getTileAtSpace(nx, ny);
          if (!tile) return;
          const { lx, ly } = getSpaceLocalCoords(nx, ny);
          if (isLocalWalkable(tile, lx, ly)) affected.add(key(nx, ny));
        });
      });
      if (affected.size === 0) {
        logLine(`${player.name} played Zombies!!! Come Out and Play! — no adjacent walkable spaces.`);
        return;
      }
      affected.forEach((spk) => {
        const existing = state.zombies.get(spk);
        if (existing) {
          existing.count += 1;
        } else {
          state.zombies.set(spk, { type: ZOMBIE_TYPE.REGULAR, count: 1 });
        }
      });
      logLine(`${player.name} played Zombies!!! Come Out and Play! — 1 zombie added to ${affected.size} space(s).`);
    }
  },
  // -------------------------------------------------------------------------
  {
    name: "Oh... That's New!",
    description: "Block 1 sewer space until the end of your next turn. No player may move in or out of that sewer. Cannot be played if it would cause a player to die.",
    collection: { [Z6]: 2 },
    preview(player) {
      if (!state.useSewerTokens) return "Sewer Tokens variant not active.";
      if (state.sewerTokenSpaces.size === 0) return "No sewer tokens have been placed yet.";
      const playable = [...state.sewerTokenSpaces.keys()].filter((spk) => {
        const [sx, sy] = spk.split(",").map(Number);
        return !state.players.some((p) => p.inSewer && p.x === sx && p.y === sy && p.hearts <= 1);
      });
      return playable.length === 0
        ? "All sewer spaces would cause a player to die — cannot play."
        : `Can block ${playable.length} sewer space(s).`;
    },
    canPlay() {
      if (!state.useSewerTokens || state.sewerTokenSpaces.size === 0) return false;
      return [...state.sewerTokenSpaces.keys()].some((spk) => {
        const [sx, sy] = spk.split(",").map(Number);
        return !state.players.some((p) => p.inSewer && p.x === sx && p.y === sy && p.hearts <= 1);
      });
    },
    apply(player) {
      const playable = [...state.sewerTokenSpaces.keys()].filter((spk) => {
        const [sx, sy] = spk.split(",").map(Number);
        return !state.players.some((p) => p.inSewer && p.x === sx && p.y === sy && p.hearts <= 1);
      });

      if (playable.length === 0) {
        logLine(`${player.name} played Oh... That's New! — no valid sewer spaces to block.`);
        return;
      }

      const doBlock = (spk) => {
        state.blockedSewerSpaces.set(spk, { turnsLeft: state.players.length + 1 });
        const [sx, sy] = spk.split(",").map(Number);
        logLine(`${player.name} played Oh... That's New! — sewer at [${sx}, ${sy}] is blocked until end of next turn.`);
      };

      if (playable.length === 1) {
        doBlock(playable[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Oh... That's New!",
        title: "Oh... That's New! — Choose a sewer space to block",
        options: playable.map((spk) => {
          const [sx, sy] = spk.split(",").map(Number);
          return { key: spk, label: `Sewer at [${sx}, ${sy}]` };
        }),
        resolve(chosenKey) {
          doBlock(chosenKey);
        }
      };
    }
  },
  // -------------------------------------------------------------------------
  {
    name: "Next Stop...HELL!!!",
    description: "Send target player to any space in the building with the most zombies. If tied, you choose which building.",
    collection: { [Z6]: 2 },
    preview() {
      let maxCount = 0;
      let maxName = null;
      state.board.forEach((tile, bk) => {
        const [tx, ty] = bk.split(",").map(Number);
        let count = 0;
        state.zombies.forEach((zdata, zk) => {
          const [zx, zy] = zk.split(",").map(Number);
          if (spaceToTileCoord(zx) === tx && spaceToTileCoord(zy) === ty) count += zdata.count;
        });
        if (count > maxCount) { maxCount = count; maxName = tile.name || bk; }
      });
      if (maxCount === 0) return "No zombies on any tile.";
      return `Will send target to ${maxName} (${maxCount} zombie(s)).`;
    },
    apply(player) {
      // Tally zombies per tile
      const tileCounts = new Map();
      state.board.forEach((tile, bk) => {
        const [tx, ty] = bk.split(",").map(Number);
        let count = 0;
        state.zombies.forEach((zdata, zk) => {
          const [zx, zy] = zk.split(",").map(Number);
          if (spaceToTileCoord(zx) === tx && spaceToTileCoord(zy) === ty) count += zdata.count;
        });
        if (count > 0) tileCounts.set(bk, { tile, count, tx, ty });
      });

      if (tileCounts.size === 0) {
        logLine(`${player.name} played Next Stop...HELL!!! — no zombies on any tile.`);
        return;
      }

      const maxCount = Math.max(...[...tileCounts.values()].map((v) => v.count));
      const topTiles = [...tileCounts.entries()].filter(([, v]) => v.count === maxCount);

      const targets = state.players.filter((p) => p.id !== player.id);
      if (targets.length === 0) {
        logLine(`${player.name} played Next Stop...HELL!!! — no other players to send.`);
        return;
      }

      const doSendToTile = (bk, tileData, target) => {
        const { tx, ty } = tileData;
        const validSpaces = new Set();
        for (let lx = 0; lx < TILE_DIM; lx++) {
          for (let ly = 0; ly < TILE_DIM; ly++) {
            if (isLocalWalkable(tileData.tile, lx, ly)) {
              validSpaces.add(key(tx * TILE_DIM + lx, ty * TILE_DIM + ly));
            }
          }
        }
        if (validSpaces.size === 0) {
          logLine(`Next Stop...HELL!!! — no walkable spaces on that tile.`);
          return;
        }
        state.pendingSpaceSelect = {
          playerId: target.id,
          cardName: "Next Stop...HELL!!!",
          validSpaces,
          promptText: `Click a space in ${tileData.tile.name || "that tile"} to place ${target.name}.`
        };
        logLine(`${player.name} played Next Stop...HELL!!! — choose where to place ${target.name} in ${tileData.tile.name || "that tile"}.`);
      };

      const doChooseTile = (target) => {
        if (topTiles.length === 1) {
          doSendToTile(...topTiles[0], target);
          return;
        }
        state.pendingEventChoice = {
          playerId: player.id,
          cardName: "Next Stop...HELL!!!",
          title: `Next Stop...HELL!!! — Choose the destination building (all have ${maxCount} zombies)`,
          options: topTiles.map(([bk, v]) => ({ key: bk, label: v.tile.name || bk })),
          resolve(chosenBk) {
            const entry = tileCounts.get(chosenBk);
            if (entry) doSendToTile(chosenBk, entry, target);
          }
        };
      };

      if (targets.length === 1) {
        doChooseTile(targets[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Next Stop...HELL!!!",
        title: "Next Stop...HELL!!! — Choose a target player",
        options: playerOpts(targets),
        resolve(optKey) {
          const target = playerFromOpt(optKey);
          if (target) doChooseTile(target);
        }
      };
    }
  },
  // -------------------------------------------------------------------------
  {
    name: "It WAS Here!?!",
    description: "Move the Helipad to another legal spot on the board.",
    collection: { [Z6]: 2 },
    preview() {
      const found = [...state.board.entries()].some(([, t]) => t.isWinTile);
      return found ? "The Helipad is on the board and can be relocated." : "No Helipad on the board.";
    },
    canPlay() {
      return [...state.board.values()].some((t) => t.isWinTile);
    },
    apply(player) {
      let helipadKey = null, helipadTile = null;
      for (const [bk, t] of state.board) {
        if (t.isWinTile) { helipadKey = bk; helipadTile = t; break; }
      }
      if (!helipadKey) {
        logLine(`${player.name} played It WAS Here!?! — no Helipad on the board.`);
        return;
      }

      const [hx, hy] = helipadKey.split(",").map(Number);

      // Move any players off the helipad to an adjacent tile before removing it
      state.players.forEach((p) => {
        if (spaceToTileCoord(p.x) !== hx || spaceToTileCoord(p.y) !== hy) return;
        const adjKeys = [[-1,0],[1,0],[0,-1],[0,1]]
          .map(([dx, dy]) => key(hx + dx, hy + dy))
          .filter((ak) => state.board.has(ak));
        if (adjKeys.length === 0) return;
        const [atx, aty] = adjKeys[0].split(",").map(Number);
        const adjTile = state.board.get(adjKeys[0]);
        for (let lx = 0; lx < TILE_DIM; lx++) {
          for (let ly = 0; ly < TILE_DIM; ly++) {
            if (isLocalWalkable(adjTile, lx, ly)) {
              p.x = atx * TILE_DIM + lx;
              p.y = aty * TILE_DIM + ly;
              logLine(`${p.name} was on the Helipad and stepped aside.`);
              return;
            }
          }
        }
      });

      // Move zombies off helipad into the pool
      state.zombies.forEach((_, zk) => {
        const [zx, zy] = zk.split(",").map(Number);
        if (spaceToTileCoord(zx) === hx && spaceToTileCoord(zy) === hy) state.zombies.delete(zk);
      });

      state.board.delete(helipadKey);

      // Find valid placements using the source template
      const sourceTile = { ...helipadTile, subTiles: undefined };
      const options = getPlacementOptions(sourceTile);

      if (options.length === 0) {
        // Restore helipad if no valid positions
        state.board.set(helipadKey, helipadTile);
        logLine(`${player.name} played It WAS Here!?! — no valid positions for the Helipad. It stays put.`);
        return;
      }

      const doPlace = (opt) => {
        const sourceSubTiles = helipadTile.subTilesTemplate || helipadTile.subTiles || {};
        const rotatedSubTiles = getRotatedSubTiles(sourceSubTiles, opt.rotation);
        addTile(opt.x, opt.y, {
          ...helipadTile,
          connectors: opt.connectors,
          ...(rotatedSubTiles ? { subTiles: rotatedSubTiles } : {})
        });
        logLine(`${player.name} played It WAS Here!?! — the Helipad moved to [${opt.x}, ${opt.y}]!`);
      };

      if (options.length === 1) {
        doPlace(options[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "It WAS Here!?!",
        title: "It WAS Here!?! — Choose where to move the Helipad",
        options: options.map((opt, i) => ({ key: String(i), label: `[${opt.x}, ${opt.y}] (rotation ${opt.rotation * 90}°)` })),
        resolve(chosenKey) {
          doPlace(options[Number(chosenKey)]);
        }
      };
    }
  },
  // -------------------------------------------------------------------------
  {
    name: "It sounded like a good idea at the time.",
    description: "Add a zombie to all sewer token spaces and all Subway Station building entrance spaces.",
    collection: { [Z6]: 2 },
    preview() {
      let count = 0;
      if (state.useSewerTokens) count += state.sewerTokenSpaces.size;
      state.board.forEach((tile, bk) => {
        if (tile.name !== TILE_NAME.SUBWAY_STATION) return;
        const [tx, ty] = bk.split(",").map(Number);
        count += subwayBuildingSpaces(tx, ty, tile).length;
      });
      return count === 0 ? "No sewer or subway entrance spaces on the board." : `Adds 1 zombie to ${count} space(s).`;
    },
    apply(player) {
      const targeted = new Set();

      if (state.useSewerTokens) {
        state.sewerTokenSpaces.forEach((_, spk) => targeted.add(spk));
      }

      state.board.forEach((tile, bk) => {
        if (tile.name !== TILE_NAME.SUBWAY_STATION) return;
        const [tx, ty] = bk.split(",").map(Number);
        subwayBuildingSpaces(tx, ty, tile).forEach((spk) => targeted.add(spk));
      });

      if (targeted.size === 0) {
        logLine(`${player.name} played It sounded like a good idea at the time. — no sewer or subway spaces.`);
        return;
      }

      targeted.forEach((spk) => {
        const existing = state.zombies.get(spk);
        if (existing) {
          existing.count += 1;
        } else {
          state.zombies.set(spk, { type: ZOMBIE_TYPE.REGULAR, count: 1 });
        }
      });

      logLine(`${player.name} played It sounded like a good idea at the time. — 1 zombie added to ${targeted.size} space(s).`);
    }
  },
  // -------------------------------------------------------------------------
  {
    name: "Inflated Self Esteem!",
    description: "Play in the Liquor Store. Skip your next turn to max out at 5 life tokens.",
    collection: { [Z6]: 2 },
    requiresTile: "Liquor Store",
    preview(player) {
      const gain = 5 - player.hearts;
      if (gain <= 0) return "Already at 5 life — you'd skip a turn with no gain.";
      return `Skip next turn to gain ${gain} life token(s): ${player.hearts} → 5.`;
    },
    apply(player) {
      const before = player.hearts;
      player.hearts = 5;
      player.cannotMoveTurns = (player.cannotMoveTurns || 0) + 1;
      logLine(`${player.name} played Inflated Self Esteem! in the Liquor Store — life maxed out (${before} → 5). Next turn is skipped.`);
    }
  },
  // -------------------------------------------------------------------------
  {
    name: "I Could Use That!",
    description: "Steal 1 bullet or 1 guts token from another player.",
    collection: { [Z6]: 2 },
    preview(player) {
      const others = state.players.filter((p) => p.id !== player.id && (p.bullets > 0 || (state.useGuts && p.guts > 0)));
      if (others.length === 0) return "No opponents have bullets or guts tokens.";
      return others.map((p) => {
        const parts = [];
        if (p.bullets > 0) parts.push(`${p.bullets} bullets`);
        if (state.useGuts && p.guts > 0) parts.push(`${p.guts} guts`);
        return `${p.name}: ${parts.join(", ")}`;
      }).join(" | ");
    },
    canPlay() {
      return state.players.some((p) => p.id !== currentPlayer().id && (p.bullets > 0 || (state.useGuts && p.guts > 0)));
    },
    apply(player) {
      const others = state.players.filter((p) => p.id !== player.id && (p.bullets > 0 || (state.useGuts && p.guts > 0)));
      if (others.length === 0) {
        logLine(`${player.name} played I Could Use That! — no opponents with bullets or guts.`);
        return;
      }

      const doSteal = (target) => {
        const opts = [];
        if (target.bullets > 0) opts.push({ key: "bullet", label: `1 bullet (${target.bullets} available)` });
        if (state.useGuts && target.guts > 0) opts.push({ key: "guts", label: `1 guts token (${target.guts} available)` });

        const takeIt = (what) => {
          if (what === "bullet") {
            target.bullets -= 1;
            player.bullets += 1;
            logLine(`${player.name} took 1 bullet from ${target.name} (I Could Use That!) — ${target.name}: ${target.bullets} left.`);
          } else {
            target.guts -= 1;
            player.guts = Math.min(MAX_GUTS, (player.guts || 0) + 1);
            logLine(`${player.name} took 1 guts token from ${target.name} (I Could Use That!) — ${target.name}: ${target.guts} left.`);
          }
        };

        if (opts.length === 1) {
          takeIt(opts[0].key);
          return;
        }

        state.pendingEventChoice = {
          playerId: player.id,
          cardName: "I Could Use That!",
          title: `I Could Use That! — Choose what to steal from ${target.name}`,
          options: opts,
          resolve(choice) { takeIt(choice); }
        };
      };

      if (others.length === 1) {
        doSteal(others[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "I Could Use That!",
        title: "I Could Use That! — Choose a player to steal from",
        options: playerOpts(others, (p) => {
          const parts = [];
          if (p.bullets > 0) parts.push(`${p.bullets} bullets`);
          if (state.useGuts && p.guts > 0) parts.push(`${p.guts} guts`);
          return `${p.name} (${parts.join(", ")})`;
        }),
        resolve(optKey) {
          const target = playerFromOpt(optKey);
          if (target) doSteal(target);
        }
      };
    }
  },
  // -------------------------------------------------------------------------
  {
    name: "We gotta get out of this place!",
    description: "All players' movement is doubled until the end of your next turn.",
    collection: { [Z6]: 2 },
    preview() {
      return state.doubleMovementCount > 0
        ? "Movement doubling is already active."
        : `All ${state.players.length} players will have movement doubled for ${state.players.length + 1} turns.`;
    },
    apply(player) {
      state.doubleMovementCount = state.players.length + 1;
      logLine(`${player.name} played We gotta get out of this place! — all players' movement doubled until end of next turn.`);
    }
  },
  // -------------------------------------------------------------------------
  {
    name: "Flood",
    description: "All players currently using the sewers are forced to the surface at their current position.",
    collection: { [Z6]: 1 },
    preview() {
      const inSewer = state.players.filter((p) => p.inSewer);
      if (inSewer.length === 0) return "No players are currently in the sewer.";
      return `Will surface: ${inSewer.map((p) => p.name).join(", ")}`;
    },
    canPlay() {
      return state.useSewerTokens && state.players.some((p) => p.inSewer);
    },
    apply(player) {
      const surfaced = state.players.filter((p) => p.inSewer);
      if (surfaced.length === 0) {
        logLine(`${player.name} played Flood — no players are in the sewer.`);
        return;
      }
      surfaced.forEach((p) => {
        p.inSewer = false;
        const surfTile = getTileAtSpace(p.x, p.y);
        const { lx: slx, ly: sly } = getSpaceLocalCoords(p.x, p.y);
        const onLegal = surfTile && isLocalWalkable(surfTile, slx, sly);
        if (onLegal) {
          logLine(`${p.name} is flooded out of the sewer — back on the surface at [${p.x}, ${p.y}].`);
          return;
        }
        // Current space is not a legal surface position — find nearest walkable road space.
        let bestDist = Infinity;
        const bestSpaces = [];
        state.board.forEach((boardTile, bk) => {
          const [tx, ty] = bk.split(",").map(Number);
          for (let lx2 = 0; lx2 < TILE_DIM; lx2++) {
            for (let ly2 = 0; ly2 < TILE_DIM; ly2++) {
              if (!isLocalWalkable(boardTile, lx2, ly2)) continue;
              const sub = boardTile.subTiles?.[key(lx2, ly2)];
              if (!sub || sub.type !== SUBTILE_TYPE.ROAD) continue;
              const w = sub.walls || [];
              if (w.includes("N") && w.includes("S") && w.includes("E") && w.includes("W")) continue;
              const sx2 = tx * TILE_DIM + lx2;
              const sy2 = ty * TILE_DIM + ly2;
              const dist = Math.abs(sx2 - p.x) + Math.abs(sy2 - p.y);
              if (dist < bestDist) {
                bestDist = dist;
                bestSpaces.length = 0;
                bestSpaces.push({ sx2, sy2 });
              } else if (dist === bestDist) {
                bestSpaces.push({ sx2, sy2 });
              }
            }
          }
        });
        if (bestSpaces.length > 0) {
          const pick = bestSpaces[Math.floor(Math.random() * bestSpaces.length)];
          p.x = pick.sx2;
          p.y = pick.sy2;
          logLine(`${p.name} is flooded out of the sewer — no legal surface space, placed at nearest road [${p.x}, ${p.y}].`);
        } else {
          logLine(`${p.name} is flooded out of the sewer but no road space found — remains at [${p.x}, ${p.y}].`);
        }
      });
      logLine(`${player.name} played Flood — ${surfaced.length} player(s) forced to the surface.`);
    }
  },
  // -------------------------------------------------------------------------
  {
    name: "Finders Keepers",
    description: "Pay 2 bullets to a player to take one weapon/item they have in play.",
    collection: { [Z6]: 2 },
    preview(player) {
      if (player.bullets < 2) return `Not enough bullets (need 2, have ${player.bullets}).`;
      const targets = state.players.filter((p) => p.id !== player.id && (p.items || []).length > 0);
      if (targets.length === 0) return "No opponents have items in play.";
      return targets.map((p) => `${p.name}: ${p.items.map((c) => c.name).join(", ")}`).join(" | ");
    },
    canPlay() {
      const p = currentPlayer();
      return p.bullets >= 2 && state.players.some((op) => op.id !== p.id && (op.items || []).length > 0);
    },
    apply(player) {
      const targets = state.players.filter((p) => p.id !== player.id && (p.items || []).length > 0);
      if (targets.length === 0) {
        logLine(`${player.name} played Finders Keepers — no opponents have items in play.`);
        return;
      }

      const doSteal = (target) => {
        const itemOpts = target.items.map((c, i) => ({ key: String(i), label: c.name }));
        state.pendingEventChoice = {
          playerId: player.id,
          cardName: "Finders Keepers",
          title: `Finders Keepers — Choose an item to take from ${target.name} (costs 2 bullets)`,
          options: itemOpts,
          resolve(chosenKey) {
            const idx = Number(chosenKey);
            const item = target.items[idx];
            if (!item) return;
            target.items.splice(idx, 1);
            player.items.push(item);
            player.bullets -= 2;
            target.bullets += 2;
            logLine(`${player.name} paid 2 bullets to ${target.name} and took ${item.name} (Finders Keepers).`);
          }
        };
      };

      if (targets.length === 1) {
        doSteal(targets[0]);
        return;
      }

      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Finders Keepers",
        title: "Finders Keepers — Choose a player to buy from",
        options: playerOpts(targets, (p) => `${p.name} (${p.items.map((c) => c.name).join(", ")})`),
        resolve(optKey) {
          const target = playerFromOpt(optKey);
          if (target) doSteal(target);
        }
      };
    }
  },
  // -------------------------------------------------------------------------
  {
    name: "Easy Come...Easy Go!",
    description: "All players remove all cards in their hands from the game permanently.",
    collection: { [Z6]: 2 },
    preview() {
      const total = state.players.reduce((sum, p) => sum + p.hand.length, 0);
      if (total === 0) return "No cards in any player's hand.";
      return state.players
        .filter((p) => p.hand.length > 0)
        .map((p) => `${p.name}: ${p.hand.length} card(s)`)
        .join(" | ");
    },
    apply(player) {
      let total = 0;
      state.players.forEach((p) => {
        total += p.hand.length;
        p.hand = [];
      });
      logLine(`${player.name} played Easy Come...Easy Go! — ${total} card(s) removed from the game permanently.`);
    }
  },
  // -------------------------------------------------------------------------
  {
    name: "Back At Ya!",
    description: "Play when a card targets a player. That card now also affects the player who originally played it.",
    collection: { [Z6]: 2 },
    canPlay() {
      const last = state.lastPlayedEventCard;
      return !!(last && last.playerId !== currentPlayer().id);
    },
    preview(player) {
      const last = state.lastPlayedEventCard;
      if (!last) return "No card was just played.";
      const caster = state.players.find((p) => p.id === last.playerId);
      if (!caster || caster.id === player.id) return "Last card was not played by an opponent.";
      return `Will also apply "${last.card.name}" to ${caster.name}.`;
    },
    apply(player) {
      const last = state.lastPlayedEventCard;
      if (!last) {
        logLine(`${player.name} played Back At Ya! — no card to reflect.`);
        return;
      }
      const caster = state.players.find((p) => p.id === last.playerId);
      if (!caster) {
        logLine(`${player.name} played Back At Ya! — original player not found.`);
        return;
      }
      logLine(`${player.name} played Back At Ya! — "${last.card.name}" now also affects ${caster.name}!`);
      if (last.card.apply) last.card.apply(caster, buildEventDeckHelpers());
    }
  },
  // -------------------------------------------------------------------------
  {
    name: "Are You Scared Yet?",
    description: "All weapon and item cards have no effect until the end of your next turn.",
    collection: { [Z6]: 2 },
    preview() {
      return state.itemsDisabledCount > 0
        ? "Items are already disabled."
        : `Will disable all weapons and items for ${state.players.length + 1} turns.`;
    },
    apply(player) {
      state.itemsDisabledCount = state.players.length + 1;
      state.weaponsJammedCount = Math.max(state.weaponsJammedCount, state.players.length + 1);
      logLine(`${player.name} played Are You Scared Yet? — all weapon/item cards have no effect until end of next turn.`);
    }
  }
);
