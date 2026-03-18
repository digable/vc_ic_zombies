function drawEventsToThree() {
  if (state.step !== STEP.DRAW_EVENTS || state.gameOver) {
    return;
  }

  const player = currentPlayer();
  while (player.hand.length < 3 && state.eventDeck.length > 0) {
    player.hand.push(state.eventDeck.shift());
  }

  logLine(`${player.name} refilled event hand to ${player.hand.length}.`);
  state.step = STEP.ROLL_MOVE;
  render();
}

function toggleHandSelection(index) {
  if (state.selectedHandIndex === index) {
    state.selectedHandIndex = null;
  } else {
    state.selectedHandIndex = index;
  }
  render();
}

function playEvent(index) {
  if (state.gameOver) {
    return;
  }

  const player = currentPlayer();
  if (state.players[state.currentPlayerIndex] !== player) {
    return;
  }
  if (player.cannotPlayCardTurns > 0) {
    logLine(`${player.name} cannot play event cards this turn.`);
    render();
    return;
  }
  if (player.eventUsedThisRound) {
    logLine("Only one event card may be played from the start of your turn to the start of your next turn.");
    render();
    return;
  }

  const card = player.hand[index];
  if (!card) {
    return;
  }

  player.hand.splice(index, 1);
  card.apply(player, buildEventDeckHelpers());
  state.eventDiscardPile.push(card);
  player.eventUsedThisRound = true;

  const pKey = key(player.x, player.y);
  if (state.zombies.has(pKey) && !player.noCombatThisTurn) {
    logLine(`${player.name} is in a zombie space after playing ${card.name}. Combat resolves immediately.`);
    resolveCombatForPlayer(player, { advanceStepWhenClear: false, endStepOnKnockout: true });
  }

  checkWin(player);
  render();
}

function discardSelected() {
  if (state.step !== STEP.DISCARD || state.gameOver) {
    return;
  }

  const player = currentPlayer();
  if (state.selectedHandIndex !== null && player.hand[state.selectedHandIndex]) {
    const [card] = player.hand.splice(state.selectedHandIndex, 1);
    state.eventDiscardPile.push(card);
    logLine(`${player.name} discarded ${card.name}.`);
  } else {
    logLine(`${player.name} skipped discard.`);
  }

  state.selectedHandIndex = null;
  state.step = STEP.END;
  render();
}
