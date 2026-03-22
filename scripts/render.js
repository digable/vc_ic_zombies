// render.js — Thin orchestrator. Wires updateButtons and the main render() call.
// All rendering helpers live in render-helpers.js, render-board.js, render-panels.js, render-debug.js.

function updateButtons() {
  if (state.pendingCombatDecision || state.pendingEventChoice || state.pendingZombieReplace || state.pendingZombieDiceChallenge || state.pendingZombiePlace || state.pendingZombieMovement || state.pendingForcedMove || state.pendingBuildingSelect) {
    refs.drawTileBtn.disabled = true;
    refs.rotateLeftBtn.disabled = true;
    refs.rotateRightBtn.disabled = true;
    refs.combatBtn.disabled = true;
    refs.drawEventsBtn.disabled = true;
    refs.rollMoveBtn.disabled = true;
    refs.endMoveBtn.disabled = true;
    refs.moveZombiesBtn.disabled = true;
    refs.discardBtn.disabled = true;
    refs.endTurnBtn.disabled = true;
    // Direction buttons stay enabled during forced movement so the controller
    // can move the target player (Brain Cramp / Where Did Everybody Go?).
    refs.moveDirBtns.forEach((btn) => {
      btn.disabled = !state.pendingForcedMove;
    });
    return;
  }

  const p = currentPlayer();
  const combatRequired = isCombatRequiredForCurrentPlayer();

  refs.drawTileBtn.disabled = state.step !== STEP.DRAW_TILE || state.gameOver || Boolean(state.pendingTile);
  refs.rotateLeftBtn.disabled = !state.pendingTile || state.gameOver || state.step !== STEP.DRAW_TILE;
  refs.rotateRightBtn.disabled = !state.pendingTile || state.gameOver || state.step !== STEP.DRAW_TILE;
  refs.combatBtn.disabled = state.step !== STEP.COMBAT || state.gameOver || !combatRequired;
  refs.drawEventsBtn.disabled = state.step !== STEP.DRAW_EVENTS || state.gameOver;
  refs.rollMoveBtn.disabled = state.step !== STEP.ROLL_MOVE || state.gameOver;
  const mustExitBuilding = p.claustrophobiaActive && isSpaceBuilding(p.x, p.y);
  refs.endMoveBtn.disabled = state.step !== STEP.MOVE || state.gameOver || mustExitBuilding;
  refs.moveZombiesBtn.disabled = state.step !== STEP.MOVE_ZOMBIES || state.gameOver || state.zombies.size === 0;
  refs.discardBtn.disabled = state.step !== STEP.DISCARD || state.gameOver;
  refs.endTurnBtn.disabled = state.step !== STEP.END || state.gameOver;

  refs.moveDirBtns.forEach((btn) => {
    const dir = btn.dataset.dir;
    const mover = state.pendingForcedMove
      ? state.players.find((pl) => pl.id === state.pendingForcedMove.targetPlayerId) ?? p
      : p;
    const disabled = state.step !== STEP.MOVE || state.gameOver || state.movesRemaining <= 0 || !canMove(mover, dir);
    btn.disabled = disabled;
  });
}

function render() {
  renderMeta();
  renderBoard();
  renderPlayerTrailSvg();
  renderPlayers();
  renderHand();
  renderDeckInfo();
  renderEventDeckInfo();
  renderCombatDecision();
  renderEventChoice();
  renderZombieReplacePanel();
  renderZombieDiceChallenge();
  renderLog();
  updateButtons();
  renderMoveStatus();
  renderGameOver();
  renderKnockoutBanner();
}
