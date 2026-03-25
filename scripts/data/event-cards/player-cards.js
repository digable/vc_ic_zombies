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
//   isItem      {true}           Card stays in play; discarded on activation
//   isWeapon    {true}           Can be targeted by "Butter Fingers"
//   combatWeapon {true}          Selectable during combat (discarded after use)
//   combatBoost {number}         One-time combat roll bonus when used as combatWeapon
//   permanentAttackBoost {number} Permanently adds to player.attackBonus on use
//   requiresTile {string|string[]} Tile name(s) the player must be on to play
//   activateItem(player, helpers) Called when the player discards the item
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
        player.hearts -= 2;
        logLine(`${player.name}'s Dynamite fizzled — loses 2 life tokens.`);
        if (player.hearts <= 0) {
          handleKnockout(player, { endStep: true });
        }
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
    name: "Chainsaw",
    description: "Play in the Lawn & Garden Store to place in front of you. Select in combat to gain +2 to all combat rolls for the rest of your turn (discarded after use).",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    isItem: true,
    isWeapon: true,
    combatWeapon: true,
    turnCombatBoost: 2,
    requiresTile: "Lawn & Garden Store",
    apply(player) {
      logLine(`${player.name} placed Chainsaw in front of them.`);
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
      logLine(`${player.name} placed Fire Axe in front of them.`);
    }
  },
  {
    name: "First Aid Kit",
    description: "Play in the Hospital or Drug Store to place in front of you. Discard instead of losing a health token during combat (free reroll).",
    collection: { [COLLECTIONS.DIRECTORS_CUT]: 2 },
    isItem: true,
    requiresTile: ["Hospital", "Drug Store"],
    apply(player) {
      logLine(`${player.name} placed First Aid Kit in front of them.`);
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
      logLine(`${player.name} placed Lots Of Ammo in front of them.`);
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
      logLine(`${player.name} placed Rocket Launcher in front of them.`);
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
      logLine(`${player.name} placed Skateboard in front of them.`);
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
  }
];
