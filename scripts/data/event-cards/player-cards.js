const playerEventCards = [
  {
    name: "Adrenaline Rush",
    description: "+3 movement this turn",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player) {
      if (state.step === STEP.MOVE) {
        state.movesRemaining += 3;
      } else {
        state.movementBonus += 3;
      }
      logLine(`${player.name} played Adrenaline Rush (+3 movement).`);
    }
  },
  {
    name: "All The Marbles",
    description: "+2 combat this turn",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player) {
      player.tempCombatBonus += 2;
      logLine(`${player.name} played All The Marbles (+2 combat this turn).`);
    }
  },
  {
    name: "Alternate Food Source",
    description: "No combat this turn",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player) {
      player.noCombatThisTurn = true;
      logLine(`${player.name} played Alternate Food Source. Combat is disabled this turn.`);
    }
  },
  {
    name: "Chainsaw",
    description: "+1 permanent combat bonus",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player) {
      player.attack += 1;
      logLine(`${player.name} played Chainsaw (+1 permanent combat).`);
    }
  },
  {
    name: "Fire Axe",
    description: "+1 combat this turn",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player) {
      player.tempCombatBonus += 1;
      logLine(`${player.name} played Fire Axe (+1 combat this turn).`);
    }
  },
  {
    name: "First Aid Kit",
    description: "+2 hearts (max 5)",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player) {
      player.hearts = Math.min(5, player.hearts + 2);
      logLine(`${player.name} played First Aid Kit (+2 hearts).`);
    }
  },
  {
    name: "Hey, Look! A Shotgun!",
    description: "+2 combat this turn",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player) {
      player.tempCombatBonus += 2;
      logLine(`${player.name} played Hey, Look! A Shotgun! (+2 combat this turn).`);
    }
  },
  {
    name: "Keys Are Still In It",
    description: "Move to any Parking Lot",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player, helpers) {
      const moved = helpers.moveToParkingLot(player);
      logLine(moved
        ? `${player.name} played Keys Are Still In It and drove to a Parking Lot.`
        : `${player.name} played Keys Are Still In It, but no Parking Lot is on the board.`);
    }
  },
  {
    name: "Lots Of Ammo",
    description: "+3 bullets",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player) {
      player.bullets += 3;
      logLine(`${player.name} played Lots Of Ammo (+3 bullets).`);
    }
  },
  {
    name: "Much Needed Rest",
    description: "+1 heart (max 5)",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player) {
      player.hearts = Math.min(5, player.hearts + 1);
      logLine(`${player.name} played Much Needed Rest (+1 heart).`);
    }
  },
  {
    name: "Skateboard",
    description: "Move up to 6 spaces this turn",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player) {
      if (state.step === STEP.MOVE) {
        state.movesRemaining = Math.max(state.movesRemaining, 6);
      } else {
        state.moveFloorThisTurn = Math.max(state.moveFloorThisTurn || 0, 6);
      }
      logLine(`${player.name} played Skateboard (minimum 6 movement this turn).`);
    }
  },
  {
    name: "This Isn't So Bad",
    description: "+1 combat this turn",
    count: 2,
    collection: TILE_COLLECTIONS.ORIGINAL,
    apply(player) {
      player.tempCombatBonus += 1;
      logLine(`${player.name} played This Isn't So Bad (+1 combat this turn).`);
    }
  }
];
