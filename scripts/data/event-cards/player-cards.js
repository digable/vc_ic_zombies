function addPlayerEventCards(pushCard, helpers) {
  pushCard("Adrenaline Rush", "+3 movement this turn", (player) => {
    if (state.step === STEP.MOVE) {
      state.movesRemaining += 3;
    } else {
      state.movementBonus += 3;
    }
    logLine(`${player.name} played Adrenaline Rush (+3 movement).`);
  });

  pushCard("All The Marbles", "+2 combat this turn", (player) => {
    player.tempCombatBonus += 2;
    logLine(`${player.name} played All The Marbles (+2 combat this turn).`);
  });

  pushCard("Alternate Food Source", "No combat this turn", (player) => {
    player.noCombatThisTurn = true;
    logLine(`${player.name} played Alternate Food Source. Combat is disabled this turn.`);
  });

  pushCard("Chainsaw", "+1 permanent combat bonus", (player) => {
    player.attack += 1;
    logLine(`${player.name} played Chainsaw (+1 permanent combat).`);
  });

  pushCard("Fire Axe", "+1 combat this turn", (player) => {
    player.tempCombatBonus += 1;
    logLine(`${player.name} played Fire Axe (+1 combat this turn).`);
  });

  pushCard("First Aid Kit", "+2 hearts (max 5)", (player) => {
    player.hearts = Math.min(5, player.hearts + 2);
    logLine(`${player.name} played First Aid Kit (+2 hearts).`);
  });

  pushCard("Hey, Look! A Shotgun!", "+2 combat this turn", (player) => {
    player.tempCombatBonus += 2;
    logLine(`${player.name} played Hey, Look! A Shotgun! (+2 combat this turn).`);
  });

  pushCard("Keys Are Still In It", "Move to any Parking Lot", (player) => {
    const moved = helpers.moveToParkingLot(player);
    logLine(moved
      ? `${player.name} played Keys Are Still In It and drove to a Parking Lot.`
      : `${player.name} played Keys Are Still In It, but no Parking Lot is on the board.`);
  });

  pushCard("Lots Of Ammo", "+3 bullets", (player) => {
    player.bullets += 3;
    logLine(`${player.name} played Lots Of Ammo (+3 bullets).`);
  });

  pushCard("Much Needed Rest", "+1 heart (max 5)", (player) => {
    player.hearts = Math.min(5, player.hearts + 1);
    logLine(`${player.name} played Much Needed Rest (+1 heart).`);
  });

  pushCard("Skateboard", "Move up to 6 spaces this turn", (player) => {
    if (state.step === STEP.MOVE) {
      state.movesRemaining = Math.max(state.movesRemaining, 6);
    } else {
      state.moveFloorThisTurn = Math.max(state.moveFloorThisTurn || 0, 6);
    }
    logLine(`${player.name} played Skateboard (minimum 6 movement this turn).`);
  });

  pushCard("This Isn't So Bad", "+1 combat this turn", (player) => {
    player.tempCombatBonus += 1;
    logLine(`${player.name} played This Isn't So Bad (+1 combat this turn).`);
  });
}
