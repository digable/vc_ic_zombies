const playerEventCards = [
  {
    name: "Adrenaline Rush",
    description: "Choose: double movement this turn OR +2 to a combat roll",
    count: 2,
    collection: TILE_COLLECTIONS.DIRECTORS_CUT,
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
    count: 2,
    collection: TILE_COLLECTIONS.DIRECTORS_CUT,
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
    count: 2,
    collection: TILE_COLLECTIONS.DIRECTORS_CUT,
    apply(player) {
      player.noCombatThisTurn = true;
      logLine(`${player.name} played Alternate Food Source. Combat is disabled this turn.`);
    }
  },
  {
    name: "Chainsaw",
    description: "Play in the Lawn & Garden Store to place in front of you. Select in combat to gain +2 to that combat roll (discarded after use).",
    count: 2,
    collection: TILE_COLLECTIONS.DIRECTORS_CUT,
    isItem: true,
    isWeapon: true,
    combatWeapon: true,
    combatBoost: 2,
    requiresTile: "Lawn & Garden Store",
    apply(player) {
      logLine(`${player.name} placed Chainsaw in front of them.`);
    }
  },
  {
    name: "Fire Axe",
    description: "Play in the Fire Station to place in front of you. Select in combat for +1 permanent combat bonus (discarded after use).",
    count: 2,
    collection: TILE_COLLECTIONS.DIRECTORS_CUT,
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
    description: "Play in the Hospital or Pharmacy to place in front of you. Discard instead of losing a health token during combat (free reroll).",
    count: 2,
    collection: TILE_COLLECTIONS.DIRECTORS_CUT,
    isItem: true,
    requiresTile: ["Hospital", "Pharmacy"],
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
    count: 2,
    collection: TILE_COLLECTIONS.DIRECTORS_CUT,
    isWeapon: true,
    apply(player) {
      player.shotgunCharges = 3;
      logLine(`${player.name} found a Shotgun! (+1 to next 3 combat rolls, ${player.shotgunCharges} charge(s) total).`);
    }
  },
  {
    name: "Keys Are Still In It",
    description: "Move up to 10 spaces in place of making a movement roll. Zombies must be fought as normal.",
    count: 1,
    collection: TILE_COLLECTIONS.DIRECTORS_CUT,
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
    count: 2,
    collection: TILE_COLLECTIONS.DIRECTORS_CUT,
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
    name: "Much Needed Rest",
    description: "Play instead of making a movement roll. Gain 2 health.",
    count: 2,
    collection: TILE_COLLECTIONS.DIRECTORS_CUT,
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
    name: "Skateboard",
    description: "Play in the Skate Shop to place in front of you. Discard to gain +2 to all movement rolls permanently.",
    count: 2,
    collection: TILE_COLLECTIONS.DIRECTORS_CUT,
    isItem: true,
    isWeapon: true,
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
    name: "This Isn't So Bad",
    description: "Move any 2 zombies to any legal space.",
    count: 2,
    collection: TILE_COLLECTIONS.DIRECTORS_CUT,
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
