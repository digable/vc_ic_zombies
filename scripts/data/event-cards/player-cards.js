// ---------------------------------------------------------------------------
// Player event cards — buffs and recovery for yourself
// ---------------------------------------------------------------------------
// Card properties:
//   name        {string}         Display name (must match deck/hand references)
//   description {string}         Shown on the card face in hand
//   collection  {object}         { [COLLECTIONS.*]: count } — keys are collections, values are copy counts
//   apply(player, helpers)       Called when the card is played from hand
//
// Item card extras (isItem: true cards sit in front of you until activated):
//   isItem               {true}           Card stays in play; discarded on activation
//   isWeapon             {true}           Can be targeted by "Butter Fingers"
//   combatWeapon         {true}           Selectable during combat (discarded after use)
//   combatBoost          {number}         One-time combat roll bonus when used as combatWeapon
//   turnCombatBoost      {number}         +N to this combat AND all remaining combats this turn (discarded after use)
//   oncePerTurnCombatBoost {number}       +N to one combat roll per turn — card stays in play, not discarded
//   permanentAttackBoost {number}         Permanently adds to player.attack on use
//   requiresTile         {string|string[]} Tile name(s) the player must be on to play
//   activateItem(player, helpers)         Called when the player discards the item
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Shared helpers — used by multiple cards below
// ---------------------------------------------------------------------------

// canPlay() check: true when the current player is on a building, named, or mall store tile.
function isOnBuildingOrStoreTile() {
  const tile = getTileAtSpace(currentPlayer().x, currentPlayer().y);
  return !!(tile && (
    tile.type === TILE_TYPE.BUILDING ||
    tile.type === TILE_TYPE.NAMED    ||
    tile.type === TILE_TYPE.MALL_STORE
  ));
}

// Iterate every subtile of the tile at (tx, ty).
// fn(lx, ly, spaceKey) — lx/ly are local 0-2 coords; spaceKey is the global space key.
function forEachTileSpace(tx, ty, fn) {
  for (let lx = 0; lx < TILE_DIM; lx += 1) {
    for (let ly = 0; ly < TILE_DIM; ly += 1) {
      fn(lx, ly, key(tx * TILE_DIM + lx, ty * TILE_DIM + ly));
    }
  }
}

// Reduce target.hearts by amount; trigger knockout if hearts drop to 0 or below.
function damagePlayer(target, amount, knockoutOptions) {
  target.hearts -= amount;
  if (target.hearts <= 0) handleKnockout(target, knockoutOptions);
}

// ---------------------------------------------------------------------------

const playerEventCards = [
  {
    name: "Dynamite",
    description: "Roll 1 die. 4–6: kill all zombies on 3 adjacent spaces (including diagonals). 1–3: lose 2 life tokens.",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    isWeapon: true,
    apply(player) {
      const roll = rollD6();
      logLine(`${player.name} played Dynamite — rolled ${roll}.`);
      if (roll >= 4) {
        const adjacentZombies = [...state.zombies.keys()].filter((zk) => {
          const [zx, zy] = zk.split(",").map(Number);
          return Math.abs(zx - player.x) <= 1 && Math.abs(zy - player.y) <= 1 && !(zx === player.x && zy === player.y);
        });
        if (adjacentZombies.length === 0) {
          logLine(`${player.name}'s Dynamite succeeded but there are no adjacent zombies.`);
          return;
        }
        state.pendingDynamiteTarget = { playerId: player.id, remaining: 3 };
        logLine(`${player.name}'s Dynamite succeeded! Select up to 3 adjacent zombie spaces to destroy.`);
      } else {
        logLine(`${player.name}'s Dynamite fizzled — loses 2 life tokens.`);
        damagePlayer(player, 2, { endStep: true });
      }
    }
  },
  {
    name: "Breakthrough",
    description: "Play during movement. Choose a direction to break through to an adjacent tile. Roll: 5–6 creates a permanent path and you may move through; 4 or less loses 1 life and ends movement. Cannot be used to/from the Helipad.",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    canPlay() {
      return state.step === STEP.MOVE && state.movesRemaining > 0 &&
             !state.pendingBreakthrough && !state.pendingForcedMove;
    },
    apply(player) {
      state.pendingBreakthrough = { playerId: player.id };
      logLine(`${player.name} played Breakthrough — choose a direction to attempt to break through.`);
    }
  },
  {
    name: "Adjusting Nicely",
    description: "Play when you have 13+ kills. Triggers automatically on knockout — discard to keep all kills.",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    isItem: true,
    canPlay() {
      return currentPlayer().kills >= 13;
    },
    apply(player) {
      logLine(`${player.name} placed Adjusting Nicely in front of them — kills are protected on next knockout.`);
    }
  },
  {
    name: "Adrenaline Rush",
    description: "Choose: double movement this turn OR +2 to a combat roll",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    apply(player) {
      logLine(`${player.name} played Adrenaline Rush — choose an effect.`);
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Adrenaline Rush",
        options: [
          { key: "double_move", label: "Double movement this turn" },
          { key: "combat_plus_2", label: "+2 to a combat roll this turn" }
        ],
        resolve(optionKey) {
          if (optionKey === "double_move") {
            if (state.step === STEP.MOVE) {
              state.movesRemaining *= 2;
            } else {
              state.doubleMovementThisTurn = true;
            }
            logLine(`${player.name} chose Adrenaline Rush: double movement.`);
          } else {
            player.tempCombatBonus += 2;
            logLine(`${player.name} chose Adrenaline Rush: +2 combat this turn.`);
          }
        }
      };
    }
  },
  {
    name: "All The Marbles",
    description: "Play in the Toy Store to place in front of you. Discard to freeze all zombie movement until after your next turn.",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    isItem: true,
    requiresTile: "Toy Store",
    apply(player) {
      logLine(`${player.name} placed All The Marbles in front of them.`);
    },
    activateItem(player) {
      state.zombieMoveFreezeCount = state.players.length;
      logLine(`${player.name} discarded All The Marbles — zombie movement frozen for ${state.players.length} turn(s).`);
    }
  },
  {
    name: "Alternate Food Source",
    description: "No combat this turn",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    apply(player) {
      player.noCombatThisTurn = true;
      logLine(`${player.name} played Alternate Food Source. Combat is disabled this turn.`);
    }
  },
  {
    name: "You Want Fries with That?",
    description: "Play in the Food Court to place in front of you. Discard to permanently mark this tile — no zombies may move onto it for the rest of the game.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    isItem: true,
    requiresTile: "Food Court",
    apply(player) {
      logLine(`${player.name} placed You Want Fries with That? in front of them.`);
    },
    activateItem(player) {
      if (!state.noZombieTiles) state.noZombieTiles = new Set();
      const tileKey = key(spaceToTileCoord(player.x), spaceToTileCoord(player.y));
      state.noZombieTiles.add(tileKey);
      const tile = getTileAtSpace(player.x, player.y);
      const tileName = tile ? getTileDisplayName(tile) : "current tile";
      logLine(`${player.name} discarded You Want Fries with That? — no zombies may move onto ${tileName} for the rest of the game.`);
    }
  },
  {
    name: "Chainsaw",
    description: "Play in the Lawn & Garden Store to place in front of you. Select in combat to gain +2 to all combat rolls for the rest of your turn (discarded after use).",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    isItem: true,
    isWeapon: true,
    combatWeapon: true,
    turnCombatBoost: 2,
    requiresTile: "Lawn & Garden Store",
    apply(player) {
      logLine(`${player.name} placed ${this.name} in front of them.`);
    }
  },
  {
    name: "Fire Axe",
    description: "Play in the Fire Station to place in front of you. Select in combat for +1 permanent combat bonus (discarded after use).",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    isItem: true,
    isWeapon: true,
    combatWeapon: true,
    permanentAttackBoost: 1,
    requiresTile: "Fire Station",
    apply(player) {
      logLine(`${player.name} placed ${this.name} in front of them.`);
    }
  },
  {
    name: "First Aid Kit",
    description: "Play in the Hospital or Drug Store to place in front of you. Discard instead of losing a health token during combat (free reroll).",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    isItem: true,
    requiresTile: ["Hospital", "Drug Store"],
    apply(player) {
      logLine(`${player.name} placed ${this.name} in front of them.`);
    },
    activateItem(player) {
      logLine(`${player.name} used the First Aid Kit.`);
    }
  },
  {
    name: "Hey, Look! A Shotgun!",
    description: "+1 to your next 3 combat rolls.",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    isWeapon: true,
    apply(player) {
      player.shotgunCharges = 3;
      logLine(`${player.name} found a Shotgun! (+1 to next 3 combat rolls, ${player.shotgunCharges} charge(s) total).`);
    }
  },
  {
    name: "Keys Are Still In It",
    description: "Move up to 10 spaces in place of making a movement roll. Zombies must be fought as normal.",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 1 },
    apply(player) {
      if (state.step === STEP.ROLL_MOVE) {
        state.currentMoveRoll = null;
        state.movesRemaining = 10;
        state.movementBonus = 0;
        state.moveFloorThisTurn = 0;
        state.step = STEP.MOVE;
        logLine(`${player.name} played Keys Are Still In It — 10 spaces to move, no roll needed.`);
      } else if (state.step === STEP.MOVE) {
        state.movesRemaining = 10;
        logLine(`${player.name} played Keys Are Still In It — movement set to 10 spaces.`);
      } else {
        state.moveFloorThisTurn = Math.max(state.moveFloorThisTurn, 10);
        logLine(`${player.name} played Keys Are Still In It — will move up to 10 spaces this turn.`);
      }
    }
  },
  {
    name: "Lots Of Ammo",
    description: "Play in the Sporting Goods Store to place in front of you. Discard to gain 3 bullets.",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    isItem: true,
    requiresTile: "Sporting Goods Store",
    apply(player) {
      logLine(`${player.name} placed ${this.name} in front of them.`);
    },
    activateItem(player) {
      player.bullets += 3;
      logLine(`${player.name} used Lots Of Ammo (+3 bullets).`);
    }
  },
  {
    name: "Mine Field",
    description: "Roll a die. Click a tile to remove that many zombies from its road spaces — they count as kills.",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    apply(player) {
      const roll = rollD6();
      logLine(`${player.name} played Mine Field — rolled ${roll}. Click a tile to detonate.`);
      state.pendingMinefield = { playerId: player.id, remaining: roll };
    }
  },
  {
    name: "Much Needed Rest",
    description: "Play instead of making a movement roll. Gain 2 health.",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    canPlay() { return state.step === STEP.ROLL_MOVE; },
    apply(player) {
      player.hearts = Math.min(5, player.hearts + 2);
      if (state.step === STEP.ROLL_MOVE) {
        state.currentMoveRoll = null;
        state.movesRemaining = 0;
        state.step = STEP.MOVE_ZOMBIES;
        autoSkipZombieMoveIfClear();
      }
      logLine(`${player.name} played Much Needed Rest (+2 hearts, movement skipped).`);
    }
  },
  {
    name: "Rocket Launcher",
    description: "Play in the Armory to place in front of you. Discard to destroy an edge tile — all zombies on it count as kills, and any players on it are moved to Town Square. Cannot target the Helipad.",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    isItem: true,
    isWeapon: true,
    requiresTile: "Armory",
    apply(player) {
      logLine(`${player.name} placed ${this.name} in front of them.`);
    },
    activateItem(player) {
      state.pendingRocketLauncher = { playerId: player.id };
      logLine(`${player.name} armed the Rocket Launcher — click an edge tile to destroy it.`);
    }
  },
  {
    name: "Skateboard",
    description: "Play in the Skate Shop to place in front of you. Discard to gain +2 to all movement rolls permanently.",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    isItem: true,
    isWeapon: true, // allows Butter Fingers to target it even though it's a movement item
    requiresTile: "Skate Shop",
    apply(player) {
      logLine(`${player.name} placed ${this.name} in front of them.`);
    },
    activateItem(player) {
      player.movementBonus = (player.movementBonus || 0) + 2;
      logLine(`${player.name} hopped on the Skateboard (+2 to all movement rolls).`);
    }
  },
  {
    name: "I See the Helicopter",
    description: "Play after a Helipad is placed. While in front of you, +1 to all movement rolls. Counts as a weapon.",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    isItem: true,
    isWeapon: true,
    canPlay() {
      return [...state.board.values()].some((t) => t.type === "helipad");
    },
    apply(player) {
      logLine(`${player.name} placed I See the Helicopter in front of them — +1 to all movement rolls while in play.`);
    }
  },
  {
    name: "I Feel ALIVE!!!",
    description: "Roll 2 dice. If both are 4+, gain 2 life (max 5).",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    apply(player) {
      const r1 = rollD6();
      const r2 = rollD6();
      logLine(`${player.name} played I Feel ALIVE!!! — rolled ${r1} and ${r2}.`);
      if (r1 >= 4 && r2 >= 4) {
        const gained = Math.min(2, 5 - player.hearts);
        player.hearts = Math.min(5, player.hearts + 2);
        logLine(`${player.name} gained ${gained} life token(s) (now ${player.hearts}).`);
      } else {
        logLine(`${player.name} needed 4+ on both dice — no life gained.`);
      }
    }
  },
  {
    name: "In the Zone",
    description: "Play at start of turn. Draw a card for each natural 6 rolled this turn. Discard to 3 at end of turn.",
    collection: { [COLLECTIONS.ZOMBIE_CORPS_E_]: 2 },
    canPlay() {
      return state.step === STEP.DRAW_TILE || state.step === STEP.COMBAT ||
             state.step === STEP.DRAW_EVENTS || state.step === STEP.ROLL_MOVE;
    },
    apply(player) {
      player.inTheZone = true;
      logLine(`${player.name} played In the Zone — will draw a card for each natural 6 rolled this turn.`);
    }
  },
  {
    name: "This Isn't So Bad",
    description: "Move any 2 zombies to any legal space.",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    apply(player) {
      if (state.zombies.size === 0) {
        logLine(`${player.name} played This Isn't So Bad, but there are no zombies to move.`);
        return;
      }
      state.pendingZombieReplace = { remaining: Math.min(2, state.zombies.size), selectedZombieKey: null };
      logLine(`${player.name} played This Isn't So Bad — select up to 2 zombies to relocate.`);
    }
  },
  {
    name: "Crossbow",
    description: "Play in the Outfitter to place in front of you. While in play, add +1 to one combat roll per turn.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    isItem: true,
    isWeapon: true,
    combatWeapon: true,
    oncePerTurnCombatBoost: 1,
    requiresTile: "Outfitter",
    apply(player) {
      logLine(`${player.name} placed ${this.name} in front of them.`);
    }
  },
  {
    name: "Clearance Sale",
    description: "Remove all zombies from mall hallway spaces on your current tile. Each counts as a kill.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    apply(player) {
      const tile = getTileAtSpace(player.x, player.y);
      if (!tile?.subTiles) {
        logLine(`${player.name} played Clearance Sale — no subtile data on this tile.`);
        return;
      }
      const tx = spaceToTileCoord(player.x);
      const ty = spaceToTileCoord(player.y);
      let killed = 0;
      forEachTileSpace(tx, ty, (lx, ly, sk) => {
        if (tile.subTiles[key(lx, ly)]?.type === "mall hallway" && state.zombies.has(sk)) {
          state.zombies.delete(sk);
          killed += 1;
        }
      });
      player.kills += killed;
      if (killed === 0) {
        logLine(`${player.name} played Clearance Sale — no zombies on mall hallway spaces.`);
      } else {
        logLine(`${player.name} played Clearance Sale — cleared ${killed} zombie(s) from mall hallway spaces (+${killed} kills).`);
      }
    }
  },
  {
    name: "Clean up in Aisle 5",
    description: "Play in a building or store. Remove all zombies from the tile and distribute them one at a time clockwise to all players — each counts as a kill.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    canPlay: isOnBuildingOrStoreTile,
    apply(player) {
      const tx = spaceToTileCoord(player.x);
      const ty = spaceToTileCoord(player.y);
      const zombieKeys = [];
      forEachTileSpace(tx, ty, (_lx, _ly, sk) => {
        if (state.zombies.has(sk)) zombieKeys.push(sk);
      });
      if (zombieKeys.length === 0) {
        logLine(`${player.name} played Clean up in Aisle 5 — no zombies on this tile.`);
        return;
      }
      zombieKeys.forEach((sk) => state.zombies.delete(sk));
      const n = state.players.length;
      const startIdx = state.currentPlayerIndex;
      const counts = {};
      zombieKeys.forEach((_, i) => {
        const recipient = state.players[(startIdx + i) % n];
        recipient.kills += 1;
        counts[recipient.id] = (counts[recipient.id] || 0) + 1;
      });
      const summary = state.players
        .filter((p) => counts[p.id])
        .map((p) => `${p.name} +${counts[p.id]}`)
        .join(", ");
      logLine(`${player.name} played Clean up in Aisle 5 — ${zombieKeys.length} zombie(s) distributed: ${summary}.`);
    }
  },
  {
    name: "Barricade the Door",
    description: "Play in a building or store. Remove all zombies from building/store subtiles and place them on adjacent walkway, street, grass, or parking spaces.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    canPlay: isOnBuildingOrStoreTile,
    apply(player) {
      const tx = spaceToTileCoord(player.x);
      const ty = spaceToTileCoord(player.y);
      const tile = state.board.get(key(tx, ty));

      const BUILDING_TYPES = new Set(["building", "mall store"]);
      const OUTSIDE_TYPES  = new Set(["road", "grass", "parking", "mall hallway"]);
      const ORTHO = [[0, -1], [0, 1], [-1, 0], [1, 0]];

      // Collect zombies from building/store subtiles only
      const removed = [];
      const buildingSpaces = new Set();
      forEachTileSpace(tx, ty, (lx, ly, sk) => {
        const sub = tile?.subTiles?.[key(lx, ly)];
        if (!sub || !BUILDING_TYPES.has(sub.type)) return;
        buildingSpaces.add(sk);
        if (state.zombies.has(sk)) {
          removed.push(state.zombies.get(sk));
          state.zombies.delete(sk);
        }
      });

      if (removed.length === 0) {
        logLine(`${player.name} played Barricade the Door — no zombies in building or store spaces.`);
        return;
      }

      // Find adjacent spaces with road/grass/parking/hallway subtile type
      const outsideSpaces = new Set();
      for (const bsk of buildingSpaces) {
        const { x: bx, y: by } = parseKey(bsk);
        for (const [dx, dy] of ORTHO) {
          const nx = bx + dx;
          const ny = by + dy;
          const nsk = key(nx, ny);
          if (buildingSpaces.has(nsk)) continue; // still a building space
          if (state.zombies.has(nsk)) continue;
          const ntx = spaceToTileCoord(nx);
          const nty = spaceToTileCoord(ny);
          if (state.noZombieTiles?.has(key(ntx, nty))) continue;
          const neighborTile = state.board.get(key(ntx, nty));
          if (!neighborTile) continue;
          const nlx = getLocalCoord(nx, ntx);
          const nly = getLocalCoord(ny, nty);
          if (!isSubtileZombieViable(neighborTile, nlx, nly)) continue;
          const nsub = neighborTile.subTiles?.[key(nlx, nly)];
          if (!nsub || !OUTSIDE_TYPES.has(nsub.type)) continue;
          outsideSpaces.add(nsk);
        }
      }

      const targets = [...outsideSpaces];
      let placed = 0;
      for (let i = 0; i < removed.length && i < targets.length; i += 1) {
        state.zombies.set(targets[i], removed[i]);
        placed += 1;
      }
      const lost = removed.length - placed;
      let msg = `${player.name} played Barricade the Door — ${removed.length} zombie(s) pushed out of building spaces, ${placed} placed on walkways/streets.`;
      if (lost > 0) msg += ` ${lost} had nowhere to go.`;
      logLine(msg);
    }
  },
  {
    name: "We're all gonna die!",
    description: "Click a tile to place 1 zombie on every legal walkable space on it.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 1 },
    apply(player) {
      state.pendingZombieFlood = { playerId: player.id };
      logLine(`${player.name} played We're all gonna die! — click a tile to flood it with zombies.`);
    }
  },
  {
    name: "Abandon All Hope",
    description: "Target another player. They suffer -1 to all die rolls during their next turn.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    canPlay() {
      return state.players.length > 1;
    },
    apply(player) {
      const others = state.players.filter((p) => p.id !== player.id);
      if (others.length === 1) {
        others[0].nextTurnDieRollPenalty = (others[0].nextTurnDieRollPenalty || 0) + 1;
        logLine(`${player.name} played Abandon All Hope — ${others[0].name} suffers -1 to all die rolls next turn.`);
        return;
      }
      state.pendingEventChoice = {
        playerId: player.id,
        cardName: "Abandon All Hope",
        options: others.map((p) => ({ key: String(p.id), label: p.name })),
        resolve(optionKey) {
          const target = state.players.find((p) => String(p.id) === optionKey);
          if (!target) return;
          target.nextTurnDieRollPenalty = (target.nextTurnDieRollPenalty || 0) + 1;
          logLine(`${player.name} played Abandon All Hope — ${target.name} suffers -1 to all die rolls next turn.`);
        }
      };
      logLine(`${player.name} played Abandon All Hope — choose a target.`);
    }
  },
  {
    name: "Hello, may I help you?",
    description: "Place a zombie on every player's current space, including your own.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    apply(player) {
      let placed = 0;
      state.players.forEach((p) => {
        const spaceKey = key(p.x, p.y);
        const ptile = getTileAtSpace(p.x, p.y);
        const plx = getLocalCoord(p.x, spaceToTileCoord(p.x));
        const ply = getLocalCoord(p.y, spaceToTileCoord(p.y));
        if (!state.zombies.has(spaceKey) && isSubtileZombieViable(ptile, plx, ply)) {
          state.zombies.set(spaceKey, { type: ZOMBIE_TYPE.REGULAR });
          placed += 1;
        }
      });
      logLine(`${player.name} played Hello, may I help you? — ${placed} zombie(s) placed on player spaces.`);
    }
  },
  {
    name: "I Will Survive! (You. on the other hand may not...)",
    description: "Play when on the same space as another player. Both roll 1 die (+1 for you). Lowest roll loses 1 heart — you win ties. No bullets may be spent.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    canPlay() {
      const cp = currentPlayer();
      return state.players.some((p) => p.id !== cp.id && p.x === cp.x && p.y === cp.y);
    },
    apply(player) {
      const opponent = state.players.find((p) => p.id !== player.id && p.x === player.x && p.y === player.y);
      if (!opponent) {
        logLine(`${player.name} played I Will Survive! but no other player is here.`);
        return;
      }
      const myRoll = rollD6();
      const theirRoll = rollD6();
      const myTotal = myRoll + 1;
      logLine(`${player.name} played I Will Survive! — ${player.name} rolled ${myRoll}+1=${myTotal}, ${opponent.name} rolled ${theirRoll}.`);
      if (myTotal >= theirRoll) {
        logLine(`${player.name} wins — ${opponent.name} loses 1 heart (now ${opponent.hearts - 1}).`);
        damagePlayer(opponent, 1, { endStep: false });
      } else {
        logLine(`${opponent.name} wins — ${player.name} loses 1 heart (now ${player.hearts - 1}).`);
        damagePlayer(player, 1, { endStep: false });
      }
    }
  },
  {
    name: "Jammed",
    description: "Players may not use weapons or spend bullet tokens until the end of your next turn.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    apply(player) {
      state.weaponsJammedCount = state.players.length + 1;
      logLine(`${player.name} played Jammed — weapons and bullets are disabled for ${state.players.length + 1} turn(s).`);
    }
  },
  {
    name: "Lots of Luck with That!",
    description: "Play when on the same space as another player. Your movement ends and you take 1 bullet and 1 random card from that player.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    canPlay() {
      const cp = currentPlayer();
      return state.players.some((p) => p.id !== cp.id && p.x === cp.x && p.y === cp.y);
    },
    apply(player) {
      const target = state.players.find((p) => p.id !== player.id && p.x === player.x && p.y === player.y);
      if (!target) {
        logLine(`${player.name} played Lots of Luck with That! — no co-located player found.`);
        return;
      }
      if (state.step === STEP.MOVE) state.movesRemaining = 0;
      let gained = [];
      if (target.bullets > 0) {
        target.bullets -= 1;
        player.bullets += 1;
        gained.push("1 bullet");
      }
      if (target.hand && target.hand.length > 0) {
        const idx = Math.floor(Math.random() * target.hand.length);
        const stolen = target.hand.splice(idx, 1)[0];
        player.hand.push(stolen);
        gained.push(`${stolen.name} (card)`);
      }
      const gainedText = gained.length > 0 ? gained.join(" and ") : "nothing (target had no bullets or cards)";
      logLine(`${player.name} played Lots of Luck with That! — took ${gainedText} from ${target.name}. Movement ends.`);
    }
  },
  {
    name: "Lucky Shot",
    description: "Play while in combat: spend 1 bullet to automatically kill the zombie you are fighting.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    // No apply() — this card is used directly from the combat panel (like First Aid Kit).
  },
  {
    name: "Now that's just gross!",
    description: "Play in the Lingerie Shop to place in front of you. Discard to immediately move to any space adjoining a building or store.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    isItem: true,
    requiresTile: "Lingerie Shop",
    apply(player) {
      logLine(`${player.name} placed Now that's just gross! in front of them.`);
    },
    activateItem(player) {
      const valid = getSpacesAdjoiningBuilding();
      if (valid.size === 0) {
        logLine(`${player.name} discarded Now that's just gross! — no valid spaces found.`);
        return;
      }
      state.pendingSpaceSelect = { playerId: player.id, cardName: "Now that's just gross!" };
      logLine(`${player.name} discarded Now that's just gross! — click a highlighted space to move there.`);
    }
  },
  {
    name: "Sprinkler System",
    description: "No zombies in the mall may move until the end of your next turn. All combat occurs as normal.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    apply(player) {
      state.zombieMoveFreezeCount = state.players.length + 1;
      logLine(`${player.name} played Sprinkler System — zombie movement frozen for ${state.players.length + 1} phase(s).`);
    }
  },
  {
    name: "One Man's Garbage",
    description: "Play in the Consignment Shop to place in front of you. Discard to retrieve the top card from the event discard pile into your hand.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    isItem: true,
    requiresTile: "Consignment Shop",
    apply(player) {
      logLine(`${player.name} placed One Man's Garbage in front of them.`);
    },
    activateItem(player) {
      if (state.eventDiscardPile.length === 0) {
        logLine(`${player.name} discarded One Man's Garbage — the discard pile is empty.`);
        return;
      }
      const retrieved = state.eventDiscardPile.pop();
      player.hand.push(retrieved);
      logLine(`${player.name} discarded One Man's Garbage — retrieved ${retrieved.name} from the discard pile.`);
    }
  },
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
  },
  {
    name: "Aww, isn't he cute!",
    description: "Play in the Pet Store to place in front of you. Discard to ignore all zombie combat on your current tile for the remainder of the turn.",
    collection: { [COLLECTIONS.MALL_WALKERS]: 2 },
    isItem: true,
    requiresTile: "Pet Store",
    apply(player) {
      logLine(`${player.name} placed Aww, isn't he cute! in front of them.`);
    },
    activateItem(player) {
      player.noCombatThisTurn = true;
      logLine(`${player.name} discarded Aww, isn't he cute! — zombie combat ignored on this tile for the rest of the turn.`);
    }
  }
];
